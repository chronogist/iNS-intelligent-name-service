const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { body, query, validationResult } = require('express-validator');
// Load env from backend .env and fallback to project root .env
const dotenv = require('dotenv');
const path = require('path');
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const blockchain = require('./config/blockchain');
const profileRoutes = require('./routes/profiles');
const marketplaceRoutes = require('./routes/marketplace');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for Render deployment
app.set('trust proxy', 1);

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration for external API access
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true,
  maxAge: 86400 // 24 hours
}));

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

// Marketplace routes
app.use('/api/marketplace', marketplaceRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// API Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    status: 'API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Check domain availability
app.get('/api/domains/available/:name',
  async (req, res) => {
    try {
      const { name } = req.params;
      
      // Basic validation
      if (!name || name.length < 3 || name.length > 63) {
        return res.status(400).json({
          success: false,
          error: 'Domain name must be between 3 and 63 characters'
        });
      }
      
      if (!/^[a-z0-9-]+$/.test(name)) {
        return res.status(400).json({
          success: false,
          error: 'Domain name can only contain lowercase letters, numbers, and hyphens'
        });
      }
      
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
  async (req, res) => {
    try {
      const { name } = req.params;
      const duration = parseInt(req.query.duration) || 31536000; // Default 1 year
      
      // Basic validation
      if (!name || name.length < 3 || name.length > 63) {
        return res.status(400).json({
          success: false,
          error: 'Domain name must be between 3 and 63 characters'
        });
      }
      
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

// Reverse resolution: Get primary domain for an address
app.get('/api/resolve/address/:address', async (req, res) => {
  try {
    const { address } = req.params;

    // Validate address format
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Ethereum address format'
      });
    }

    const { ethers } = require('ethers');
    const provider = blockchain.getProvider();
    const registry = new ethers.Contract(
      blockchain.getRegistryAddress(),
      ['function primaryName(address) view returns (string)'],
      provider
    );

    const primaryDomain = await registry.primaryName(address);

    if (!primaryDomain || primaryDomain === '') {
      return res.json({
        success: true,
        data: {
          address,
          domain: null,
          hasPrimaryName: false
        }
      });
    }

    res.json({
      success: true,
      data: {
        address,
        domain: `${primaryDomain}.0g`,
        domainName: primaryDomain,
        hasPrimaryName: true
      }
    });

  } catch (error) {
    console.error('Error resolving address:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve address to domain'
    });
  }
});

// Batch reverse resolution
app.post('/api/resolve/addresses', async (req, res) => {
  try {
    const { addresses } = req.body;

    if (!Array.isArray(addresses) || addresses.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Request body must contain an array of addresses'
      });
    }

    if (addresses.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 50 addresses per request'
      });
    }

    const { ethers } = require('ethers');
    const provider = blockchain.getProvider();
    const registry = new ethers.Contract(
      blockchain.getRegistryAddress(),
      ['function primaryName(address) view returns (string)'],
      provider
    );

    const results = await Promise.all(
      addresses.map(async (address) => {
        try {
          const primaryDomain = await registry.primaryName(address);
          return {
            address,
            domain: primaryDomain ? `${primaryDomain}.0g` : null,
            domainName: primaryDomain || null,
            hasPrimaryName: !!primaryDomain
          };
        } catch (error) {
          return {
            address,
            domain: null,
            domainName: null,
            hasPrimaryName: false,
            error: 'Resolution failed'
          };
        }
      })
    );

    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('Error batch resolving addresses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to batch resolve addresses'
    });
  }
});

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

// Resolve domain to core info
app.get('/api/resolve/:domain', async (req, res) => {
  try {
    const { domain } = req.params;
    const cleanDomain = domain.replace('.0g', '').toLowerCase();

    const info = await blockchain.getDomainInfo(cleanDomain);
    const { ethers } = require('ethers');

    if (!info || info.inftAddress === ethers.ZeroAddress) {
      return res.status(404).json({ success: false, error: 'Domain not found' });
    }

    const node = ethers.keccak256(ethers.toUtf8Bytes(cleanDomain));

    res.json({
      success: true,
      data: {
        domain: `${cleanDomain}.0g`,
        node,
        owner: info.owner,
        inftAddress: info.inftAddress,
        resolvedAddress: info.resolvedAddress,
        expiry: info.expiry,
        expiryDate: info.expiryDate
      }
    });
  } catch (error) {
    console.error('Error resolving domain:', error);
    res.status(500).json({ success: false, error: 'Failed to resolve domain' });
  }
});

// Indexer status endpoint
app.get('/api/indexer/status', async (req, res) => {
  try {
    const provider = blockchain.getProvider();
    const currentBlock = await provider.getBlockNumber();
    const registryAddress = blockchain.getRegistryAddress();
    const marketplaceAddress = process.env.MARKETPLACE_ADDRESS || null;

    res.json({
      success: true,
      currentBlock,
      chainHead: currentBlock,
      lag: 0,
      lastSyncAt: new Date().toISOString(),
      healthy: !!provider && !!registryAddress && !!marketplaceAddress,
      components: {
        rpc: 'ok',
        registry: registryAddress ? 'ok' : 'missing',
        marketplace: marketplaceAddress ? 'ok' : 'missing'
      }
    });
  } catch (error) {
    console.error('Error getting indexer status:', error);
    res.status(503).json({
      success: false,
      error: 'Indexer unavailable',
      details: error.message
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

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    path: req.path,
    method: req.method
  });
});

// 404 handler for all other routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
    method: req.method,
    availableRoutes: [
      'GET /health',
      'GET /api/health',
      'GET /api/info',
      'GET /api/indexer/status',
      'GET /api/domains/available/:name',
      'GET /api/domains/price/:name',
      'GET /api/profile/:domain',
      'GET /api/profile/:domain/raw',
      'POST /api/profile/upload',
      'GET /api/profile/download/:rootHash',
      'GET /api/marketplace/listings',
      'GET /api/marketplace/stats',
      'GET /api/marketplace/listing/:domain',
      'GET /api/resolve/:domain',
      'GET /api/resolve/address/:address',
      'POST /api/resolve/addresses'
    ]
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