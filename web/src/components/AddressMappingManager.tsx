"use client";

import { useState, useEffect } from 'react';
import { blockchainService } from '@/lib/blockchain';
import { NFTMetadata } from '@/lib/address-mapping';
import { Search, RefreshCw, Download, Upload, BarChart3, Users, Hash } from 'lucide-react';

export default function AddressMappingManager() {
  const [stats, setStats] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<NFTMetadata[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [allAddresses, setAllAddresses] = useState<string[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [addressNFTs, setAddressNFTs] = useState<NFTMetadata[]>([]);

  useEffect(() => {
    loadStats();
    loadAllAddresses();
  }, []);

  const loadStats = async () => {
    try {
      const mappingStats = await blockchainService.getMappingStats();
      setStats(mappingStats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadAllAddresses = async () => {
    try {
      const addresses = await blockchainService.getAllAddressesWithNFTs();
      setAllAddresses(addresses);
    } catch (error) {
      console.error('Failed to load addresses:', error);
    }
  };

  const updateMapping = async () => {
    setLoading(true);
    try {
      await blockchainService.updateAddressMapping();
      await loadStats();
      await loadAllAddresses();
    } catch (error) {
      console.error('Failed to update mapping:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchNFTs = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await blockchainService.searchNFTsByName(searchTerm);
      setSearchResults(results);
    } catch (error) {
      console.error('Failed to search NFTs:', error);
    }
  };

  const loadAddressNFTs = async (address: string) => {
    setSelectedAddress(address);
    try {
      const nfts = await blockchainService.getNFTsForAddressWithMetadata(address);
      setAddressNFTs(nfts);
    } catch (error) {
      console.error('Failed to load address NFTs:', error);
    }
  };

  const exportMapping = () => {
    const data = blockchainService.getMappingStats();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'address-mapping.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString();
  };

  const formatCacheAge = (age: number) => {
    const minutes = Math.floor(age / 60000);
    const seconds = Math.floor((age % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Address Mapping Manager</h2>
      
      {/* Stats Section */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-blue-600">Total Addresses</span>
            </div>
            <p className="text-2xl font-bold text-blue-800">{stats.totalAddresses}</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Hash className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-600">Total NFTs</span>
            </div>
            <p className="text-2xl font-bold text-green-800">{stats.totalNFTs}</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <span className="text-sm text-purple-600">Last Update</span>
            </div>
            <p className="text-sm font-medium text-purple-800">{formatDate(stats.lastUpdate)}</p>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-orange-600" />
              <span className="text-sm text-orange-600">Cache Age</span>
            </div>
            <p className="text-sm font-medium text-orange-800">{formatCacheAge(stats.cacheAge)}</p>
          </div>
        </div>
      )}

      {/* Actions Section */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={updateMapping}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Updating...' : 'Update Mapping'}
        </button>
        
        <button
          onClick={exportMapping}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export Mapping
        </button>
        
        <button
          onClick={() => blockchainService.clearAddressMappingCache()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
        >
          Clear Cache
        </button>
      </div>

      {/* Search Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Search NFTs by Name</h3>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Enter name (e.g., 'kinga')"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={searchNFTs}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
        </div>
        
        {searchResults.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Search Results ({searchResults.length})</h4>
            <div className="grid gap-2">
              {searchResults.map((nft) => (
                <div key={nft.tokenId} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{nft.name}.0g</span>
                    <span className="text-sm text-gray-600">Token ID: {nft.tokenId}</span>
                  </div>
                  <div className="text-sm text-gray-600">Owner: {shortenAddress(nft.owner)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Addresses Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Address List */}
        <div>
          <h3 className="text-lg font-semibold mb-3">All Addresses with NFTs ({allAddresses.length})</h3>
          <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
            {allAddresses.map((address) => (
              <button
                key={address}
                onClick={() => loadAddressNFTs(address)}
                className={`w-full p-3 text-left border-b border-gray-100 hover:bg-gray-50 ${
                  selectedAddress === address ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="font-mono text-sm">{shortenAddress(address)}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Address NFTs */}
        <div>
          <h3 className="text-lg font-semibold mb-3">
            {selectedAddress ? `NFTs for ${shortenAddress(selectedAddress)}` : 'Select an address'}
          </h3>
          
          {selectedAddress && addressNFTs.length > 0 && (
            <div className="space-y-3">
              {addressNFTs.map((nft) => (
                <div key={nft.tokenId} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{nft.name}.0g</h4>
                    <span className="text-sm bg-gray-100 px-2 py-1 rounded">#{nft.tokenId}</span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Registration: {formatDate(new Date(nft.registrationDate))}</div>
                    <div>Price: {Number(nft.price) / 1e18} ETH</div>
                    {nft.metadataHash && (
                      <div className="font-mono text-xs">Metadata: {nft.metadataHash.slice(0, 10)}...</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {selectedAddress && addressNFTs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No NFTs found for this address
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
