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

/**
 * Legacy simplified metadata used by older components (for smooth migration)
 */
export interface LegacyAIAgentMetadata {
  timestamp: number;
  agentType: string;
  learningData: Record<string, any>;
  performanceMetrics: Record<string, any>;
  decisionHistory: Array<Record<string, any>>;
  version: string;
  contextHash?: string;
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
 * Browser 0G Storage Service
 * Calls backend API endpoints which handle 0G SDK operations server-side
 */
export class BrowserZeroGStorageService {
  private apiUrl: string;
  private initialized = true; // No initialization needed, API is always available

  constructor(apiUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') {
    this.apiUrl = apiUrl;
    console.log('🏗️ 0G Storage service initialized (using backend API)');
  }

  async init() {
    // No-op for compatibility - backend is always ready
    return;
  }

  /**
   * Upload AI Agent metadata to 0G Storage via backend API
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

      // Upload via backend API
      console.log('☁️  Uploading to 0G Storage network via backend...');
      const response = await fetch(`${this.apiUrl}/api/profile/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: signedMetadata }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();

      console.log('✅ Upload completed successfully');
      console.log('📝 Transaction:', result.txHash);

      const rootHash = result.rootHash;
      if (!rootHash) {
        console.error('❌ Failed to get root hash from upload');
        throw new Error('Failed to get root hash');
      }

      console.log('🎉 Upload successful!');
      console.log('📍 Root Hash:', rootHash);
      console.log('🔗 Metadata Hash:', metadataHash);

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

  /**
   * Upload data to 0G Storage via backend API
   */
  async uploadData(
    data: LegacyAIAgentMetadata
  ): Promise<{ success: boolean; merkleRoot?: string; dataRoot?: string; error?: string }> {
    try {
      console.log('📤 Uploading to 0G Storage via backend API...');

      const response = await fetch(`${this.apiUrl}/api/profile/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();

      console.log('✅ Upload successful:', result);

      // Calculate metadata hash for verification
      const metadataJSON = JSON.stringify(data, null, 2);
      const metadataHash = ethers.keccak256(ethers.toUtf8Bytes(metadataJSON));

      return {
        success: true,
        merkleRoot: result.rootHash,
        dataRoot: metadataHash
      };
    } catch (err: any) {
      console.error('❌ Upload error:', err);
      return { success: false, error: err?.message || 'Unknown error' };
    }
  }

  /**
   * Compatibility wrapper: lightweight file info by root hash
   * Note: Detailed size/status may require backend or future SDK calls.
   */
  async getFileInfo(rootHash: string): Promise<{
    merkleRoot: string;
    size?: string;
    nodeUrl: string;
    status: string;
    timestamp: number;
  }> {
    await this.init();
    return {
      merkleRoot: rootHash,
      size: 'Unknown',
      nodeUrl: INDEXER_RPC,
      status: 'Unknown',
      timestamp: Date.now()
    };
  }

  /**
   * Download data from 0G Storage via backend API
   */
  async downloadData(rootHash: string): Promise<{
    success: boolean;
    merkleRoot: string;
    nodeUrl: string;
    data?: any;
    message?: string;
  }> {
    try {
      console.log('📥 Downloading from 0G Storage via backend API...');

      const response = await fetch(`${this.apiUrl}/api/profile/download/${rootHash}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Download failed');
      }

      const data = await response.json();

      console.log('✅ Download successful');

      return {
        success: true,
        merkleRoot: rootHash,
        nodeUrl: INDEXER_RPC,
        data: data
      };
    } catch (err: any) {
      console.error('❌ Download error:', err);
      return {
        success: false,
        merkleRoot: rootHash,
        nodeUrl: INDEXER_RPC,
        message: err?.message || 'Download failed'
      };
    }
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

// Export a singleton for existing imports
export const browserZeroGStorage = new BrowserZeroGStorageService(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
);