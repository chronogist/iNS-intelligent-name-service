const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');

// Import contract ABIs and addresses
const MARKETPLACE_ADDRESS = process.env.MARKETPLACE_ADDRESS || '0xf20C0fB3D11BF0c9C8de177eC7886b868a248344';
const REGISTRY_ADDRESS = process.env.REGISTRY_ADDRESS || '0x507d8324A029f87BdFFF2025215AABBA0326a7bd';

// Simplified ABI for reading data
const MARKETPLACE_ABI = [
  'function saleListings(bytes32) view returns (address seller, uint256 price, uint256 listedAt, bool active)',
  'function rentalListings(bytes32) view returns (address owner, uint256 pricePerDay, uint256 minDuration, uint256 maxDuration, uint256 listedAt, bool active)',
  'function activeRentals(bytes32) view returns (address renter, uint256 startTime, uint256 endTime, uint256 totalPaid, bool active)',
  'function getMarketplaceStats() view returns (uint256 totalSales, uint256 totalVolume, uint256 totalRentals, uint256 totalRentalVolume)',
  'event DomainListedForSale(bytes32 indexed node, string domainName, address indexed seller, uint256 price, uint256 timestamp)',
  'event DomainListedForRent(bytes32 indexed node, string domainName, address indexed owner, uint256 pricePerDay, uint256 minDuration, uint256 maxDuration, uint256 timestamp)',
];

// Setup provider and contract
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'https://evmrpc-testnet.0g.ai');
const marketplaceContract = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, provider);

// Optional from-block override to widen event scan range
const MARKETPLACE_FROM_BLOCK = parseInt(process.env.MARKETPLACE_FROM_BLOCK || '0');

/**
 * GET /api/marketplace/listings
 * Get all active marketplace listings with filters and pagination
 */
router.get('/listings', async (req, res) => {
  try {
    console.log('📊 Fetching marketplace listings...');

    const { type, owner, agentType, minPrice, maxPrice, sort, page = '1', limit = '20' } = req.query;

    // We'll fetch from recent events as a temporary solution
    const currentBlock = await provider.getBlockNumber();
    const defaultWindow = Math.max(0, currentBlock - 100000); // widen scan window (~100k blocks)
    const fromBlock = MARKETPLACE_FROM_BLOCK > 0 ? MARKETPLACE_FROM_BLOCK : defaultWindow;

    // Fetch sale listing events
    const saleFilter = marketplaceContract.filters.DomainListedForSale();
    const saleEvents = await marketplaceContract.queryFilter(saleFilter, fromBlock, currentBlock);

    // Fetch rental listing events
    const rentFilter = marketplaceContract.filters.DomainListedForRent();
    const rentEvents = await marketplaceContract.queryFilter(rentFilter, fromBlock, currentBlock);

    // Process events and check if still active
    const listings = [];

    for (const event of saleEvents) {
      try {
        const node = event.args[0];
        const domainName = event.args[1];
        const seller = event.args[2];
        const price = event.args[3];

        // Check if still active
        const listing = await marketplaceContract.saleListings(node);
        if (listing.active) {
          // Fetch domain profile data
          const profileResponse = await fetch(`${process.env.API_URL || 'http://localhost:5000/api'}/profile/${domainName}`);
          let profile = null;
          if (profileResponse.ok) {
            profile = await profileResponse.json();
          }

          listings.push({
            domain: domainName,
            node,
            agentType: profile?.agentType || 'custom',
            intelligenceScore: profile?.intelligenceScore || 0,
            totalActions: profile?.totalActions || 0,
            successRate: profile?.successRate || 0,
            price: ethers.formatEther(price),
            rentalPricePerDay: '0',
            seller,
            owner: seller,
            inftAddress: profile?.inftAddress || '',
            isRental: false,
            performance: {
              totalValueManaged: profile?.totalValueManaged || '0',
              profitGenerated: profile?.profitGenerated || '0',
              gasOptimized: profile?.gasOptimized || '0',
            },
          });
        }
      } catch (error) {
        console.error('Error processing sale event:', error);
      }
    }

    for (const event of rentEvents) {
      try {
        const node = event.args[0];
        const domainName = event.args[1];
        const ownerAddr = event.args[2];
        const pricePerDay = event.args[3];

        // Check if still active
        const listing = await marketplaceContract.rentalListings(node);
        if (listing.active) {
          // Fetch domain profile data
          const profileResponse = await fetch(`${process.env.API_URL || 'http://localhost:5000/api'}/profile/${domainName}`);
          let profile = null;
          if (profileResponse.ok) {
            profile = await profileResponse.json();
          }

          listings.push({
            domain: domainName,
            node,
            agentType: profile?.agentType || 'custom',
            intelligenceScore: profile?.intelligenceScore || 0,
            totalActions: profile?.totalActions || 0,
            successRate: profile?.successRate || 0,
            price: '0',
            rentalPricePerDay: ethers.formatEther(pricePerDay),
            owner: ownerAddr,
            inftAddress: profile?.inftAddress || '',
            isRental: true,
            performance: {
              totalValueManaged: profile?.totalValueManaged || '0',
              profitGenerated: profile?.profitGenerated || '0',
              gasOptimized: profile?.gasOptimized || '0',
            },
          });
        }
      } catch (error) {
        console.error('Error processing rental event:', error);
      }
    }

    // Apply filters
    let filtered = listings;

    if (type === 'sale') {
      filtered = filtered.filter(l => !l.isRental);
    } else if (type === 'rental') {
      filtered = filtered.filter(l => l.isRental);
    }

    if (owner) {
      const ownerLower = owner.toLowerCase();
      filtered = filtered.filter(l => (l.owner || '').toLowerCase() === ownerLower);
    }

    if (agentType) {
      filtered = filtered.filter(l => (l.agentType || '').toLowerCase() === agentType.toLowerCase());
    }

    const min = minPrice ? parseFloat(minPrice) : null;
    const max = maxPrice ? parseFloat(maxPrice) : null;

    if (min !== null) {
      filtered = filtered.filter(l => {
        const p = l.isRental ? parseFloat(l.rentalPricePerDay || '0') : parseFloat(l.price || '0');
        return p >= min;
      });
    }

    if (max !== null) {
      filtered = filtered.filter(l => {
        const p = l.isRental ? parseFloat(l.rentalPricePerDay || '0') : parseFloat(l.price || '0');
        return p <= max;
      });
    }

    // Sorting
    if (sort === 'price') {
      filtered.sort((a, b) => {
        const pa = a.isRental ? parseFloat(a.rentalPricePerDay || '0') : parseFloat(a.price || '0');
        const pb = b.isRental ? parseFloat(b.rentalPricePerDay || '0') : parseFloat(b.price || '0');
        return pa - pb;
      });
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(parseInt(limit), 100));
    const start = (pageNum - 1) * limitNum;
    const paged = filtered.slice(start, start + limitNum);

    console.log(`✅ Found ${filtered.length} listings, returning page ${pageNum}`);

    res.json({
      success: true,
      listings: paged,
      total: filtered.length,
      page: pageNum,
      limit: limitNum,
    });
  } catch (error) {
    console.error('Error fetching marketplace listings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch marketplace listings',
      message: error.message,
    });
  }
});

/**
 * GET /api/marketplace/stats
 * Get marketplace statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await marketplaceContract.getMarketplaceStats();

    res.json({
      success: true,
      stats: {
        totalSales: stats.totalSales.toString(),
        totalVolume: ethers.formatEther(stats.totalVolume),
        totalRentals: stats.totalRentals.toString(),
        totalRentalVolume: ethers.formatEther(stats.totalRentalVolume),
      },
    });
  } catch (error) {
    console.error('Error fetching marketplace stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch marketplace stats',
      message: error.message,
    });
  }
});

/**
 * GET /api/marketplace/listing/:domain
 * Get listing details for a specific domain
 */
router.get('/listing/:domain', async (req, res) => {
  try {
    const { domain } = req.params;

    // Compute node hash (normalize domain)
    const cleanDomain = domain.replace('.0g', '').toLowerCase();
    const node = ethers.keccak256(ethers.toUtf8Bytes(cleanDomain));

    // Fetch both sale and rental listings
    const saleListing = await marketplaceContract.saleListings(node);
    const rentalListing = await marketplaceContract.rentalListings(node);
    const activeRental = await marketplaceContract.activeRentals(node);

    res.json({
      success: true,
      domain,
      node,
      saleListing: saleListing.active ? {
        seller: saleListing.seller,
        price: ethers.formatEther(saleListing.price),
        listedAt: saleListing.listedAt.toString(),
        active: saleListing.active,
      } : null,
      rentalListing: rentalListing.active ? {
        owner: rentalListing.owner,
        pricePerDay: ethers.formatEther(rentalListing.pricePerDay),
        minDuration: rentalListing.minDuration.toString(),
        maxDuration: rentalListing.maxDuration.toString(),
        listedAt: rentalListing.listedAt.toString(),
        active: rentalListing.active,
      } : null,
      activeRental: activeRental.active ? {
        renter: activeRental.renter,
        startTime: activeRental.startTime.toString(),
        endTime: activeRental.endTime.toString(),
        totalPaid: ethers.formatEther(activeRental.totalPaid),
        active: activeRental.active,
      } : null,
    });
  } catch (error) {
    console.error('Error fetching listing details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch listing details',
      message: error.message,
    });
  }
});

module.exports = router;
