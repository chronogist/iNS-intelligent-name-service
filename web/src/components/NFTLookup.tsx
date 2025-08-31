"use client";

import { useState } from 'react';
import { blockchainService } from '@/lib/blockchain';
import { Search, User, Hash, Calendar, Coins } from 'lucide-react';

interface NFT {
  name: string;
  tokenId: string;
  registrationDate: string;
  price: bigint;
}

export default function NFTLookup() {
  const [address, setAddress] = useState<string>('');
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const lookupNFTs = async () => {
    if (!address.trim()) {
      setError('Please enter an address');
      return;
    }

    setLoading(true);
    setError(null);
    setNfts([]);

    try {
      // Initialize blockchain service if needed
      await blockchainService.initialize();
      
      // Get NFTs for the address
      const foundNFTs = await blockchainService.getNFTsForAddress(address.trim());
      setNfts(foundNFTs);
      
      if (foundNFTs.length === 0) {
        setError('No NFTs found for this address');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to lookup NFTs');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: bigint) => {
    return (Number(price) / 1e18).toFixed(4);
  };

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-4">NFT Lookup Tool</h2>
      
      <div className="mb-6">
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Enter wallet address (0x...)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={lookupNFTs}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            {loading ? 'Searching...' : 'Lookup NFTs'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {nfts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Found {nfts.length} NFT{nfts.length !== 1 ? 's' : ''} for {shortenAddress(address)}
            </h3>
            <div className="text-sm text-gray-600">
              Total Value: {formatPrice(nfts.reduce((total, nft) => total + nft.price, 0n))} ETH
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {nfts.map((nft, index) => (
              <div key={nft.tokenId} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">#{nft.tokenId}</span>
                </div>

                <h4 className="text-lg font-bold text-gray-900 mb-2">
                  {nft.name}.0g
                </h4>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    <span>Token ID: {nft.tokenId}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Registered: {formatDate(nft.registrationDate)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4" />
                    <span>Price: {formatPrice(nft.price)} ETH</span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => window.open(`/profile/${nft.name}`, '_blank')}
                    className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    View Profile
                  </button>
                  <button
                    onClick={() => window.open(`/nft/${nft.tokenId}`, '_blank')}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded text-sm hover:bg-gray-200 transition-colors"
                  >
                    NFT Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Searching for NFTs...</p>
        </div>
      )}
    </div>
  );
}
