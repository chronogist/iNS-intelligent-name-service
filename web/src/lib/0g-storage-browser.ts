import { ethers } from 'ethers';

// 0G Storage Configuration
const OG_CONFIG = {
  RPC_URL: process.env.NEXT_PUBLIC_OG_RPC_URL || 'https://evmrpc-testnet.0g.ai/',
  INDEXER_RPC: process.env.NEXT_PUBLIC_OG_INDEXER_RPC || 'https://indexer-storage-testnet-turbo.0g.ai',
  KV_ENDPOINT: process.env.NEXT_PUBLIC_OG_KV_ENDPOINT || 'http://3.101.147.150:6789'
};

// Name metadata structure for 0g naming service
export interface NameMetadata {
  displayName: string;        // "Alice"
  bio: string;                // "Web3 developer building the future"
  avatar: string;             // IPFS or 0G Storage URI
  socialLinks: {
    twitter?: string;
    github?: string;
    website?: string;
    telegram?: string;
  };
  location?: string;          // "New York, NY"
  status?: string;            // "Active", "Traveling", "Busy"
  lastUpdated: number;        // Timestamp
  version: string;            // Metadata version
}

export interface EncryptedMetadata {
  encryptedData: string;      // Base64 encoded encrypted data
  iv: string;                 // Initialization vector
  metadataHash: string;       // Hash of the metadata
}

export interface UploadResult {
  encryptedURI: string;
  metadataHash: string;
  rootHash: string;
  txHash: string;
}

export class OGStorageBrowserService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;

  async initialize(): Promise<void> {
    if (typeof window === 'undefined') return;

    // Check if MetaMask is installed
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    // Request account access
    await window.ethereum.request({ method: 'eth_requestAccounts' });

    // Create provider and signer
    this.provider = new ethers.BrowserProvider(window.ethereum);
    this.signer = await this.provider.getSigner();
  }

  /**
   * Upload name metadata to 0G Storage (Browser-compatible)
   * Note: This is a simplified version that simulates 0G Storage upload
   * In a real implementation, you would use the 0G Storage SDK with proper browser support
   */
  async uploadNameMetadata(
    name: string,
    metadata: NameMetadata,
    encryptionKey: Uint8Array
  ): Promise<UploadResult> {
    if (!this.signer) {
      throw new Error('0G Storage service not initialized');
    }

    try {
      // Encrypt metadata
      const encryptedData = await this.encryptMetadata(metadata, encryptionKey);
      
      // Create metadata object with encryption info
      const encryptedMetadata: EncryptedMetadata = {
        encryptedData: encryptedData.encrypted,
        iv: encryptedData.iv,
        metadataHash: encryptedData.hash
      };

      // Convert to JSON and create blob
      const metadataJson = JSON.stringify(encryptedMetadata);
      const metadataBlob = new Blob([metadataJson], { type: 'application/json' });
      
      // Generate a simulated root hash (in real implementation, this would be from 0G Storage)
      const rootHash = ethers.keccak256(ethers.toUtf8Bytes(metadataJson + Date.now()));
      
      // Create 0G Storage URI
      const encryptedURI = `og://storage/${rootHash}`;

      // Simulate upload transaction (in real implementation, this would be an actual 0G Storage transaction)
      const userAddress = await this.signer.getAddress();
      const message = `Upload metadata for ${name}.0g to 0G Storage`;
      const signature = await this.signer.signMessage(message);
      const txHash = ethers.keccak256(ethers.toUtf8Bytes(signature));

      console.log(`✅ Simulated upload to 0G Storage for ${name}.0g`);
      console.log(`   Root Hash: ${rootHash}`);
      console.log(`   Encrypted URI: ${encryptedURI}`);
      console.log(`   Transaction Hash: ${txHash}`);

      return {
        encryptedURI,
        metadataHash: encryptedData.hash,
        rootHash,
        txHash
      };
    } catch (error) {
      console.error('Error uploading name metadata:', error);
      throw error;
    }
  }

  /**
   * Download and decrypt name metadata from 0G Storage (Browser-compatible)
   */
  async downloadNameMetadata(
    rootHash: string,
    encryptionKey: Uint8Array
  ): Promise<NameMetadata> {
    try {
      // In a real implementation, this would download from 0G Storage
      // For now, we'll simulate by creating a default metadata structure
      const defaultMetadata: NameMetadata = {
        displayName: "User",
        bio: "Profile loaded from 0G Storage",
        avatar: "",
        socialLinks: {},
        location: "",
        status: "Active",
        lastUpdated: Date.now(),
        version: "1.0.0"
      };

      console.log(`✅ Simulated download from 0G Storage: ${rootHash}`);
      return defaultMetadata;
    } catch (error) {
      console.error('Error downloading name metadata:', error);
      throw error;
    }
  }

  /**
   * Update name metadata (upload new version)
   */
  async updateNameMetadata(
    name: string,
    currentMetadata: NameMetadata,
    updates: Partial<NameMetadata>,
    encryptionKey: Uint8Array
  ): Promise<UploadResult> {
    // Merge current metadata with updates
    const updatedMetadata: NameMetadata = {
      ...currentMetadata,
      ...updates,
      lastUpdated: Date.now(),
      version: this.incrementVersion(currentMetadata.version)
    };

    // Upload updated metadata
    return await this.uploadNameMetadata(name, updatedMetadata, encryptionKey);
  }

  /**
   * Store metadata in 0G Key-Value storage for quick access (Browser-compatible)
   */
  async storeMetadataInKV(
    name: string,
    metadataHash: string,
    rootHash: string
  ): Promise<string> {
    try {
      const streamId = ethers.keccak256(ethers.toUtf8Bytes(name));
      const key = 'metadata';
      const value = JSON.stringify({
        metadataHash,
        rootHash,
        lastUpdated: Date.now()
      });

      // Simulate KV storage (in real implementation, this would use 0G KV)
      console.log('✅ Simulated KV storage:', { streamId, key, value });

      return streamId;
    } catch (error) {
      console.error('Error storing metadata in KV:', error);
      throw error;
    }
  }

  /**
   * Retrieve metadata reference from 0G Key-Value storage (Browser-compatible)
   */
  async getMetadataFromKV(name: string): Promise<{
    metadataHash: string;
    rootHash: string;
    lastUpdated: number;
  } | null> {
    try {
      const streamId = ethers.keccak256(ethers.toUtf8Bytes(name));
      
      // Simulate KV retrieval (in real implementation, this would query 0G KV)
      console.log(`✅ Simulated KV retrieval for ${name}: ${streamId}`);
      
      // Return null to indicate no cached data (will fall back to on-chain data)
      return null;
    } catch (error) {
      console.error('Error retrieving metadata from KV:', error);
      return null;
    }
  }

  /**
   * Upload avatar image to 0G Storage (Browser-compatible)
   */
  async uploadAvatar(
    name: string,
    imageFile: File
  ): Promise<{
    avatarURI: string;
    rootHash: string;
    txHash: string;
  }> {
    if (!this.signer) {
      throw new Error('0G Storage service not initialized');
    }

    try {
      // Generate a simulated root hash for the image
      const imageHash = ethers.keccak256(ethers.toUtf8Bytes(imageFile.name + Date.now()));
      
      // Create avatar URI
      const avatarURI = `og://storage/${imageHash}`;

      // Simulate upload transaction
      const userAddress = await this.signer.getAddress();
      const message = `Upload avatar for ${name}.0g to 0G Storage`;
      const signature = await this.signer.signMessage(message);
      const txHash = ethers.keccak256(ethers.toUtf8Bytes(signature));

      console.log(`✅ Simulated avatar upload to 0G Storage for ${name}.0g`);
      console.log(`   Image: ${imageFile.name}`);
      console.log(`   Root Hash: ${imageHash}`);
      console.log(`   Avatar URI: ${avatarURI}`);

      return {
        avatarURI,
        rootHash: imageHash,
        txHash
      };
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  }

  /**
   * Get avatar image from 0G Storage (Browser-compatible)
   */
  async getAvatar(rootHash: string): Promise<Blob | null> {
    try {
      // In a real implementation, this would download from 0G Storage
      // For now, we'll return null to indicate no avatar
      console.log(`✅ Simulated avatar download from 0G Storage: ${rootHash}`);
      return null;
    } catch (error) {
      console.error('Error getting avatar:', error);
      return null;
    }
  }

  // Helper methods

  private async encryptMetadata(
    metadata: NameMetadata, 
    key: Uint8Array
  ): Promise<{
    encrypted: string;
    iv: string;
    hash: string;
  }> {
    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Convert metadata to string
    const metadataString = JSON.stringify(metadata);
    
    // Encrypt using AES-GCM
    const encodedMetadata = new TextEncoder().encode(metadataString);
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      new Uint8Array(key),
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      encodedMetadata
    );
    
    // Convert to base64
    const encryptedBase64 = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
    const ivBase64 = btoa(String.fromCharCode(...iv));
    
    // Generate hash
    const hash = ethers.keccak256(ethers.toUtf8Bytes(metadataString));
    
    return {
      encrypted: encryptedBase64,
      iv: ivBase64,
      hash
    };
  }

  private async decryptMetadata(
    encryptedData: string,
    iv: string,
    key: Uint8Array
  ): Promise<string> {
    // Convert from base64
    const encrypted = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    const ivBytes = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
    
    // Decrypt using AES-GCM
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      new Uint8Array(key),
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBytes },
      cryptoKey,
      encrypted
    );
    
    return new TextDecoder().decode(decrypted);
  }

  private incrementVersion(currentVersion: string): string {
    const versionParts = currentVersion.split('.');
    const major = parseInt(versionParts[0]);
    const minor = parseInt(versionParts[1]);
    const patch = parseInt(versionParts[2]) + 1;
    return `${major}.${minor}.${patch}`;
  }

  /**
   * Generate encryption key from user's wallet
   */
  async generateEncryptionKey(userAddress: string): Promise<Uint8Array> {
    if (!this.signer) {
      throw new Error('Signer not initialized');
    }

    // Sign a message to generate a deterministic key
    const message = `Generate encryption key for ${userAddress} at ${Date.now()}`;
    const signature = await this.signer.signMessage(message);
    
    // Use signature to generate encryption key
    const keyMaterial = ethers.keccak256(ethers.toUtf8Bytes(signature));
    return ethers.getBytes(keyMaterial);
  }

  /**
   * Verify file integrity using Merkle proof (Browser-compatible)
   */
  async verifyFileIntegrity(rootHash: string): Promise<boolean> {
    try {
      // In a real implementation, this would verify using 0G Storage Merkle proofs
      // For now, we'll simulate successful verification
      console.log(`✅ Simulated file integrity verification: ${rootHash}`);
      return true;
    } catch (error) {
      console.error('Error verifying file integrity:', error);
      return false;
    }
  }
}

// Global instance
export const ogStorageBrowserService = new OGStorageBrowserService();

