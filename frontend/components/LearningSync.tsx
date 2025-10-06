'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Zap, Loader2, CheckCircle } from 'lucide-react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { getLearningData, getPendingCount, clearAfterSync } from '@/lib/simple-learning';
import toast from 'react-hot-toast';

interface LearningSyncProps {
  domain: string;
  inftAddress?: string;
}

export default function LearningSync({ domain, inftAddress }: LearningSyncProps) {
  const { address } = useAccount();
  const [isSyncing, setIsSyncing] = useState(false);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    query: {
      enabled: !!hash, // Only watch if hash exists
    }
  });

  const learningData = getLearningData(domain);
  const pendingCount = getPendingCount(domain);

  const handleSync = async () => {
    if (!learningData || !inftAddress || !address) {
      toast.error('Cannot sync: missing data');
      return;
    }

    try {
      setIsSyncing(true);

      // Call INFT contract to update intelligence
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
          learningData.successfulActions > 0, // true if any successful actions
          BigInt(learningData.intelligenceScore)
        ],
      });

    } catch (error: any) {
      console.error('Sync error:', error);
      toast.error(error.message || 'Failed to sync');
      setIsSyncing(false);
    }
  };

  // Handle success
  useEffect(() => {
    if (isSuccess && isSyncing) {
      toast.success('Learning synced to blockchain!');
      clearAfterSync(domain);
      setIsSyncing(false);
    }
  }, [isSuccess, isSyncing, domain]);

  if (!learningData || pendingCount === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 bg-gradient-to-r from-primary-500/10 to-accent-500/10 border border-primary-500/20"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="w-6 h-6 text-primary-400" />
          <div>
            <h3 className="font-bold text-white">Intelligence Update Available</h3>
            <p className="text-sm text-dark-300">
              {pendingCount} new action{pendingCount > 1 ? 's' : ''} learned • Score: {learningData.intelligenceScore}/1000
            </p>
          </div>
        </div>

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
          ) : isSuccess ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Synced!
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Sync to Chain
            </>
          )}
        </button>
      </div>

      {/* Simple stats */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div className="bg-dark-800/50 rounded p-2 text-center">
          <div className="text-primary-400 font-bold">{learningData.totalActions}</div>
          <div className="text-dark-400">Actions</div>
        </div>
        <div className="bg-dark-800/50 rounded p-2 text-center">
          <div className="text-green-400 font-bold">
            {learningData.totalActions > 0
              ? Math.round((learningData.successfulActions / learningData.totalActions) * 100)
              : 0}%
          </div>
          <div className="text-dark-400">Success</div>
        </div>
        <div className="bg-dark-800/50 rounded p-2 text-center">
          <div className="text-blue-400 font-bold">{learningData.intelligenceScore}</div>
          <div className="text-dark-400">IQ Score</div>
        </div>
      </div>
    </motion.div>
  );
}
