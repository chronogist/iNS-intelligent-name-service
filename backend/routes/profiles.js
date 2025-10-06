const express = require('express');
const { ethers } = require('ethers');
const router = express.Router();

const REGISTRY_ABI = require('../contracts/INSRegistry.json');
const INFT_ABI = require('../contracts/INFT.json');

const RPC_URL = process.env.RPC_URL || 'https://evmrpc-testnet.0g.ai';
const REGISTRY_ADDRESS = process.env.REGISTRY_ADDRESS || '0xfDf463C23df9ac82D6946A34b9c8A8dDF23d44a3';

const provider = new ethers.JsonRpcProvider(RPC_URL);

/**
 * GET /api/profile/:domain
 * Get profile for a domain name
 */
router.get('/:domain', async (req, res) => {
  try {
    const { domain } = req.params;
    const cleanDomain = domain.replace('.0g', '').toLowerCase();

    console.log(`📋 Fetching profile for: ${cleanDomain}`);

    // 1. Get INFT address from registry
    const registry = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, provider);
    const inftAddress = await registry.getINFT(cleanDomain);

    if (inftAddress === ethers.ZeroAddress) {
      return res.status(404).json({
        success: false,
        error: 'Domain not found'
      });
    }

    console.log(`  ✓ INFT Address: ${inftAddress}`);

    // 2. Get metadata and owner from INFT
    const inft = new ethers.Contract(inftAddress, INFT_ABI, provider);
    const [metadataURI, metadataHash, owner, domainName] = await Promise.all([
      inft.metadataURI(),
      inft.metadataHash(),
      inft.domainOwner(),
      inft.domainName()
    ]);

    console.log(`  ✓ Owner: ${owner}`);
    console.log(`  ✓ Metadata URI: ${metadataURI.substring(0, 50)}...`);

    // 3. Parse metadata from URI
    let profile = {
      displayName: cleanDomain,
      bio: '',
      avatar: '',
      social: {},
      professional: {},
      portfolio: [],
      settings: {}
    };

    try {
      if (metadataURI.startsWith('data:application/json;base64,')) {
        // Decode base64 embedded metadata
        const base64Data = metadataURI.split(',')[1];
        const jsonString = Buffer.from(base64Data, 'base64').toString('utf-8');
        const metadata = JSON.parse(jsonString);

        // Extract profile from metadata
        if (metadata.profile) {
          profile = { ...profile, ...metadata.profile };
        }

        console.log(`  ✓ Profile parsed successfully`);
      } else if (metadataURI.startsWith('0g://') || metadataURI.startsWith('ipfs://')) {
        // For now, just note that metadata is on external storage
        console.log(`  ⚠ External metadata storage not yet implemented`);
      }
    } catch (parseError) {
      console.error('  ⚠ Error parsing metadata:', parseError.message);
      // Continue with default profile
    }

    // 4. Get registration info
    const expiry = await registry.getExpiry(cleanDomain);
    const expiryDate = new Date(Number(expiry) * 1000);

    // 5. Get block timestamp for registration date
    const currentBlock = await provider.getBlockNumber();
    const block = await provider.getBlock(currentBlock);
    const registeredDate = new Date(Number(block.timestamp) * 1000);

    console.log(`  ✓ Expires: ${expiryDate.toISOString()}`);

    res.json({
      success: true,
      data: {
        domain: `${cleanDomain}.0g`,
        owner,
        inftAddress,
        profile,
        metadataHash,
        registered: registeredDate.toISOString(),
        expires: expiryDate.toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Profile fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile',
      details: error.message
    });
  }
});

/**
 * GET /api/profile/:domain/raw
 * Get raw metadata for debugging
 */
router.get('/:domain/raw', async (req, res) => {
  try {
    const { domain } = req.params;
    const cleanDomain = domain.replace('.0g', '').toLowerCase();

    const registry = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, provider);
    const inftAddress = await registry.getINFT(cleanDomain);

    if (inftAddress === ethers.ZeroAddress) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    const inft = new ethers.Contract(inftAddress, INFT_ABI, provider);
    const [metadataURI, metadataHash, metadataLocked] = await Promise.all([
      inft.metadataURI(),
      inft.metadataHash(),
      inft.metadataLocked()
    ]);

    res.json({
      success: true,
      data: {
        domain: `${cleanDomain}.0g`,
        inftAddress,
        metadataURI,
        metadataHash,
        metadataLocked
      }
    });

  } catch (error) {
    console.error('Error fetching raw metadata:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch raw metadata'
    });
  }
});

/**
 * GET /api/profiles/search
 * Search profiles by skills, availability, etc.
 * TODO: Implement in future sprint
 */
router.get('/search', async (req, res) => {
  res.status(501).json({
    success: false,
    error: 'Profile search not yet implemented',
    message: 'This feature will be available in Sprint 2'
  });
});

module.exports = router;
