'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Brain, Zap, TrendingUp, Activity, Award,
  ShoppingCart, Clock, CheckCircle, AlertCircle
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAccount } from 'wagmi';

const agentTypeLabels: Record<string, string> = {
  'defi_trader': 'DeFi Trader',
  'gas_optimizer': 'Gas Optimizer',
  'nft_analyzer': 'NFT Analyzer',
  'yield_farmer': 'Yield Farmer',
  'arbitrage_bot': 'Arbitrage Bot',
  'custom': 'Custom Agent'
};

const agentTypeColors: Record<string, string> = {
  'defi_trader': 'from-blue-500 to-cyan-500',
  'gas_optimizer': 'from-green-500 to-emerald-500',
  'nft_analyzer': 'from-purple-500 to-pink-500',
  'yield_farmer': 'from-yellow-500 to-orange-500',
  'arbitrage_bot': 'from-red-500 to-rose-500',
  'custom': 'from-gray-500 to-slate-500'
};

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const domain = params.domain as string;

  // Mock agent data - replace with actual contract calls
  const agent = {
    domain: domain,
    agentType: 'defi_trader',
    intelligenceScore: 847,
    totalActions: 1250,
    successfulActions: 1115,
    successRate: 89.2,
    price: '2.5',
    owner: '0x1234567890abcdef1234567890abcdef12345678',
    inftAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
    isRental: false,
    agentVersion: 15,
    performance: {
      totalValueManaged: '125000000000000000000',
      profitGenerated: '15000000000000000000',
      gasOptimized: '2500000000000000000'
    },
    strategies: [
      { name: 'USDT-ETH Swing', successRate: 92, timesUsed: 450 },
      { name: 'Gas Price Optimization', successRate: 95, timesUsed: 800 }
    ],
    recentActions: [
      { timestamp: Date.now() - 3600000, type: 'swap', outcome: 'success', profit: '0.05 0G' },
      { timestamp: Date.now() - 7200000, type: 'swap', outcome: 'success', profit: '0.03 0G' },
      { timestamp: Date.now() - 10800000, type: 'swap', outcome: 'failure', profit: '-0.01 0G' },
    ]
  };

  const getIntelligenceLabel = (score: number): { label: string; color: string } => {
    if (score >= 900) return { label: 'Genius', color: 'text-yellow-400' };
    if (score >= 800) return { label: 'Expert', color: 'text-purple-400' };
    if (score >= 700) return { label: 'Advanced', color: 'text-blue-400' };
    if (score >= 600) return { label: 'Intermediate', color: 'text-green-400' };
    return { label: 'Beginner', color: 'text-gray-400' };
  };

  const intelligence = getIntelligenceLabel(agent.intelligenceScore);

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.push('/marketplace')}
            className="btn-ghost mb-8 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Marketplace
          </button>

          {/* Agent Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r ${agentTypeColors[agent.agentType]} text-white mb-4`}>
                  {agentTypeLabels[agent.agentType]}
                </div>
                <h1 className="text-4xl sm:text-5xl font-display font-bold mb-2">
                  <span className="gradient-text">{agent.domain}.0g</span>
                </h1>
                <p className="text-dark-400">
                  Owner: {agent.owner.slice(0, 6)}...{agent.owner.slice(-4)}
                </p>
              </div>

              <div className="glass-card p-6 text-center">
                <div className="text-sm text-dark-400 mb-2">Price</div>
                <div className="text-4xl font-bold gradient-text mb-4">{agent.price} 0G</div>
                <button className="btn-primary w-full flex items-center justify-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Buy Agent
                </button>
              </div>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Intelligence & Performance */}
            <div className="lg:col-span-2 space-y-6">
              {/* Intelligence Score */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card p-6"
              >
                <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
                  <Brain className="w-6 h-6 text-primary-400" />
                  Intelligence Score
                </h2>

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-2xl font-bold ${intelligence.color}`}>
                      {intelligence.label}
                    </span>
                    <span className="text-3xl font-bold text-primary-400">{agent.intelligenceScore}/1000</span>
                  </div>
                  <div className="bg-dark-600 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-500"
                      style={{ width: `${(agent.intelligenceScore / 1000) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-dark-800 rounded-lg">
                    <div className="text-2xl font-bold text-primary-400">{agent.totalActions.toLocaleString()}</div>
                    <div className="text-sm text-dark-400">Total Actions</div>
                  </div>
                  <div className="text-center p-4 bg-dark-800 rounded-lg">
                    <div className="text-2xl font-bold text-green-400">{agent.successRate}%</div>
                    <div className="text-sm text-dark-400">Success Rate</div>
                  </div>
                  <div className="text-center p-4 bg-dark-800 rounded-lg">
                    <div className="text-2xl font-bold text-blue-400">v{agent.agentVersion}</div>
                    <div className="text-sm text-dark-400">Version</div>
                  </div>
                </div>
              </motion.div>

              {/* Performance Metrics */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card p-6"
              >
                <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-primary-400" />
                  Performance Metrics
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg">
                    <span className="text-dark-400">Total Value Managed</span>
                    <span className="text-xl font-bold">{(Number(agent.performance.totalValueManaged) / 1e18).toFixed(2)} 0G</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg">
                    <span className="text-dark-400">Profit Generated</span>
                    <span className="text-xl font-bold text-green-400">+{(Number(agent.performance.profitGenerated) / 1e18).toFixed(2)} 0G</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg">
                    <span className="text-dark-400">Gas Optimized</span>
                    <span className="text-xl font-bold text-blue-400">{(Number(agent.performance.gasOptimized) / 1e18).toFixed(3)} 0G</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg">
                    <span className="text-dark-400">ROI</span>
                    <span className="text-xl font-bold text-yellow-400">
                      {((Number(agent.performance.profitGenerated) / Number(agent.performance.totalValueManaged)) * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Learned Strategies */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card p-6"
              >
                <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
                  <Zap className="w-6 h-6 text-primary-400" />
                  Learned Strategies
                </h2>

                <div className="space-y-4">
                  {agent.strategies.map((strategy, index) => (
                    <div key={index} className="p-4 bg-dark-800 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{strategy.name}</h3>
                        <span className="text-green-400 font-semibold">{strategy.successRate}% success</span>
                      </div>
                      <div className="text-sm text-dark-400">
                        Used {strategy.timesUsed.toLocaleString()} times
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Right Column - Recent Activity */}
            <div className="space-y-6">
              {/* Recent Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass-card p-6"
              >
                <h2 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary-400" />
                  Recent Actions
                </h2>

                <div className="space-y-3">
                  {agent.recentActions.map((action, index) => (
                    <div key={index} className="p-3 bg-dark-800 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold capitalize">{action.type}</span>
                        {action.outcome === 'success' ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-dark-400">
                          {new Date(action.timestamp).toLocaleString()}
                        </span>
                        <span className={action.outcome === 'success' ? 'text-green-400' : 'text-red-400'}>
                          {action.profit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Contract Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="glass-card p-6"
              >
                <h2 className="text-xl font-display font-bold mb-4">Contract Info</h2>
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="text-dark-400 mb-1">INFT Address</div>
                    <code className="text-xs bg-dark-800 px-2 py-1 rounded block truncate">
                      {agent.inftAddress}
                    </code>
                  </div>
                  <div>
                    <div className="text-dark-400 mb-1">Owner</div>
                    <code className="text-xs bg-dark-800 px-2 py-1 rounded block truncate">
                      {agent.owner}
                    </code>
                  </div>
                </div>
              </motion.div>

              {/* What You Get */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="glass-card p-6 bg-gradient-to-br from-primary-500/10 to-accent-500/10 border border-primary-500/20"
              >
                <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary-400" />
                  What You Get
                </h2>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Complete domain ownership transfer</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>All learned strategies & patterns</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Full performance history</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Intelligence score & metrics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Encrypted metadata on 0G Storage</span>
                  </li>
                </ul>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
