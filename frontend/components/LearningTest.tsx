'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, CheckCircle, XCircle } from 'lucide-react';
import { recordTransaction, initLearningData, getLearningData } from '@/lib/simple-learning';
import toast from 'react-hot-toast';

interface LearningTestProps {
  domain: string;
  agentType?: string;
}

export default function LearningTest({ domain, agentType = 'custom' }: LearningTestProps) {
  const [isRecording, setIsRecording] = useState(false);

  const recordTestTransaction = (success: boolean) => {
    setIsRecording(true);

    // Initialize if not exists
    let data = getLearningData(domain);
    if (!data) {
      initLearningData(domain, agentType);
    }

    // Record fake transaction
    const tx = {
      hash: `0x${Math.random().toString(16).slice(2, 66)}`,
      from: '0x0000000000000000000000000000000000000000',
      to: '0x1111111111111111111111111111111111111111',
      value: (Math.random() * 0.1 * 1e18).toString(),
      gasPrice: (Math.random() * 20 * 1e9).toString(),
      gas: (Math.random() * 100000 + 50000).toString(),
      timestamp: Date.now(),
    };

    const updated = recordTransaction(domain, tx, success);

    toast.success(
      `Recorded ${success ? 'successful' : 'failed'} action! IQ: ${updated.intelligenceScore}`
    );

    setIsRecording(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 bg-yellow-500/5 border border-yellow-500/20"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-yellow-400" />
          <div>
            <h3 className="font-bold text-sm">Test Learning System</h3>
            <p className="text-xs text-dark-400">Manually record test transactions</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => recordTestTransaction(true)}
            disabled={isRecording}
            className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg text-sm flex items-center gap-1 transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            Success
          </button>
          <button
            onClick={() => recordTestTransaction(false)}
            disabled={isRecording}
            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-sm flex items-center gap-1 transition-colors"
          >
            <XCircle className="w-4 h-4" />
            Failure
          </button>
        </div>
      </div>
    </motion.div>
  );
}
