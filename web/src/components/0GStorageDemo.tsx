'use client';

import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  Download, 
  Edit, 
  Save, 
  Image, 
  User, 
  Globe, 
  MessageCircle,
  Github,
  Twitter,
  ExternalLink,
  Shield,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { blockchainService } from '@/lib/blockchain';
import { NameMetadata } from '@/lib/0g-storage-browser';

interface OGStorageDemoProps {
  name: string;
  tokenId: string;
}

export default function OGStorageDemo({ name, tokenId }: OGStorageDemoProps) {
  const [metadata, setMetadata] = useState<NameMetadata | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<NameMetadata>>({
    displayName: '',
    bio: '',
    location: '',
    status: 'Active',
    socialLinks: {
      twitter: '',
      github: '',
      website: '',
      telegram: ''
    }
  });

  useEffect(() => {
    loadMetadata();
  }, [name, tokenId]);

  const loadMetadata = async () => {
    try {
      setLoading(true);
      const data = await blockchainService.getNameMetadata(name, tokenId);
      if (data) {
        setMetadata(data);
        setFormData({
          displayName: data.displayName,
          bio: data.bio,
          location: data.location,
          status: data.status,
          socialLinks: data.socialLinks
        });
      }
    } catch (error) {
      console.error('Error loading metadata:', error);
      setUploadStatus({
        type: 'error',
        message: 'Failed to load metadata'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async () => {
    if (!avatarFile) return;

    try {
      setLoading(true);
      const result = await blockchainService.uploadAvatar(name, avatarFile);
      
      setUploadStatus({
        type: 'success',
        message: `Avatar uploaded! Transaction: ${result.txHash}`
      });

      // Update form data with new avatar URI
      setFormData(prev => ({
        ...prev,
        avatar: result.avatarURI
      }));

      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setUploadStatus({
        type: 'error',
        message: 'Failed to upload avatar'
      });
    } finally {
      setLoading(false);
    }
  };

  const saveMetadata = async () => {
    try {
      setLoading(true);
      
      const updatedMetadata: NameMetadata = {
        displayName: formData.displayName || name,
        bio: formData.bio || '',
        avatar: formData.avatar || metadata?.avatar || '',
        socialLinks: formData.socialLinks || {},
        location: formData.location || '',
        status: formData.status || 'Active',
        lastUpdated: Date.now(),
        version: metadata?.version || '1.0.0'
      };

      const result = await blockchainService.updateNameMetadata(
        name,
        tokenId,
        updatedMetadata
      );

      setMetadata(updatedMetadata);
      setIsEditing(false);
      
      setUploadStatus({
        type: 'success',
        message: `Metadata updated! Transaction: ${result.txHash}`
      });
    } catch (error) {
      console.error('Error saving metadata:', error);
      setUploadStatus({
        type: 'error',
        message: 'Failed to save metadata'
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyIntegrity = async () => {
    if (!metadata?.avatar) return;

    try {
      setLoading(true);
      const rootHash = metadata.avatar.replace('og://storage/', '');
      const isValid = await blockchainService.verifyFileIntegrity(rootHash);
      
      setUploadStatus({
        type: isValid ? 'success' : 'error',
        message: isValid ? 'File integrity verified!' : 'File integrity check failed'
      });
    } catch (error) {
      console.error('Error verifying integrity:', error);
      setUploadStatus({
        type: 'error',
        message: 'Failed to verify file integrity'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !metadata) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-lg">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
          <span className="ml-2">Loading metadata...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">0G Storage Integration Demo</h2>
      
      {/* Status Messages */}
      {uploadStatus && (
        <div className={`mb-6 p-4 rounded-lg ${
          uploadStatus.type === 'success' ? 'bg-green-50 border border-green-200' :
          uploadStatus.type === 'error' ? 'bg-red-50 border border-red-200' :
          'bg-blue-50 border border-blue-200'
        }`}>
          <div className="flex items-center">
            {uploadStatus.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            ) : uploadStatus.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            ) : (
              <Shield className="w-5 h-5 text-blue-600 mr-2" />
            )}
            <span className={`font-medium ${
              uploadStatus.type === 'success' ? 'text-green-800' :
              uploadStatus.type === 'error' ? 'text-red-800' :
              'text-blue-800'
            }`}>
              {uploadStatus.message}
            </span>
          </div>
        </div>
      )}

      {/* Current Metadata Display */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Current Metadata</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              {isEditing ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
              {isEditing ? 'Save' : 'Edit'}
            </button>
            {metadata?.avatar && (
              <button
                onClick={verifyIntegrity}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <Shield className="w-4 h-4" />
                Verify Integrity
              </button>
            )}
          </div>
        </div>

        {metadata ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profile Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {metadata.avatar ? (
                    <img 
                      src={metadata.avatar} 
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-gray-400" />
                  )}
                </div>
                <div>
                  <h4 className="text-lg font-semibold">{metadata.displayName}</h4>
                  <p className="text-gray-600">@{name}.0g</p>
                  <p className="text-sm text-gray-500">
                    Last updated: {new Date(metadata.lastUpdated).toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                {isEditing ? (
                  <textarea
                    value={formData.bio || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                ) : (
                  <p className="text-gray-700">{metadata.bio || 'No bio set'}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.location || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-700">{metadata.location || 'Not set'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  {isEditing ? (
                    <select
                      value={formData.status || 'Active'}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Active">Active</option>
                      <option value="Busy">Busy</option>
                      <option value="Away">Away</option>
                      <option value="Traveling">Traveling</option>
                    </select>
                  ) : (
                    <p className="text-gray-700">{metadata.status || 'Active'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Social Links</h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Twitter</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.socialLinks?.twitter || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        socialLinks: { ...prev.socialLinks, twitter: e.target.value }
                      }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="@username"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Twitter className="w-4 h-4 text-blue-400" />
                      <span className="text-gray-700">
                        {metadata.socialLinks?.twitter || 'Not set'}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GitHub</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.socialLinks?.github || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        socialLinks: { ...prev.socialLinks, github: e.target.value }
                      }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="username"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Github className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-700">
                        {metadata.socialLinks?.github || 'Not set'}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={formData.socialLinks?.website || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        socialLinks: { ...prev.socialLinks, website: e.target.value }
                      }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://example.com"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-green-600" />
                      <span className="text-gray-700">
                        {metadata.socialLinks?.website || 'Not set'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No metadata found. Start by editing your profile.</p>
          </div>
        )}
      </div>

      {/* Avatar Upload */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Avatar Upload</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {avatarFile && (
              <button
                onClick={uploadAvatar}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-400"
              >
                <Upload className="w-4 h-4" />
                Upload to 0G Storage
              </button>
            )}
          </div>
          
          {avatarPreview && (
            <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200">
              <img 
                src={avatarPreview} 
                alt="Avatar preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </div>

      {/* 0G Storage Info */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">0G Storage Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-1">🔐 Encrypted Storage</h4>
            <p>Metadata is encrypted and stored securely on 0G Storage</p>
          </div>
          <div>
            <h4 className="font-medium mb-1">🛡️ Merkle Proofs</h4>
            <p>File integrity verified using cryptographic Merkle proofs</p>
          </div>
          <div>
            <h4 className="font-medium mb-1">⚡ Fast Access</h4>
            <p>Quick metadata retrieval using 0G Key-Value storage</p>
          </div>
        </div>
      </div>
    </div>
  );
}
