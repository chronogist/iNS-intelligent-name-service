'use client';

import React, { useState, useEffect } from 'react';
import { blockchainService } from '@/lib/blockchain';

interface DynamicMetadataManagerProps {
  tokenId: string;
}

interface MetadataState {
  metadataHash: string;
  encryptedURI: string;
  tokenURI: string;
  owner: string;
}

interface MetadataUpdateEvent {
  tokenId: string;
  newHash: string;
  timestamp: string;
  blockNumber: number;
  transactionHash: string;
}

export default function DynamicMetadataManager({ tokenId }: DynamicMetadataManagerProps) {
  const [metadataState, setMetadataState] = useState<MetadataState | null>(null);
  const [updateEvents, setUpdateEvents] = useState<MetadataUpdateEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [newEncryptedURI, setNewEncryptedURI] = useState('');
  const [newMetadataHash, setNewMetadataHash] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);

  useEffect(() => {
    loadMetadataState();
    loadUpdateEvents();
    checkOwnership();
  }, [tokenId]);

  const loadMetadataState = async () => {
    try {
      setLoading(true);
      const state = await blockchainService.getCurrentMetadataState(tokenId);
      setMetadataState(state);
    } catch (error) {
      console.error('Error loading metadata state:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUpdateEvents = async () => {
    try {
      const events = await blockchainService.getMetadataUpdateEvents(tokenId);
      setUpdateEvents(events);
    } catch (error) {
      console.error('Error loading update events:', error);
    }
  };

  const checkOwnership = async () => {
    try {
      const address = await blockchainService.getConnectedAddress();
      setConnectedAddress(address);
      
      if (metadataState && address) {
        setIsOwner(address.toLowerCase() === metadataState.owner.toLowerCase());
      }
    } catch (error) {
      console.error('Error checking ownership:', error);
    }
  };

  const handleUpdateMetadata = async () => {
    if (!newEncryptedURI || !newMetadataHash) {
      alert('Please provide both encrypted URI and metadata hash');
      return;
    }

    try {
      setLoading(true);
      const txHash = await blockchainService.updateMetadata(tokenId, newEncryptedURI, newMetadataHash);
      alert(`Metadata updated successfully! Transaction: ${txHash}`);
      
      // Reload data
      await loadMetadataState();
      await loadUpdateEvents();
      
      // Clear form
      setNewEncryptedURI('');
      setNewMetadataHash('');
    } catch (error) {
      console.error('Error updating metadata:', error);
      alert('Failed to update metadata. See console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorizeUsage = async () => {
    const executor = prompt('Enter executor address:');
    const permissions = prompt('Enter permissions (JSON string):');
    
    if (!executor || !permissions) return;

    try {
      setLoading(true);
      const txHash = await blockchainService.authorizeUsage(tokenId, executor, permissions);
      alert(`Usage authorized successfully! Transaction: ${txHash}`);
    } catch (error) {
      console.error('Error authorizing usage:', error);
      alert('Failed to authorize usage. See console for details.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !metadataState) {
    return <div className="p-4">Loading metadata state...</div>;
  }

  if (!metadataState) {
    return <div className="p-4 text-red-500">Failed to load metadata state</div>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">ERC7857 Dynamic Metadata Manager</h2>
      
      {/* Current Metadata State */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Current Metadata State</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded">
            <label className="block text-sm font-medium text-gray-700">Metadata Hash</label>
            <p className="text-sm text-gray-900 break-all">{metadataState.metadataHash}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <label className="block text-sm font-medium text-gray-700">Encrypted URI</label>
            <p className="text-sm text-gray-900 break-all">{metadataState.encryptedURI}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <label className="block text-sm font-medium text-gray-700">Token URI</label>
            <p className="text-sm text-gray-900 break-all">{metadataState.tokenURI}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <label className="block text-sm font-medium text-gray-700">Owner</label>
            <p className="text-sm text-gray-900 break-all">{metadataState.owner}</p>
          </div>
        </div>
      </div>

      {/* Ownership Status */}
      <div className="mb-6">
        <div className={`p-4 rounded-lg ${isOwner ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
          <p className={`font-medium ${isOwner ? 'text-green-800' : 'text-yellow-800'}`}>
            {isOwner 
              ? '✅ You own this NFT - You can update metadata' 
              : '⚠️ You do not own this NFT - Cannot update metadata'
            }
          </p>
          {connectedAddress && (
            <p className="text-sm text-gray-600 mt-1">
              Connected: {connectedAddress}
            </p>
          )}
        </div>
      </div>

      {/* Update Metadata Form */}
      {isOwner && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Update Metadata</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Encrypted URI
              </label>
              <input
                type="text"
                value={newEncryptedURI}
                onChange={(e) => setNewEncryptedURI(e.target.value)}
                placeholder="ipfs://Qm..."
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Metadata Hash
              </label>
              <input
                type="text"
                value={newMetadataHash}
                onChange={(e) => setNewMetadataHash(e.target.value)}
                placeholder="0x..."
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleUpdateMetadata}
              disabled={loading || !newEncryptedURI || !newMetadataHash}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Metadata'}
            </button>
          </div>
        </div>
      )}

      {/* Authorize Usage */}
      {isOwner && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Authorize Usage</h3>
          <button
            onClick={handleAuthorizeUsage}
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Authorizing...' : 'Authorize Usage'}
          </button>
        </div>
      )}

      {/* Metadata Update History */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Metadata Update History</h3>
        {updateEvents.length === 0 ? (
          <p className="text-gray-500">No metadata updates found</p>
        ) : (
          <div className="space-y-3">
            {updateEvents.map((event, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Update #{updateEvents.length - index}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(event.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">New Hash:</span> 
                    <span className="text-gray-600 break-all ml-2">{event.newHash}</span>
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Block:</span> 
                    <span className="text-gray-600 ml-2">{event.blockNumber}</span>
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Transaction:</span> 
                    <span className="text-gray-600 break-all ml-2">{event.transactionHash}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

