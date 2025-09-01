# NFT Retrieval Mechanism Guide

## Overview

This document explains how the iNS (Intelligent Naming Service) retrieves NFTs associated with an address and why your profile might not be showing NFTs.

## How NFT Retrieval Works

### 1. **Current Implementation (Problematic)**

The current system uses a **sequential scanning approach**:

```typescript
// Scans token IDs 1-100 sequentially
for (let i = 1; i <= maxTokenId; i++) {
  try {
    const owner = await registrar.ownerOf(i);
    if (owner.toLowerCase() === address.toLowerCase()) {
      // Found an NFT owned by this address
    }
  } catch (error) {
    // Token doesn't exist, continue
    continue;
  }
}
```

**Problems:**
- ❌ **Inefficient**: Makes individual blockchain calls for each token ID
- ❌ **Limited Range**: Only scans first 100 tokens
- ❌ **No Event Tracking**: Doesn't listen to blockchain events
- ❌ **High Gas Costs**: Multiple RPC calls

### 2. **Improved Implementation (Recommended)**

The enhanced system now uses **multiple fallback approaches**:

#### **Approach 1: Address Mapping Service**
```typescript
// Uses cached mapping data for fast queries
const nfts = await addressMappingService.getNFTsForAddress(address, this);
```

#### **Approach 2: Direct Blockchain Query**
```typescript
// Uses ERC721 balance + enumeration
const balance = await registrar.balanceOf(address);
for (let i = 0; i < balance; i++) {
  const tokenId = await registrar.tokenOfOwnerByIndex(address, i);
  // Process token
}
```

#### **Approach 3: Event-Based Retrieval**
```typescript
// Uses Transfer events to find ownership
const filter = registrar.filters.Transfer(null, address, null);
const events = await registrar.queryFilter(filter);
```

#### **Approach 4: Enhanced Scanning**
```typescript
// Scans more tokens (1-100) as final fallback
return await this.scanForNFTs(address, 100);
```

## Why Your Profile Might Not Show NFTs

### **Common Issues:**

1. **No NFTs Minted Yet**
   - You haven't registered any `.0g` names
   - The demo script needs to be run first

2. **Wrong Network**
   - Must be on 0G testnet (Chain ID: 16601)
   - MetaMask must be connected to correct network

3. **Contract Not Deployed**
   - Smart contracts must be deployed to the network
   - Check `.ins.addresses.json` for correct addresses

4. **Token ID Range Too Small**
   - Previous implementation only scanned first 20-50 tokens
   - Your NFT might have a higher token ID

5. **Blockchain Service Not Initialized**
   - Provider/signer not properly connected
   - Contract instances not created

## How to Fix

### **Step 1: Verify Network Connection**
```typescript
// Ensure you're on 0G testnet
const network = await provider.getNetwork();
const OG_TESTNET_CHAIN_ID = 16601n;
if (network.chainId !== OG_TESTNET_CHAIN_ID) {
  // Switch to correct network
}
```

### **Step 2: Check Contract Deployment**
```typescript
// Verify contracts are accessible
const contractsDeployed = await blockchainService.areContractsDeployed();
if (!contractsDeployed) {
  // Deploy contracts or check addresses
}
```

### **Step 3: Test NFT Retrieval**
```typescript
// Use the new test function
const result = await testNFTRetrieval();
console.log('Test result:', result);
```

### **Step 4: Register a Test Name**
```bash
# Run the demo script to mint a test NFT
npm run demo
# or
npx hardhat run scripts/demo.ts --network 0g-testnet
```

## Best Practices for NFT Retrieval

### **1. Use Events When Possible**
```typescript
// Listen to Transfer events for real-time updates
const filter = registrar.filters.Transfer(null, userAddress, null);
registrar.on(filter, (from, to, tokenId) => {
  // Handle new NFT ownership
});
```

### **2. Implement Caching**
```typescript
// Cache NFT data to reduce blockchain calls
const cachedNFTs = await addressMappingService.getNFTsForAddress(address);
if (cachedNFTs.length > 0 && isCacheValid()) {
  return cachedNFTs;
}
```

### **3. Use Batch Operations**
```typescript
// Batch multiple calls together
const promises = tokenIds.map(id => registrar.ownerOf(id));
const owners = await Promise.all(promises);
```

### **4. Implement Pagination**
```typescript
// For large collections, implement pagination
const pageSize = 20;
const page = Math.floor(tokenId / pageSize);
```

## Testing Your Setup

### **Test Button**
The profile page now includes a 🐛 test button that:
- Connects to 0G testnet
- Scans for existing tokens
- Checks contract accessibility
- Reports results in console

### **Console Debugging**
Enable console logging to see:
- Network connection status
- Contract initialization
- Token scanning progress
- NFT discovery results

### **Manual Testing**
```typescript
// Test specific functions
await blockchainService.initialize();
const nfts = await blockchainService.getUserNFTs();
console.log('Found NFTs:', nfts);
```

## Troubleshooting Checklist

- [ ] MetaMask connected to 0G testnet (Chain ID: 16601)
- [ ] Wallet connected to the dApp
- [ ] Contracts deployed and accessible
- [ ] At least one NFT minted (run demo script)
- [ ] Browser console shows no errors
- [ ] Test button returns successful results

## Next Steps

1. **Run the test button** to verify blockchain connectivity
2. **Check console logs** for detailed debugging information
3. **Ensure you're on the correct network** in MetaMask
4. **Run the demo script** to mint a test NFT
5. **Refresh the profile page** to see your NFTs

## Technical Details

### **Contract Addresses**
```json
{
  "registry": "0xe8Eb3bA53B8d5aC878e61d499a04E86813e78E36",
  "registrar": "0xe5E1d3eB7d39390Cc410Ed978CC413d3E4ED14c5",
  "resolver": "0xb2C192888260a308010572026A4f22EF5D66C1f7"
}
```

### **RPC Endpoints**
- **0G Testnet**: `https://evmrpc-testnet.0g.ai/`
- **Indexer**: `https://indexer-storage-testnet-turbo.0g.ai`

### **Supported Standards**
- **ERC-721**: Basic NFT functionality
- **ERC-7857**: Dynamic metadata and transfer capabilities
- **ENS-like**: Domain name resolution

This enhanced implementation should resolve the NFT display issues and provide a robust foundation for NFT retrieval.
