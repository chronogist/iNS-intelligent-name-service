'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Globe, TrendingUp, BarChart3, DollarSign, PieChart, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import PortfolioValue from '@/components/PortfolioValue';
import EarningsTracker from '@/components/EarningsTracker';
import MarketplaceManager from '@/components/MarketplaceManager';
import { useAccount, useReadContract } from 'wagmi';
import { useRouter } from 'next/navigation';

interface Domain {
  name: string;
  owner: string;
}

export default function PortfolioPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'earnings' | 'manage'>('overview');

  const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS as `0x${string}`;

  // Fetch user's domains
  const { data: domainNames, isLoading: isLoadingDomains } = useReadContract({
    address: REGISTRY_ADDRESS,
    abi: [{
      name: 'getOwnerDomains',
      type: 'function',
      stateMutability: 'view',
      inputs: [{ name: 'owner', type: 'address' }],
      outputs: [{ name: '', type: 'string[]' }]
    }],
    functionName: 'getOwnerDomains',
    args: [address as `0x${string}`],
    query: {
      enabled: !!address && isConnected
    }
  });

  useEffect(() => {
    console.log('Portfolio - isConnected:', isConnected, 'isLoadingDomains:', isLoadingDomains, 'domainNames:', domainNames);

    if (!isConnected) {
      console.log('Portfolio - Not connected, redirecting to home');
      router.push('/');
      return;
    }

    if (!isLoadingDomains) {
      if (domainNames && domainNames.length > 0) {
        console.log('Portfolio - Found domains:', domainNames);
        const formattedDomains = domainNames.map((name: string) => ({
          name,
          owner: address || '',
        }));
        setDomains(formattedDomains as Domain[]);
        setIsLoading(false);
      } else if (domainNames !== undefined) {
        console.log('Portfolio - No domains found');
        setDomains([]);
        setIsLoading(false);
      }
    }
  }, [domainNames, address, isConnected, isLoadingDomains, router]);

  if (!isConnected) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <button
              onClick={() => router.push('/domains')}
              className="btn-ghost mb-4 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Domains
            </button>

            <h1 className="text-3xl sm:text-4xl font-display font-bold mb-2">
              Portfolio <span className="gradient-text">Dashboard</span>
            </h1>
            <p className="text-dark-300">
              Manage your domain investments, track earnings, and optimize marketplace listings
            </p>
          </motion.div>

          {/* Tab Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-2 mb-8"
          >
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                  activeTab === 'overview'
                    ? 'bg-primary-500 text-white shadow-glow'
                    : 'text-dark-400 hover:text-white hover:bg-dark-800'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <PieChart className="w-5 h-5" />
                  <span className="hidden sm:inline">Portfolio Value</span>
                  <span className="sm:hidden">Value</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('earnings')}
                className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                  activeTab === 'earnings'
                    ? 'bg-primary-500 text-white shadow-glow'
                    : 'text-dark-400 hover:text-white hover:bg-dark-800'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  <span className="hidden sm:inline">Earnings</span>
                  <span className="sm:hidden">Earn</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('manage')}
                className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                  activeTab === 'manage'
                    ? 'bg-primary-500 text-white shadow-glow'
                    : 'text-dark-400 hover:text-white hover:bg-dark-800'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  <span className="hidden sm:inline">Manage Listings</span>
                  <span className="sm:hidden">Manage</span>
                </div>
              </button>
            </div>
          </motion.div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-primary-400 animate-spin" />
            </div>
          ) : domains.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-12 text-center"
            >
              <Globe className="w-16 h-16 text-dark-400 mx-auto mb-6" />
              <h2 className="text-2xl font-display font-bold mb-4">
                No Domains Yet
              </h2>
              <p className="text-dark-300 mb-8">
                Register your first domain to start building your portfolio
              </p>
              <button
                onClick={() => router.push('/')}
                className="btn-primary"
              >
                Search Domains
              </button>
            </motion.div>
          ) : (
            <>
              {/* Portfolio Value Tab */}
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <PortfolioValue domains={domains} />
                </motion.div>
              )}

              {/* Earnings Tab */}
              {activeTab === 'earnings' && (
                <motion.div
                  key="earnings"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <EarningsTracker domains={domains.map(d => d.name)} />
                </motion.div>
              )}

              {/* Manage Listings Tab */}
              {activeTab === 'manage' && (
                <motion.div
                  key="manage"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  {/* Domain Selector */}
                  <div className="glass-card p-6">
                    <h3 className="text-xl font-bold mb-4">Select Domain to Manage</h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {domains.map((domain) => (
                        <button
                          key={domain.name}
                          onClick={() => setSelectedDomain(domain.name)}
                          className={`p-4 rounded-lg border-2 transition-all text-left ${
                            selectedDomain === domain.name
                              ? 'border-primary-500 bg-primary-500/10'
                              : 'border-dark-600 bg-dark-800 hover:border-dark-500'
                          }`}
                        >
                          <div className="font-bold text-lg">{domain.name}.0g</div>
                          <div className="text-xs text-dark-400 mt-1">Click to manage</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Marketplace Manager */}
                  {selectedDomain ? (
                    <MarketplaceManager
                      domainName={selectedDomain}
                      isOwner={true}
                    />
                  ) : (
                    <div className="glass-card p-12 text-center">
                      <BarChart3 className="w-12 h-12 text-dark-400 mx-auto mb-4" />
                      <h3 className="text-xl font-bold mb-2">Select a Domain</h3>
                      <p className="text-dark-400">
                        Choose a domain above to manage its marketplace listings
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </>
          )}

          {/* Quick Actions */}
          {domains.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 glass-card p-6 bg-gradient-to-br from-primary-500/10 to-accent-500/10 border border-primary-500/20"
            >
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary-400" />
                Quick Actions
              </h3>
              <div className="grid md:grid-cols-3 gap-3">
                <button
                  onClick={() => {
                    setActiveTab('manage');
                    setSelectedDomain(domains[0].name);
                  }}
                  className="btn-primary justify-center"
                >
                  List Domain for Sale
                </button>
                <button
                  onClick={() => router.push('/marketplace')}
                  className="btn-ghost justify-center"
                >
                  Browse Marketplace
                </button>
                <button
                  onClick={() => router.push('/domains')}
                  className="btn-ghost justify-center"
                >
                  View All Domains
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
