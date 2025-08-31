"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, X, User, Crown, ChevronRight, ExternalLink, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { blockchainService } from '@/lib/blockchain';
import { useWallet } from './WalletContext';

interface WalletConnectProps {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
}

interface WalletOption {
  id: string;
  name: string;
  icon: string;
  category: 'installed' | 'popular' | 'more';
  description?: string;
  available: boolean;
}

const WALLET_OPTIONS: WalletOption[] = [
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: '🦊',
    category: 'installed',
    description: 'Connect using MetaMask',
    available: true
  },
  {
    id: 'browser',
    name: 'Browser Wallet',
    icon: '🌐',
    category: 'popular',
    description: 'Use your browser\'s built-in wallet',
    available: true
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    icon: '🔗',
    category: 'popular',
    description: 'Connect with QR code',
    available: false
  },
  {
    id: 'phantom',
    name: 'Phantom',
    icon: '👻',
    category: 'popular',
    description: 'Solana wallet',
    available: false
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    icon: '🌈',
    category: 'popular',
    description: 'The fun, simple & secure Ethereum wallet',
    available: false
  },
  {
    id: 'rabby',
    name: 'Rabby Wallet',
    icon: '🐰',
    category: 'installed',
    description: 'DeBank\'s wallet',
    available: false
  },
  {
    id: 'keplr',
    name: 'Keplr',
    icon: '🔷',
    category: 'installed',
    description: 'Cosmos wallet',
    available: false
  }
];

export default function WalletConnect({ onConnect, onDisconnect }: WalletConnectProps) {
  const { isWalletConnected, address, networkInfo, setIsWalletConnected, setAddress, setNetworkInfo, checkConnection, refreshProfile } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ name: string; tokenId: string } | null>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const router = useRouter();

  const connectWallet = async (walletId: string) => {
    setIsConnecting(true);
    setError(null);
    
    try {
      if (walletId === 'metamask') {
        await blockchainService.initialize();
      } else if (walletId === 'browser') {
        // Try to use browser's built-in wallet
        if (typeof window !== 'undefined' && window.ethereum) {
          await blockchainService.initialize();
        } else {
          throw new Error('No browser wallet detected');
        }
      } else {
        throw new Error(`${WALLET_OPTIONS.find(w => w.id === walletId)?.name} is not yet supported`);
      }
      
      await checkConnection();
      setShowWalletModal(false);
    } catch (error: unknown) {
      console.error('Connection error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet';
      setError(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setIsWalletConnected(false);
    setAddress(null);
    setNetworkInfo(null);
    onDisconnect?.();
  };

  const checkUserProfile = async () => {
    if (!address) return;
    
    console.log('🔄 Checking user profile for address:', address);
    
    try {
      const profile = await blockchainService.getUserProfile();
      console.log('📊 Profile result:', profile);
      setUserProfile(profile);
      console.log('✅ Updated user profile state:', profile);
    } catch (error) {
      console.error('❌ Error checking user profile:', error);
      setUserProfile(null);
    }
  };

  // Refresh user profile periodically and after wallet connection
  useEffect(() => {
    if (isWalletConnected && address) {
      // Check profile immediately
      checkUserProfile();
      
      // Set up periodic refresh every 30 seconds
      const interval = setInterval(() => {
        checkUserProfile();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [isWalletConnected, address]);

  // Listen for profile refresh requests
  useEffect(() => {
    if (isWalletConnected && address) {
      // Check profile when refreshProfile is called
      const handleRefresh = () => {
        checkUserProfile();
      };
      
      // We'll use a custom event to trigger profile refresh
      window.addEventListener('refresh-profile', handleRefresh);
      return () => window.removeEventListener('refresh-profile', handleRefresh);
    }
  }, [isWalletConnected, address]);

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getWalletOptionsByCategory = () => {
    const categories = {
      installed: WALLET_OPTIONS.filter(w => w.category === 'installed' && w.available),
      popular: WALLET_OPTIONS.filter(w => w.category === 'popular'),
      more: WALLET_OPTIONS.filter(w => w.category === 'more')
    };
    return categories;
  };

  if (isWalletConnected && address) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl px-4 py-2.5 shadow-sm hover:shadow-md transition-all duration-200"
      >
        {/* Wallet Icon */}
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
          <Wallet className="size-4 text-white" />
        </div>
        
        {/* Address and Network Info */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {userProfile ? `${userProfile.name}.0g` : shortenAddress(address)}
            </span>
            {userProfile && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => router.push(`/profile/${userProfile.name}`)}
                  className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="View my profile"
                >
                  <User className="size-3 text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  onClick={() => router.push(`/nft/${userProfile.tokenId}`)}
                  className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="View my NFT"
                >
                  <Crown className="size-3 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            )}
          </div>
          {networkInfo && (
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
              Network: {networkInfo.name || `Chain ID: ${networkInfo.chainId}`}
            </span>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={checkUserProfile}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Refresh profile"
          >
            <RefreshCw className="size-3.5 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={disconnectWallet}
            className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Disconnect wallet"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <button
          onClick={() => setShowWalletModal(true)}
          disabled={isConnecting}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm hover:shadow-md"
        >
          <Wallet className="size-4" />
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
        
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2"
          >
            {error}
          </motion.div>
        )}
      </div>

      {/* Wallet Selection Modal */}
      <AnimatePresence>
        {showWalletModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowWalletModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden mx-auto border border-gray-200 dark:border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Connect a Wallet</h2>
                <button
                  onClick={() => setShowWalletModal(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="size-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="flex">
                {/* Left Section - Wallet Options */}
                <div className="flex-1 p-6">
                  <div className="space-y-6">
                    {/* Installed Wallets */}
                    {getWalletOptionsByCategory().installed.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-3">Installed</h3>
                        <div className="space-y-2">
                          {getWalletOptionsByCategory().installed.map((wallet) => (
                            <button
                              key={wallet.id}
                              onClick={() => connectWallet(wallet.id)}
                              disabled={isConnecting}
                              className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                                  {wallet.icon}
                                </div>
                                <div className="text-left">
                                  <div className="font-medium text-gray-900 dark:text-white">{wallet.name}</div>
                                  {wallet.description && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{wallet.description}</div>
                                  )}
                                </div>
                              </div>
                              <ChevronRight className="size-4 text-gray-400 dark:text-gray-500" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Popular Wallets */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-3">Popular</h3>
                      <div className="space-y-2">
                        {getWalletOptionsByCategory().popular.map((wallet) => (
                          <button
                            key={wallet.id}
                            onClick={() => connectWallet(wallet.id)}
                            disabled={!wallet.available || isConnecting}
                            className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                                {wallet.icon}
                              </div>
                              <div className="text-left">
                                <div className="font-medium text-gray-900 dark:text-white">{wallet.name}</div>
                                {wallet.description && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400">{wallet.description}</div>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="size-4 text-gray-400" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Section - What is a Wallet? */}
                <div className="w-80 bg-gray-50 dark:bg-gray-800 p-6 border-l border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">What is a Wallet?</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                          <Wallet className="size-4 text-white" />
                        </div>
                        <h4 className="font-medium text-gray-900 dark:text-white">A Home for your Digital Assets</h4>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Wallets are used to send, receive, store, and display digital assets like Ethereum and NFTs.
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <User className="size-4 text-white" />
                        </div>
                        <h4 className="font-medium text-gray-900 dark:text-white">A New Way to Log In</h4>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Instead of creating new accounts and passwords on every website, just connect your wallet.
                      </p>
                    </div>

                    <div className="pt-4">
                      <button
                        onClick={() => window.open('https://ethereum.org/en/wallets/', '_blank')}
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors mb-2"
                      >
                        Get a Wallet
                      </button>
                      <button
                        onClick={() => window.open('https://ethereum.org/en/wallets/', '_blank')}
                        className="w-full text-blue-600 text-sm hover:text-blue-700 transition-colors"
                      >
                        Learn More
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
