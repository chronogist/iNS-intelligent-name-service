import { ethers } from 'ethers';

// Test script to verify NFT retrieval
export async function testNFTRetrieval() {
  console.log('🧪 Testing NFT retrieval...');
  
  // Contract addresses from .ins.addresses.json
  const CONTRACT_ADDRESSES = {
    registrar: '0xe5E1d3eB7d39390Cc410Ed978CC413d3E4ED14c5',
    registry: '0xe8Eb3bA53B8d5aC878e61d499a04E86813e78E36',
    resolver: '0xb2C192888260a308010572026A4f22EF5D66C1f7'
  };

  // Enhanced ABI with events
  const ENHANCED_ABI = [
    'function ownerOf(uint256 tokenId) view returns (address)',
    'function balanceOf(address owner) view returns (uint256)',
    'function tokenURI(uint256 tokenId) view returns (string)',
    'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
    'function totalSupply() view returns (uint256)',
    'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'
  ];

  try {
    // Connect to 0G testnet
    const provider = new ethers.JsonRpcProvider('https://evmrpc-testnet.0g.ai/');
    console.log('✅ Connected to 0G testnet');
    
    // Create contract instance
    const registrar = new ethers.Contract(CONTRACT_ADDRESSES.registrar, ENHANCED_ABI, provider);
    console.log('✅ Contract instance created');
    
    // Test 1: Check if contract exists and is accessible
    try {
      const totalSupply = await registrar.totalSupply();
      console.log(`📊 Total supply: ${totalSupply.toString()}`);
    } catch (error) {
      console.log('⚠️ totalSupply not supported, continuing...');
    }
    
    // Test 2: Scan for existing tokens
    console.log('🔍 Scanning for existing tokens...');
    const foundTokens = [];
    
    for (let i = 1; i <= 50; i++) {
      try {
        const owner = await registrar.ownerOf(i);
        if (owner && owner !== ethers.ZeroAddress) {
          console.log(`✅ Token ${i} owned by: ${owner}`);
          foundTokens.push({ tokenId: i, owner });
          
          // Try to get token URI
          try {
            const tokenURI = await registrar.tokenURI(i);
            console.log(`   URI: ${tokenURI.substring(0, 100)}...`);
          } catch (uriError) {
            console.log(`   URI: Error getting URI`);
          }
        }
      } catch (error) {
        // Token doesn't exist
        continue;
      }
    }
    
    console.log(`📊 Found ${foundTokens.length} existing tokens`);
    
    // Test 3: Check specific addresses for NFTs
    const testAddresses = [
      '0x5FbDB2315678afecb367f032d93F642f64180aa3', // Example address
      '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'  // Another example
    ];
    
    for (const address of testAddresses) {
      try {
        const balance = await registrar.balanceOf(address);
        console.log(`📊 Address ${address} has ${balance.toString()} NFTs`);
        
        if (balance > 0n) {
          for (let i = 0; i < Number(balance); i++) {
            try {
              const tokenId = await registrar.tokenOfOwnerByIndex(address, i);
              console.log(`   Token ${tokenId} at index ${i}`);
            } catch (error) {
              console.log(`   Could not get token at index ${i}`);
            }
          }
        }
      } catch (error) {
        console.log(`❌ Error checking address ${address}:`, error.message);
      }
    }
    
    return {
      success: true,
      totalTokensFound: foundTokens.length,
      tokens: foundTokens
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Export for use in components
export default testNFTRetrieval;
