'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ethers } from 'ethers';

interface IntelligenceRule {
  ruleType: number;
  tokenId: string;
  triggerCondition: string;
  newMetadataURI: string;
  newMetadataHash: string;
  isActive: boolean;
  lastTriggered: string;
  cooldownPeriod: string;
}

interface ExternalDataFeed {
  name: string;
  value: number;
  description: string;
}

const INTELLIGENCE_TYPES = [
  { id: 0, name: 'TIME_BASED', description: 'Changes based on time (daily, weekly, etc.)' },
  { id: 1, name: 'WEATHER_BASED', description: 'Changes based on weather data' },
  { id: 2, name: 'SOCIAL_BASED', description: 'Changes based on social media activity' },
  { id: 3, name: 'PRICE_BASED', description: 'Changes based on cryptocurrency prices' },
  { id: 4, name: 'CUSTOM_LOGIC', description: 'Custom business logic' }
];

export default function IntelligenceTriggers() {
  const [rules, setRules] = useState<IntelligenceRule[]>([]);
  const [dataFeeds, setDataFeeds] = useState<ExternalDataFeed[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTokenId, setSelectedTokenId] = useState('1');
  const [newRule, setNewRule] = useState({
    tokenId: '1',
    ruleType: 0,
    triggerCondition: '',
    newMetadataURI: '',
    cooldownPeriod: '3600'
  });

  const defaultDataFeeds: ExternalDataFeed[] = [
    { name: 'weather_condition', value: 1, description: 'Weather condition (1=rainy, 0=sunny)' },
    { name: 'social_activity', value: 1500, description: 'Social media activity level' },
    { name: 'eth_price', value: 3500, description: 'ETH price in USD' }
  ];

  useEffect(() => {
    setDataFeeds(defaultDataFeeds);
    loadRules();
  }, []);

  const loadRules = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would call the IntelligentOracle contract
      // For now, we'll show example data
      const exampleRules: IntelligenceRule[] = [
        {
          ruleType: 0,
          tokenId: '1',
          triggerCondition: 'daily',
          newMetadataURI: 'og://storage/daily_metadata_1',
          newMetadataHash: '0x1234...',
          isActive: true,
          lastTriggered: new Date().toISOString(),
          cooldownPeriod: '86400'
        },
        {
          ruleType: 1,
          tokenId: '1',
          triggerCondition: 'rainy',
          newMetadataURI: 'og://storage/rainy_metadata_1',
          newMetadataHash: '0x5678...',
          isActive: true,
          lastTriggered: new Date().toISOString(),
          cooldownPeriod: '3600'
        }
      ];
      setRules(exampleRules);
    } catch (error) {
      console.error('Error loading rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const addRule = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would call the IntelligentOracle contract
      const newRuleData: IntelligenceRule = {
        ruleType: newRule.ruleType,
        tokenId: newRule.tokenId,
        triggerCondition: newRule.triggerCondition,
        newMetadataURI: newRule.newMetadataURI,
        newMetadataHash: ethers.keccak256(ethers.toUtf8Bytes(newRule.newMetadataURI)),
        isActive: true,
        lastTriggered: new Date().toISOString(),
        cooldownPeriod: newRule.cooldownPeriod
      };
      
      setRules([...rules, newRuleData]);
      setNewRule({
        tokenId: '1',
        ruleType: 0,
        triggerCondition: '',
        newMetadataURI: '',
        cooldownPeriod: '3600'
      });
    } catch (error) {
      console.error('Error adding rule:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateDataFeed = (name: string, value: number) => {
    setDataFeeds(prev => prev.map(feed => 
      feed.name === name ? { ...feed, value } : feed
    ));
  };

  const executeIntelligence = async (tokenId: string) => {
    setLoading(true);
    try {
      // In a real implementation, this would call the IntelligentOracle contract
      console.log(`Executing intelligence for token ${tokenId}`);
      // Simulate execution
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error executing intelligence:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold text-white mb-4">🧠 Intelligence Triggers</h1>
        <p className="text-gray-300 text-lg">
          Manage how your iNFTs respond to real-world events and conditions
        </p>
      </motion.div>

      {/* Data Feeds Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gray-800 rounded-lg p-6"
      >
        <h2 className="text-2xl font-semibold text-white mb-4">📊 External Data Feeds</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {dataFeeds.map((feed) => (
            <div key={feed.name} className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-2">{feed.name}</h3>
              <p className="text-gray-300 text-sm mb-3">{feed.description}</p>
              <input
                type="number"
                value={feed.value}
                onChange={(e) => updateDataFeed(feed.name, parseInt(e.target.value))}
                className="w-full bg-gray-600 text-white px-3 py-2 rounded border border-gray-500"
              />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Add New Rule Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-800 rounded-lg p-6"
      >
        <h2 className="text-2xl font-semibold text-white mb-4">➕ Add Intelligence Rule</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-300 mb-2">Token ID</label>
            <input
              type="number"
              value={newRule.tokenId}
              onChange={(e) => setNewRule({...newRule, tokenId: e.target.value})}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-500"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-2">Intelligence Type</label>
            <select
              value={newRule.ruleType}
              onChange={(e) => setNewRule({...newRule, ruleType: parseInt(e.target.value)})}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-500"
            >
              {INTELLIGENCE_TYPES.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-300 mb-2">Trigger Condition</label>
            <input
              type="text"
              value={newRule.triggerCondition}
              onChange={(e) => setNewRule({...newRule, triggerCondition: e.target.value})}
              placeholder="e.g., daily, rainy, viral"
              className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-500"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-2">New Metadata URI</label>
            <input
              type="text"
              value={newRule.newMetadataURI}
              onChange={(e) => setNewRule({...newRule, newMetadataURI: e.target.value})}
              placeholder="og://storage/new_metadata"
              className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-500"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-2">Cooldown Period (seconds)</label>
            <input
              type="number"
              value={newRule.cooldownPeriod}
              onChange={(e) => setNewRule({...newRule, cooldownPeriod: e.target.value})}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={addRule}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Rule'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Current Rules Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gray-800 rounded-lg p-6"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-white">📋 Current Intelligence Rules</h2>
          <button
            onClick={() => executeIntelligence(selectedTokenId)}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium disabled:opacity-50"
          >
            {loading ? 'Executing...' : 'Execute Intelligence'}
          </button>
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            <p className="text-gray-300 mt-2">Loading rules...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rules.map((rule, index) => (
              <div key={index} className="bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-white">
                      {INTELLIGENCE_TYPES[rule.ruleType]?.name} Rule
                    </h3>
                    <p className="text-gray-300 text-sm">
                      Token ID: {rule.tokenId} | Condition: {rule.triggerCondition}
                    </p>
                    <p className="text-gray-400 text-sm">
                      URI: {rule.newMetadataURI}
                    </p>
                    <p className="text-gray-400 text-sm">
                      Last Triggered: {new Date(rule.lastTriggered).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      rule.isActive ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Intelligence Types Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gray-800 rounded-lg p-6"
      >
        <h2 className="text-2xl font-semibold text-white mb-4">🔧 Intelligence Types</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {INTELLIGENCE_TYPES.map((type) => (
            <div key={type.id} className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-2">{type.name}</h3>
              <p className="text-gray-300 text-sm">{type.description}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
