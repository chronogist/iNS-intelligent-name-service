'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Zap, Loader2, CheckCircle, Cloud, Database, ExternalLink } from 'lucide-react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { getLearningData, getPendingCount, clearAfterSync } from '@/lib/simple-learning';
import { ZeroGStorageService, BrowserZeroGStorageService, AIAgentMetadata } from '@/lib/0g-storage';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

interface LearningSyncProps {
  domain: string;
  inftAddress?: string;
}

export default function LearningSync({ domain, inftAddress }: LearningSyncProps) {
  const { address } = useAccount();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStep, setSyncStep] = useState('');
  const [uploadResult, setUploadResult] = useState<{
    rootHash: string;
    metadataHash: string;
    transactionHash?: string;
  } | null>(null);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    query: {
      enabled: !!hash,
    }
  });

  const learningData = getLearningData(domain);
  const pendingCount = getPendingCount(domain);

  const handleSync = async () => {
    if (!learningData || !inftAddress || !address) {
      console.error('❌ Missing required data:', { learningData: !!learningData, inftAddress, address });
      toast.error('Cannot sync: missing data');
      return;
    }

    console.log('🎯 Starting sync process...');
    console.log('📊 Input data:', { 
      domain, 
      inftAddress, 
      address, 
      totalActions: learningData.totalActions,
      pendingCount 
    });

    try {
      setIsSyncing(true);
      setSyncStep('🔧 Preparing agent metadata...');
      console.log('🔧 Step 1: Preparing agent metadata...');

      // Step 1: Create comprehensive agent metadata
      const agentMetadata: AIAgentMetadata = {
        domain: learningData.domain,
        agentType: learningData.agentType as any,
        version: 1,
        createdAt: Date.now() - (learningData.totalActions * 86400000),
        lastUpdatedAt: Date.now(),

        intelligence: {
          parameters: {
            riskTolerance: learningData.successfulActions / Math.max(learningData.totalActions, 1),
            adaptabilityScore: Math.min(learningData.totalActions * 10, 100),
            decisionAccuracy: learningData.successfulActions / Math.max(learningData.totalActions, 1)
          },
          performanceHistory: learningData.transactions.map((tx, index) => ({
            timestamp: tx.timestamp,
            action: tx.success ? 'successful_transaction' : 'failed_transaction',
            outcome: tx.success ? 'success' : 'failure',
            valueImpact: tx.value,
            gasUsed: tx.gas,
            intelligenceScoreBefore: Math.max(0, learningData.intelligenceScore - (learningData.transactions.length - index) * 5),
            intelligenceScoreAfter: Math.max(0, learningData.intelligenceScore - (learningData.transactions.length - index - 1) * 5),
            metadata: {
              transactionHash: tx.hash,
              gasPrice: tx.gasPrice,
              from: tx.from,
              to: tx.to
            }
          })),
          trainingDataHashes: [],
          strategies: [{
            id: 'adaptive_learning',
            name: 'Adaptive Learning Strategy',
            type: 'general',
            description: 'Learns from transaction patterns and outcomes',
            parameters: { learningRate: 0.1, adaptationThreshold: 5 },
            successRate: learningData.successfulActions / Math.max(learningData.totalActions, 1),
            timesUsed: learningData.totalActions,
            lastUsed: Date.now(),
            avgValueImpact: '0'
          }]
        },

        metrics: {
          intelligenceScore: learningData.intelligenceScore,
          totalActions: learningData.totalActions,
          successfulActions: learningData.successfulActions,
          successRate: learningData.successfulActions / Math.max(learningData.totalActions, 1) * 100,
          totalValueManaged: learningData.transactions.reduce((sum, tx) => sum + BigInt(tx.value || '0'), BigInt(0)).toString(),
          profitGenerated: '0',
          gasOptimized: learningData.transactions.reduce((sum, tx) => sum + BigInt(tx.gas || '0'), BigInt(0)).toString()
        },

        routingRules: [],
        ownerAddress: address,
        transferHistory: [],
        isListed: false,
        rentalAvailable: false,
        metadataHash: '',
        signature: ''
      };

      console.log('🧠 Agent Metadata Prepared:', {
        domain: agentMetadata.domain,
        intelligenceScore: agentMetadata.metrics.intelligenceScore,
        totalActions: agentMetadata.metrics.totalActions,
        dataSize: JSON.stringify(agentMetadata).length,
        performanceRecords: agentMetadata.intelligence.performanceHistory.length
      });

      setSyncStep('📤 Uploading to 0G Storage Network...');

      // Step 2: Create wallet signer for 0G Storage
      console.log('🔐 Creating wallet signer for 0G Storage...');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      console.log('👤 Signer address:', await signer.getAddress());
      console.log('🔑 Creating 0G Storage wallet...');
      
      // Use the browser signer directly instead of creating a new wallet
      console.log('🏗️  Initializing Browser 0G Storage Service...');
      const storageService = new BrowserZeroGStorageService();
      console.log('🚀 Starting REAL 0G Storage upload...');
      console.log('📡 0G Storage service initialized');
      
      const uploadResult = await storageService.uploadAgentMetadata(agentMetadata, signer);
      
      console.log('✅ 0G Storage Upload Successful!');
      console.log('📍 Root Hash:', uploadResult.rootHash);
      console.log('🔐 Metadata Hash:', uploadResult.metadataHash);
      
      setUploadResult(uploadResult);
      toast.success('🎉 Agent data uploaded to 0G Storage!');

      setSyncStep('📝 Updating INFT contract with 0G reference...');

      // Step 4: Update INFT contract with 0G Storage reference
      writeContract({
        address: inftAddress as `0x${string}`,
        abi: [{
          name: 'updateMetadata',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { name: '_newURI', type: 'string' },
            { name: '_newHash', type: 'bytes32' }
          ],
          outputs: []
        }],
        functionName: 'updateMetadata',
        args: [
          uploadResult.rootHash, // 0G Storage root hash as URI
          uploadResult.metadataHash as `0x${string}` // Verification hash
        ],
      });

    } catch (error: any) {
      console.error('❌ Sync error:', error);
      console.error('📋 Error details:', {
        message: error?.message || 'Unknown error',
        stack: error?.stack || 'No stack trace',
        name: error?.name || 'Unknown error type'
      });
      toast.error(error.message || 'Failed to sync to 0G Storage');
      setIsSyncing(false);
      setSyncStep('');
    }
  };

  // Handle success
  useEffect(() => {
    if (isSuccess) {
      toast.success('✅ Agent synced to blockchain!');
      clearAfterSync(domain);
      setIsSyncing(false);
      setSyncStep('');
      setUploadResult(null);
    }
  }, [isSuccess, domain]);

  if (!learningData || learningData.totalActions === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No learning data available yet.</p>
        <p className="text-sm mt-2">Interact with your agent to generate data.</p>
      </div>
    );
  }

  const isProcessing = isSyncing || isPending || isConfirming;

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Learning Summary */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">AI Agent Learning Summary</h3>
          <div className="flex items-center space-x-2 text-blue-600">
            <Brain className="w-5 h-5" />
            <span className="font-bold">{learningData.intelligenceScore}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{learningData.totalActions}</div>
            <div className="text-sm text-blue-800">Total Actions</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{learningData.successfulActions}</div>
            <div className="text-sm text-green-800">Successful</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-purple-600">{pendingCount}</div>
            <div className="text-sm text-purple-800">Pending Sync</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {learningData.totalActions > 0 ? Math.round((learningData.successfulActions / learningData.totalActions) * 100) : 0}%
            </div>
            <div className="text-sm text-orange-800">Success Rate</div>
          </div>
        </div>

        {/* Recent Transactions */}
        {learningData.transactions.length > 0 && (
          <div className="mb-4">
            <h4 className="font-semibold text-gray-700 mb-2">Recent Activity</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {learningData.transactions.slice(-3).map((tx, index) => (
                <div key={index} className="flex items-center justify-between text-sm bg-gray-50 rounded p-2">
                  <span className={`w-2 h-2 rounded-full ${tx.success ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="font-mono text-xs">{tx.hash.slice(0, 10)}...</span>
                  <span className="text-gray-500">{new Date(tx.timestamp).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 0G Storage Upload Result */}
      {uploadResult && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl shadow-lg p-6 mb-6 border-2 border-blue-200">
          <div className="flex items-center mb-4">
            <Cloud className="w-6 h-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-bold text-gray-900">0G Storage Upload Complete</h3>
            <CheckCircle className="w-5 h-5 text-green-500 ml-2" />
          </div>
          
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Root Hash:</span>
                <a 
                  href={`https://testnet-scan.0g.ai/storage/${uploadResult.rootHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-mono"
                >
                  {uploadResult.rootHash.slice(0, 12)}...{uploadResult.rootHash.slice(-8)}
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Metadata Hash:</span>
                <span className="text-sm font-mono text-gray-800">
                  {uploadResult.metadataHash.slice(0, 12)}...{uploadResult.metadataHash.slice(-8)}
                </span>
              </div>
            </div>

            {uploadResult.transactionHash && (
              <div className="bg-white rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Transaction:</span>
                  <a 
                    href={`https://testnet-scan.0g.ai/tx/${uploadResult.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-mono"
                  >
                    {uploadResult.transactionHash.slice(0, 12)}...{uploadResult.transactionHash.slice(-8)}
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center">
              <Database className="w-4 h-4 text-green-600 mr-2" />
              <span className="text-sm text-green-800 font-medium">
                Agent data permanently stored on 0G Storage Network
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Sync Button */}
      <motion.div
        whileHover={{ scale: isProcessing ? 1 : 1.02 }}
        whileTap={{ scale: isProcessing ? 1 : 0.98 }}
      >
        <button
          onClick={handleSync}
          disabled={isProcessing || pendingCount === 0}
          className={`w-full p-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
            isProcessing
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : pendingCount === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl'
          }`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <div className="text-center">
                <div>{syncStep || 'Processing...'}</div>
                {(isPending || isConfirming) && (
                  <div className="text-xs opacity-75 mt-1">
                    {isPending ? 'Confirming transaction...' : 'Waiting for confirmation...'}
                  </div>
                )}
              </div>
            </>
          ) : pendingCount === 0 ? (
            <>
              <CheckCircle className="w-5 h-5" />
              <span>All Data Synced</span>
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              <span>Sync to 0G Storage ({pendingCount} actions)</span>
            </>
          )}
        </button>
      </motion.div>

      {isProcessing && (
        <div className="mt-4 text-center text-sm text-gray-600">
          <div className="bg-blue-50 rounded-lg p-3">
            {syncStep && <div className="font-medium mb-1">{syncStep}</div>}
            <div className="text-xs">
              {isPending && "Preparing transaction..."}
              {isConfirming && "Confirming on blockchain..."}
            </div>
          </div>
        </div>
      )}

      {/* Debug Test Button */}
      <div className="mt-4">
        <button
          onClick={() => {
            console.log('🧪 CONSOLE TEST: This should appear in your browser console!');
            console.log('📊 Current learning data:', learningData);
            console.log('🎯 Domain:', domain);
            console.log('📍 INFT Address:', inftAddress);
            console.log('👤 Wallet Address:', address);
            toast.success('Check your browser console for debug logs!');
          }}
          className="w-full p-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-medium hover:bg-yellow-200 transition-colors"
        >
          🧪 Test Console Logging (Check F12 Console)
        </button>
      </div>
    </div>
  );
}
