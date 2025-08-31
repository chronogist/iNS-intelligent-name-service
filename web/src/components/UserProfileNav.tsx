"use client";

import { motion } from 'framer-motion';
import { 
  User, 
  Crown, 
  Wallet, 
  Settings, 
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { blockchainService } from '@/lib/blockchain';

interface UserProfileNavProps {
  isConnected: boolean;
}

export default function UserProfileNav({ isConnected }: UserProfileNavProps) {
  const [userProfile, setUserProfile] = useState<{ name: string; tokenId: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isConnected) {
      loadUserProfile();
    } else {
      setUserProfile(null);
    }
  }, [isConnected]);

  const loadUserProfile = async () => {
    setLoading(true);
    try {
      const profile = await blockchainService.getUserProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.8 }}
      className="flex justify-center mb-8"
    >
      <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 shadow-lg max-w-4xl w-full">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Welcome to iNS! 🎉
          </h3>
          <p className="text-gray-600">
            {userProfile ? `You're logged in as ${userProfile.name}.0g` : 'Your wallet is connected'}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="group"
          >
            {userProfile ? (
              <button
                onClick={() => router.push(`/profile/${userProfile.name}`)}
                className="w-full p-4 bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-xl hover:from-blue-100 hover:to-purple-100 transition-all duration-300 group-hover:shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                    <User className="size-5 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="font-semibold text-gray-900">My Profile</h4>
                    <p className="text-sm text-gray-600">View and manage your profile</p>
                  </div>
                  <ArrowRight className="size-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </button>
            ) : (
              <button
                onClick={() => router.push('/my-profile')}
                className="w-full p-4 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl hover:from-gray-100 hover:to-gray-200 transition-all duration-300 group-hover:shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-gray-400 to-gray-500 p-2 rounded-lg">
                    <User className="size-5 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="font-semibold text-gray-700">My Profile</h4>
                    <p className="text-sm text-gray-500">Register a name to create your profile</p>
                  </div>
                  <ArrowRight className="size-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
              </button>
            )}
          </motion.div>

          {/* NFTs Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="group"
          >
            <button
              onClick={() => router.push('/nfts')}
              className="w-full p-4 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl hover:from-purple-100 hover:to-pink-100 transition-all duration-300 group-hover:shadow-lg"
            >
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-lg">
                  <Crown className="size-5 text-white" />
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-semibold text-gray-900">My NFTs</h4>
                  <p className="text-sm text-gray-600">View all your registered names</p>
                </div>
                <ArrowRight className="size-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
              </div>
            </button>
          </motion.div>

          {/* Admin Panel Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="group"
          >
            <button
              onClick={() => router.push('/admin/fees')}
              className="w-full p-4 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl hover:from-green-100 hover:to-emerald-100 transition-all duration-300 group-hover:shadow-lg"
            >
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-2 rounded-lg">
                  <Wallet className="size-5 text-white" />
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-semibold text-gray-900">Admin Panel</h4>
                  <p className="text-sm text-gray-600">Manage fees and settings</p>
                </div>
                <ArrowRight className="size-4 text-gray-400 group-hover:text-green-600 transition-colors" />
              </div>
            </button>
          </motion.div>

          {/* Intelligence Triggers Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="group"
          >
            <button
              onClick={() => router.push('/intelligence')}
              className="w-full p-4 bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-xl hover:from-orange-100 hover:to-red-100 transition-all duration-300 group-hover:shadow-lg"
            >
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-orange-600 to-red-600 p-2 rounded-lg">
                  <Settings className="size-5 text-white" />
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-semibold text-gray-900">Intelligence</h4>
                  <p className="text-sm text-gray-600">Manage iNFT triggers</p>
                </div>
                <ArrowRight className="size-4 text-gray-400 group-hover:text-orange-600 transition-colors" />
              </div>
            </button>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h4>
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => window.open('https://etherscan.io', '_blank')}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              <ExternalLink className="size-3" />
              View on Explorer
            </button>
            {userProfile && (
              <button
                onClick={() => navigator.clipboard.writeText(userProfile.name)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                <Settings className="size-3" />
                Copy Profile Link
              </button>
            )}
          </div>
        </div>

        {loading && (
          <div className="mt-4 text-center">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Loading profile...</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
