"use client";

import { motion } from 'framer-motion';
import { 
  User, 
  Crown, 
  Calendar, 
  ExternalLink, 
  Copy, 
  Eye,
  Globe,
  Heart,
  Share2
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { blockchainService } from '@/lib/blockchain';
import { ethers } from 'ethers';

interface ProfilePageProps {
  params: Promise<{
    name: string;
  }>;
}

interface ProfileData {
  name: string;
  tokenId?: string;
  owner: string;
  registrationDate: string;
  transactionHash: string;
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [name, setName] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params;
      setName(resolvedParams.name);
    };
    loadParams();
  }, [params]);

  useEffect(() => {
    if (name) {
      loadProfileData();
    }
  }, [name]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading profile data for name:', name);
      
      // Initialize blockchain service
      await blockchainService.initialize();
      
      // Check name availability to get owner and token ID
      const availability = await blockchainService.checkNameAvailability(name);
      console.log('📊 Name availability result:', availability);
      
      if (availability.isAvailable) {
        setError('Name not found or not registered');
        return;
      }
      
      // Get token ID from name
      const labelHash = ethers.keccak256(ethers.toUtf8Bytes(name));
      const node = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(['bytes32', 'bytes32'], ['0x0000000000000000000000000000000000000000000000000000000000000000', labelHash]));
      const tokenId = await blockchainService.registrar!.nodeToTokenId(node);
      console.log('🆔 Token ID for name:', name, 'is:', tokenId.toString());
      
      // Try to get registration events to find the registration details
      let registrationEvent = null;
      try {
        const events = await blockchainService.getRegistrationEvents();
        registrationEvent = events.find(event => 
          event.name === name || event.name.includes(name)
        );
      } catch (eventError) {
        console.warn('Could not load registration events:', eventError);
      }
      
      // If we can't find the registration event, create a fallback profile
      if (!registrationEvent) {
        console.log('Registration event not found, creating fallback profile data');
        
        // Get current metadata state for additional info
        let metadataState = null;
        try {
          metadataState = await blockchainService.getCurrentMetadataState(tokenId.toString());
        } catch (metadataError) {
          console.warn('Could not load metadata state:', metadataError);
        }
        
        const profileData: ProfileData = {
          name: name,
          tokenId: tokenId.toString(),
          owner: availability.owner || 'Unknown',
          registrationDate: new Date().toISOString(), // Fallback to current date
          transactionHash: metadataState?.transactionHash || '0x0000000000000000000000000000000000000000000000000000000000000000'
        };
        
        setProfileData(profileData);
        setError(null);
        return;
      }
      
      // Use the found registration event
      const profileData: ProfileData = {
        name: name,
        tokenId: tokenId.toString(),
        owner: availability.owner || registrationEvent.buyer,
        registrationDate: registrationEvent.timestamp,
        transactionHash: registrationEvent.hash
      };
      
      setProfileData(profileData);
      setError(null);
    } catch (err) {
      setError('Failed to load profile data from blockchain');
      console.error('Error loading profile:', err);
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Profile not found'}</p>
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={handleBack}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                ← Back
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{profileData.name}.0g</h1>
                <p className="text-gray-600">Profile Page</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => copyToClipboard(`https://ins.app/${profileData.name}`, 'profile')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Share profile"
              >
                {copiedField === 'profile' ? (
                  <Heart className="size-5 text-red-500" />
                ) : (
                  <Share2 className="size-5 text-gray-600" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Profile Card */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-xl overflow-hidden"
            >
              {/* Profile Header */}
              <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 p-8 text-white">
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
                    <Crown className="size-8" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">{profileData.name}.0g</h1>
                    <p className="text-purple-100">Identity Name Service</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                    <p className="text-purple-100 text-sm">Token ID</p>
                    <p className="text-xl font-bold">#{profileData.tokenId}</p>
                  </div>
                  <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                    <p className="text-purple-100 text-sm">Registration Date</p>
                    <p className="text-xl font-bold">
                      {new Date(profileData.registrationDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Profile Details */}
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Information</h2>
                
                <div className="space-y-6">
                  {/* Owner Information */}
                  <div className="bg-gray-50 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <User className="size-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Owner</h3>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-gray-700">{shortenAddress(profileData.owner)}</span>
                      <button
                        onClick={() => copyToClipboard(profileData.owner, 'owner')}
                        className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        {copiedField === 'owner' ? (
                          <Heart className="size-4 text-red-500" />
                        ) : (
                          <Copy className="size-4 text-gray-600" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Registration Details */}
                  <div className="bg-gray-50 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Calendar className="size-5 text-green-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Registration Details</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Transaction Hash</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-gray-700">
                            {shortenHash(profileData.transactionHash)}
                          </span>
                          <button
                            onClick={() => copyToClipboard(profileData.transactionHash, 'tx')}
                            className="p-1 rounded hover:bg-gray-200 transition-colors"
                          >
                            {copiedField === 'tx' ? (
                              <Heart className="size-3 text-red-500" />
                            ) : (
                              <Copy className="size-3 text-gray-600" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Registration Date</span>
                        <span className="text-gray-700">
                          {new Date(profileData.registrationDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-xl p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => window.open(`/nft/${profileData.tokenId}`, '_blank')}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
                >
                  <Eye className="size-4" />
                  View NFT
                </button>
                <button
                  onClick={() => window.open(`https://etherscan.io/tx/${profileData.transactionHash}`, '_blank')}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-200"
                >
                  <ExternalLink className="size-4" />
                  View on Explorer
                </button>
                <button
                  onClick={() => copyToClipboard(`https://ins.app/${profileData.name}`, 'link')}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-200"
                >
                  <Share2 className="size-4" />
                  {copiedField === 'link' ? 'Link Copied!' : 'Share Profile'}
                </button>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-xl p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Profile Views</span>
                  <span className="font-semibold text-gray-900">1,234</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Followers</span>
                  <span className="font-semibold text-gray-900">56</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Days Since Registration</span>
                  <span className="font-semibold text-gray-900">
                    {Math.floor((Date.now() - new Date(profileData.registrationDate).getTime()) / (1000 * 60 * 60 * 24))}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
