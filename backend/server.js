const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { body, query, validationResult } = require('express-validator');
require('dotenv').config();

const blockchain = require('./config/blockchain');
const profileRoutes = require('./routes/profiles');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests, please try again later.'
});
app.use('/api/', limiter);

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// Routes

// Profile routes
app.use('/api/profile', profileRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Check domain availability
app.get('/api/domains/available/:name',
  query('name').isLength({ min: 3, max: 63 }).matches(/^[a-z0-9-]+$/),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { name } = req.params;
      
      const available = await blockchain.checkAvailability(name);
      
      res.json({
        success: true,
        data: {
          name,
          available
        }
      });
    } catch (error) {
      console.error('Error checking availability:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check availability'
      });
    }
  }
);

// Get domain price
app.get('/api/domains/price/:name',
  query('duration').optional().isInt({ min: 31536000 }),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { name } = req.params;
      const duration = parseInt(req.query.duration) || 31536000; // Default 1 year
      
      const priceInEth = await blockchain.getPrice(name, duration);
      
      res.json({
        success: true,
        data: {
          name,
          duration,
          price: priceInEth,
          priceFormatted: `${priceInEth} tokens`
        }
      });
    } catch (error) {
      console.error('Error getting price:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get price'
      });
    }
  }
);

// Get registry info
app.get('/api/info', async (req, res) => {
  try {
    const registryAddress = blockchain.getRegistryAddress();
    const provider = blockchain.getProvider();
    const network = await provider.getNetwork();

    res.json({
      success: true,
      data: {
        registryAddress,
        chainId: Number(network.chainId),
        network: network.name
      }
    });
  } catch (error) {
    console.error('Error getting info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get registry info'
    });
  }
});


// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
async function startServer() {
  try {
    console.log('🚀 Starting iNS Backend Server...\n');

    // Initialize services
    await blockchain.initialize();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`\n✅ Server running on port ${PORT}`);
      console.log(`📍 API available at http://localhost:${PORT}/api`);
      console.log(`❤️  Health check at http://localhost:${PORT}/health\n`);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n👋 Shutting down gracefully...');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;