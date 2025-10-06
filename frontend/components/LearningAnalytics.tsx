'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Brain, Zap, Loader2, CheckCircle, TrendingUp,
  Activity, Target, Award, Clock, BarChart3
} from 'lucide-react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { getLearningData, getPendingCount, clearAfterSync, initLearningData } from '@/lib/simple-learning';
import { syncFromBlockchain } from '@/lib/blockchain-sync';
import toast from 'react-hot-toast';

interface LearningAnalyticsProps {
  domain: string;
  inftAddress?: string;
}

export default function LearningAnalytics({ domain, inftAddress }: LearningAnalyticsProps) {
  const { address } = useAccount();
  const [isSyncing, setIsSyncing] = useState(false);
  const [learningData, setLearningData] = useState(getLearningData(domain));
  const [pendingCount, setPendingCount] = useState(getPendingCount(domain));

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    query: {
      enabled: !!hash,
    }
  });

  // Note: Blockchain sync disabled for now to avoid errors
  // Data is stored in localStorage and synced to blockchain manually via "Sync to Chain" button
  // This keeps it simple and avoids RPC call issues

  // Refresh data periodically to catch updates from test buttons
  useEffect(() => {
    const interval = setInterval(() => {
      setLearningData(getLearningData(domain));
      setPendingCount(getPendingCount(domain));
    }, 1000); // Refresh every second

    return () => clearInterval(interval);
  }, [domain]);

  const handleSync = async () => {
    if (!learningData || !inftAddress || !address) {
      toast.error('Cannot sync: missing data');
      return;
    }

    try {
      setIsSyncing(true);

      writeContract({
        address: inftAddress as `0x${string}`,
        abi: [{
          name: 'recordAction',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { name: '_success', type: 'bool' },
            { name: '_newIntelligenceScore', type: 'uint256' }
          ],
          outputs: []
        }],
        functionName: 'recordAction',
        args: [
          learningData.successfulActions > 0,
          BigInt(learningData.intelligenceScore)
        ],
      });

    } catch (error: any) {
      console.error('Sync error:', error);
      toast.error(error.message || 'Failed to sync');
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (isSuccess && isSyncing) {
      toast.success('Learning synced to blockchain!');
      clearAfterSync(domain);
      setIsSyncing(false);
    }
  }, [isSuccess, isSyncing, domain]);

  // Show empty state when no learning data exists
  if (!learningData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-gray-500/20 to-slate-500/20 rounded-xl">
              <Brain className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold">AI Intelligence Analytics</h2>
              <p className="text-sm text-dark-400">Ready to start learning</p>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="text-center py-12">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary-500/10 to-accent-500/10 rounded-full flex items-center justify-center mb-4">
              <Brain className="w-10 h-10 text-primary-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No Learning Data Yet</h3>
            <p className="text-dark-400 max-w-md mx-auto">
              Your AI agent hasn't started learning yet. Begin interacting with your domain or visit the Learning Dashboard to start training.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => window.location.href = `/domains/${domain}/learning`}
              className="btn-primary flex items-center gap-2 justify-center"
            >
              <Brain className="w-4 h-4" />
              Start Learning
            </button>
            <button
              onClick={() => {
                // Initialize empty learning data for this domain
                initLearningData(domain, 'ai_assistant');
                setLearningData(getLearningData(domain));
                setPendingCount(getPendingCount(domain));
                toast.success('AI agent initialized for ' + domain);
              }}
              className="btn-secondary flex items-center gap-2 justify-center"
            >
              <Zap className="w-4 h-4" />
              Initialize Agent
            </button>
          </div>

          {/* Stats Preview */}
          <div className="grid grid-cols-3 gap-4 mt-8 max-w-sm mx-auto">
            <div className="bg-dark-800/50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-gray-400">0</div>
              <div className="text-xs text-dark-400">Actions</div>
            </div>
            <div className="bg-dark-800/50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-gray-400">0%</div>
              <div className="text-xs text-dark-400">Success</div>
            </div>
            <div className="bg-dark-800/50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-gray-400">0</div>
              <div className="text-xs text-dark-400">IQ Score</div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  const successRate = learningData.totalActions > 0
    ? (learningData.successfulActions / learningData.totalActions) * 100
    : 0;

  const intelligenceLevel =
    learningData.intelligenceScore >= 900 ? { label: 'Genius', color: 'text-yellow-400', gradient: 'from-yellow-500 to-orange-500' } :
    learningData.intelligenceScore >= 800 ? { label: 'Expert', color: 'text-purple-400', gradient: 'from-purple-500 to-pink-500' } :
    learningData.intelligenceScore >= 700 ? { label: 'Advanced', color: 'text-blue-400', gradient: 'from-blue-500 to-cyan-500' } :
    learningData.intelligenceScore >= 600 ? { label: 'Intermediate', color: 'text-green-400', gradient: 'from-green-500 to-emerald-500' } :
    learningData.intelligenceScore >= 300 ? { label: 'Learning', color: 'text-cyan-400', gradient: 'from-cyan-500 to-blue-500' } :
    { label: 'Beginner', color: 'text-gray-400', gradient: 'from-gray-500 to-slate-500' };

  const failureRate = 100 - successRate;
  const progressPercentage = (learningData.intelligenceScore / 1000) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-3 bg-gradient-to-br ${intelligenceLevel.gradient}/20 rounded-xl`}>
            <Brain className={`w-6 h-6 ${intelligenceLevel.color}`} />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold">AI Intelligence Analytics</h2>
            <p className="text-sm text-dark-400">Real-time learning metrics</p>
          </div>
        </div>

        {pendingCount > 0 && (
          <button
            onClick={handleSync}
            disabled={isPending || isConfirming || isSyncing}
            className="btn-primary flex items-center gap-2"
          >
            {isPending || isConfirming ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Sync to Chain
              </>
            )}
          </button>
        )}
      </div>

      {/* Intelligence Score Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-dark-400">Intelligence Score</span>
            <span className={`px-2 py-1 rounded-full text-xs font-bold ${intelligenceLevel.color} bg-white/5`}>
              {intelligenceLevel.label}
            </span>
          </div>
          <span className="text-2xl font-bold gradient-text">
            {learningData.intelligenceScore}/1000
          </span>
        </div>

        {/* Progress Bar */}
        <div className="relative h-3 bg-dark-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`absolute top-0 left-0 h-full bg-gradient-to-r ${intelligenceLevel.gradient} rounded-full`}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          </motion.div>
        </div>
        <p className="text-xs text-dark-400 mt-1">
          {Math.round(progressPercentage)}% complete
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Actions */}
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-dark-400">Total Actions</span>
          </div>
          <div className="text-2xl font-bold text-blue-400">{learningData.totalActions}</div>
          {pendingCount > 0 && (
            <p className="text-xs text-blue-300 mt-1">+{pendingCount} pending</p>
          )}
        </div>

        {/* Success Rate */}
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-green-400" />
            <span className="text-xs text-dark-400">Success Rate</span>
          </div>
          <div className="text-2xl font-bold text-green-400">{Math.round(successRate)}%</div>
          <div className="mt-2 flex gap-1 h-1.5">
            <div
              className="bg-green-500 rounded-full"
              style={{ width: `${successRate}%` }}
            />
            <div
              className="bg-red-500 rounded-full"
              style={{ width: `${failureRate}%` }}
            />
          </div>
        </div>

        {/* Successful Actions */}
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-dark-400">Successful</span>
          </div>
          <div className="text-2xl font-bold text-emerald-400">{learningData.successfulActions}</div>
          <p className="text-xs text-dark-400 mt-1">
            {learningData.totalActions - learningData.successfulActions} failed
          </p>
        </div>

        {/* Level Progress */}
        <div className={`bg-gradient-to-br ${intelligenceLevel.gradient}/10 border ${intelligenceLevel.gradient.split(' ')[0].replace('from-', 'border-')}/20 rounded-xl p-4`}>
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 ${intelligenceLevel.color}" />
            <span className="text-xs text-dark-400">Current Level</span>
          </div>
          <div className={`text-lg font-bold ${intelligenceLevel.color}`}>{intelligenceLevel.label}</div>
          <p className="text-xs text-dark-400 mt-1">
            Next: {learningData.intelligenceScore >= 900 ? 'Max' : learningData.intelligenceScore >= 800 ? 'Genius' : learningData.intelligenceScore >= 700 ? 'Expert' : learningData.intelligenceScore >= 600 ? 'Advanced' : learningData.intelligenceScore >= 300 ? 'Intermediate' : 'Learning'}
          </p>
        </div>
      </div>

      {/* Performance Breakdown */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Success/Failure Pie Chart Visualization */}
        <div className="bg-dark-800/50 rounded-xl p-4 border border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-primary-400" />
            <h3 className="font-semibold">Performance Distribution</h3>
          </div>

          <div className="flex items-center justify-center gap-8">
            {/* Circular Progress */}
            <div className="relative w-32 h-32">
              <svg className="transform -rotate-90 w-32 h-32">
                {/* Background circle */}
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-dark-600"
                />
                {/* Success arc */}
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${(successRate / 100) * 351.86} 351.86`}
                  className="text-green-500"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-2xl font-bold">{Math.round(successRate)}%</span>
                <span className="text-xs text-dark-400">Success</span>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm">Success: {learningData.successfulActions}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm">Failed: {learningData.totalActions - learningData.successfulActions}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-dark-800/50 rounded-xl p-4 border border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-primary-400" />
            <h3 className="font-semibold">Recent Activity</h3>
          </div>

          <div className="space-y-2 max-h-32 overflow-y-auto">
            {learningData.transactions.length === 0 ? (
              <p className="text-sm text-dark-400 text-center py-4">No activity yet</p>
            ) : (
              learningData.transactions.slice(-5).reverse().map((tx, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm p-2 rounded-lg bg-dark-700/50">
                  <div className="flex items-center gap-2">
                    {tx.success ? (
                      <CheckCircle className="w-3 h-3 text-green-400" />
                    ) : (
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                    )}
                    <span className="text-xs text-dark-300">
                      {new Date(tx.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <span className={`text-xs font-mono ${Number(tx.value) > 0 ? 'text-green-400' : 'text-dark-400'}`}>
                    {(Number(tx.value) / 1e18).toFixed(4)} 0G
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Sync Status */}
      {pendingCount > 0 && (
        <div className="mt-4 p-3 bg-primary-500/10 border border-primary-500/20 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <Zap className="w-4 h-4 text-primary-400" />
            <span className="text-primary-300">
              {pendingCount} action{pendingCount > 1 ? 's' : ''} ready to sync to blockchain
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
