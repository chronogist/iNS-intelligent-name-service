'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { useAccount, useReadContract } from 'wagmi';
import { Loader2, ArrowLeft, Globe, Clock, Settings, ExternalLink, Plus, Trash2, X, Zap, Brain } from 'lucide-react';
import Navbar from '@/components/Navbar';
import LearningAnalytics from '@/components/LearningAnalytics';
import MarketplaceManager from '@/components/MarketplaceManager';
import toast from 'react-hot-toast';

interface RoutingRule {
  id: string;
  type: 'token' | 'amount' | 'sender' | 'default';
  condition: string;
  destination: string;
  label: string;
}

export default function DomainManagePage() {
  const params = useParams();
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(true);
  const [domainOwner, setDomainOwner] = useState<string>('');
  const [expiry, setExpiry] = useState<number>(0);
  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [routingRules, setRoutingRules] = useState<RoutingRule[]>([]);
  const [newRule, setNewRule] = useState<Partial<RoutingRule>>({
    type: 'default',
    condition: '',
    destination: '',
    label: ''
  });

  const domainName = params.name as string;
  const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS as `0x${string}`;
  const EXPLORER_URL = process.env.NEXT_PUBLIC_EXPLORER_URL;

  // Get domain owner
  const { data: owner } = useReadContract({
    address: REGISTRY_ADDRESS,
    abi: [{
      name: 'ownerOf',
      type: 'function',
      stateMutability: 'view',
      inputs: [{ name: 'name', type: 'string' }],
      outputs: [{ name: '', type: 'address' }]
    }],
    functionName: 'ownerOf',
    args: [domainName],
    query: {
      enabled: !!domainName
    }
  });

  // Get domain expiry
  const { data: expiryData } = useReadContract({
    address: REGISTRY_ADDRESS,
    abi: [{
      name: 'getExpiry',
      type: 'function',
      stateMutability: 'view',
      inputs: [{ name: 'name', type: 'string' }],
      outputs: [{ name: '', type: 'uint256' }]
    }],
    functionName: 'getExpiry',
    args: [domainName],
    query: {
      enabled: !!domainName
    }
  });

  // Get INFT address
  const { data: inftAddress } = useReadContract({
    address: REGISTRY_ADDRESS,
    abi: [{
      name: 'getINFT',
      type: 'function',
      stateMutability: 'view',
      inputs: [{ name: 'name', type: 'string' }],
      outputs: [{ name: '', type: 'address' }]
    }],
    functionName: 'getINFT',
    args: [domainName],
    query: {
      enabled: !!domainName
    }
  });

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
      return;
    }

    if (owner) {
      setDomainOwner(owner as string);

      // Check if current user is owner
      if (address?.toLowerCase() !== (owner as string).toLowerCase()) {
        router.push('/domains');
        return;
      }
    }

    if (expiryData) {
      setExpiry(Number(expiryData));
    }

    if (owner && expiryData) {
      setIsLoading(false);
    }
  }, [owner, expiryData, address, isConnected, router]);

  const formatExpiryDate = (timestamp: number) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isExpired = () => {
    if (!expiry) return false;
    return expiry < Math.floor(Date.now() / 1000);
  };

  const handleAddRule = () => {
    if (!newRule.label || !newRule.destination) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!newRule.destination.match(/^0x[a-fA-F0-9]{40}$/)) {
      toast.error('Please enter a valid wallet address');
      return;
    }

    const rule: RoutingRule = {
      id: Date.now().toString(),
      type: newRule.type as any,
      condition: newRule.condition || '',
      destination: newRule.destination,
      label: newRule.label
    };

    setRoutingRules([...routingRules, rule]);
    setShowAddRuleModal(false);
    setNewRule({
      type: 'default',
      condition: '',
      destination: '',
      label: ''
    });
    toast.success('Routing rule added!');
  };

  const handleDeleteRule = (id: string) => {
    setRoutingRules(routingRules.filter(rule => rule.id !== id));
    toast.success('Routing rule deleted');
  };

  const getRuleTypeLabel = (type: string) => {
    switch (type) {
      case 'token': return 'Token Type';
      case 'amount': return 'Amount Range';
      case 'sender': return 'Sender Address';
      case 'default': return 'Default Route';
      default: return type;
    }
  };

  if (!isConnected) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center pt-32">
          <Loader2 className="w-12 h-12 text-primary-400 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.push('/domains')}
            className="btn-ghost mb-8 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Domains
          </button>

          {/* Domain Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl sm:text-4xl font-display font-bold mb-2">
              <span className="gradient-text">{domainName}.0g</span>
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-dark-400">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className={isExpired() ? 'text-red-400' : ''}>
                  {isExpired() ? 'Expired' : 'Expires'}: {formatExpiryDate(expiry)}
                </span>
              </div>
            </div>
          </motion.div>

          {/* AI Learning Dashboard Link */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <button
              onClick={() => router.push(`/domains/${domainName}/learning`)}
              className="w-full glass-card p-6 hover:border-primary-500/50 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-lg group-hover:scale-110 transition-transform">
                    <Brain className="w-6 h-6 text-primary-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-display font-bold mb-1">AI Learning Dashboard</h3>
                    <p className="text-sm text-dark-400">View how your agent is learning and improving</p>
                  </div>
                </div>
                <ArrowLeft className="w-5 h-5 text-primary-400 rotate-180 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </motion.div>

          {/* AI Learning Analytics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <LearningAnalytics domain={domainName} inftAddress={inftAddress as string} />
          </motion.div>

          {/* Marketplace Manager */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <MarketplaceManager domainName={domainName} isOwner={address?.toLowerCase() === domainOwner.toLowerCase()} />
          </motion.div>

          {/* Domain Details Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-8 mb-8"
          >
            <h2 className="text-2xl font-display font-bold mb-6">Domain Details</h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-dark-400">Owner Address</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-sm bg-dark-800 px-3 py-2 rounded-lg flex-1 truncate">
                    {domainOwner}
                  </code>
                  <button
                    onClick={() => window.open(`${EXPLORER_URL}/address/${domainOwner}`, '_blank')}
                    className="btn-ghost text-sm flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm text-dark-400">INFT Contract</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-sm bg-dark-800 px-3 py-2 rounded-lg flex-1 truncate">
                    {inftAddress as string || 'Loading...'}
                  </code>
                  {inftAddress && (
                    <button
                      onClick={() => window.open(`${EXPLORER_URL}/address/${inftAddress}`, '_blank')}
                      className="btn-ghost text-sm flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm text-dark-400">Expiry Date</label>
                <div className="mt-1">
                  <p className={`text-lg font-semibold ${isExpired() ? 'text-red-400' : 'text-primary-400'}`}>
                    {formatExpiryDate(expiry)}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Routing Rules Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-bold">Intelligent Routing Rules</h2>
              <button
                onClick={() => setShowAddRuleModal(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Rule
              </button>
            </div>

            {routingRules.length === 0 ? (
              <div className="text-center py-12">
                <Settings className="w-16 h-16 text-dark-400 mx-auto mb-4" />
                <p className="text-dark-400">
                  No routing rules configured yet. Add rules to enable intelligent routing for your domain.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {routingRules.map((rule, index) => (
                  <motion.div
                    key={rule.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="glass-card p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Zap className="w-5 h-5 text-primary-400" />
                        <h3 className="font-semibold">{rule.label}</h3>
                        <span className="text-xs px-2 py-1 bg-primary-500/10 text-primary-400 rounded-full">
                          {getRuleTypeLabel(rule.type)}
                        </span>
                      </div>
                      <div className="text-sm text-dark-400 ml-8">
                        {rule.condition && <p className="mb-1">Condition: {rule.condition}</p>}
                        <p className="truncate">Destination: {rule.destination}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Add Rule Modal */}
      <AnimatePresence>
        {showAddRuleModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
            onClick={() => setShowAddRuleModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-display font-bold">Add Routing Rule</h3>
                <button
                  onClick={() => setShowAddRuleModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Rule Label *</label>
                  <input
                    type="text"
                    value={newRule.label || ''}
                    onChange={(e) => setNewRule({ ...newRule, label: e.target.value })}
                    placeholder="e.g., USDT to Trading Wallet"
                    className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-3 text-white placeholder:text-dark-400 focus:outline-none focus:border-primary-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Rule Type</label>
                  <select
                    value={newRule.type || 'default'}
                    onChange={(e) => setNewRule({ ...newRule, type: e.target.value as any })}
                    className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-400 transition-colors"
                  >
                    <option value="default">Default Route</option>
                    <option value="token">Token Type</option>
                    <option value="amount">Amount Range</option>
                    <option value="sender">Sender Address</option>
                  </select>
                </div>

                {newRule.type !== 'default' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Condition</label>
                    <input
                      type="text"
                      value={newRule.condition || ''}
                      onChange={(e) => setNewRule({ ...newRule, condition: e.target.value })}
                      placeholder={
                        newRule.type === 'token' ? 'e.g., USDT, ETH' :
                        newRule.type === 'amount' ? 'e.g., >1000' :
                        'e.g., 0x123...'
                      }
                      className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-3 text-white placeholder:text-dark-400 focus:outline-none focus:border-primary-400 transition-colors"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Destination Wallet *</label>
                  <input
                    type="text"
                    value={newRule.destination || ''}
                    onChange={(e) => setNewRule({ ...newRule, destination: e.target.value })}
                    placeholder="0x..."
                    className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-3 text-white placeholder:text-dark-400 focus:outline-none focus:border-primary-400 transition-colors"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowAddRuleModal(false)}
                    className="flex-1 btn-ghost"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddRule}
                    className="flex-1 btn-primary"
                  >
                    Add Rule
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
