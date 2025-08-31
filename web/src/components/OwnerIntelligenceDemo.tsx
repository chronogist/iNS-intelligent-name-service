'use client';

import React, { useState, useEffect } from 'react';
import { 
  User, 
  TrendingUp, 
  MessageCircle, 
  MapPin,
  Activity,
  Award,
  Users,
  Zap,
  RefreshCw,
  Play,
  Pause,
  Star,
  Heart,
  Share2
} from 'lucide-react';
import { blockchainService } from '@/lib/blockchain';

interface OwnerIntelligenceDemoProps {
  ownerAddress: string;
  tokenId: string;
}

interface OwnerData {
  socialScore: number;
  reputationScore: number;
  transactionCount: number;
  location: string;
  lastActive: string;
  nftInteractionCount: number;
}

interface OwnerActivity {
  type: 'social' | 'transaction' | 'interaction' | 'location' | 'achievement';
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  timestamp: string;
}

export default function OwnerIntelligenceDemo({ ownerAddress, tokenId }: OwnerIntelligenceDemoProps) {
  const [ownerData, setOwnerData] = useState<OwnerData | null>(null);
  const [nftState, setNftState] = useState({
    image: '/api/placeholder/512/512/0b1020/b0ffa3?text=alice.0g',
    description: 'A dynamic NFT that responds to its owner',
    attributes: [
      { trait_type: 'TLD', value: '0g' },
      { trait_type: 'Owner Status', value: 'Active' },
      { trait_type: 'Social Influence', value: 'Growing' }
    ]
  });
  const [activities, setActivities] = useState<OwnerActivity[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadOwnerData();
    loadOwnerActivities();
  }, [ownerAddress]);

  const loadOwnerData = async () => {
    try {
      setLoading(true);
      const data = await blockchainService.getOwnerIntelligenceData(ownerAddress);
      setOwnerData(data);
    } catch (error) {
      console.error('Error loading owner data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOwnerActivities = async () => {
    try {
      const events = await blockchainService.getOwnerBasedUpdateEvents(ownerAddress);
      const activityHistory: OwnerActivity[] = [
        {
          type: 'social',
          description: 'Posted viral content on social media',
          impact: 'positive',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        },
        {
          type: 'achievement',
          description: 'Reached 1000 followers milestone',
          impact: 'positive',
          timestamp: new Date(Date.now() - 7200000).toISOString()
        },
        {
          type: 'transaction',
          description: 'Made 10+ transactions this week',
          impact: 'positive',
          timestamp: new Date(Date.now() - 86400000).toISOString()
        },
        {
          type: 'interaction',
          description: 'Interacted with NFT 5 times today',
          impact: 'positive',
          timestamp: new Date(Date.now() - 1800000).toISOString()
        }
      ];
      setActivities(activityHistory);
    } catch (error) {
      console.error('Error loading owner activities:', error);
    }
  };

  const simulateOwnerActivity = () => {
    const activityTypes: Array<{ type: OwnerActivity['type']; description: string; impact: OwnerActivity['impact'] }> = [
      { type: 'social', description: 'Went viral on Twitter', impact: 'positive' },
      { type: 'social', description: 'Reached 10K followers', impact: 'positive' },
      { type: 'achievement', description: 'Got verified badge', impact: 'positive' },
      { type: 'transaction', description: 'Made large purchase', impact: 'positive' },
      { type: 'interaction', description: 'Updated NFT metadata', impact: 'positive' },
      { type: 'location', description: 'Traveled to new city', impact: 'neutral' },
      { type: 'social', description: 'Received negative feedback', impact: 'negative' }
    ];

    const randomActivity = activityTypes[Math.floor(Math.random() * activityTypes.length)];
    const newActivity: OwnerActivity = {
      ...randomActivity,
      timestamp: new Date().toISOString()
    };

    setActivities(prev => [newActivity, ...prev.slice(0, 9)]);

    // Update NFT state based on activity
    updateNFTBasedOnActivity(newActivity);
  };

  const updateNFTBasedOnActivity = (activity: OwnerActivity) => {
    const newState = { ...nftState };

    switch (activity.type) {
      case 'social':
        if (activity.impact === 'positive') {
          newState.image = '/api/placeholder/512/512/7c3aed/a78bfa?text=alice.0g';
          newState.description = 'Viral moment! The NFT reflects owner\'s social success';
          newState.attributes = [
            { trait_type: 'TLD', value: '0g' },
            { trait_type: 'Owner Status', value: 'Viral' },
            { trait_type: 'Social Influence', value: '🔥 Trending' }
          ];
        } else {
          newState.image = '/api/placeholder/512/512/991b1b/fca5a5?text=alice.0g';
          newState.description = 'The NFT shows support during challenging times';
          newState.attributes = [
            { trait_type: 'TLD', value: '0g' },
            { trait_type: 'Owner Status', value: 'Supportive' },
            { trait_type: 'Social Influence', value: 'Resilient' }
          ];
        }
        break;

      case 'achievement':
        newState.image = '/api/placeholder/512/512/059669/34d399?text=alice.0g';
        newState.description = 'Achievement unlocked! The NFT celebrates owner\'s success';
        newState.attributes = [
          { trait_type: 'TLD', value: '0g' },
          { trait_type: 'Owner Status', value: 'Achiever' },
          { trait_type: 'Social Influence', value: '⭐ Verified' }
        ];
        break;

      case 'transaction':
        newState.image = '/api/placeholder/512/512/78350f/fbbf24?text=alice.0g';
        newState.description = 'Active trader! The NFT reflects owner\'s market activity';
        newState.attributes = [
          { trait_type: 'TLD', value: '0g' },
          { trait_type: 'Owner Status', value: 'Trader' },
          { trait_type: 'Social Influence', value: 'Active' }
        ];
        break;

      case 'interaction':
        newState.image = '/api/placeholder/512/512/1e40af/93c5fd?text=alice.0g';
        newState.description = 'Engaged owner! The NFT responds to frequent interactions';
        newState.attributes = [
          { trait_type: 'TLD', value: '0g' },
          { trait_type: 'Owner Status', value: 'Engaged' },
          { trait_type: 'Social Influence', value: 'Interactive' }
        ];
        break;

      case 'location':
        newState.image = '/api/placeholder/512/512/6b21a8/d8b4fe?text=alice.0g';
        newState.description = 'Traveler! The NFT adapts to owner\'s location changes';
        newState.attributes = [
          { trait_type: 'TLD', value: '0g' },
          { trait_type: 'Owner Status', value: 'Traveler' },
          { trait_type: 'Social Influence', value: 'Global' }
        ];
        break;
    }

    setNftState(newState);
  };

  const trackActivity = async (activityType: OwnerActivity['type']) => {
    try {
      await blockchainService.trackOwnerActivity(ownerAddress, activityType);
      simulateOwnerActivity();
    } catch (error) {
      console.error('Error tracking activity:', error);
    }
  };

  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      simulateOwnerActivity();
    }, 5000); // Every 5 seconds

    return () => clearInterval(interval);
  }, [isSimulating]);

  if (loading) {
    return <div className="p-4">Loading owner intelligence data...</div>;
  }

  if (!ownerData) {
    return <div className="p-4 text-red-500">Failed to load owner data</div>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">👤 Owner-Based Intelligence</h2>
      
      {/* Owner Profile & NFT State */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Owner Intelligence Data */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold">Owner Intelligence Profile</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Social Score</span>
              </div>
              <p className="text-2xl font-bold text-blue-700">{ownerData.socialScore}</p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">Reputation</span>
              </div>
              <p className="text-2xl font-bold text-green-700">{ownerData.reputationScore}/100</p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">Transactions</span>
              </div>
              <p className="text-2xl font-bold text-purple-700">{ownerData.transactionCount}</p>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-900">NFT Interactions</span>
              </div>
              <p className="text-2xl font-bold text-orange-700">{ownerData.nftInteractionCount}</p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">Current Location</span>
            </div>
            <p className="text-lg font-semibold text-gray-700">{ownerData.location}</p>
            <p className="text-sm text-gray-500">
              Last active: {new Date(ownerData.lastActive).toLocaleString()}
            </p>
          </div>
        </div>

        {/* NFT State */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">NFT Response to Owner</h3>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <img 
              src={nftState.image} 
              alt="Owner-responsive NFT"
              className="w-full h-64 object-cover rounded-lg mb-4"
            />
            <p className="text-gray-600 mb-4">{nftState.description}</p>
            
            <div className="space-y-2">
              {nftState.attributes.map((attr, index) => (
                <div key={index} className="flex justify-between bg-white p-2 rounded">
                  <span className="text-sm text-gray-600">{attr.trait_type}</span>
                  <span className="text-sm font-medium text-gray-900">{attr.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Simulation Controls */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Activity Simulation</h3>
          <div className="flex gap-4">
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isSimulating 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isSimulating ? 'Stop Simulation' : 'Start Auto Simulation'}
            </button>
            
            <button
              onClick={() => simulateOwnerActivity()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Zap className="w-4 h-4" />
              Trigger Activity
            </button>
          </div>
        </div>

        {/* Manual Activity Triggers */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <button
            onClick={() => trackActivity('social')}
            className="flex items-center gap-2 p-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Social Activity
          </button>
          
          <button
            onClick={() => trackActivity('transaction')}
            className="flex items-center gap-2 p-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
          >
            <Activity className="w-4 h-4" />
            Transaction
          </button>
          
          <button
            onClick={() => trackActivity('interaction')}
            className="flex items-center gap-2 p-3 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
          >
            <Users className="w-4 h-4" />
            NFT Interaction
          </button>
          
          <button
            onClick={() => trackActivity('location')}
            className="flex items-center gap-2 p-3 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
          >
            <MapPin className="w-4 h-4" />
            Location Change
          </button>
          
          <button
            onClick={() => trackActivity('achievement')}
            className="flex items-center gap-2 p-3 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
          >
            <Award className="w-4 h-4" />
            Achievement
          </button>
        </div>
      </div>

      {/* Activity History */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Recent Owner Activities</h3>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {activities.map((activity, index) => (
            <div 
              key={index} 
              className={`p-4 rounded-lg border-l-4 ${
                activity.impact === 'positive' 
                  ? 'border-green-500 bg-green-50' 
                  : activity.impact === 'negative'
                  ? 'border-red-500 bg-red-50'
                  : 'border-blue-500 bg-blue-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{activity.description}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  activity.impact === 'positive' 
                    ? 'bg-green-100 text-green-800' 
                    : activity.impact === 'negative'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {activity.type}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How Owner Intelligence Works */}
      <div className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-purple-900 mb-3">How Owner-Based Intelligence Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-purple-800">
          <div>
            <h4 className="font-medium mb-2">1. Monitor Owner Activity</h4>
            <p>Oracle tracks owner&apos;s social media, transactions, location, and interactions</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">2. Evaluate Impact</h4>
            <p>Smart contracts analyze activity patterns and determine NFT response</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">3. Dynamic NFT Updates</h4>
            <p>The NFT&apos;s appearance and attributes change based on owner&apos;s behavior</p>
          </div>
        </div>
      </div>
    </div>
  );
}
