"use client";

import { motion } from 'framer-motion';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Wallet, 
  Copy, 
  ExternalLink,
  Download,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { blockchainService } from '@/lib/blockchain';
import { ethers } from 'ethers';

interface FeeData {
  contractBalance: string;
  totalRegistrations: number;
  currentPrice: string;
  totalRevenue: string;
  recentTransactions: Array<{
    hash: string;
    name: string;
    price: string;
    buyer: string;
    timestamp: string;
  }>;
}

export default function FeesPage() {
  const [feeData, setFeeData] = useState<FeeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    loadFeeData();
  }, []);

    const loadFeeData = async () => {
    try {
      setLoading(true);
      
      // Initialize blockchain service if needed
      if (!blockchainService['provider']) {
        await blockchainService.initialize();
      }
      
      // Get real blockchain data
      const feeData = await blockchainService.getFeeData();
      
      // Get recent registration events (last 10 events)
      const recentEvents = await blockchainService.getRegistrationEvents();
      
      const realData: FeeData = {
        contractBalance: ethers.formatEther(feeData.contractBalance),
        totalRegistrations: feeData.totalRegistrations,
        currentPrice: ethers.formatEther(feeData.currentPrice),
        totalRevenue: ethers.formatEther(feeData.contractBalance), // Contract balance represents total revenue
        recentTransactions: recentEvents.slice(0, 5).map(event => ({
          hash: event.hash,
          name: event.name || 'Unknown',
          price: ethers.formatEther(event.price || feeData.currentPrice),
          buyer: event.buyer,
          timestamp: event.timestamp
        }))
      };
      
      setFeeData(realData);
      
      // Check if current user is contract owner
      const ownerStatus = await blockchainService.isContractOwner();
      setIsOwner(ownerStatus);
    } catch (error) {
      console.error('Error loading fee data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAddress || !ethers.isAddress(withdrawAddress)) {
      alert('Please enter a valid Ethereum address');
      return;
    }

    setIsWithdrawing(true);
    try {
      const hash = await blockchainService.withdrawFees(withdrawAddress);
      alert(`Withdrawal successful! Transaction hash: ${hash}`);
      
      // Refresh data
      loadFeeData();
      setWithdrawAddress('');
    } catch (error: unknown) {
      console.error('Withdrawal error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Withdrawal failed: ${errorMessage}`);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const shortenHash = (hash: string) => {
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading fee data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Fee Management Dashboard</h1>
              <p className="text-gray-600">Track and manage NFT registration fees</p>
            </div>
            <button
              onClick={loadFeeData}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <RefreshCw className="size-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-xl p-6"
          >
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-3 rounded-xl">
                <DollarSign className="size-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Contract Balance</p>
                                 <p className="text-2xl font-bold text-gray-900">{feeData?.contractBalance} OG</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl p-6"
          >
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl">
                <TrendingUp className="size-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                                 <p className="text-2xl font-bold text-gray-900">{feeData?.totalRevenue} OG</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-xl p-6"
          >
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-3 rounded-xl">
                <Users className="size-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Registrations</p>
                <p className="text-2xl font-bold text-gray-900">{feeData?.totalRegistrations}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-xl p-6"
          >
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-orange-500 to-red-600 p-3 rounded-xl">
                <Wallet className="size-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Current Price</p>
                                 <p className="text-2xl font-bold text-gray-900">{feeData?.currentPrice} OG</p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Withdrawal Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl shadow-xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-r from-red-500 to-pink-600 p-2 rounded-lg">
                <Wallet className="size-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Withdraw Fees</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Withdrawal Address
                </label>
                <input
                  type="text"
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Available Balance</span>
                  <span className="font-semibold text-gray-900">{feeData?.contractBalance} OG</span>
                </div>
              </div>

              <button
                onClick={handleWithdraw}
                disabled={isWithdrawing || !withdrawAddress || !isOwner}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl font-semibold hover:from-red-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isWithdrawing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Withdrawing...
                  </>
                ) : (
                  <>
                    <Download className="size-4" />
                    Withdraw All Fees
                  </>
                )}
              </button>
            </div>

                        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  {isOwner 
                    ? 'You are the contract owner and can withdraw fees.'
                    : 'Only the contract owner can withdraw fees. Make sure you&apos;re connected with the correct wallet.'
                  }
                </p>
              </div>
            </div>
          </motion.div>

          {/* Recent Transactions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-2xl shadow-xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Recent Transactions</h2>
              <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                View All
              </button>
            </div>

            <div className="space-y-4">
              {feeData?.recentTransactions.map((tx, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{tx.name}.0g</span>
                      <span className="text-sm text-gray-500">•</span>
                                             <span className="font-semibold text-green-600">{tx.price} OG</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(tx.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Buyer:</span>
                      <span className="font-mono text-gray-900">{shortenAddress(tx.buyer)}</span>
                      <button
                        onClick={() => copyToClipboard(tx.buyer, `buyer-${index}`)}
                        className="p-1 rounded hover:bg-gray-100 transition-colors"
                      >
                        {copiedField === `buyer-${index}` ? (
                          <AlertTriangle className="size-3 text-green-500" />
                        ) : (
                          <Copy className="size-3 text-gray-500" />
                        )}
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-gray-500">
                        {shortenHash(tx.hash)}
                      </span>
                      <button
                        onClick={() => copyToClipboard(tx.hash, `hash-${index}`)}
                        className="p-1 rounded hover:bg-gray-100 transition-colors"
                      >
                        {copiedField === `hash-${index}` ? (
                          <AlertTriangle className="size-3 text-green-500" />
                        ) : (
                          <Copy className="size-3 text-gray-500" />
                        )}
                      </button>
                      <button
                        onClick={() => window.open(`https://etherscan.io/tx/${tx.hash}`, '_blank')}
                        className="p-1 rounded hover:bg-gray-100 transition-colors"
                      >
                        <ExternalLink className="size-3 text-gray-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
