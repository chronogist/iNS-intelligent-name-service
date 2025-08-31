"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  Copy, 
  ExternalLink, 
  User, 
  Eye, 
  LinkIcon,
  Crown,
  Calendar,
  Hash
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  transactionHash: string;
  tokenId?: string;
  ownerAddress: string;
  price: string;
  metadataHash?: string;
  encryptedURI?: string;
  onProfileUpdate?: () => void;
}

export default function SuccessModal({
  isOpen,
  onClose,
  name,
  transactionHash,
  tokenId,
  ownerAddress,
  price,
  metadataHash,
  encryptedURI,
  onProfileUpdate
}: SuccessModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const router = useRouter();

  // Trigger profile update when modal opens (after successful registration)
  useEffect(() => {
    if (isOpen && onProfileUpdate) {
      // Small delay to ensure the blockchain state has updated
      setTimeout(() => {
        onProfileUpdate();
      }, 1000);
    }
  }, [isOpen, onProfileUpdate]);

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

  const handleViewProfile = () => {
    router.push(`/profile/${name}`);
    onClose();
  };

  const handleViewNFT = () => {
    if (tokenId) {
      router.push(`/nft/${tokenId}`);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 rounded-t-3xl text-white text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle className="size-8" />
              </motion.div>
              <h2 className="text-2xl font-bold mb-2">Registration Successful! 🎉</h2>
              <p className="text-green-100">
                {name}.0g is now yours forever
              </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Name Display */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
                  <Crown className="size-12 text-blue-600 mx-auto mb-3" />
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">{name}.0g</h3>
                  <p className="text-gray-600">Your new identity is ready!</p>
                </div>
              </motion.div>

              {/* Transaction Details */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-semibold text-gray-900">Transaction Details</h3>
                
                <div className="grid gap-3">
                  {/* Token ID */}
                  {tokenId && (
                    <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center gap-2">
                        <Hash className="size-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Token ID</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-gray-900">#{tokenId}</span>
                        <button
                          onClick={() => copyToClipboard(tokenId, 'tokenId')}
                          className="p-1 rounded hover:bg-gray-200 transition-colors"
                        >
                          {copiedField === 'tokenId' ? (
                            <CheckCircle className="size-3 text-green-500" />
                          ) : (
                            <Copy className="size-3 text-gray-500" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Owner */}
                  <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <User className="size-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Owner</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-gray-900">{shortenAddress(ownerAddress)}</span>
                      <button
                        onClick={() => copyToClipboard(ownerAddress, 'owner')}
                        className="p-1 rounded hover:bg-gray-200 transition-colors"
                      >
                        {copiedField === 'owner' ? (
                          <CheckCircle className="size-3 text-green-500" />
                        ) : (
                          <Copy className="size-3 text-gray-500" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <Crown className="size-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Price Paid</span>
                    </div>
                    <span className="font-semibold text-gray-900">{price} OG</span>
                  </div>

                  {/* Transaction Hash */}
                  <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <ExternalLink className="size-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Transaction</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-gray-900">{shortenHash(transactionHash)}</span>
                      <button
                        onClick={() => copyToClipboard(transactionHash, 'tx')}
                        className="p-1 rounded hover:bg-gray-200 transition-colors"
                      >
                        {copiedField === 'tx' ? (
                          <CheckCircle className="size-3 text-green-500" />
                        ) : (
                          <Copy className="size-3 text-gray-500" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Registration Date */}
                  <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Registered</span>
                    </div>
                    <span className="text-sm text-gray-900">{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </motion.div>

              {/* 0G Storage Info */}
              {metadataHash && encryptedURI && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="bg-blue-50 border border-blue-200 rounded-xl p-4"
                >
                  <h4 className="text-sm font-semibold text-blue-900 mb-3">0G Storage Integration</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-blue-700">Metadata Hash:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-blue-900">{shortenHash(metadataHash)}</span>
                        <button
                          onClick={() => copyToClipboard(metadataHash, 'hash')}
                          className="p-1 rounded hover:bg-blue-200 transition-colors"
                        >
                          {copiedField === 'hash' ? (
                            <CheckCircle className="size-3 text-green-500" />
                          ) : (
                            <Copy className="size-3 text-blue-500" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-blue-700">Encrypted URI:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-blue-900">{shortenHash(encryptedURI)}</span>
                        <button
                          onClick={() => copyToClipboard(encryptedURI, 'uri')}
                          className="p-1 rounded hover:bg-blue-200 transition-colors"
                        >
                          {copiedField === 'uri' ? (
                            <CheckCircle className="size-3 text-green-500" />
                          ) : (
                            <Copy className="size-3 text-blue-500" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-blue-600">
                    ✅ Metadata automatically uploaded to 0G Storage
                  </div>
                </motion.div>
              )}

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-3"
              >
                {/* View Profile Button */}
                <button
                  onClick={handleViewProfile}
                  className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <User className="size-5" />
                  View My Profile
                </button>

                {/* View NFT Button */}
                {tokenId && (
                  <button
                    onClick={handleViewNFT}
                    className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <Eye className="size-5" />
                    View NFT Details
                  </button>
                )}

                {/* Share Profile Link */}
                <button
                  onClick={() => copyToClipboard(`https://ins.app/${name}`, 'profile')}
                  className="w-full flex items-center justify-center gap-3 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 border border-gray-200"
                >
                  <LinkIcon className="size-5" />
                  {copiedField === 'profile' ? 'Profile Link Copied!' : 'Copy Profile Link'}
                  {copiedField === 'profile' && <CheckCircle className="size-4 text-green-500" />}
                </button>
              </motion.div>

              {/* Celebration confetti effect */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none"
              >
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ 
                      opacity: 0, 
                      y: -20, 
                      x: Math.random() * 100 - 50 
                    }}
                    animate={{ 
                      opacity: [0, 1, 0], 
                      y: [-20, -100], 
                      x: Math.random() * 200 - 100 
                    }}
                    transition={{
                      delay: 0.8 + i * 0.1,
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3
                    }}
                    className="absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: '50%'
                    }}
                  />
                ))}
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
