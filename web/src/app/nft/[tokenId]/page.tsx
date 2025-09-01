"use client";

import { motion } from 'framer-motion';
import { 
  Crown, 
  Copy, 
  ExternalLink, 
  User, 
  Calendar, 
  Hash,
  Eye,
  Share2,
  Heart,
  ArrowLeft,
  Settings
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { blockchainService } from '@/lib/blockchain';
import DynamicMetadataManager from '@/components/DynamicMetadataManager';
import IntelligentMetadataDemo from '@/components/IntelligentMetadataDemo';
import OwnerIntelligenceDemo from '@/components/OwnerIntelligenceDemo';
import OGStorageDemo from '@/components/0GStorageDemo';
import { useRouter } from 'next/navigation';

interface NFTDetailsPageProps {
  params: Promise<{
    tokenId: string;
  }>;
}

interface NFTData {
  tokenId: string;
  name: string;
  owner: string;
  registrationDate: string;
  transactionHash: string;
  imageUrl: string;
  contractAddress: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

export default function NFTDetailsPage({ params }: NFTDetailsPageProps) {
  const [nftData, setNftData] = useState<NFTData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showDynamicManager, setShowDynamicManager] = useState(false);
  const [showIntelligenceDemo, setShowIntelligenceDemo] = useState(false);
  const [showOwnerIntelligence, setShowOwnerIntelligence] = useState(false);
  const [showOGStorage, setShowOGStorage] = useState(false);
  const [tokenId, setTokenId] = useState<string>('');
  const [networkInfo, setNetworkInfo] = useState<{ chainId: bigint; name: string } | null>(null);
  const [contractAddress, setContractAddress] = useState<string>('0x0000000000000000000000000000000000000000');

  const router = useRouter();

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params;
      setTokenId(resolvedParams.tokenId);
    };
    loadParams();
  }, [params]);

  useEffect(() => {
    if (tokenId) {
      loadNFTData();
    }
  }, [tokenId]);

  const loadNFTData = async () => {
    try {
      setLoading(true);
      
      // Initialize blockchain service
      await blockchainService.initialize();
      
      // Get NFT data from blockchain
      const currentState = await blockchainService.getCurrentMetadataState(tokenId);
      console.log('📊 Current metadata state:', currentState);
      
      // Try to resolve the name from token ID by checking all possible names
      let resolvedName = null;
      try {
        // Get registration events to find the name for this token ID
        const events = await blockchainService.getRegistrationEvents();
        console.log('📋 Found registration events:', events.length);
        
        // Look for an event that matches this token ID
        const registrationEvent = events.find(event => {
          // Since we can't access the private registrar property, we'll skip token ID matching
          // The name will be resolved from token URI or fallback instead
          return false;
        });
        
        if (registrationEvent) {
          resolvedName = registrationEvent.name;
          console.log('✅ Found name for token ID:', resolvedName);
        }
      } catch (eventError) {
        console.warn('Could not load registration events:', eventError);
      }
      
      // If we couldn't resolve the name from events, try to get it from the token URI
      if (!resolvedName) {
        try {
          if (currentState.tokenURI && currentState.tokenURI.startsWith('data:application/json;base64,')) {
            const jsonB64 = currentState.tokenURI.replace('data:application/json;base64,', '');
            const jsonStr = ethers.toUtf8String(ethers.getBytes('0x' + Buffer.from(jsonB64, 'base64').toString('hex')));
            const tokenData = JSON.parse(jsonStr);
            
            if (tokenData.name && tokenData.name.endsWith('.0g')) {
              resolvedName = tokenData.name.replace('.0g', '');
              console.log('✅ Got name from token URI:', resolvedName);
            }
          }
        } catch (uriError) {
          console.warn('Could not get name from token URI:', uriError);
        }
      }
      
      // Fallback: if we still don't have a name, use a placeholder
      if (!resolvedName) {
        resolvedName = `name_${tokenId}`;
        console.log('⚠️ Using fallback name:', resolvedName);
      }
      
      // Get network info for the contract address
      const networkInfoData = await blockchainService.getNetworkInfo();
      setNetworkInfo(networkInfoData);
      
      // Get the actual contract address
      let contractAddressData = '0x0000000000000000000000000000000000000000';
      try {
        const registrarAddress = blockchainService.getRegistrarAddress();
        if (registrarAddress) {
          contractAddressData = registrarAddress;
          console.log('✅ Contract address:', contractAddressData);
          setContractAddress(contractAddressData);
        }
      } catch (error) {
        console.warn('Could not get contract address:', error);
      }
      
      // Create a better image URL that doesn't rely on external API
      const imageUrl = `data:image/svg+xml;base64,${btoa(`
        <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
              <stop offset="50%" style="stop-color:#8B5CF6;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#3B82F6;stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="512" height="512" fill="url(#grad)"/>
          <text x="256" y="256" font-family="Arial, sans-serif" font-size="48" font-weight="bold" text-anchor="middle" fill="white" dy=".3em">${resolvedName}.0g</text>
          <text x="256" y="320" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" fill="white" opacity="0.8">NFT #${tokenId}</text>
        </svg>
      `)}`;
      
      const nftData: NFTData = {
        tokenId: tokenId,
        name: resolvedName,
        owner: currentState.owner,
        registrationDate: new Date().toISOString(), // We'll try to get this from events later
        transactionHash: '0x0000000000000000000000000000000000000000000000000000000000000000', // We'll try to get this from events later
        imageUrl: imageUrl,
        contractAddress: contractAddress,
        attributes: [
          { trait_type: "TLD", value: "0g" },
          { trait_type: "Token ID", value: tokenId },
          { trait_type: "Metadata Hash", value: currentState.metadataHash.slice(0, 10) + '...' },
          { trait_type: "Registration Date", value: new Date().toLocaleDateString() },
          { trait_type: "Network", value: networkInfoData?.name || 'Unknown' },
          { trait_type: "Owner", value: shortenAddress(currentState.owner) }
        ]
      };
      
      // Try to get registration details from events
      try {
        const events = await blockchainService.getRegistrationEvents();
        const registrationEvent = events.find(event => event.name === resolvedName);
        
        if (registrationEvent) {
          nftData.registrationDate = registrationEvent.timestamp;
          nftData.transactionHash = registrationEvent.hash;
          console.log('✅ Found registration details:', registrationEvent);
        }
      } catch (eventError) {
        console.warn('Could not get registration details:', eventError);
      }
      
      setNftData(nftData);
      setError(null);
    } catch (err) {
      setError('Failed to load NFT data from blockchain');
      console.error('Error loading NFT:', err);
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

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const shortenHash = (hash: string) => {
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };

  const handleBack = () => {
    // Try to go back, if no history then go to home
    if (window.history.length > 1) {
      window.history.back();
    } else {
      router.push('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading NFT details...</p>
        </div>
      </div>
    );
  }

  if (error || !nftData) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error || 'NFT not found'}</p>
          <button 
            onClick={handleBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

    return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="grid gap-4 lg:grid-cols-2">
          {/* NFT Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="aspect-square bg-gradient-to-br from-blue-900 via-purple-900 to-blue-900 relative">
                <img 
                  src={nftData.imageUrl} 
                  alt={`${nftData.name}.0g NFT`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
                  #{nftData.tokenId}
                </div>
              </div>
              
              <div className="p-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{nftData.name}.0g</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-3 text-sm">Identity Name Service NFT</p>
                
                {/* Attributes */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {nftData.attributes.map((attr, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{attr.trait_type}</p>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{attr.value}</p>
                    </div>
                  ))}
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => window.open(`/profile/${nftData.name}`, '_blank')}
                    className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition-all duration-200 text-sm"
                  >
                    <User className="size-3" />
                    View Profile
                  </button>
                  <button
                    onClick={() => copyToClipboard(nftData.contractAddress, 'contract')}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    title="Copy contract address"
                  >
                    {copiedField === 'contract' ? (
                      <Heart className="size-3 text-red-500" />
                    ) : (
                      <Hash className="size-3" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* NFT Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {/* Owner Information */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-1.5 rounded-lg">
                  <User className="size-4 text-white" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Owner</h3>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-sm text-gray-700 dark:text-gray-300">{shortenAddress(nftData.owner)}</span>
                <button
                  onClick={() => copyToClipboard(nftData.owner, 'owner')}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {copiedField === 'owner' ? (
                    <Heart className="size-3 text-red-500" />
                  ) : (
                    <Copy className="size-3 text-gray-600 dark:text-gray-400" />
                  )}
                </button>
              </div>
              <button
                onClick={() => window.open(`https://etherscan.io/address/${nftData.owner}`, '_blank')}
                className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
              >
                <ExternalLink className="size-3" />
                View on Explorer
              </button>
            </div>

            {/* Registration Details */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-1.5 rounded-lg">
                  <Calendar className="size-4 text-white" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Registration Details</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400 text-sm">Token ID</span>
                  <span className="font-mono text-gray-900 dark:text-white text-sm">#{nftData.tokenId}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400 text-sm">Registration Date</span>
                  <span className="text-gray-900 dark:text-white text-sm">
                    {new Date(nftData.registrationDate).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400 text-sm">Transaction Hash</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-gray-900 dark:text-white">
                      {shortenHash(nftData.transactionHash)}
                    </span>
                    <button
                      onClick={() => copyToClipboard(nftData.transactionHash, 'tx')}
                      className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      {copiedField === 'tx' ? (
                        <Heart className="size-3 text-red-500" />
                      ) : (
                        <Copy className="size-3 text-gray-600 dark:text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400 text-sm">Contract Address</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-gray-900 dark:text-white">
                      {shortenAddress(nftData.contractAddress)}
                    </span>
                    <button
                      onClick={() => copyToClipboard(nftData.contractAddress, 'contract')}
                      className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      {copiedField === 'contract' ? (
                        <Heart className="size-3 text-red-500" />
                      ) : (
                        <Copy className="size-3 text-gray-600 dark:text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => window.open(`https://etherscan.io/tx/${nftData.transactionHash}`, '_blank')}
                className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 transition-all duration-200 mt-3 text-sm"
              >
                <ExternalLink className="size-3" />
                View Transaction
              </button>
            </div>

            {/* Collection Info */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-1.5 rounded-lg">
                  <Crown className="size-4 text-white" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Collection</h3>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400 text-sm">Collection Name</span>
                  <span className="font-semibold text-gray-900 dark:text-white text-sm">{nftData.name}.0g</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400 text-sm">Symbol</span>
                  <span className="font-semibold text-gray-900 dark:text-white text-sm">0GINFT</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400 text-sm">Standard</span>
                  <span className="font-semibold text-gray-900 dark:text-white text-sm">ERC-721</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400 text-sm">Network</span>
                  <span className="font-semibold text-gray-900 dark:text-white text-sm">{networkInfo?.name || 'Unknown'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400 text-sm">Contract</span>
                  <span className="font-mono text-xs text-gray-900 dark:text-white">{shortenAddress(contractAddress)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400 text-sm">Token ID</span>
                  <span className="font-semibold text-gray-900 dark:text-white text-sm">#{nftData.tokenId}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ERC7857 Dynamic Metadata Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-gradient-to-r from-orange-500 to-red-600 p-2 rounded-lg">
              <Settings className="size-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">ERC7857 Dynamic Features</h2>
            <div className="ml-auto flex gap-2">
              <button
                onClick={() => setShowOGStorage(!showOGStorage)}
                className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg hover:from-blue-600 hover:to-cyan-700 transition-all duration-200 text-sm"
              >
                {showOGStorage ? 'Hide' : 'Show'} 0G Storage
              </button>
              <button
                onClick={() => setShowOwnerIntelligence(!showOwnerIntelligence)}
                className="px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 text-sm"
              >
                {showOwnerIntelligence ? 'Hide' : 'Show'} Owner Intelligence
              </button>
              <button
                onClick={() => setShowIntelligenceDemo(!showIntelligenceDemo)}
                className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-200 text-sm"
              >
                {showIntelligenceDemo ? 'Hide' : 'Show'} Intelligence Demo
              </button>
              <button
                onClick={() => setShowDynamicManager(!showDynamicManager)}
                className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-all duration-200 text-sm"
              >
                {showDynamicManager ? 'Hide' : 'Show'} Dynamic Manager
              </button>
            </div>
          </div>
          
          {showOGStorage && nftData && (
            <OGStorageDemo 
              name={nftData.name} 
              tokenId={tokenId} 
            />
          )}
          
          {showOwnerIntelligence && nftData && (
            <OwnerIntelligenceDemo 
              ownerAddress={nftData.owner} 
              tokenId={tokenId} 
            />
          )}
          
          {showIntelligenceDemo && (
            <IntelligentMetadataDemo />
          )}
          
          {showDynamicManager && (
            <DynamicMetadataManager tokenId={tokenId} />
          )}
        </motion.div>
      </div>
    </div>
  );
}
