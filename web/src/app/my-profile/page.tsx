"use client";

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { blockchainService } from '@/lib/blockchain';
import { User, Crown, AlertCircle, ExternalLink, Calendar, Coins, Hash } from 'lucide-react';
import { ethers } from 'ethers';



interface UserNFT {
  name: string;
  tokenId: string;
  registrationDate: string;
  price: bigint;
}

export default function MyProfilePage() {
  const [loading, setLoading] = useState(true);
  const [userNFTs, setUserNFTs] = useState<UserNFT[]>([]);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadUserNFTs();
  }, []);

  const loadUserNFTs = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      
      console.log('🔄 Initializing blockchain service...');
      await blockchainService.initialize();
      console.log('✅ Blockchain service initialized');
      
      // Check if wallet is connected
      console.log('🔍 Checking wallet connection...');
      const isConnected = await blockchainService.isConnected();
      console.log('Wallet connected:', isConnected);
      
      if (!isConnected) {
        setError('Please connect your wallet first. Make sure MetaMask is connected and you are on the 0G testnet.');
        setLoading(false);
        return;
      }

      // Get user address
      console.log('🔍 Getting user address...');
      const address = await blockchainService.getConnectedAddress();
      console.log('User address:', address);
      setUserAddress(address);

      // Check if contracts are deployed
      console.log('🔍 Checking if contracts are deployed...');
      const contractsDeployed = await blockchainService.areContractsDeployed();
      console.log('Contracts deployed:', contractsDeployed);
      
      if (!contractsDeployed) {
        setError('Smart contracts not found on this network. Please switch to 0G testnet (Galileo) in MetaMask to use this dApp. The contracts are deployed on Chain ID 16601.');
        setLoading(false);
        return;
      }

      // Get all user NFTs
      console.log('🔍 Getting user NFTs...');
      let nfts = await blockchainService.getUserNFTs();
      console.log('📊 User NFTs found:', nfts);
      console.log('📊 User NFTs length:', nfts.length);
      // Convert BigInt values to strings for JSON serialization
      const serializableNfts = nfts.map(nft => ({
        ...nft,
        price: nft.price.toString()
      }));
      console.log('📊 User NFTs details:', JSON.stringify(serializableNfts, null, 2));
      
      // If no NFTs found through getUserNFTs, try direct scan as fallback
      if (nfts.length === 0 && address) {
        console.log('🔄 No NFTs found through getUserNFTs, trying direct scan...');
        try {
          nfts = await blockchainService.getNFTsForAddressWithMetadata(address);
          console.log('📊 Direct scan NFTs found:', nfts);
          console.log('📊 Direct scan NFTs length:', nfts.length);
          // Convert BigInt values to strings for JSON serialization
          const serializableDirectNfts = nfts.map(nft => ({
            ...nft,
            price: nft.price.toString()
          }));
          console.log('📊 Direct scan NFTs details:', JSON.stringify(serializableDirectNfts, null, 2));
        } catch (directError) {
          console.error('Direct scan failed:', directError);
        }
      }
      
      setUserNFTs(nfts);
      
    } catch (err) {
      console.error('Error loading user NFTs:', err);
      setError(`Failed to load your NFTs: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };



  const checkContractStatus = async () => {
    try {
      console.log('🔍 Checking contract status...');
      await blockchainService.initialize();
      
      const contractInfo = await blockchainService.checkContractForNFTs();
      console.log('📊 Contract info:', contractInfo);
      
      if (contractInfo.hasNFTs) {
        alert(`Contract has ${contractInfo.totalTokens} NFTs! Sample: ${contractInfo.sampleTokens.map(t => `Token ${t.tokenId} owned by ${t.owner.slice(0, 6)}...`).join(', ')}`);
      } else {
        alert('No NFTs found on the contract. You may need to mint some first using the demo script.');
      }
    } catch (error) {
      console.error('Contract check error:', error);
      alert(`Contract check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const checkKingName = async () => {
    try {
      console.log('🔍 Checking for "king" name...');
      await blockchainService.initialize();
      
      const kingInfo = await blockchainService.checkNameExists('king');
      console.log('👑 King name info:', kingInfo);
      
      if (kingInfo.exists) {
        alert(`✅ Found "king.0g"! Token ID: ${kingInfo.tokenId}, Owner: ${kingInfo.owner?.slice(0, 6)}...${kingInfo.owner?.slice(-4)}`);
      } else {
        alert('❌ "king.0g" not found. Run the demo script first: npm run demo');
      }
    } catch (error) {
      console.error('King name check error:', error);
      alert(`King name check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(parseInt(timestamp) * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: bigint) => {
    return ethers.formatEther(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your NFTs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Header */}
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.push('/')}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
              >
                ← Back to Home
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
                <p className="text-gray-600 dark:text-gray-400">Your iNS Names</p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-2xl mx-auto px-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <AlertCircle className="w-8 h-8 text-yellow-600" />
                <h2 className="text-2xl font-bold text-yellow-800">Network Configuration Required</h2>
              </div>
              
              <p className="text-yellow-700 text-lg mb-6">
                {error}
              </p>
              
              <div className="bg-white border border-yellow-300 rounded-lg p-6 mb-6">
                <h4 className="font-semibold text-yellow-800 mb-3 text-lg">Quick Fix:</h4>
                <div className="text-sm text-yellow-700 space-y-3">
                  <p>1. <strong>Add 0G Testnet to MetaMask:</strong></p>
                  <div className="bg-gray-100 p-4 rounded text-left font-mono text-xs">
                    <p><strong>Network Name:</strong> 0G Testnet (Galileo)</p>
                    <p><strong>Chain ID:</strong> 16601</p>
                    <p><strong>RPC URL:</strong> https://evmrpc-testnet.0g.ai/</p>
                    <p><strong>Currency Symbol:</strong> 0G</p>
                    <p><strong>Block Explorer:</strong> https://testnet.0g.ai/</p>
                  </div>
                  <p>2. <strong>Switch to 0G Testnet</strong></p>
                  <p>3. <strong>Refresh this page</strong></p>
                </div>
              </div>
              
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => window.open('https://testnet.0g.ai/', '_blank')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  🌐 Visit 0G Testnet
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  🏠 Go Home
                </button>
                <button
                  onClick={loadUserNFTs}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  🔄 Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.push('/')}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
              >
                ← Back to Home
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
                <p className="text-gray-600 dark:text-gray-400">Your iNS Names</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadUserNFTs}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm text-gray-600 dark:text-gray-300"
                title="Refresh NFTs"
              >
                🔄 Refresh
              </button>

              <button
                onClick={checkContractStatus}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm text-gray-600 dark:text-gray-300"
                title="Check Contract Status"
              >
                📊 Contract
              </button>
              <button
                onClick={checkKingName}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm text-gray-600 dark:text-gray-300"
                title="Check King Name"
              >
                👑 King
              </button>
            </div>
            {userAddress && (
              <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">

        
        {userNFTs.length === 0 ? (
          // No NFTs found
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-12 max-w-2xl mx-auto">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 p-8 rounded-2xl mb-8">
                <User className="w-16 h-16 text-blue-500 dark:text-blue-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Names Yet</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  You haven&apos;t registered any names yet. Register your first name to get started!
                </p>
                
                {/* Debug Information */}
                {userAddress && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4 mb-6">
                    <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Debug Info</h3>
                    <div className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                                          <p>Address: {userAddress}</p>
                    <p>Contracts: {userAddress ? 'Deployed' : 'Not accessible'}</p>
                    <p>Click the 📊 button to check if contract has any NFTs</p>
                    </div>
                  </div>
                )}

                {/* Instructions */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 mb-6">
                  <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">Getting Started</h3>
                  <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                    <p>1. Make sure you're on 0G testnet (Chain ID: 16601)</p>
                    <p>2. Connect your wallet to this dApp</p>
                    <p>3. Run the demo script to mint a test NFT:</p>
                    <code className="block bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded mt-1">
                      npm run demo
                    </code>
                    <p className="mt-2">4. Click 👑 to check if "king.0g" was created</p>
                    <p>5. Refresh this page to see your NFTs</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Crown className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">Get Your First Name</h3>
                  </div>
                  <p className="text-blue-700 dark:text-blue-300 text-sm mb-4">
                    Register a unique name to create your on-chain identity and profile.
                  </p>
                  <button
                    onClick={() => router.push('/')}
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Register a Name
                  </button>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">What you'll get:</h3>
                  <ul className="text-gray-600 dark:text-gray-300 text-sm space-y-2">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      A unique .0g domain name
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      An NFT representing your identity
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      A public profile page
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Full ownership and control
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          // Display user's NFTs
          <div className="space-y-8">
            {/* Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Names</h2>
                  <p className="text-gray-600 dark:text-gray-400">You own {userNFTs.length} name{userNFTs.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Value</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatPrice(userNFTs.reduce((total, nft) => total + nft.price, 0n))} OG
                  </p>
                </div>
              </div>
            </motion.div>

            {/* NFT Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {userNFTs.map((nft, index) => (
                <motion.div
                  key={nft.tokenId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300"
                >
                  {/* NFT Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Crown className="w-6 h-6 text-white" />
                    </div>
                    <button
                      onClick={() => router.push(`/nft/${nft.tokenId}`)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="View NFT details"
                    >
                      <ExternalLink className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>

                  {/* NFT Name */}
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {nft.name}.0g
                  </h3>

                  {/* NFT Details */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Hash className="w-4 h-4" />
                      <span>Token ID: {nft.tokenId}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>Registered: {formatDate(nft.registrationDate)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Coins className="w-4 h-4" />
                      <span>Price: {formatPrice(nft.price)} OG</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-6">
                    <button
                      onClick={() => router.push(`/profile/${nft.name}`)}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => router.push(`/nft/${nft.tokenId}`)}
                      className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                    >
                      NFT Details
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
