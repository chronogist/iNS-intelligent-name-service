'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { useReadContract, useAccount } from 'wagmi';
import {
  Loader2,
  Globe,
  Clock,
  User,
  Shield,
  Copy,
  ExternalLink,
  Share2,
  CheckCircle2,
  Settings,
  Lock,
  Zap
} from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function DomainDisplayPage() {
  const params = useParams();
  const router = useRouter();
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [domainOwner, setDomainOwner] = useState<string>('');
  const [expiry, setExpiry] = useState<number>(0);
  const [inftAddr, setInftAddr] = useState<string>('');

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
  });

  // Check if domain is available
  const { data: isAvailable } = useReadContract({
    address: REGISTRY_ADDRESS,
    abi: [{
      name: 'available',
      type: 'function',
      stateMutability: 'view',
      inputs: [{ name: 'name', type: 'string' }],
      outputs: [{ name: '', type: 'bool' }]
    }],
    functionName: 'available',
    args: [domainName],
  });

  useEffect(() => {
    if (isAvailable === true) {
      // Domain doesn't exist, redirect to registration
      router.push(`/register?domain=${domainName}`);
      return;
    }

    if (owner && expiryData && inftAddress) {
      setDomainOwner(owner as string);
      setExpiry(Number(expiryData));
      setInftAddr(inftAddress as string);
      setIsLoading(false);
    }
  }, [owner, expiryData, inftAddress, isAvailable, domainName, router]);

  const formatExpiryDate = (timestamp: number) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareUrl = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isExpired = () => {
    if (!expiry) return false;
    return expiry < Math.floor(Date.now() / 1000);
  };

  const isOwner = address?.toLowerCase() === domainOwner?.toLowerCase();

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
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-3 mb-4">
              <Globe className="w-12 h-12 text-primary-400" />
              <h1 className="text-4xl sm:text-6xl font-display font-bold">
                <span className="gradient-text">{domainName}.0g</span>
              </h1>
            </div>

            <p className="text-xl text-dark-300 mb-6">
              Intelligent Naming Service on 0G Network
            </p>

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={shareUrl}
                className="btn-ghost flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Share2 className="w-5 h-5" />
                    Share Domain
                  </>
                )}
              </button>

              {isOwner && (
                <button
                  onClick={() => router.push(`/domains/${domainName}`)}
                  className="btn-primary flex items-center gap-2"
                >
                  <Settings className="w-5 h-5" />
                  Manage Domain
                </button>
              )}
            </div>
          </motion.div>

          {/* Status Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="flex justify-center mb-12"
          >
            <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full ${
              isExpired() ? 'bg-red-500/10 border border-red-500/20' : 'bg-green-500/10 border border-green-500/20'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isExpired() ? 'bg-red-400' : 'bg-green-400'} animate-pulse`} />
              <span className={`font-semibold ${isExpired() ? 'text-red-400' : 'text-green-400'}`}>
                {isExpired() ? 'Expired' : 'Active'}
              </span>
            </div>
          </motion.div>

          {/* Main Info Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {/* Owner Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-primary-500/10 rounded-xl">
                  <User className="w-6 h-6 text-primary-400" />
                </div>
                <h3 className="text-xl font-display font-bold">Domain Owner</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <code className="text-sm text-dark-300 truncate flex-1">
                    {formatAddress(domainOwner)}
                  </code>
                  <button
                    onClick={() => copyToClipboard(domainOwner)}
                    className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={() => window.open(`${EXPLORER_URL}/address/${domainOwner}`, '_blank')}
                  className="w-full btn-ghost text-sm flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  View on Explorer
                </button>
              </div>
            </motion.div>

            {/* Expiry Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-primary-500/10 rounded-xl">
                  <Clock className="w-6 h-6 text-primary-400" />
                </div>
                <h3 className="text-xl font-display font-bold">Expiry Date</h3>
              </div>
              <div className="space-y-3">
                <p className={`text-2xl font-bold ${isExpired() ? 'text-red-400' : 'text-primary-400'}`}>
                  {formatExpiryDate(expiry)}
                </p>
                {isExpired() && (
                  <p className="text-sm text-red-400">
                    This domain has expired and may be available for registration
                  </p>
                )}
              </div>
            </motion.div>
          </div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-display font-bold mb-6 text-center">
              Domain <span className="gradient-text">Features</span>
            </h2>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* INFT Token */}
              <div className="glass-card p-6">
                <div className="p-3 bg-purple-500/10 rounded-xl w-fit mb-4">
                  <Shield className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="font-display font-bold mb-2">INFT Token</h3>
                <p className="text-sm text-dark-400 mb-3">
                  Secured by Intelligent NFT with encrypted metadata
                </p>
                <button
                  onClick={() => window.open(`${EXPLORER_URL}/address/${inftAddr}`, '_blank')}
                  className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1"
                >
                  View Contract <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              {/* TEE Security */}
              <div className="glass-card p-6">
                <div className="p-3 bg-green-500/10 rounded-xl w-fit mb-4">
                  <Lock className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="font-display font-bold mb-2">TEE Security</h3>
                <p className="text-sm text-dark-400">
                  Protected by Trusted Execution Environment for secure transfers
                </p>
              </div>

              {/* Intelligent Routing */}
              <div className="glass-card p-6">
                <div className="p-3 bg-blue-500/10 rounded-xl w-fit mb-4">
                  <Zap className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="font-display font-bold mb-2">Smart Routing</h3>
                <p className="text-sm text-dark-400">
                  AI-powered routing rules for intelligent domain resolution
                </p>
              </div>
            </div>
          </motion.div>

          {/* Technical Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card p-8"
          >
            <h2 className="text-2xl font-display font-bold mb-6">Technical Details</h2>

            <div className="grid gap-6">
              <div>
                <label className="text-sm text-dark-400 mb-2 block">INFT Contract Address</label>
                <div className="flex items-center gap-2">
                  <code className="text-sm bg-dark-800 px-4 py-3 rounded-lg flex-1 truncate">
                    {inftAddr}
                  </code>
                  <button
                    onClick={() => copyToClipboard(inftAddr)}
                    className="p-3 hover:bg-dark-700 rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => window.open(`${EXPLORER_URL}/address/${inftAddr}`, '_blank')}
                    className="p-3 hover:bg-dark-700 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm text-dark-400 mb-2 block">Registry Contract</label>
                <div className="flex items-center gap-2">
                  <code className="text-sm bg-dark-800 px-4 py-3 rounded-lg flex-1 truncate">
                    {REGISTRY_ADDRESS}
                  </code>
                  <button
                    onClick={() => copyToClipboard(REGISTRY_ADDRESS)}
                    className="p-3 hover:bg-dark-700 rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => window.open(`${EXPLORER_URL}/address/${REGISTRY_ADDRESS}`, '_blank')}
                    className="p-3 hover:bg-dark-700 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm text-dark-400 mb-2 block">Network</label>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-sm font-semibold">0G Testnet (Chain ID: 16602)</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* CTA Section */}
          {!isOwner && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-12 text-center"
            >
              <div className="glass-card p-8">
                <Globe className="w-16 h-16 text-primary-400 mx-auto mb-4" />
                <h3 className="text-2xl font-display font-bold mb-3">
                  Want your own intelligent domain?
                </h3>
                <p className="text-dark-300 mb-6">
                  Register your .0g domain on the 0G Network with INFT security
                </p>
                <button
                  onClick={() => router.push('/')}
                  className="btn-primary"
                >
                  Search Domains
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
