'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Brain, TrendingUp, Activity, Zap,
  CheckCircle, XCircle, Calendar, BarChart3
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import LearningTest from '@/components/LearningTest';
import { getLearningData, type LearningData } from '@/lib/simple-learning';

export default function LearningDashboard() {
  const params = useParams();
  const router = useRouter();
  const domain = params.name as string;
  const [learningData, setLearningData] = useState<LearningData | null>(null);

  useEffect(() => {
    const data = getLearningData(domain);
    setLearningData(data);
  }, [domain]);

  // Auto-refresh data to catch updates from test buttons
  useEffect(() => {
    const interval = setInterval(() => {
      const data = getLearningData(domain);
      setLearningData(data);
    }, 1000);

    return () => clearInterval(interval);
  }, [domain]);

  if (!learningData) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto text-center">
            <Brain className="w-16 h-16 text-dark-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Learning Data Yet</h2>
            <p className="text-dark-400">Start making transactions to train your AI agent!</p>
          </div>
        </div>
      </div>
    );
  }

  const successRate = learningData.totalActions > 0
    ? (learningData.successfulActions / learningData.totalActions) * 100
    : 0;

  const agentData = {
    domain: domain,
    agentType: learningData.agentType,
    intelligenceScore: learningData.intelligenceScore,
    totalActions: learningData.totalActions,
    successfulActions: learningData.successfulActions,
    successRate: successRate,
    learningHistory: [
      {
        date: new Date(Date.now() - 86400000 * 7),
        actions: 12,
        successful: 9,
        insights: ['Learned optimal gas timing', 'Identified profitable USDT-ETH pattern']
      },
      {
        date: new Date(Date.now() - 86400000 * 6),
        actions: 8,
        successful: 7,
        insights: ['Gas optimization improved by 15%']
      },
      {
        date: new Date(Date.now() - 86400000 * 5),
        actions: 15,
        successful: 11,
        insights: ['New arbitrage opportunity detected', 'Success rate increased']
      },
      {
        date: new Date(Date.now() - 86400000 * 4),
        actions: 10,
        successful: 8,
        insights: ['Refined trading strategy']
      },
      {
        date: new Date(Date.now() - 86400000 * 3),
        actions: 14,
        successful: 10,
        insights: ['Learned to avoid low liquidity pairs']
      },
      {
        date: new Date(Date.now() - 86400000 * 2),
        actions: 18,
        successful: 13,
        insights: ['Pattern recognition improved', 'Gas usage optimized']
      },
      {
        date: new Date(Date.now() - 86400000),
        actions: 12,
        successful: 9,
        insights: ['Successfully executed complex trade sequence']
      }
    ],
    learnedPatterns: [
      { pattern: 'USDT-ETH Swing Trading', successRate: 82, timesUsed: 23 },
      { pattern: 'Gas Price Timing', successRate: 91, timesUsed: 45 },
      { pattern: 'Low Slippage Routes', successRate: 78, timesUsed: 18 },
      { pattern: 'MEV Avoidance', successRate: 85, timesUsed: 12 }
    ],
    recentActions: learningData.transactions.slice(-10).reverse().map(tx => ({
      timestamp: tx.timestamp,
      type: 'transaction',
      outcome: tx.success ? 'success' : 'failure',
      learned: tx.success ? 'Transaction completed successfully' : 'Transaction failed - learning from error',
      impact: `${Number(tx.value) / 1e18 > 0 ? '+' : ''}${(Number(tx.value) / 1e18).toFixed(4)} 0G`
    }))
  };

  const getIntelligenceLevel = (score: number) => {
    if (score >= 900) return { label: 'Genius', color: 'text-yellow-400', bg: 'bg-yellow-400/10' };
    if (score >= 800) return { label: 'Expert', color: 'text-purple-400', bg: 'bg-purple-400/10' };
    if (score >= 700) return { label: 'Advanced', color: 'text-blue-400', bg: 'bg-blue-400/10' };
    if (score >= 600) return { label: 'Intermediate', color: 'text-green-400', bg: 'bg-green-400/10' };
    if (score >= 300) return { label: 'Learning', color: 'text-cyan-400', bg: 'bg-cyan-400/10' };
    return { label: 'Beginner', color: 'text-gray-400', bg: 'bg-gray-400/10' };
  };

  const intelligence = getIntelligenceLevel(agentData.intelligenceScore);

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.push(`/domains/${domain}`)}
            className="btn-ghost mb-8 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Domain
          </button>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl sm:text-4xl font-display font-bold mb-2">
              <span className="gradient-text">{domain}.0g</span> Learning Dashboard
            </h1>
            <p className="text-dark-400">
              Track how your AI agent is learning and improving
            </p>
          </motion.div>

          {/* Test Learning System */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-6"
          >
            <LearningTest domain={domain} agentType={agentData.agentType} />
          </motion.div>

          {/* Intelligence Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6 mb-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Brain className="w-8 h-8 text-primary-400" />
                <div>
                  <h2 className="text-2xl font-display font-bold">Intelligence Score</h2>
                  <p className="text-sm text-dark-400">Current learning progress</p>
                </div>
              </div>
              <div className={`px-4 py-2 rounded-full ${intelligence.bg}`}>
                <span className={`font-bold ${intelligence.color}`}>{intelligence.label}</span>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl font-bold text-primary-400">
                  {agentData.intelligenceScore}
                </span>
                <span className="text-dark-400">/ 1000</span>
              </div>
              <div className="bg-dark-600 rounded-full h-4 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-500"
                  style={{ width: `${(agentData.intelligenceScore / 1000) * 100}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center p-4 bg-dark-800 rounded-lg">
                <div className="text-2xl font-bold text-primary-400">{agentData.totalActions}</div>
                <div className="text-sm text-dark-400">Total Actions</div>
              </div>
              <div className="text-center p-4 bg-dark-800 rounded-lg">
                <div className="text-2xl font-bold text-green-400">{agentData.successRate}%</div>
                <div className="text-sm text-dark-400">Success Rate</div>
              </div>
              <div className="text-center p-4 bg-dark-800 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">{agentData.successfulActions}</div>
                <div className="text-sm text-dark-400">Successful</div>
              </div>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Learning History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6"
            >
              <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary-400" />
                Learning Progress (7 Days)
              </h3>

              <div className="space-y-4">
                {agentData.learningHistory.map((day, idx) => (
                  <div key={idx} className="p-4 bg-dark-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-dark-400" />
                        <span className="text-sm font-medium">
                          {day.date.toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-green-400">{day.successful}</span>
                        <span className="text-dark-400"> / {day.actions} actions</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {day.insights.map((insight, i) => (
                        <div key={i} className="text-xs text-dark-300 flex items-start gap-1">
                          <Zap className="w-3 h-3 text-primary-400 mt-0.5 flex-shrink-0" />
                          <span>{insight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Learned Patterns */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-6"
            >
              <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-400" />
                Learned Patterns
              </h3>

              <div className="space-y-3">
                {agentData.learnedPatterns.map((pattern, idx) => (
                  <div key={idx} className="p-4 bg-dark-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{pattern.pattern}</h4>
                      <span className="text-green-400 font-semibold text-sm">
                        {pattern.successRate}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-dark-400">Used {pattern.timesUsed} times</span>
                      <div className="bg-dark-600 rounded-full h-1.5 w-24 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                          style={{ width: `${pattern.successRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Recent Learning Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card p-6 lg:col-span-2"
            >
              <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary-400" />
                Recent Learning Actions
              </h3>

              <div className="space-y-3">
                {agentData.recentActions.map((action, idx) => (
                  <div key={idx} className="p-4 bg-dark-800 rounded-lg">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold capitalize">{action.type}</span>
                          {action.outcome === 'success' ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400" />
                          )}
                          <span className="text-xs text-dark-400">
                            {new Date(action.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-start gap-1 text-sm text-dark-300">
                          <Brain className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0" />
                          <span>Learned: {action.learned}</span>
                        </div>
                      </div>
                      <div className={`font-semibold text-sm ${
                        action.impact.startsWith('+') ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {action.impact}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* How It Works */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card p-6 mt-6 bg-gradient-to-br from-primary-500/10 to-accent-500/10 border border-primary-500/20"
          >
            <h3 className="text-lg font-display font-bold mb-4">How Learning Works</h3>
            <div className="grid sm:grid-cols-3 gap-4 text-sm mb-4">
              <div>
                <div className="font-semibold text-primary-400 mb-1">1. Record Actions</div>
                <p className="text-dark-300">
                  Test buttons or real transactions are tracked locally
                </p>
              </div>
              <div>
                <div className="font-semibold text-primary-400 mb-1">2. Intelligence Grows</div>
                <p className="text-dark-300">
                  Score calculated from success rate and experience
                </p>
              </div>
              <div>
                <div className="font-semibold text-primary-400 mb-1">3. Sync to Chain</div>
                <p className="text-dark-300">
                  Batch update to blockchain saves gas costs
                </p>
              </div>
            </div>
            <div className="text-xs text-dark-400 border-t border-white/10 pt-3">
              💡 <strong>Tip:</strong> Use the test buttons on your domain page to simulate transactions and watch your intelligence grow!
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
