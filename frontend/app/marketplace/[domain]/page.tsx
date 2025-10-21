'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Brain, Zap, TrendingUp, Activity, Award,
  ShoppingCart, Clock, CheckCircle, AlertCircle, Loader2
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAccount } from 'wagmi';
import { useMarketplace, useSaleListing, useRentalListing, useActiveRental } from '@/hooks/useMarketplace';
import { computeNode, formatPrice, formatAddress } from '@/lib/domain-utils';
import { parseEther } from 'viem';
import { toast } from 'react-hot-toast';

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
  const node = computeNode(domain) as `0x${string}`;

  const [isLoading, setIsLoading] = useState(true);
  const [agent, setAgent] = useState<any>(null);
  const [isBuying, setIsBuying] = useState(false);
  const [isRenting, setIsRenting] = useState(false);
  const [rentalDays, setRentalDays] = useState(1);

  // Fetch listing data from contract
  const { data: saleListing } = useSaleListing(node);
  const { data: rentalListing } = useRentalListing(node);
  const { data: activeRental } = useActiveRental(node);

  // Marketplace hooks
  const { buyDomain, rentDomain } = useMarketplace();

  // Fetch agent profile data
  useEffect(() => {
    async function fetchAgentData() {
      try {
        setIsLoading(true);

        // Fetch from backend API
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/marketplace/listing/${domain}`);

        if (!response.ok) {
          throw new Error('Failed to fetch agent data');
        }

        const data = await response.json();

        // Also fetch profile data
        const profileResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/${domain}`);
        let profileData = null;
        if (profileResponse.ok) {
          const profile = await profileResponse.json();
          profileData = profile.data;
        }

        setAgent({
          domain,
          node: data.node,
          agentType: profileData?.agentType || 'custom',
          intelligenceScore: profileData?.intelligenceScore || 0,
          totalActions: profileData?.totalActions || 0,
          successfulActions: profileData?.successfulActions || 0,
          successRate: profileData?.successRate || 0,
          price: data.saleListing?.price || '0',
          owner: data.saleListing?.seller || data.rentalListing?.owner || '',
          inftAddress: profileData?.inftAddress || '',
          isRental: !data.saleListing && !!data.rentalListing,
          agentVersion: profileData?.agentVersion || 1,
          rentalPricePerDay: data.rentalListing?.pricePerDay,
          rentalMinDuration: data.rentalListing?.minDuration,
          rentalMaxDuration: data.rentalListing?.maxDuration,
          performance: {
            totalValueManaged: profileData?.totalValueManaged || '0',
            profitGenerated: profileData?.profitGenerated || '0',
            gasOptimized: profileData?.gasOptimized || '0'
          },
          strategies: profileData?.strategies || [],
          recentActions: profileData?.recentActions || [],
          saleListing: data.saleListing,
          rentalListing: data.rentalListing,
          activeRental: data.activeRental,
        });
      } catch (error) {
        console.error('Error fetching agent data:', error);
        toast.error('Failed to load agent details');
      } finally {
        setIsLoading(false);
      }
    }

    fetchAgentData();
  }, [domain]);

  const handleBuy = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!agent?.saleListing) {
      toast.error('This domain is not for sale');
      return;
    }

    try {
      setIsBuying(true);
      toast.loading('Purchasing domain...', { id: 'buy' });

      const tx = await buyDomain(node, agent.price);

      toast.success('Domain purchased successfully!', { id: 'buy' });

      // Redirect to dashboard after successful purchase
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error: any) {
      console.error('Error buying domain:', error);
      toast.error(error.message || 'Failed to purchase domain', { id: 'buy' });
    } finally {
      setIsBuying(false);
    }
  };

  const handleRent = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!agent?.rentalListing) {
      toast.error('This domain is not available for rent');
      return;
    }

    const minDays = Number(agent.rentalMinDuration);
    const maxDays = Number(agent.rentalMaxDuration);

    if (rentalDays < minDays || rentalDays > maxDays) {
      toast.error(`Rental duration must be between ${minDays} and ${maxDays} days`);
      return;
    }

    try {
      setIsRenting(true);
      const totalPrice = (parseFloat(agent.rentalPricePerDay) * rentalDays).toFixed(18);

      toast.loading('Renting domain...', { id: 'rent' });

      const tx = await rentDomain(node, rentalDays, totalPrice);

      toast.success('Domain rented successfully!', { id: 'rent' });

      // Redirect to dashboard after successful rental
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error: any) {
      console.error('Error renting domain:', error);
      toast.error(error.message || 'Failed to rent domain', { id: 'rent' });
    } finally {
      setIsRenting(false);
    }
  };

  const getIntelligenceLabel = (score: number): { label: string; color: string } => {
    if (score >= 900) return { label: 'Genius', color: 'text-yellow-400' };
    if (score >= 800) return { label: 'Expert', color: 'text-purple-400' };
    if (score >= 700) return { label: 'Advanced', color: 'text-blue-400' };
    if (score >= 600) return { label: 'Intermediate', color: 'text-green-400' };
    return { label: 'Beginner', color: 'text-gray-400' };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-primary-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (!agent || (!agent.saleListing && !agent.rentalListing)) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <AlertCircle className="w-16 h-16 text-dark-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Domain Not Listed</h2>
            <p className="text-dark-400 mb-6">This domain is not currently available on the marketplace.</p>
            <button onClick={() => router.push('/marketplace')} className="btn-primary">
              Back to Marketplace
            </button>
          </div>
        </div>
      </div>
    );
  }

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
                  Owner: {formatAddress(agent.owner)}
                </p>
              </div>

              <div className="glass-card p-6 text-center">
                {agent.isRental ? (
                  <>
                    <div className="text-sm text-dark-400 mb-2">Rental Price</div>
                    <div className="text-3xl font-bold gradient-text mb-2">
                      {agent.rentalPricePerDay} 0G<span className="text-sm">/day</span>
                    </div>
                    <div className="text-xs text-dark-400 mb-4">
                      {agent.rentalMinDuration}-{agent.rentalMaxDuration} days
                    </div>
                    <input
                      type="number"
                      min={agent.rentalMinDuration}
                      max={agent.rentalMaxDuration}
                      value={rentalDays}
                      onChange={(e) => setRentalDays(parseInt(e.target.value) || 1)}
                      className="w-full mb-3 px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white"
                      placeholder="Days to rent"
                    />
                    <button
                      onClick={handleRent}
                      disabled={isRenting || !isConnected}
                      className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                      {isRenting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Clock className="w-5 h-5" />}
                      {isRenting ? 'Renting...' : 'Rent Agent'}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-sm text-dark-400 mb-2">Price</div>
                    <div className="text-4xl font-bold gradient-text mb-4">{agent.price} 0G</div>
                    <button
                      onClick={handleBuy}
                      disabled={isBuying || !isConnected}
                      className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                      {isBuying ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingCart className="w-5 h-5" />}
                      {isBuying ? 'Buying...' : 'Buy Agent'}
                    </button>
                  </>
                )}
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
                      {((Number(agent.performance.profitGenerated) / Number(agent.performance.totalValueManaged || 1)) * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Learned Strategies */}
              {agent.strategies.length > 0 && (
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
                    {agent.strategies.map((strategy: any, index: number) => (
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
              )}
            </div>

            {/* Right Column - Recent Activity */}
            <div className="space-y-6">
              {/* Recent Actions */}
              {agent.recentActions.length > 0 && (
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
                    {agent.recentActions.map((action: any, index: number) => (
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
              )}

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
                      {agent.inftAddress || 'Not available'}
                    </code>
                  </div>
                  <div>
                    <div className="text-dark-400 mb-1">Owner</div>
                    <code className="text-xs bg-dark-800 px-2 py-1 rounded block truncate">
                      {agent.owner}
                    </code>
                  </div>
                  <div>
                    <div className="text-dark-400 mb-1">Node Hash</div>
                    <code className="text-xs bg-dark-800 px-2 py-1 rounded block truncate">
                      {agent.node}
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
                    <span>{agent.isRental ? 'Temporary access rights' : 'Complete domain ownership transfer'}</span>
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
