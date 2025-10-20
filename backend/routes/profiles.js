const express = require('express');
const { ethers } = require('ethers');
const router = express.Router();

const REGISTRY_ABI = require('../contracts/INSRegistry.json');
const INFT_ABI = require('../contracts/INFT.json');

// REAL 0G Storage configuration (OFFICIAL ENDPOINTS)
const RPC_URL = process.env.RPC_URL || 'https://evmrpc-testnet.0g.ai';
const INDEXER_RPC = process.env.INDEXER_RPC || 'https://indexer-storage-testnet-turbo.0g.ai';
const REGISTRY_ADDRESS = process.env.REGISTRY_ADDRESS || '0xfDf463C23df9ac82D6946A34b9c8A8dDF23d44a3';

const provider = new ethers.JsonRpcProvider(RPC_URL);

// REAL 0G Storage Upload Endpoint
router.post('/upload', async (req, res) => {
  try {
    const { data } = req.body;
    
    const { ZgFile, Indexer } = await import('@0glabs/0g-ts-sdk');

    // Use PRIVATE_KEY as primary, fallback to ZEROG_PRIVATE_KEY and VITE_ZEROG_PRIVATE_KEY
    const privateKey = process.env.PRIVATE_KEY || process.env.ZEROG_PRIVATE_KEY || process.env.VITE_ZEROG_PRIVATE_KEY;

    if (!privateKey) {
      return res.status(500).json({ error: 'Storage private key not configured' });
    }

    const signer = new ethers.Wallet(privateKey, provider);
    const indexer = new Indexer(INDEXER_RPC);

    const jsonData = JSON.stringify(data, null, 2);
    const fileName = `traffic-${Date.now()}.json`;
    const filePath = `/tmp/${fileName}`;

    // Write to temp file
    const { writeFileSync, unlinkSync } = await import('fs');
    writeFileSync(filePath, jsonData);

    const file = await ZgFile.fromFilePath(filePath);
    const [tree, treeErr] = await file.merkleTree();

    if (treeErr) {
      await file.close();
      unlinkSync(filePath);
      return res.status(500).json({ error: `Merkle tree error: ${treeErr}` });
    }

    const [tx, uploadErr] = await indexer.upload(file, RPC_URL, signer);

    if (uploadErr) {
      await file.close();
      unlinkSync(filePath);
      return res.status(500).json({ error: `Upload error: ${uploadErr}` });
    }

    await file.close();
    unlinkSync(filePath);

    const result = {
      rootHash: tree?.rootHash() || '',
      txHash: tx || '',
      timestamp: new Date().toISOString()
    };

    console.log('✅ Saved to 0G Storage:', result);
    res.json(result);

  } catch (error) {
    console.error('Storage save failed:', error);
    res.status(500).json({ error: error?.message || 'Storage save failed' });
  }
});

// REAL 0G Storage Download Endpoint  
router.get('/download/:rootHash', async (req, res) => {
  try {
    const { rootHash } = req.params;
    const { Indexer } = await import('@0glabs/0g-ts-sdk');
    
    const indexer = new Indexer(INDEXER_RPC);
    
    // Download file via Indexer
    const downloadPath = `/tmp/download-${Date.now()}.json`;
    const downloadErr = await indexer.download(rootHash, downloadPath);
    
    if (downloadErr) {
      return res.status(500).json({ error: `Download error: ${downloadErr}` });
    }
    
    // Read and return file
    const { readFileSync, unlinkSync } = await import('fs');
    const data = readFileSync(downloadPath, 'utf8');
    unlinkSync(downloadPath);
    
    res.json({ 
      success: true, 
      data: JSON.parse(data),
      rootHash 
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Profile search placeholder route (placed before dynamic ':domain' route)
router.get('/search', async (req, res) => {
  res.status(501).json({
    success: false,
    error: 'Profile search not yet implemented',
    message: 'This feature will be available in Sprint 2'
  });
});

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

/* Search route moved above to avoid shadowing by '/:domain' */

module.exports = router;
