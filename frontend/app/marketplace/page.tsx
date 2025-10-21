'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Loader2, Zap, TrendingUp, Star, Brain, Activity,
  Filter, Search, ArrowUpDown, ShoppingCart, Eye, Award
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUserListings, useMarketplaceStats } from '@/hooks/useMarketplace';
import { formatPrice } from '@/lib/domain-utils';

interface ListedAgent {
  domain: string;
  node: string;
  agentType: string;
  intelligenceScore: number;
  totalActions: number;
  successRate: number;
  price: string;
  owner: string;
  inftAddress: string;
  isRental: boolean;
  rentalPricePerDay?: string;
  performance: {
    totalValueManaged: string;
    profitGenerated: string;
    gasOptimized: string;
  };
}

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

export default function MarketplacePage() {
  const { isConnected, address } = useAccount();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [agents, setAgents] = useState<ListedAgent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<ListedAgent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'intelligence' | 'price' | 'performance'>('intelligence');

  // Fetch marketplace stats
  const { data: marketplaceStats } = useMarketplaceStats();

  // Fetch all listings - we'll need to implement a function to get all listed domains
  // For now, we'll fetch from the backend API which should index marketplace events
  useEffect(() => {
    async function fetchListings() {
      try {
        setIsLoading(true);

        // Fetch from your backend API that indexes marketplace events
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/marketplace/listings`);

        if (!response.ok) {
          throw new Error('Failed to fetch listings');
        }

        const data = await response.json();
        setAgents(data.listings || []);
        setFilteredAgents(data.listings || []);
      } catch (error) {
        console.error('Error fetching marketplace listings:', error);
        // For now, show empty state
        setAgents([]);
        setFilteredAgents([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchListings();
  }, []);

  // Filter and sort agents
  useEffect(() => {
    let filtered = [...agents];

    // Apply type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(agent => agent.agentType === selectedType);
    }

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(agent =>
        agent.domain.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'intelligence':
          return b.intelligenceScore - a.intelligenceScore;
        case 'price':
          return parseFloat(a.price) - parseFloat(b.price);
        case 'performance':
          return b.successRate - a.successRate;
        default:
          return 0;
      }
    });

    setFilteredAgents(filtered);
  }, [agents, selectedType, searchQuery, sortBy]);

  const getIntelligenceLabel = (score: number): { label: string; color: string } => {
    if (score >= 900) return { label: 'Genius', color: 'text-yellow-400' };
    if (score >= 800) return { label: 'Expert', color: 'text-purple-400' };
    if (score >= 700) return { label: 'Advanced', color: 'text-blue-400' };
    if (score >= 600) return { label: 'Intermediate', color: 'text-green-400' };
    return { label: 'Beginner', color: 'text-gray-400' };
  };

  // Calculate stats from marketplace
  const stats = useMemo(() => {
    const totalSales = marketplaceStats ? Number((marketplaceStats as any)[0]) : 0;
    const totalVolume = marketplaceStats ? Number((marketplaceStats as any)[1]) / 1e18 : 0;
    const totalRentals = marketplaceStats ? Number((marketplaceStats as any)[2]) : 0;

    return {
      totalAgents: agents.length,
      avgIntelligence: agents.length > 0
        ? Math.floor(agents.reduce((acc, a) => acc + a.intelligenceScore, 0) / agents.length)
        : 0,
      forSale: agents.filter(a => !a.isRental).length,
      forRent: agents.filter(a => a.isRental).length,
      totalSales,
      totalVolume,
      totalRentals,
    };
  }, [agents, marketplaceStats]);

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Brain className="w-12 h-12 text-primary-400" />
              <h1 className="text-4xl sm:text-5xl font-display font-bold">
                AI Agent <span className="gradient-text">Marketplace</span>
              </h1>
            </div>
            <p className="text-xl text-dark-300 max-w-3xl mx-auto">
              Buy, sell, and rent intelligent domains with proven trading strategies, gas optimizations, and DeFi expertise
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            {[
              { label: 'Total Agents', value: stats.totalAgents, icon: Brain },
              { label: 'Avg Intelligence', value: stats.avgIntelligence, icon: Zap },
              { label: 'For Sale', value: stats.forSale, icon: ShoppingCart },
              { label: 'For Rent', value: stats.forRent, icon: Activity },
            ].map((stat, i) => (
              <div key={i} className="glass-card p-4 text-center">
                <stat.icon className="w-6 h-6 text-primary-400 mx-auto mb-2" />
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-dark-400">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Filters & Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6 mb-8"
          >
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search agents..."
                  className="w-full bg-dark-800 border border-dark-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-dark-400 focus:outline-none focus:border-primary-400 transition-colors"
                />
              </div>

              {/* Type Filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-dark-800 border border-dark-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-400 transition-colors"
              >
                <option value="all">All Types</option>
                {Object.entries(agentTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-dark-800 border border-dark-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-400 transition-colors"
              >
                <option value="intelligence">Intelligence Score</option>
                <option value="price">Price (Low to High)</option>
                <option value="performance">Performance</option>
              </select>
            </div>
          </motion.div>

          {/* Agents Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-primary-400 animate-spin" />
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Brain className="w-16 h-16 text-dark-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">No Agents Listed Yet</h2>
              <p className="text-dark-400 mb-6">
                {agents.length === 0
                  ? "Be the first to list your intelligent domain on the marketplace!"
                  : "Try adjusting your filters or search query"}
              </p>
              {isConnected && (
                <button
                  onClick={() => router.push('/dashboard')}
                  className="btn-primary"
                >
                  List Your Domain
                </button>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAgents.map((agent, index) => {
                const intelligence = getIntelligenceLabel(agent.intelligenceScore);
                return (
                  <motion.div
                    key={agent.domain}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass-card p-6 hover:shadow-glow transition-all duration-300 cursor-pointer group"
                    onClick={() => router.push(`/marketplace/${agent.domain}`)}
                  >
                    {/* Header */}
                    <div className="mb-4">
                      <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${agentTypeColors[agent.agentType]} text-white mb-3`}>
                        {agentTypeLabels[agent.agentType]}
                      </div>
                      <h3 className="text-xl font-bold group-hover:text-primary-400 transition-colors">
                        {agent.domain}.0g
                      </h3>
                    </div>

                    {/* Intelligence Score */}
                    <div className="mb-4 p-4 bg-dark-800 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-dark-400">Intelligence</span>
                        <span className={`text-sm font-semibold ${intelligence.color}`}>
                          {intelligence.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-dark-600 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-500"
                            style={{ width: `${(agent.intelligenceScore / 1000) * 100}%` }}
                          />
                        </div>
                        <span className="text-lg font-bold text-primary-400">{agent.intelligenceScore}</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="text-center p-2 bg-dark-800 rounded-lg">
                        <div className="text-sm text-dark-400">Actions</div>
                        <div className="text-lg font-semibold">{agent.totalActions.toLocaleString()}</div>
                      </div>
                      <div className="text-center p-2 bg-dark-800 rounded-lg">
                        <div className="text-sm text-dark-400">Success</div>
                        <div className="text-lg font-semibold text-green-400">{agent.successRate.toFixed(1)}%</div>
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="mb-4 p-3 bg-dark-800 rounded-lg space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-dark-400">Value Managed:</span>
                        <span className="font-semibold">{(Number(agent.performance.totalValueManaged) / 1e18).toFixed(2)} 0G</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-dark-400">Profit:</span>
                        <span className="font-semibold text-green-400">+{(Number(agent.performance.profitGenerated) / 1e18).toFixed(2)} 0G</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-dark-400">Gas Saved:</span>
                        <span className="font-semibold text-blue-400">{(Number(agent.performance.gasOptimized) / 1e18).toFixed(3)} 0G</span>
                      </div>
                    </div>

                    {/* Price & CTA */}
                    <div className="border-t border-dark-600 pt-4">
                      {agent.isRental ? (
                        <>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-dark-400">Rental Price</span>
                            <span className="text-xl font-bold text-primary-400">
                              {agent.rentalPricePerDay} 0G<span className="text-sm text-dark-400">/day</span>
                            </span>
                          </div>
                          <button className="w-full btn-primary">
                            Rent Agent
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-dark-400">Price</span>
                            <span className="text-2xl font-bold text-primary-400">{agent.price} 0G</span>
                          </div>
                          <button className="w-full btn-primary">
                            Buy Agent
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
