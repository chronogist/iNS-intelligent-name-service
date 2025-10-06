/**
 * AI Agent Learning Tracker
 * Monitors agent actions and updates intelligence over time
 */

import { ethers } from 'ethers';
import {
  AIAgentMetadata,
  PerformanceRecord,
  Strategy,
  calculateIntelligenceScore,
  ZeroGStorageService,
  BrowserZeroGStorageService
} from './0g-storage';

/**
 * Agent Action Types
 */
export type AgentAction = {
  type: 'transaction' | 'swap' | 'yield' | 'gas_optimization' | 'arbitrage' | 'custom';
  timestamp: number;
  transactionHash?: string;
  fromAddress?: string;
  toAddress?: string;
  tokenAddress?: string;
  amount?: string;
  gasUsed: string;
  gasPrice?: string;
  outcome: 'success' | 'failure';
  valueImpact: string; // Can be negative
  metadata?: Record<string, any>;
};

/**
 * Learning Event
 * Represents what the agent learned from an action
 */
export type LearningEvent = {
  actionId: string;
  timestamp: number;
  strategyId?: string;
  parameterUpdates: Record<string, any>;
  intelligenceScoreChange: number;
  insights: string[];
};

/**
 * Agent Learning Tracker
 * Tracks agent performance and updates metadata on 0G Storage
 */
export class AgentLearningTracker {
  private domain: string;
  private currentMetadata: AIAgentMetadata;
  private storageService: BrowserZeroGStorageService;
  private pendingActions: AgentAction[] = [];

  constructor(domain: string, metadata: AIAgentMetadata) {
    this.domain = domain;
    this.currentMetadata = metadata;
    this.storageService = new BrowserZeroGStorageService();
  }

  /**
   * Record a new agent action
   */
  async recordAction(action: AgentAction, signer: ethers.Signer): Promise<LearningEvent> {
    const previousScore = this.currentMetadata.metrics.intelligenceScore;

    // Create performance record
    const performanceRecord: PerformanceRecord = {
      timestamp: action.timestamp,
      action: action.type,
      outcome: action.outcome,
      valueImpact: action.valueImpact,
      gasUsed: action.gasUsed,
      intelligenceScoreBefore: previousScore,
      intelligenceScoreAfter: previousScore, // Will be updated
      metadata: {
        ...action.metadata,
        transactionHash: action.transactionHash,
        fromAddress: action.fromAddress,
        toAddress: action.toAddress,
        tokenAddress: action.tokenAddress,
        amount: action.amount,
        gasPrice: action.gasPrice
      }
    };

    // Update metadata metrics
    this.currentMetadata.intelligence.performanceHistory.push(performanceRecord);
    this.currentMetadata.metrics.totalActions += 1;

    if (action.outcome === 'success') {
      this.currentMetadata.metrics.successfulActions += 1;
    }

    // Update success rate
    this.currentMetadata.metrics.successRate =
      (this.currentMetadata.metrics.successfulActions / this.currentMetadata.metrics.totalActions) * 100;

    // Update value managed
    const currentValue = BigInt(this.currentMetadata.metrics.totalValueManaged);
    const actionValue = BigInt(action.valueImpact);
    this.currentMetadata.metrics.totalValueManaged = (currentValue + actionValue).toString();

    // Update profit if positive
    if (actionValue > BigInt(0)) {
      const currentProfit = BigInt(this.currentMetadata.metrics.profitGenerated);
      this.currentMetadata.metrics.profitGenerated = (currentProfit + actionValue).toString();
    }

    // Update gas optimization
    const currentGas = BigInt(this.currentMetadata.metrics.gasOptimized);
    const gasUsed = BigInt(action.gasUsed);
    this.currentMetadata.metrics.gasOptimized = (currentGas + gasUsed).toString();

    // Recalculate intelligence score
    const newScore = calculateIntelligenceScore(this.currentMetadata);
    this.currentMetadata.metrics.intelligenceScore = newScore;
    performanceRecord.intelligenceScoreAfter = newScore;

    // Update version and timestamp
    this.currentMetadata.version += 1;
    this.currentMetadata.lastUpdatedAt = Date.now();

    // Learn from the action
    const learningEvent = await this.learnFromAction(action);

    // Upload updated metadata to 0G Storage
    console.log('🔄 Preparing to upload learning data to 0G Storage...');
    console.log('📊 Current metrics:', {
      intelligenceScore: this.currentMetadata.metrics.intelligenceScore,
      totalActions: this.currentMetadata.metrics.totalActions,
      successRate: this.currentMetadata.metrics.successRate,
      version: this.currentMetadata.version
    });

    try {
      console.log('⏳ Uploading to 0G Storage...');
      const uploadStart = Date.now();

      const { rootHash, metadataHash } = await this.storageService.uploadAgentMetadata(
        this.currentMetadata,
        signer
      );

      const uploadTime = Date.now() - uploadStart;

      console.log('✅ Successfully uploaded to 0G Storage!');
      console.log('📍 Root Hash:', rootHash);
      console.log('🔗 Metadata Hash:', metadataHash);
      console.log('⏱️  Upload took:', uploadTime, 'ms');
      console.log('🎯 You can retrieve this data using the root hash');

    } catch (error) {
      console.error('❌ Failed to upload metadata to 0G Storage:', error);
      console.error('⚠️  Learning data saved locally but not backed up to 0G Storage');
      // Still return the learning event even if upload fails
    }

    return learningEvent;
  }

  /**
   * Learn from an action - extract insights and update strategies
   */
  private async learnFromAction(action: AgentAction): Promise<LearningEvent> {
    const learningEvent: LearningEvent = {
      actionId: `${action.timestamp}-${action.type}`,
      timestamp: action.timestamp,
      parameterUpdates: {},
      intelligenceScoreChange: this.currentMetadata.metrics.intelligenceScore,
      insights: []
    };

    // Agent-type specific learning
    switch (this.currentMetadata.agentType) {
      case 'defi_trader':
        this.learnDeFiStrategy(action, learningEvent);
        break;
      case 'gas_optimizer':
        this.learnGasOptimization(action, learningEvent);
        break;
      case 'yield_farmer':
        this.learnYieldStrategy(action, learningEvent);
        break;
      case 'arbitrage_bot':
        this.learnArbitrageStrategy(action, learningEvent);
        break;
      default:
        this.learnGenericPattern(action, learningEvent);
    }

    return learningEvent;
  }

  /**
   * Learn DeFi trading patterns
   */
  private learnDeFiStrategy(action: AgentAction, event: LearningEvent) {
    if (action.type === 'swap' || action.type === 'transaction') {
      // Track which tokens/pairs are profitable
      const tokenAddress = action.metadata?.tokenAddress;
      if (tokenAddress) {
        const tokenStats = this.currentMetadata.intelligence.parameters[`token_${tokenAddress}`] || {
          totalTrades: 0,
          successfulTrades: 0,
          totalProfit: '0'
        };

        tokenStats.totalTrades += 1;
        if (action.outcome === 'success' && BigInt(action.valueImpact) > BigInt(0)) {
          tokenStats.successfulTrades += 1;
          const currentProfit = BigInt(tokenStats.totalProfit);
          tokenStats.totalProfit = (currentProfit + BigInt(action.valueImpact)).toString();
        }

        this.currentMetadata.intelligence.parameters[`token_${tokenAddress}`] = tokenStats;
        event.parameterUpdates[`token_${tokenAddress}`] = tokenStats;
        event.insights.push(`Updated stats for token ${tokenAddress}`);
      }

      // Learn optimal gas prices
      if (action.gasPrice) {
        const gasPrice = BigInt(action.gasPrice);
        const avgGasPrice = this.currentMetadata.intelligence.parameters.avgSuccessfulGasPrice || '0';
        const currentAvg = BigInt(avgGasPrice);
        const newAvg = (currentAvg + gasPrice) / BigInt(2);
        this.currentMetadata.intelligence.parameters.avgSuccessfulGasPrice = newAvg.toString();
        event.insights.push(`Learned optimal gas price: ${ethers.formatUnits(newAvg, 'gwei')} gwei`);
      }
    }
  }

  /**
   * Learn gas optimization patterns
   */
  private learnGasOptimization(action: AgentAction, event: LearningEvent) {
    const gasUsed = BigInt(action.gasUsed);

    // Track gas usage patterns
    const actionType = action.type;
    const gasStats = this.currentMetadata.intelligence.parameters[`gas_${actionType}`] || {
      count: 0,
      totalGas: '0',
      minGas: gasUsed.toString(),
      maxGas: gasUsed.toString(),
      avgGas: '0'
    };

    gasStats.count += 1;
    const totalGas = BigInt(gasStats.totalGas) + gasUsed;
    gasStats.totalGas = totalGas.toString();
    gasStats.avgGas = (totalGas / BigInt(gasStats.count)).toString();
    gasStats.minGas = (gasUsed < BigInt(gasStats.minGas) ? gasUsed : BigInt(gasStats.minGas)).toString();
    gasStats.maxGas = (gasUsed > BigInt(gasStats.maxGas) ? gasUsed : BigInt(gasStats.maxGas)).toString();

    this.currentMetadata.intelligence.parameters[`gas_${actionType}`] = gasStats;
    event.parameterUpdates[`gas_${actionType}`] = gasStats;
    event.insights.push(`Optimized gas usage for ${actionType}: avg ${ethers.formatUnits(gasStats.avgGas, 'wei')} gas`);
  }

  /**
   * Learn yield farming strategies
   */
  private learnYieldStrategy(action: AgentAction, event: LearningEvent) {
    if (action.type === 'yield') {
      const protocol = action.metadata?.protocol;
      if (protocol) {
        const protocolStats = this.currentMetadata.intelligence.parameters[`yield_${protocol}`] || {
          deposits: 0,
          totalYield: '0',
          avgAPY: 0
        };

        if (action.outcome === 'success' && BigInt(action.valueImpact) > BigInt(0)) {
          protocolStats.deposits += 1;
          const currentYield = BigInt(protocolStats.totalYield);
          protocolStats.totalYield = (currentYield + BigInt(action.valueImpact)).toString();

          // Calculate APY if we have deposit amount and time
          if (action.metadata?.depositAmount && action.metadata?.durationDays) {
            const deposit = BigInt(action.metadata.depositAmount);
            const days = Number(action.metadata.durationDays);
            const yearlyYield = (BigInt(action.valueImpact) * BigInt(365)) / BigInt(days);
            const apy = Number((yearlyYield * BigInt(10000)) / deposit) / 100; // percentage with 2 decimals
            protocolStats.avgAPY = ((protocolStats.avgAPY * (protocolStats.deposits - 1)) + apy) / protocolStats.deposits;
          }
        }

        this.currentMetadata.intelligence.parameters[`yield_${protocol}`] = protocolStats;
        event.parameterUpdates[`yield_${protocol}`] = protocolStats;
        event.insights.push(`Learned yield strategy for ${protocol}: ${protocolStats.avgAPY.toFixed(2)}% APY`);
      }
    }
  }

  /**
   * Learn arbitrage patterns
   */
  private learnArbitrageStrategy(action: AgentAction, event: LearningEvent) {
    if (action.type === 'arbitrage') {
      const dexPair = action.metadata?.dexPair; // e.g., "UniswapV3-SushiSwap"
      if (dexPair) {
        const pairStats = this.currentMetadata.intelligence.parameters[`arb_${dexPair}`] || {
          attempts: 0,
          successful: 0,
          totalProfit: '0',
          avgProfit: '0'
        };

        pairStats.attempts += 1;
        if (action.outcome === 'success' && BigInt(action.valueImpact) > BigInt(0)) {
          pairStats.successful += 1;
          const currentProfit = BigInt(pairStats.totalProfit);
          const newTotalProfit = currentProfit + BigInt(action.valueImpact);
          pairStats.totalProfit = newTotalProfit.toString();
          pairStats.avgProfit = (newTotalProfit / BigInt(pairStats.successful)).toString();
        }

        this.currentMetadata.intelligence.parameters[`arb_${dexPair}`] = pairStats;
        event.parameterUpdates[`arb_${dexPair}`] = pairStats;
        event.insights.push(`Arbitrage opportunity on ${dexPair}: ${pairStats.successful}/${pairStats.attempts} successful`);
      }
    }
  }

  /**
   * Learn generic patterns for custom agents
   */
  private learnGenericPattern(action: AgentAction, event: LearningEvent) {
    // Track success rate by action type
    const actionStats = this.currentMetadata.intelligence.parameters[`action_${action.type}`] || {
      total: 0,
      successful: 0,
      successRate: 0
    };

    actionStats.total += 1;
    if (action.outcome === 'success') {
      actionStats.successful += 1;
    }
    actionStats.successRate = (actionStats.successful / actionStats.total) * 100;

    this.currentMetadata.intelligence.parameters[`action_${action.type}`] = actionStats;
    event.parameterUpdates[`action_${action.type}`] = actionStats;
    event.insights.push(`Action ${action.type}: ${actionStats.successRate.toFixed(1)}% success rate`);
  }

  /**
   * Get current metadata
   */
  getCurrentMetadata(): AIAgentMetadata {
    return { ...this.currentMetadata };
  }

  /**
   * Get intelligence insights
   */
  getInsights(): string[] {
    const insights: string[] = [];
    const metrics = this.currentMetadata.metrics;

    insights.push(`Intelligence Score: ${metrics.intelligenceScore}/1000`);
    insights.push(`Total Actions: ${metrics.totalActions}`);
    insights.push(`Success Rate: ${metrics.successRate.toFixed(1)}%`);
    insights.push(`Total Value Managed: ${ethers.formatEther(metrics.totalValueManaged)} 0G`);
    insights.push(`Profit Generated: ${ethers.formatEther(metrics.profitGenerated)} 0G`);
    insights.push(`Gas Optimized: ${ethers.formatEther(metrics.gasOptimized)} 0G`);

    // Agent-specific insights
    const params = this.currentMetadata.intelligence.parameters;
    Object.keys(params).forEach(key => {
      if (key.startsWith('token_')) {
        const stats = params[key];
        insights.push(`Token ${key.replace('token_', '')}: ${stats.successfulTrades}/${stats.totalTrades} trades`);
      } else if (key.startsWith('yield_')) {
        const stats = params[key];
        insights.push(`Yield on ${key.replace('yield_', '')}: ${stats.avgAPY.toFixed(2)}% APY`);
      } else if (key.startsWith('arb_')) {
        const stats = params[key];
        insights.push(`Arbitrage ${key.replace('arb_', '')}: ${stats.successful}/${stats.attempts} successful`);
      }
    });

    return insights;
  }

  /**
   * Export learning data for analysis
   */
  exportLearningData() {
    return {
      domain: this.domain,
      agentType: this.currentMetadata.agentType,
      intelligenceScore: this.currentMetadata.metrics.intelligenceScore,
      version: this.currentMetadata.version,
      performanceHistory: this.currentMetadata.intelligence.performanceHistory,
      learnedParameters: this.currentMetadata.intelligence.parameters,
      strategies: this.currentMetadata.intelligence.strategies,
      insights: this.getInsights()
    };
  }
}
