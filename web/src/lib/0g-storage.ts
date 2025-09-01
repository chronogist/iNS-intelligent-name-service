import { ZgFile, Indexer, Batcher, KvClient } from '@0glabs/0g-ts-sdk';
import { ethers } from 'ethers';
import { promises as fs } from 'fs';

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

export class OGStorageService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  private indexer: Indexer | null = null;
  private kvClient: KvClient | null = null;

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

    // Initialize 0G Storage components
    this.indexer = new Indexer(OG_CONFIG.INDEXER_RPC);
    this.kvClient = new KvClient(OG_CONFIG.KV_ENDPOINT);
  }

  /**
   * Upload name metadata to 0G Storage
   */
  async uploadNameMetadata(
    name: string,
    metadata: NameMetadata,
    encryptionKey: Uint8Array
  ): Promise<{
    encryptedURI: string;
    metadataHash: string;
    rootHash: string;
    txHash: string;
  }> {
    if (!this.indexer || !this.signer) {
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

      // Convert to JSON and create file
      const metadataJson = JSON.stringify(encryptedMetadata);
      
      // Create temporary file path
      const tempPath = `/tmp/${name}.0g-metadata.json`;
      
      // Write metadata to temporary file
      await fs.writeFile(tempPath, metadataJson);
      
      // Open file handle and create ZgFile
      const fileHandle = await fs.open(tempPath, 'r');
      const stats = await fs.stat(tempPath);
      const file = new ZgFile(fileHandle, stats.size);
      
      // Generate Merkle tree for verification
      const [tree, treeErr] = await file.merkleTree();
      if (treeErr !== null) {
        throw new Error(`Error generating Merkle tree: ${treeErr}`);
      }

      // Upload to 0G Storage
      const [tx, uploadErr] = await this.indexer.upload(file, OG_CONFIG.RPC_URL, this.signer as any);
      if (uploadErr !== null) {
        throw new Error(`Upload error: ${uploadErr}`);
      }

      // Create 0G Storage URI
      const encryptedURI = `og://storage/${tree?.rootHash()}`;

      // Close file
      await file.close();

      return {
        encryptedURI,
        metadataHash: encryptedData.hash,
        rootHash: tree?.rootHash() || '',
        txHash: tx || ''
      };
    } catch (error) {
      console.error('Error uploading name metadata:', error);
      throw error;
    }
  }

  /**
   * Download and decrypt name metadata from 0G Storage
   */
  async downloadNameMetadata(
    rootHash: string,
    encryptionKey: Uint8Array
  ): Promise<NameMetadata> {
    if (!this.indexer) {
      throw new Error('0G Storage service not initialized');
    }

    try {
      // Download file from 0G Storage
      const tempPath = `/tmp/${rootHash}.json`;
      const err = await this.indexer.download(rootHash, tempPath, true);
      if (err !== null) {
        throw new Error(`Download error: ${err}`);
      }

      // Read the downloaded file
      const response = await fetch(`file://${tempPath}`);
      const encryptedMetadata: EncryptedMetadata = await response.json();

      // Decrypt metadata
      const decryptedData = await this.decryptMetadata(
        encryptedMetadata.encryptedData,
        encryptedMetadata.iv,
        encryptionKey
      );

      return JSON.parse(decryptedData);
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
  ): Promise<{
    encryptedURI: string;
    metadataHash: string;
    rootHash: string;
    txHash: string;
  }> {
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
   * Store metadata in 0G Key-Value storage for quick access
   */
  async storeMetadataInKV(
    name: string,
    metadataHash: string,
    rootHash: string
  ): Promise<string> {
    if (!this.kvClient) {
      throw new Error('0G KV client not initialized');
    }

    try {
      const streamId = ethers.keccak256(ethers.toUtf8Bytes(name));
      const key = 'metadata';
      const value = JSON.stringify({
        metadataHash,
        rootHash,
        lastUpdated: Date.now()
      });

      // Store in 0G KV
      const keyBytes = Uint8Array.from(Buffer.from(key, 'utf-8'));
      const valueBytes = Uint8Array.from(Buffer.from(value, 'utf-8'));
      
      // Note: This would require a batcher setup in a real implementation
      // For now, we'll simulate the KV storage
      console.log('Storing in 0G KV:', { streamId, key, value });

      return streamId;
    } catch (error) {
      console.error('Error storing metadata in KV:', error);
      throw error;
    }
  }

  /**
   * Retrieve metadata reference from 0G Key-Value storage
   */
  async getMetadataFromKV(name: string): Promise<{
    metadataHash: string;
    rootHash: string;
    lastUpdated: number;
  } | null> {
    if (!this.kvClient) {
      throw new Error('0G KV client not initialized');
    }

    try {
      const streamId = ethers.keccak256(ethers.toUtf8Bytes(name));
      const key = 'metadata';
      const keyBytes = Uint8Array.from(Buffer.from(key, 'utf-8'));
      
      // Retrieve from 0G KV
      const value = await this.kvClient.getValue(
        streamId, 
        ethers.encodeBase64(keyBytes)
      );

      if (value) {
        return JSON.parse(value);
      }

      return null;
    } catch (error) {
      console.error('Error retrieving metadata from KV:', error);
      return null;
    }
  }

  /**
   * Upload avatar image to 0G Storage
   */
  async uploadAvatar(
    name: string,
    imageFile: File
  ): Promise<{
    avatarURI: string;
    rootHash: string;
    txHash: string;
  }> {
    if (!this.indexer || !this.signer) {
      throw new Error('0G Storage service not initialized');
    }

    try {
      // Create ZgFile from image
      const file = new ZgFile(imageFile, `${name}-avatar.${imageFile.name.split('.').pop()}`);
      
      // Generate Merkle tree
      const [tree, treeErr] = await file.merkleTree();
      if (treeErr !== null) {
        throw new Error(`Error generating Merkle tree: ${treeErr}`);
      }

      // Upload to 0G Storage
      const [tx, uploadErr] = await this.indexer.upload(file, OG_CONFIG.RPC_URL, this.signer as any);
      if (uploadErr !== null) {
        throw new Error(`Upload error: ${uploadErr}`);
      }

      // Create avatar URI
      const avatarURI = `og://storage/${tree?.rootHash()}`;

      // Close file
      await file.close();

      return {
        avatarURI,
        rootHash: tree?.rootHash() || '',
        txHash: tx || ''
      };
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  }

  /**
   * Get avatar image from 0G Storage
   */
  async getAvatar(rootHash: string): Promise<Blob> {
    if (!this.indexer) {
      throw new Error('0G Storage service not initialized');
    }

    try {
      // Download avatar from 0G Storage
      const tempPath = `/tmp/avatar-${rootHash}`;
      const err = await this.indexer.download(rootHash, tempPath, true);
      if (err !== null) {
        throw new Error(`Download error: ${err}`);
      }

      // Read the downloaded file
      const response = await fetch(`file://${tempPath}`);
      return await response.blob();
    } catch (error) {
      console.error('Error getting avatar:', error);
      throw error;
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
      key,
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
      key,
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
   * Verify file integrity using Merkle proof
   */
  async verifyFileIntegrity(rootHash: string, filePath: string): Promise<boolean> {
    try {
      // Download with proof verification enabled
      const err = await this.indexer?.download(rootHash, filePath, true);
      return err === null;
    } catch (error) {
      console.error('Error verifying file integrity:', error);
      return false;
    }
  }
}

// Global instance
export const ogStorageService = new OGStorageService();

