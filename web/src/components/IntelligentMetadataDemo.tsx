'use client';

import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Cloud, 
  TrendingUp, 
  MessageCircle, 
  Zap,
  Eye,
  RefreshCw,
  Play,
  Pause
} from 'lucide-react';

interface IntelligenceRule {
  id: string;
  type: 'TIME_BASED' | 'WEATHER_BASED' | 'SOCIAL_BASED' | 'PRICE_BASED' | 'CUSTOM_LOGIC';
  name: string;
  description: string;
  condition: string;
  isActive: boolean;
  lastTriggered?: string;
  nextTrigger?: string;
  icon: React.ReactNode;
  color: string;
}

interface MetadataState {
  currentImage: string;
  currentDescription: string;
  currentAttributes: Array<{ trait_type: string; value: string }>;
  lastUpdated: string;
  updateReason: string;
}

export default function IntelligentMetadataDemo() {
  const [metadataState, setMetadataState] = useState<MetadataState>({
    currentImage: '/api/placeholder/512/512/0b1020/b0ffa3?text=alice.0g',
    currentDescription: 'A dynamic name.0g NFT that changes based on real-world events',
    currentAttributes: [
      { trait_type: 'TLD', value: '0g' },
      { trait_type: 'Status', value: 'Normal' },
      { trait_type: 'Intelligence Level', value: 'Active' }
    ],
    lastUpdated: new Date().toISOString(),
    updateReason: 'Initial state'
  });

  const [rules, setRules] = useState<IntelligenceRule[]>([
    {
      id: '1',
      type: 'TIME_BASED',
      name: 'Daily Mood Cycle',
      description: 'Changes the NFT appearance based on time of day',
      condition: 'Every 6 hours',
      isActive: true,
      icon: <Clock className="w-5 h-5" />,
      color: 'bg-blue-500'
    },
    {
      id: '2',
      type: 'WEATHER_BASED',
      name: 'Weather Response',
      description: 'Adapts to current weather conditions',
      condition: 'When weather changes',
      isActive: true,
      icon: <Cloud className="w-5 h-5" />,
      color: 'bg-cyan-500'
    },
    {
      id: '3',
      type: 'PRICE_BASED',
      name: 'Market Sentiment',
      description: 'Changes based on cryptocurrency market conditions',
      condition: 'ETH price > $3000',
      isActive: false,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'bg-green-500'
    },
    {
      id: '4',
      type: 'SOCIAL_BASED',
      name: 'Social Buzz',
      description: 'Responds to social media activity around the name',
      condition: 'High social activity',
      isActive: true,
      icon: <MessageCircle className="w-5 h-5" />,
      color: 'bg-purple-500'
    }
  ]);

  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(3000); // 3 seconds

  // Simulate intelligent metadata changes
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      simulateIntelligenceUpdate();
    }, simulationSpeed);

    return () => clearInterval(interval);
  }, [isSimulating, simulationSpeed]);

  const simulateIntelligenceUpdate = () => {
    const activeRules = rules.filter(rule => rule.isActive);
    if (activeRules.length === 0) return;

    // Randomly select an active rule to trigger
    const randomRule = activeRules[Math.floor(Math.random() * activeRules.length)];
    
    // Update metadata based on the rule type
    const newState = { ...metadataState };
    
    switch (randomRule.type) {
      case 'TIME_BASED':
        const hour = new Date().getHours();
        if (hour < 6) {
          newState.currentImage = '/api/placeholder/512/512/1a1a2e/ff6b6b?text=alice.0g';
          newState.currentDescription = 'Night mode: The NFT sleeps peacefully';
          newState.currentAttributes = [
            { trait_type: 'TLD', value: '0g' },
            { trait_type: 'Status', value: 'Sleeping' },
            { trait_type: 'Time', value: 'Night' }
          ];
        } else if (hour < 12) {
          newState.currentImage = '/api/placeholder/512/512/2d5a27/4ade80?text=alice.0g';
          newState.currentDescription = 'Morning mode: Fresh and energetic';
          newState.currentAttributes = [
            { trait_type: 'TLD', value: '0g' },
            { trait_type: 'Status', value: 'Energetic' },
            { trait_type: 'Time', value: 'Morning' }
          ];
        } else if (hour < 18) {
          newState.currentImage = '/api/placeholder/512/512/78350f/fbbf24?text=alice.0g';
          newState.currentDescription = 'Afternoon mode: Productive and focused';
          newState.currentAttributes = [
            { trait_type: 'TLD', value: '0g' },
            { trait_type: 'Status', value: 'Productive' },
            { trait_type: 'Time', value: 'Afternoon' }
          ];
        } else {
          newState.currentImage = '/api/placeholder/512/512/7c2d12/f59e0b?text=alice.0g';
          newState.currentDescription = 'Evening mode: Relaxed and reflective';
          newState.currentAttributes = [
            { trait_type: 'TLD', value: '0g' },
            { trait_type: 'Status', value: 'Relaxed' },
            { trait_type: 'Time', value: 'Evening' }
          ];
        }
        break;

      case 'WEATHER_BASED':
        const weatherTypes = [
          { image: '/api/placeholder/512/512/1e3a8a/60a5fa?text=alice.0g', desc: 'Rainy day: The NFT wears a digital raincoat', status: 'Rainy' },
          { image: '/api/placeholder/512/512/fbbf24/fef3c7?text=alice.0g', desc: 'Sunny day: Bright and cheerful appearance', status: 'Sunny' },
          { image: '/api/placeholder/512/512/6b7280/e5e7eb?text=alice.0g', desc: 'Cloudy day: Muted and contemplative', status: 'Cloudy' },
          { image: '/api/placeholder/512/512/1f2937/9ca3af?text=alice.0g', desc: 'Stormy weather: Dark and dramatic', status: 'Stormy' }
        ];
        const weather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
        newState.currentImage = weather.image;
        newState.currentDescription = weather.desc;
        newState.currentAttributes = [
          { trait_type: 'TLD', value: '0g' },
          { trait_type: 'Status', value: weather.status },
          { trait_type: 'Weather', value: 'Responsive' }
        ];
        break;

      case 'SOCIAL_BASED':
        newState.currentImage = '/api/placeholder/512/512/7c3aed/a78bfa?text=alice.0g';
        newState.currentDescription = 'Viral moment: The NFT is trending on social media!';
        newState.currentAttributes = [
          { trait_type: 'TLD', value: '0g' },
          { trait_type: 'Status', value: 'Viral' },
          { trait_type: 'Social Score', value: '🔥 Hot' }
        ];
        break;

      case 'PRICE_BASED':
        newState.currentImage = '/api/placeholder/512/512/059669/34d399?text=alice.0g';
        newState.currentDescription = 'Bull market: The NFT reflects market optimism';
        newState.currentAttributes = [
          { trait_type: 'TLD', value: '0g' },
          { trait_type: 'Status', value: 'Bullish' },
          { trait_type: 'Market Sentiment', value: 'Positive' }
        ];
        break;
    }

    newState.lastUpdated = new Date().toISOString();
    newState.updateReason = `Triggered by: ${randomRule.name}`;
    
    setMetadataState(newState);

    // Update the rule's last triggered time
    setRules(prevRules => 
      prevRules.map(rule => 
        rule.id === randomRule.id 
          ? { ...rule, lastTriggered: new Date().toISOString() }
          : rule
      )
    );
  };

  const toggleRule = (ruleId: string) => {
    setRules(prevRules =>
      prevRules.map(rule =>
        rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
      )
    );
  };

  const toggleSimulation = () => {
    setIsSimulating(!isSimulating);
  };

  const triggerManualUpdate = () => {
    simulateIntelligenceUpdate();
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">🧠 Intelligent NFT Demo</h2>
      
      {/* Current NFT State */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Current NFT State</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <img 
              src={metadataState.currentImage} 
              alt="Dynamic NFT"
              className="w-full h-64 object-cover rounded-lg mb-4"
            />
            <p className="text-sm text-gray-600 mb-2">
              Last updated: {new Date(metadataState.lastUpdated).toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">
              Reason: {metadataState.updateReason}
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Description</h4>
              <p className="text-gray-600">{metadataState.currentDescription}</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Attributes</h4>
              <div className="grid grid-cols-1 gap-2">
                {metadataState.currentAttributes.map((attr, index) => (
                  <div key={index} className="flex justify-between bg-gray-100 p-2 rounded">
                    <span className="text-sm text-gray-600">{attr.trait_type}</span>
                    <span className="text-sm font-medium text-gray-900">{attr.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Intelligence Rules */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Intelligence Rules</h3>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSimulation}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isSimulating 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isSimulating ? 'Stop Simulation' : 'Start Simulation'}
            </button>
            
            <button
              onClick={triggerManualUpdate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Zap className="w-4 h-4" />
              Trigger Update
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.map((rule) => (
            <div 
              key={rule.id} 
              className={`p-4 rounded-lg border-2 transition-all ${
                rule.isActive 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${rule.color} text-white`}>
                    {rule.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{rule.name}</h4>
                    <p className="text-sm text-gray-600">{rule.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleRule(rule.id)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    rule.isActive
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                  }`}
                >
                  {rule.isActive ? 'Active' : 'Inactive'}
                </button>
              </div>
              
              <div className="text-sm text-gray-600">
                <p><strong>Condition:</strong> {rule.condition}</p>
                {rule.lastTriggered && (
                  <p><strong>Last triggered:</strong> {new Date(rule.lastTriggered).toLocaleString()}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">How ERC7857 Intelligence Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-2">1. Oracle Integration</h4>
            <p>External data feeds (weather, social media, prices) are monitored by decentralized oracles</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">2. Rule Evaluation</h4>
            <p>Smart contracts evaluate conditions and trigger metadata updates when criteria are met</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">3. Dynamic Updates</h4>
            <p>The NFT&apos;s appearance, attributes, and metadata change automatically based on real-world events</p>
          </div>
        </div>
      </div>
    </div>
  );
}
