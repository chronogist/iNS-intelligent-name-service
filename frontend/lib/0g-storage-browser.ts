/**
 * REAL 0G Storage Service for Browser (Using Official SDK)
 * Browser-compatible implementation with real 0G Storage operations
 */

import { ethers } from 'ethers';

// OFFICIAL 0G Network Configuration
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://evmrpc-testnet.0g.ai/';
const INDEXER_RPC = process.env.NEXT_PUBLIC_INDEXER_RPC || 'https://indexer-storage-testnet-turbo.0g.ai'; // OFFICIAL DOCUMENTATION

/**
 * AI Agent Metadata Schema (Browser-safe)
 */
export interface AIAgentMetadata {
  domain: string;
  agentType: 'defi_trader' | 'gas_optimizer' | 'nft_analyzer' | 'yield_farmer' | 'arbitrage_bot' | 'custom';
  version: number;
  createdAt: number;
  lastUpdatedAt: number;
  intelligence: {
    parameters: Record<string, any>;
    performanceHistory: PerformanceRecord[];
    trainingDataHashes: string[];
    strategies: Strategy[];
  };
  metrics: {
    intelligenceScore: number;
    totalActions: number;
    successfulActions: number;
    successRate: number;
    totalValueManaged: string;
    profitGenerated: string;
    gasOptimized: string;
  };
  routingRules: RoutingRule[];
  ownerAddress: string;
  transferHistory: TransferRecord[];
  isListed: boolean;
  listingPrice?: string;
  rentalAvailable: boolean;
  rentalPricePerDay?: string;
  metadataHash: string;
  signature: string;
}

export interface PerformanceRecord {
  timestamp: number;
  action: string;
  outcome: 'success' | 'failure';
  valueImpact: string;
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
 * Browser-only 0G Storage Service
 * Uses dynamic imports to avoid SSR issues
 */
export class BrowserZeroGStorageService {
  private indexer: any = null;
  private initialized = false;

  async init() {
    if (this.initialized) return;
    
    try {
      // Dynamic import to avoid SSR issues
      const { Indexer } = await import('@0glabs/0g-ts-sdk');
      this.indexer = new Indexer(INDEXER_RPC);
      this.initialized = true;
      console.log('🏗️ 0G Storage service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize 0G Storage service:', error);
      throw new Error('Failed to initialize 0G Storage service');
    }
  }

  /**
   * Upload AI Agent metadata to 0G Storage (browser version)
   */
  async uploadAgentMetadata(
    metadata: AIAgentMetadata,
    signer: ethers.Signer
  ): Promise<{ rootHash: string; metadataHash: string }> {
    try {
      await this.init();
      
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

      // Create file from metadata using dynamic import
      console.log('📦 Creating metadata buffer...');
      const { MemData } = await import('@0glabs/0g-ts-sdk');
      
      const metadataBuffer = Buffer.from(JSON.stringify(signedMetadata, null, 2));
      console.log('📦 Metadata buffer created:', metadataBuffer.length, 'bytes');

      const zgFile = new MemData(metadataBuffer);
      console.log('📄 ZG File object created');

      // Generate merkle tree
      console.log('🌳 Generating merkle tree...');
      const [tree, treeErr] = await zgFile.merkleTree();
      if (treeErr) {
        console.error('❌ Merkle tree generation failed:', treeErr);
        throw new Error(`Failed to generate merkle tree: ${treeErr.message}`);
      }
      console.log('✅ Merkle tree generated successfully');

      // Upload to 0G Storage
      console.log('☁️  Uploading to 0G Storage network...');
      console.log('🔗 RPC URL:', RPC_URL);
      console.log('🗂️  Indexer RPC:', INDEXER_RPC);
      console.log('👤 Signer address:', await signer.getAddress());

      const uploadStartTime = Date.now();
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
   */
  async downloadAgentMetadata(rootHash: string): Promise<AIAgentMetadata> {
    throw new Error('Browser download not yet implemented - use API endpoint');
  }
}

/**
 * Intelligence Score Calculation (Browser-safe)
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