'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, TrendingUp, ShoppingBag, Clock, Calendar,
  Activity, BarChart3, PieChart, Download
} from 'lucide-react';
import { useAccount } from 'wagmi';
import { useMarketplaceStats } from '@/hooks/useMarketplace';

interface Transaction {
  type: 'sale' | 'rental';
  domain: string;
  amount: number;
  buyer: string;
  timestamp: number;
  duration?: number; // for rentals
}

interface EarningsTrackerProps {
  domains: string[];
}

export default function EarningsTracker({ domains }: EarningsTrackerProps) {
  const { address } = useAccount();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  const { data: marketplaceStats } = useMarketplaceStats();

  // Fetch transaction history
  useEffect(() => {
    async function fetchTransactions() {
      setIsLoading(true);

      try {
        // In a real implementation, this would fetch from backend API
        // that indexes marketplace events for the user's domains

        // For now, we'll create a placeholder structure
        // You would fetch actual events like:
        // - DomainSold events where seller = address
        // - DomainRented events where owner = address

        // Simulate API call
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/marketplace/earnings/${address}`
        ).catch(() => null);

        if (response && response.ok) {
          const data = await response.json();
          setTransactions(data.transactions || []);
        } else {
          // Placeholder data structure (will be empty until events are indexed)
          setTransactions([]);
        }
      } catch (error) {
        console.error('Error fetching earnings:', error);
        setTransactions([]);
      } finally {
        setIsLoading(false);
      }
    }

    if (address && domains.length > 0) {
      fetchTransactions();
    } else {
      setIsLoading(false);
    }
  }, [address, domains, timeRange]);

  // Calculate metrics
  const metrics = {
    totalEarnings: transactions.reduce((sum, tx) => sum + tx.amount, 0),
    totalSales: transactions.filter(tx => tx.type === 'sale').length,
    totalRentals: transactions.filter(tx => tx.type === 'rental').length,
    salesEarnings: transactions
      .filter(tx => tx.type === 'sale')
      .reduce((sum, tx) => sum + tx.amount, 0),
    rentalEarnings: transactions
      .filter(tx => tx.type === 'rental')
      .reduce((sum, tx) => sum + tx.amount, 0),
  };

  // Filter transactions by time range
  const getFilteredTransactions = () => {
    const now = Date.now();
    const ranges = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      'all': Infinity,
    };

    const cutoff = now - ranges[timeRange];
    return transactions.filter(tx => tx.timestamp >= cutoff);
  };

  const filteredTransactions = getFilteredTransactions();

  return (
    <div className="space-y-6">
      {/* Earnings Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display font-bold flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-primary-400" />
            Earnings Tracker
          </h2>

          {/* Time Range Selector */}
          <div className="flex gap-2">
            {(['7d', '30d', '90d', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  timeRange === range
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-800 text-dark-400 hover:text-white'
                }`}
              >
                {range === 'all' ? 'All Time' : range.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid md:grid-cols-4 gap-4">
          {/* Total Earnings */}
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span className="text-sm text-dark-400">Total Earnings</span>
            </div>
            <div className="text-3xl font-bold text-green-400">
              {metrics.totalEarnings.toFixed(4)}
              <span className="text-xl ml-1">0G</span>
            </div>
            <div className="text-xs text-dark-400 mt-1">
              {metrics.totalSales + metrics.totalRentals} transactions
            </div>
          </div>

          {/* Sales Earnings */}
          <div className="bg-dark-800 border border-dark-600 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingBag className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-dark-400">From Sales</span>
            </div>
            <div className="text-2xl font-bold text-blue-400">
              {metrics.salesEarnings.toFixed(4)} 0G
            </div>
            <div className="text-xs text-dark-400 mt-1">
              {metrics.totalSales} sales
            </div>
          </div>

          {/* Rental Earnings */}
          <div className="bg-dark-800 border border-dark-600 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-purple-400" />
              <span className="text-sm text-dark-400">From Rentals</span>
            </div>
            <div className="text-2xl font-bold text-purple-400">
              {metrics.rentalEarnings.toFixed(4)} 0G
            </div>
            <div className="text-xs text-dark-400 mt-1">
              {metrics.totalRentals} rentals
            </div>
          </div>

          {/* Average per Transaction */}
          <div className="bg-dark-800 border border-dark-600 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-yellow-400" />
              <span className="text-sm text-dark-400">Avg per TX</span>
            </div>
            <div className="text-2xl font-bold text-yellow-400">
              {transactions.length > 0
                ? (metrics.totalEarnings / transactions.length).toFixed(4)
                : '0.0000'}
              <span className="text-sm ml-1">0G</span>
            </div>
          </div>
        </div>

        {/* Visual Breakdown */}
        <div className="mt-6 grid md:grid-cols-2 gap-4">
          {/* Earnings Split */}
          <div className="bg-dark-800 rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-primary-400" />
              Earnings Split
            </h3>
            <div className="space-y-2">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-dark-400">Sales</span>
                  <span className="text-blue-400 font-semibold">
                    {metrics.totalEarnings > 0
                      ? ((metrics.salesEarnings / metrics.totalEarnings) * 100).toFixed(1)
                      : '0'}%
                  </span>
                </div>
                <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{
                      width: `${metrics.totalEarnings > 0 ? (metrics.salesEarnings / metrics.totalEarnings) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-dark-400">Rentals</span>
                  <span className="text-purple-400 font-semibold">
                    {metrics.totalEarnings > 0
                      ? ((metrics.rentalEarnings / metrics.totalEarnings) * 100).toFixed(1)
                      : '0'}%
                  </span>
                </div>
                <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500"
                    style={{
                      width: `${metrics.totalEarnings > 0 ? (metrics.rentalEarnings / metrics.totalEarnings) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Platform Stats */}
          <div className="bg-dark-800 rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary-400" />
              Your Market Position
            </h3>
            {marketplaceStats ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-dark-400">Global Sales:</span>
                  <span className="font-semibold">{Number((marketplaceStats as any)[0])}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">Global Volume:</span>
                  <span className="font-semibold">
                    {(Number((marketplaceStats as any)[1]) / 1e18).toFixed(2)} 0G
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">Your Contribution:</span>
                  <span className="font-semibold text-primary-400">
                    {Number((marketplaceStats as any)[1]) > 0
                      ? ((metrics.totalEarnings / (Number((marketplaceStats as any)[1]) / 1e18)) * 100).toFixed(2)
                      : '0'}%
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-dark-400">Loading market stats...</div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Transaction History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Transaction History</h3>
          {filteredTransactions.length > 0 && (
            <button className="btn-ghost text-sm flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-dark-400">Loading transactions...</div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="w-12 h-12 text-dark-400 mx-auto mb-4" />
            <h4 className="font-semibold mb-2">No Transactions Yet</h4>
            <p className="text-sm text-dark-400 mb-4">
              Start listing your domains to track earnings here
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTransactions.map((tx, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-dark-800 rounded-lg hover:bg-dark-700 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    tx.type === 'sale' ? 'bg-blue-500/20' : 'bg-purple-500/20'
                  }`}>
                    {tx.type === 'sale' ? (
                      <ShoppingBag className="w-5 h-5 text-blue-400" />
                    ) : (
                      <Clock className="w-5 h-5 text-purple-400" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold">{tx.domain}.0g</div>
                    <div className="text-sm text-dark-400">
                      {tx.type === 'sale' ? 'Sold' : `Rented for ${tx.duration} days`}
                      {' • '}
                      {new Date(tx.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-bold text-green-400">
                    +{tx.amount.toFixed(4)} 0G
                  </div>
                  <div className="text-xs text-dark-400">
                    After 2.5% fee
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Earnings Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6 bg-gradient-to-br from-primary-500/10 to-accent-500/10 border border-primary-500/20"
      >
        <h3 className="font-bold mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary-400" />
          Maximize Your Earnings
        </h3>
        <ul className="space-y-2 text-sm text-dark-300">
          <li className="flex items-start gap-2">
            <span className="text-primary-400">•</span>
            <span>List multiple domains to create diversified income streams</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-400">•</span>
            <span>Train AI agents to increase domain intelligence and value</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-400">•</span>
            <span>Consider rental listings for passive recurring income</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-400">•</span>
            <span>Monitor market trends to optimize pricing strategies</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-400">•</span>
            <span>Short, memorable domains typically command premium prices</span>
          </li>
        </ul>
      </motion.div>
    </div>
  );
}
