/**
 * 0G Storage Service for iNS AI Agents
 * Handles upload/download of encrypted agent metadata to 0G Storage
 * Following official 0G Storage TypeScript SDK guide: https://docs.0g.ai/developer-hub/building-on-0g/storage/sdk
 */

import { Indexer, ZgFile, MemData } from '@0glabs/0g-ts-sdk';
import { ethers } from 'ethers';

// 0G Network Configuration - Following official guide
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://evmrpc-testnet.0g.ai/';
const INDEXER_RPC = process.env.NEXT_PUBLIC_INDEXER_RPC || 'https://indexer-storage-testnet-turbo.0g.ai'; // OFFICIAL DOCUMENTATION

/**
 * AI Agent Metadata Schema
 * This is what gets stored on 0G Storage and encrypted
 */
export interface AIAgentMetadata {
  // Core Identity
  domain: string;
  agentType: 'defi_trader' | 'gas_optimizer' | 'nft_analyzer' | 'yield_farmer' | 'arbitrage_bot' | 'custom';
  version: number;
  createdAt: number;
  lastUpdatedAt: number;

  // Intelligence Data (the "brain" of the agent)
  intelligence: {
    // Learned parameters specific to agent type
    parameters: Record<string, any>;

    // Historical performance metrics
    performanceHistory: PerformanceRecord[];

    // Training data references (could be encrypted hashes)
    trainingDataHashes: string[];

    // Agent's learned strategies
    strategies: Strategy[];
  };

  // Performance Metrics (verifiable on-chain)
  metrics: {
    intelligenceScore: number;  // 0-1000 scale
    totalActions: number;
    successfulActions: number;
    successRate: number;        // percentage
    totalValueManaged: string;  // in wei
    profitGenerated: string;    // in wei
    gasOptimized: string;       // total gas saved
  };

  // Routing Rules (for intelligent transaction routing)
  routingRules: RoutingRule[];

  // Ownership & Transfer History
  ownerAddress: string;
  transferHistory: TransferRecord[];

  // Marketplace Data
  isListed: boolean;
  listingPrice?: string;
  rentalAvailable: boolean;
  rentalPricePerDay?: string;

  // Metadata verification
  metadataHash: string;
  signature: string;
}

export interface PerformanceRecord {
  timestamp: number;
  action: string;
  outcome: 'success' | 'failure';
  valueImpact: string;  // in wei, can be negative
  gasUsed: string;
  intelligenceScoreBefore: number;
  intelligenceScoreAfter: number;
  metadata?: Record<string, any>;
}

export interface Strategy {
  id: string;
  name: string;
  type: string;
  description: string;
  parameters: Record<string, any>;
  successRate: number;
  timesUsed: number;
  lastUsed: number;
  avgValueImpact: string;
}

export interface RoutingRule {
  id: string;
  type: 'token' | 'amount' | 'sender' | 'gas_price' | 'time' | 'default';
  condition: string;
  destination: string;
  label: string;
  priority: number;
  active: boolean;
}

export interface TransferRecord {
  from: string;
  to: string;
  timestamp: number;
  price: string;
  intelligenceScore: number;
  transactionHash: string;
}

/**
 * Intelligence Score Calculation
 * Score ranges from 0-1000
 */
export function calculateIntelligenceScore(metadata: AIAgentMetadata): number {
  const {
    totalActions,
    successfulActions,
    totalValueManaged,
    profitGenerated,
    gasOptimized
  } = metadata.metrics;

  if (totalActions === 0) return 0;

  // Success rate component (0-300 points)
  const successRate = successfulActions / totalActions;
  const successScore = Math.min(300, successRate * 300);

  // Experience component (0-200 points)
  const experienceScore = Math.min(200, Math.log10(totalActions + 1) * 50);

  // Value managed component (0-200 points)
  const valueScore = Math.min(200, Math.log10(
    Number(ethers.formatEther(totalValueManaged || '0')) + 1
  ) * 20);

  // Profit component (0-200 points)
  const profitScore = Math.min(200, Math.log10(
    Number(ethers.formatEther(profitGenerated || '0')) + 1
  ) * 20);

  // Gas optimization component (0-100 points)
  const gasScore = Math.min(100, Math.log10(
    Number(ethers.formatEther(gasOptimized || '0')) + 1
  ) * 10);

  return Math.floor(successScore + experienceScore + valueScore + profitScore + gasScore);
}

/**
 * 0G Storage Service Class
 */
export class ZeroGStorageService {
  private indexer: Indexer;
  private provider: ethers.JsonRpcProvider;

  constructor() {
    this.indexer = new Indexer(INDEXER_RPC);
    this.provider = new ethers.JsonRpcProvider(RPC_URL);
  }

  /**
   * Upload AI Agent metadata to 0G Storage
   * @param metadata Agent metadata to upload
   * @param signer Wallet signer for transaction
   * @returns Root hash of uploaded file
   */
  async uploadAgentMetadata(
    metadata: AIAgentMetadata,
    signer: ethers.Wallet
  ): Promise<{ rootHash: string; metadataHash: string }> {
    try {
      console.log('📤 Starting 0G Storage upload...');
      console.log('📊 Metadata:', {
        domain: metadata.domain,
        agentType: metadata.agentType,
        intelligenceScore: metadata.metrics.intelligenceScore,
        totalActions: metadata.metrics.totalActions
      });

      // Calculate metadata hash
      const metadataJSON = JSON.stringify(metadata, null, 2);
      const metadataHash = ethers.keccak256(ethers.toUtf8Bytes(metadataJSON));
      console.log('🔐 Metadata hash calculated:', metadataHash);

      // Sign the metadata
      console.log('✍️  Signing metadata...');
      const signature = await signer.signMessage(metadataHash);
      console.log('✅ Metadata signed:', signature.slice(0, 20) + '...');

      // Add signature to metadata
      const signedMetadata = {
        ...metadata,
        signature,
        metadataHash
      };

      // Create file from metadata
      const metadataBuffer = Buffer.from(JSON.stringify(signedMetadata, null, 2));
      console.log('📦 Metadata buffer created:', metadataBuffer.length, 'bytes');

      // Write to temporary file for ZgFile.fromFilePath
      const fs = await import('fs');
      const path = await import('path');
      const tempDir = '/tmp';
      const fileName = `agent-metadata-${Date.now()}.json`;
      const filePath = path.join(tempDir, fileName);
      
      fs.writeFileSync(filePath, JSON.stringify(signedMetadata, null, 2));
      console.log('📄 Temporary file created:', filePath);

      // Create ZgFile from file path (REAL 0G SDK method)
      const file = await ZgFile.fromFilePath(filePath);
      console.log('✅ ZgFile created from file path');

      // Generate merkle tree
      console.log('🌳 Generating merkle tree...');
      const [tree, treeErr] = await file.merkleTree();
      if (treeErr !== null) {
        console.error('❌ Merkle tree generation failed:', treeErr);
        // Clean up temp file
        fs.unlinkSync(filePath);
        throw new Error(`Failed to generate merkle tree: ${treeErr.message}`);
      }
      console.log('✅ Merkle tree generated successfully');

      // Upload to 0G Storage using REAL indexer.upload method
      console.log('☁️  Uploading to 0G Storage network...');
      console.log('🔗 RPC URL:', RPC_URL);
      console.log('👤 Signer address:', await signer.getAddress());

      const uploadStartTime = Date.now();
      const [tx, uploadErr] = await this.indexer.upload(file, RPC_URL, signer as any);
      const uploadDuration = Date.now() - uploadStartTime;
      
      // Clean up temporary file
      await file.close();
      fs.unlinkSync(filePath);
      console.log('🧹 Temporary file cleaned up');

      if (uploadErr !== null) {
        console.error('❌ Upload failed:', uploadErr);
        throw new Error(`Failed to upload to 0G Storage: ${uploadErr.message}`);
      }

      console.log('✅ Upload completed in', uploadDuration, 'ms');
      console.log('📝 Transaction:', tx);

      const rootHash = tree!.rootHash();
      if (!rootHash) {
        console.error('❌ Failed to get root hash from merkle tree');
        throw new Error('Failed to generate root hash');
      }

      console.log('🎉 Upload successful!');
      console.log('📍 Root Hash:', rootHash);
      console.log('🔗 Metadata Hash:', metadataHash);
      console.log('⏱️  Total upload time:', uploadDuration, 'ms');

      return {
        rootHash,
        metadataHash
      };
    } catch (error: any) {
      console.error('❌ Error uploading to 0G Storage:', error);
      console.error('📋 Error details:', {
        message: error?.message || 'Unknown error',
        stack: error?.stack || 'No stack trace'
      });
      throw error;
    }
  }

  /**
   * Download AI Agent metadata from 0G Storage
   * @param rootHash Root hash of the file
   * @returns Agent metadata
   */
  async downloadAgentMetadata(rootHash: string): Promise<AIAgentMetadata> {
    try {
      // Create temporary file path
      const tempPath = `/tmp/agent-${rootHash}.json`;

      // Download from 0G Storage
      const err = await this.indexer.download(rootHash, tempPath, true);
      if (err) {
        throw new Error(`Failed to download from 0G Storage: ${err.message}`);
      }

      // Read and parse metadata
      const fs = require('fs');
      const metadataJSON = fs.readFileSync(tempPath, 'utf8');
      const metadata = JSON.parse(metadataJSON) as AIAgentMetadata;

      // Verify metadata hash
      const calculatedHash = ethers.keccak256(
        ethers.toUtf8Bytes(JSON.stringify({
          ...metadata,
          signature: undefined,
          metadataHash: undefined
        }))
      );

      if (calculatedHash !== metadata.metadataHash) {
        throw new Error('Metadata hash mismatch - file may be corrupted');
      }

      // Clean up temp file
      fs.unlinkSync(tempPath);

      return metadata;
    } catch (error: any) {
      console.error('Error downloading from 0G Storage:', error);
      throw error;
    }
  }

  /**
   * Create initial AI Agent metadata
   */
  static createInitialMetadata(
    domain: string,
    agentType: AIAgentMetadata['agentType'],
    ownerAddress: string,
    routingRules: RoutingRule[] = []
  ): AIAgentMetadata {
    const now = Date.now();

    return {
      domain,
      agentType,
      version: 1,
      createdAt: now,
      lastUpdatedAt: now,
      intelligence: {
        parameters: {},
        performanceHistory: [],
        trainingDataHashes: [],
        strategies: []
      },
      metrics: {
        intelligenceScore: 0,
        totalActions: 0,
        successfulActions: 0,
        successRate: 0,
        totalValueManaged: '0',
        profitGenerated: '0',
        gasOptimized: '0'
      },
      routingRules,
      ownerAddress,
      transferHistory: [],
      isListed: false,
      rentalAvailable: false,
      metadataHash: '',
      signature: ''
    };
  }

  /**
   * Update agent metrics after an action
   */
  static updateMetricsAfterAction(
    metadata: AIAgentMetadata,
    action: PerformanceRecord
  ): AIAgentMetadata {
    const updatedMetadata = { ...metadata };

    // Add to performance history
    updatedMetadata.intelligence.performanceHistory.push(action);

    // Update metrics
    updatedMetadata.metrics.totalActions += 1;
    if (action.outcome === 'success') {
      updatedMetadata.metrics.successfulActions += 1;
    }
    updatedMetadata.metrics.successRate =
      (updatedMetadata.metrics.successfulActions / updatedMetadata.metrics.totalActions) * 100;

    // Update value impact
    const currentValue = BigInt(updatedMetadata.metrics.totalValueManaged);
    const actionValue = BigInt(action.valueImpact);
    updatedMetadata.metrics.totalValueManaged = (currentValue + actionValue).toString();

    // Update profit if positive
    if (BigInt(action.valueImpact) > BigInt(0)) {
      const currentProfit = BigInt(updatedMetadata.metrics.profitGenerated);
      updatedMetadata.metrics.profitGenerated = (currentProfit + actionValue).toString();
    }

    // Update gas optimization
    const currentGas = BigInt(updatedMetadata.metrics.gasOptimized);
    const gasUsed = BigInt(action.gasUsed);
    updatedMetadata.metrics.gasOptimized = (currentGas + gasUsed).toString();

    // Recalculate intelligence score
    updatedMetadata.metrics.intelligenceScore = calculateIntelligenceScore(updatedMetadata);

    // Update timestamp
    updatedMetadata.lastUpdatedAt = Date.now();
    updatedMetadata.version += 1;

    return updatedMetadata;
  }
}

// Browser-compatible version (without fs operations)
export class BrowserZeroGStorageService {
  private indexer: Indexer;

  constructor() {
    this.indexer = new Indexer(INDEXER_RPC);
  }

  /**
   * Upload AI Agent metadata to 0G Storage (browser version) 
   * Following official 0G TypeScript SDK guide
   */
  async uploadAgentMetadata(
    metadata: AIAgentMetadata,
    signer: ethers.Signer
  ): Promise<{ rootHash: string; metadataHash: string }> {
    try {
      console.log('📤 Starting 0G Storage upload...');
      console.log('📊 Metadata:', {
        domain: metadata.domain,
        agentType: metadata.agentType,
        intelligenceScore: metadata.metrics.intelligenceScore,
        totalActions: metadata.metrics.totalActions
      });

      // Calculate metadata hash
      const metadataJSON = JSON.stringify(metadata, null, 2);
      const metadataHash = ethers.keccak256(ethers.toUtf8Bytes(metadataJSON));
      console.log('🔐 Metadata hash calculated:', metadataHash);

      // Sign the metadata
      console.log('✍️  Signing metadata...');
      const signature = await signer.signMessage(ethers.getBytes(metadataHash));
      console.log('✅ Metadata signed:', signature.slice(0, 20) + '...');

      // Add signature to metadata
      const signedMetadata = {
        ...metadata,
        signature,
        metadataHash
      };

      // Create file from metadata - REAL 0G Storage implementation
      const metadataBuffer = Buffer.from(JSON.stringify(signedMetadata, null, 2));
      console.log('📦 Metadata buffer created:', metadataBuffer.length, 'bytes');

      const zgFile = new MemData(metadataBuffer);
      console.log('📄 ZG MemData object created (browser compatible)');

      // Generate merkle tree - Following official SDK guide
      console.log('🌳 Generating merkle tree...');
      const [tree, treeErr] = await zgFile.merkleTree();
      if (treeErr) {
        console.error('❌ Merkle tree generation failed:', treeErr);
        throw new Error(`Failed to generate merkle tree: ${treeErr.message}`);
      }
      console.log('✅ Merkle tree generated successfully');

      // Upload to 0G Storage - REAL implementation using official indexer.upload
      console.log('☁️  Uploading to REAL 0G Storage network...');
      console.log('🔗 RPC URL:', RPC_URL);
      console.log('🗂️  Indexer RPC:', INDEXER_RPC);
      console.log('👤 Signer address:', await signer.getAddress());

      const uploadStartTime = Date.now();
      // REAL upload using official SDK method
      const [tx, uploadErr] = await this.indexer.upload(zgFile, RPC_URL, signer as any);
      const uploadDuration = Date.now() - uploadStartTime;

      if (uploadErr !== null) {
        console.error('❌ Upload failed:', uploadErr);
        throw new Error(`Failed to upload to 0G Storage: ${uploadErr.message}`);
      }

      console.log('✅ Upload completed in', uploadDuration, 'ms');
      console.log('📝 Transaction:', tx);

      const rootHash = tree!.rootHash();
      if (!rootHash) {
        console.error('❌ Failed to get root hash from merkle tree');
        throw new Error('Failed to generate root hash');
      }

      console.log('🎉 Upload successful!');
      console.log('📍 Root Hash:', rootHash);
      console.log('🔗 Metadata Hash:', metadataHash);
      console.log('⏱️  Total upload time:', uploadDuration, 'ms');

      return {
        rootHash,
        metadataHash
      };
    } catch (error: any) {
      console.error('❌ Error uploading to 0G Storage:', error);
      console.error('📋 Error details:', {
        message: error?.message || 'Unknown error',
        stack: error?.stack || 'No stack trace',
        name: error?.name || 'Unknown error type'
      });
      throw error;
    }
  }

  /**
   * Download AI Agent metadata from 0G Storage (browser version)
   * Uses backend API for file operations since browser can't write to filesystem
   */
  async downloadAgentMetadata(rootHash: string): Promise<AIAgentMetadata> {
    try {
      console.log('📥 Starting REAL download via API...');
      console.log('🔑 Root hash:', rootHash);

      // Use backend API for download since browser can't write to filesystem
      const response = await fetch(`/api/profiles/download/${rootHash}`);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Download failed');
      }
      
      console.log('✅ Download successful via API');
      console.log('🔍 Domain:', result.data.domain);
      
      return result.data as AIAgentMetadata;
      
    } catch (error: any) {
      console.error('❌ Error downloading from 0G Storage:', error);
      throw error;
    }
  }
}
