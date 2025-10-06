'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Globe, Clock, Settings, ExternalLink, Star } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Domain {
  name: string;
  owner: string;
  expiry?: number;
  expiryDate?: string | number;
  routingRules?: any[];
}

export default function DomainsPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const EXPLORER_URL = process.env.NEXT_PUBLIC_EXPLORER_URL;
  const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS as `0x${string}`;

  // Get primary name
  const { data: primaryNameData } = useReadContract({
    address: REGISTRY_ADDRESS,
    abi: [{
      name: 'getPrimaryName',
      type: 'function',
      stateMutability: 'view',
      inputs: [{ name: 'addr', type: 'address' }],
      outputs: [{ name: '', type: 'string' }]
    }],
    functionName: 'getPrimaryName',
    args: [address as `0x${string}`],
    query: {
      enabled: !!address && isConnected
    }
  });

  // Set primary name
  const { data: hash, writeContract, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isSuccess) {
      toast.success('Primary name updated successfully!');
      window.location.reload();
    }
  }, [isSuccess]);

  const handleSetPrimaryName = async (domainName: string) => {
    try {
      writeContract({
        address: REGISTRY_ADDRESS,
        abi: [{
          name: 'setPrimaryName',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [{ name: 'name', type: 'string' }],
          outputs: []
        }],
        functionName: 'setPrimaryName',
        args: [domainName]
      });
    } catch (error) {
      console.error('Error setting primary name:', error);
      toast.error('Failed to set primary name');
    }
  };

  // FAST onchain domain lookup - single call!
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
    if (!isConnected) {
      router.push('/');
      return;
    }

    // Convert domain names to full domain objects
    if (domainNames && domainNames.length > 0) {
      const formattedDomains = domainNames.map((name: string) => ({
        name,
        owner: address || '',
        expiry: 0, // Will be fetched individually if needed
        expiryDate: 'Loading...',
        routingRules: []
      }));
      setDomains(formattedDomains as Domain[]);
      setIsLoading(false);
    } else if (domainNames && domainNames.length === 0) {
      setDomains([]);
      setIsLoading(false);
    }
  }, [domainNames, address, isConnected]);

  const formatExpiryDate = (domain: Domain) => {
    try {
      // Handle both timestamp and ISO string formats
      const timestamp = domain.expiry || (typeof domain.expiryDate === 'number' ? domain.expiryDate : 0);
      if (!timestamp) return 'Unknown';

      const date = new Date(timestamp * 1000);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown';
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl sm:text-4xl font-display font-bold mb-2">
              My <span className="gradient-text">Domains</span>
            </h1>
            <p className="text-dark-300">
              Manage your intelligent domains on 0G Network
            </p>
          </motion.div>

          {/* Domains List */}
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
                You haven't registered any domains yet. Start by searching for your perfect domain.
              </p>
              <button
                onClick={() => router.push('/')}
                className="btn-primary"
              >
                Search Domains
              </button>
            </motion.div>
          ) : (
            <div className="grid gap-6">
              {domains.map((domain, index) => (
                <motion.div
                  key={domain.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card p-6 hover:shadow-glow transition-all duration-300"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl font-display font-bold">
                          {domain.name}.0g
                        </h3>
                        {primaryNameData === domain.name && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-xs text-yellow-400 font-semibold">Primary</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-dark-400">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>Expires: {formatExpiryDate(domain)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          <span>{Array.isArray(domain.routingRules) ? domain.routingRules.length : 0} routing rules</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {primaryNameData !== domain.name && (
                        <button
                          onClick={() => handleSetPrimaryName(domain.name)}
                          disabled={isPending || isConfirming}
                          className="btn-ghost text-sm flex items-center gap-2"
                        >
                          <Star className="w-4 h-4" />
                          {isPending || isConfirming ? 'Setting...' : 'Set as Primary'}
                        </button>
                      )}
                      <button
                        onClick={() => router.push(`/d/${domain.name}`)}
                        className="btn-ghost text-sm flex items-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View
                      </button>
                      <button
                        onClick={() => router.push(`/domains/${domain.name}`)}
                        className="btn-primary"
                      >
                        Manage
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
