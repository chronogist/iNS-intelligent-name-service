import { ethers } from 'ethers';

export interface NFTMetadata {
  name: string;
  tokenId: string;
  registrationDate: string;
  price: bigint;
  owner: string;
  tokenURI: string;
  metadataHash?: string;
  encryptedURI?: string;
}

export interface AddressMapping {
  [address: string]: NFTMetadata[];
}

export class AddressMappingService {
  private mapping: AddressMapping = {};
  private lastUpdate: number = 0;
  private updateInterval: number = 5 * 60 * 1000; // 5 minutes
  private isUpdating: boolean = false;

  /**
   * Get all NFTs for an address from the mapping
   */
  async getNFTsForAddress(address: string, blockchainService: any): Promise<NFTMetadata[]> {
    const normalizedAddress = address.toLowerCase();
    
    // Check if we have cached data and it's recent
    if (this.mapping[normalizedAddress] && this.isCacheValid()) {
      console.log(`📋 Returning cached NFTs for ${normalizedAddress}`);
      return this.mapping[normalizedAddress];
    }

    // If no cache or expired, update the mapping
    await this.updateMapping(blockchainService);
    
    return this.mapping[normalizedAddress] || [];
  }

  /**
   * Get all addresses that own NFTs
   */
  getAllAddresses(): string[] {
    return Object.keys(this.mapping);
  }

  /**
   * Get all NFTs in the mapping
   */
  getAllNFTs(): NFTMetadata[] {
    return Object.values(this.mapping).flat();
  }

  /**
   * Search NFTs by name (partial match)
   */
  searchNFTsByName(name: string): NFTMetadata[] {
    const searchTerm = name.toLowerCase();
    return this.getAllNFTs().filter(nft => 
      nft.name.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Get NFT by token ID
   */
  getNFTByTokenId(tokenId: string): NFTMetadata | null {
    const allNFTs = this.getAllNFTs();
    return allNFTs.find(nft => nft.tokenId === tokenId) || null;
  }

  /**
   * Update the entire mapping from blockchain
   */
  async updateMapping(blockchainService: any): Promise<void> {
    if (this.isUpdating) {
      console.log('🔄 Mapping update already in progress...');
      return;
    }

    this.isUpdating = true;
    console.log('🔄 Updating address mapping from blockchain...');

    try {
      // Initialize blockchain service if needed
      await blockchainService.initialize();

      const newMapping: AddressMapping = {};
      const maxTokenId = 100; // Scan first 100 tokens

      console.log(`Scanning tokens 1 to ${maxTokenId} for address mapping...`);

      for (let i = 1; i <= maxTokenId; i++) {
        try {
          // Get owner of this token
          const owner = await blockchainService.registrar.ownerOf(i);
          
          if (owner && owner !== ethers.ZeroAddress) {
            const normalizedOwner = owner.toLowerCase();
            
            // Get token metadata
            try {
              const tokenURI = await blockchainService.registrar.tokenURI(i);
              const metadataHash = await blockchainService.registrar.getMetadataHash(i);
              const encryptedURI = await blockchainService.registrar.getEncryptedURI(i);
              
              let name = `token_${i}`;
              let registrationDate = new Date().toISOString();
              let price = 0n;

              // Try to extract name from token URI
              if (tokenURI.startsWith('data:application/json;base64,')) {
                try {
                  const jsonB64 = tokenURI.replace('data:application/json;base64,', '');
                  const jsonStr = ethers.toUtf8String(ethers.getBytes('0x' + Buffer.from(jsonB64, 'base64').toString('hex')));
                  const tokenData = JSON.parse(jsonStr);
                  
                  if (tokenData.name && tokenData.name.endsWith('.0g')) {
                    name = tokenData.name.replace('.0g', '');
                  }
                } catch (parseError) {
                  console.warn(`Could not parse token URI for ${i}:`, parseError);
                }
              }

              const nftMetadata: NFTMetadata = {
                name,
                tokenId: i.toString(),
                registrationDate,
                price,
                owner: normalizedOwner,
                tokenURI,
                metadataHash,
                encryptedURI
              };

              // Add to mapping
              if (!newMapping[normalizedOwner]) {
                newMapping[normalizedOwner] = [];
              }
              newMapping[normalizedOwner].push(nftMetadata);

              console.log(`✅ Mapped ${name}.0g (Token ${i}) to ${normalizedOwner}`);
            } catch (metadataError) {
              console.warn(`Could not get metadata for token ${i}:`, metadataError);
            }
          }
        } catch (error) {
          // Token doesn't exist or other error, continue
          continue;
        }
      }

      // Update the mapping
      this.mapping = newMapping;
      this.lastUpdate = Date.now();

      console.log(`✅ Address mapping updated. Found ${Object.keys(newMapping).length} addresses with ${this.getAllNFTs().length} total NFTs`);
    } catch (error) {
      console.error('❌ Failed to update address mapping:', error);
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Add a single NFT to the mapping (for new registrations)
   */
  addNFTToMapping(nft: NFTMetadata): void {
    const normalizedOwner = nft.owner.toLowerCase();
    
    if (!this.mapping[normalizedOwner]) {
      this.mapping[normalizedOwner] = [];
    }
    
    // Check if NFT already exists
    const existingIndex = this.mapping[normalizedOwner].findIndex(
      existing => existing.tokenId === nft.tokenId
    );
    
    if (existingIndex >= 0) {
      // Update existing
      this.mapping[normalizedOwner][existingIndex] = nft;
      console.log(`🔄 Updated NFT ${nft.name}.0g in mapping`);
    } else {
      // Add new
      this.mapping[normalizedOwner].push(nft);
      console.log(`➕ Added NFT ${nft.name}.0g to mapping`);
    }
  }

  /**
   * Remove an NFT from the mapping (for transfers)
   */
  removeNFTFromMapping(tokenId: string, oldOwner: string): void {
    const normalizedOwner = oldOwner.toLowerCase();
    
    if (this.mapping[normalizedOwner]) {
      this.mapping[normalizedOwner] = this.mapping[normalizedOwner].filter(
        nft => nft.tokenId !== tokenId
      );
      
      // Remove empty address entries
      if (this.mapping[normalizedOwner].length === 0) {
        delete this.mapping[normalizedOwner];
      }
      
      console.log(`➖ Removed NFT ${tokenId} from ${normalizedOwner} in mapping`);
    }
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(): boolean {
    return Date.now() - this.lastUpdate < this.updateInterval;
  }

  /**
   * Get mapping statistics
   */
  getStats(): {
    totalAddresses: number;
    totalNFTs: number;
    lastUpdate: Date;
    cacheAge: number;
  } {
    return {
      totalAddresses: Object.keys(this.mapping).length,
      totalNFTs: this.getAllNFTs().length,
      lastUpdate: new Date(this.lastUpdate),
      cacheAge: Date.now() - this.lastUpdate
    };
  }

  /**
   * Clear the mapping cache
   */
  clearCache(): void {
    this.mapping = {};
    this.lastUpdate = 0;
    console.log('🗑️ Address mapping cache cleared');
  }

  /**
   * Export mapping as JSON
   */
  exportMapping(): string {
    return JSON.stringify(this.mapping, null, 2);
  }

  /**
   * Import mapping from JSON
   */
  importMapping(jsonData: string): void {
    try {
      this.mapping = JSON.parse(jsonData);
      this.lastUpdate = Date.now();
      console.log('📥 Address mapping imported successfully');
    } catch (error) {
      console.error('❌ Failed to import address mapping:', error);
    }
  }
}

// Global instance
export const addressMappingService = new AddressMappingService();
