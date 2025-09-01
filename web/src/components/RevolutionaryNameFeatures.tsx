'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Globe, 
  TrendingUp, 
  Gamepad2, 
  Users, 
  Shield, 
  Zap,
  Star,
  Award,
  Target,
  BarChart3,
  Heart,
  Crown,
  Sparkles
} from 'lucide-react';

interface NameFeature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'inft' | 'blockchain' | 'security' | 'ai' | 'storage' | 'performance';
  priority: 'core' | 'advanced' | 'premium';
  benefit: string;
  zeroGAdvantage: string;
}

const REVOLUTIONARY_FEATURES: NameFeature[] = [
  {
    id: 'encrypted-metadata',
    title: 'Encrypted Metadata Protection',
    description: 'Store sensitive AI agent data securely with built-in encryption',
    icon: <Shield className="w-6 h-6" />,
    category: 'security',
    priority: 'core',
    benefit: 'Traditional NFTs expose all metadata publicly - iNFTs keep AI intelligence private',
    zeroGAdvantage: '0G Storage provides tamper-proof, encrypted storage with 99.999% durability'
  },
  {
    id: 'secure-transfer',
    title: 'Secure Metadata Transfer',
    description: 'Transfer both ownership AND encrypted metadata together',
    icon: <Zap className="w-6 h-6" />,
    category: 'inft',
    priority: 'core',
    benefit: 'ERC-721 only transfers ownership - ERC-7857 transfers complete AI functionality',
    zeroGAdvantage: '0G Chain executes transfers with cryptographic proofs and oracle verification'
  },
  {
    id: 'dynamic-evolution',
    title: 'Dynamic AI Evolution',
    description: 'AI agents that learn and evolve while maintaining NFT ownership',
    icon: <Brain className="w-6 h-6" />,
    category: 'ai',
    priority: 'core',
    benefit: 'Static NFTs become outdated - iNFTs grow more valuable over time',
    zeroGAdvantage: '0G Compute enables secure AI inference without exposing model data'
  },
  {
    id: 'oracle-verification',
    title: 'Oracle-Based Verification',
    description: 'TEE and ZKP proofs ensure transfer integrity and data authenticity',
    icon: <Target className="w-6 h-6" />,
    category: 'security',
    priority: 'advanced',
    benefit: 'No verification in traditional NFTs - iNFTs provide cryptographic guarantees',
    zeroGAdvantage: '0G infrastructure supports both TEE and ZKP oracle implementations'
  },
  {
    id: 'authorized-usage',
    title: 'Authorized Usage Control',
    description: 'Grant AI agent access without transferring ownership',
    icon: <Users className="w-6 h-6" />,
    category: 'inft',
    priority: 'advanced',
    benefit: 'Enable AI-as-a-Service models while maintaining full ownership',
    zeroGAdvantage: '0G Chain smart contracts manage complex permission systems'
  },
  {
    id: 'clone-functionality',
    title: 'Clone & Distribute',
    description: 'Create new tokens with same AI metadata for distribution',
    icon: <Star className="w-6 h-6" />,
    category: 'inft',
    priority: 'advanced',
    benefit: 'Preserve original while enabling AI agent templates and licensing',
    zeroGAdvantage: '0G Storage efficiently manages multiple encrypted copies'
  },
  {
    id: 'real-time-updates',
    title: 'Real-Time Metadata Updates',
    description: 'Update AI agent capabilities without breaking NFT integrity',
    icon: <TrendingUp className="w-6 h-6" />,
    category: 'ai',
    priority: 'premium',
    benefit: 'Traditional NFTs are immutable - iNFTs support secure evolution',
    zeroGAdvantage: '0G Storage provides version control and update verification'
  },
  {
    id: 'cross-chain-compatibility',
    title: 'Cross-Chain Compatibility',
    description: 'Deploy and transfer iNFTs across multiple blockchain networks',
    icon: <Globe className="w-6 h-6" />,
    category: 'blockchain',
    priority: 'premium',
    benefit: 'Break free from single-chain limitations',
    zeroGAdvantage: '0G infrastructure designed for multi-chain AI applications'
  },
  {
    id: 'enterprise-grade',
    title: 'Enterprise-Grade Security',
    description: 'Military-grade encryption and compliance-ready infrastructure',
    icon: <Crown className="w-6 h-6" />,
    category: 'security',
    priority: 'premium',
    benefit: 'Meet enterprise security requirements and regulatory compliance',
    zeroGAdvantage: '0G provides institutional-grade security with audit trails'
  }
];

export default function RevolutionaryNameFeatures() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedFeature, setSelectedFeature] = useState<NameFeature | null>(null);

  const categories = [
    { id: 'all', name: 'All Features', icon: <Sparkles className="w-5 h-5" /> },
    { id: 'inft', name: 'iNFT Core', icon: <Star className="w-5 h-5" /> },
    { id: 'blockchain', name: '0G Blockchain', icon: <Zap className="w-5 h-5" /> },
    { id: 'security', name: 'Security & Privacy', icon: <Shield className="w-5 h-5" /> },
    { id: 'ai', name: 'AI & Intelligence', icon: <Brain className="w-5 h-5" /> },
    { id: 'storage', name: '0G Storage', icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'performance', name: 'Performance', icon: <Award className="w-5 h-5" /> }
  ];

  const priorities = [
    { id: 'all', name: 'All Priorities', color: 'bg-gray-600' },
    { id: 'core', name: 'Core Features', color: 'bg-green-600' },
    { id: 'advanced', name: 'Advanced Features', color: 'bg-blue-600' },
    { id: 'premium', name: 'Premium Features', color: 'bg-purple-600' }
  ];

  const filteredFeatures = REVOLUTIONARY_FEATURES.filter(feature => {
    const categoryMatch = selectedCategory === 'all' || feature.category === selectedCategory;
    const priorityMatch = selectedPriority === 'all' || feature.priority === selectedPriority;
    return categoryMatch && priorityMatch;
  });

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold text-white mb-4">🚀 iNFT Benefits Over Traditional NFTs</h1>
        <p className="text-gray-300 text-lg max-w-3xl mx-auto">
          Discover how Intelligent NFTs (iNFTs) powered by the 0G blockchain revolutionize digital asset ownership, 
          enabling secure AI agent tokenization with encrypted metadata and dynamic evolution capabilities
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gray-800 rounded-lg p-6"
      >
        <div className="flex flex-wrap gap-4">
          {/* Category Filter */}
          <div>
            <label className="block text-gray-300 mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-gray-300 mb-2">Priority</label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
            >
              {priorities.map(priority => (
                <option key={priority.id} value={priority.id}>
                  {priority.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Features Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {filteredFeatures.map((feature, index) => (
          <motion.div
            key={feature.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-all cursor-pointer border border-gray-700 hover:border-blue-500"
            onClick={() => setSelectedFeature(feature)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                    feature.priority === 'core' ? 'bg-green-600 text-white' :
                    feature.priority === 'advanced' ? 'bg-blue-600 text-white' :
                    'bg-purple-600 text-white'
                  }`}>
                    {feature.priority}
                  </span>
                </div>
              </div>
            </div>
            
            <p className="text-gray-300 text-sm mb-4">{feature.description}</p>
            
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Zap className="w-4 h-4" />
              <span>iNFT Benefit</span>
            </div>
                            <p className="text-gray-400 text-xs mt-1">{feature.benefit}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Feature Detail Modal */}
      {selectedFeature && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedFeature(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 rounded-lg">
                  {selectedFeature.icon}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedFeature.title}</h2>
                  <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                    selectedFeature.priority === 'core' ? 'bg-green-600 text-white' :
                    selectedFeature.priority === 'advanced' ? 'bg-blue-600 text-white' :
                    'bg-purple-600 text-white'
                  }`}>
                    {selectedFeature.priority} Feature
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedFeature(null)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                <p className="text-gray-300">{selectedFeature.description}</p>
              </div>

              <div>
                              <h3 className="text-lg font-semibold text-white mb-2">iNFT Benefit</h3>
              <p className="text-gray-300">{selectedFeature.benefit}</p>
              </div>

              <div>
                              <h3 className="text-lg font-semibold text-white mb-2">0G Blockchain Advantage</h3>
              <p className="text-gray-300">{selectedFeature.zeroGAdvantage}</p>
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-2">Example Use Case</h3>
                <div className="text-gray-300 text-sm">
                  {selectedFeature.id === 'encrypted-metadata' && (
                    <p>An AI trading bot's model weights and strategy are encrypted and stored securely, 
                    ensuring proprietary algorithms remain private while maintaining NFT ownership.</p>
                  )}
                  {selectedFeature.id === 'secure-transfer' && (
                    <p>When transferring an AI agent NFT, both the token ownership AND the encrypted 
                    AI intelligence transfer together, ensuring the new owner receives a fully functional agent.</p>
                  )}
                  {selectedFeature.id === 'dynamic-evolution' && (
                    <p>An AI content creator NFT learns from user interactions and evolves its 
                    creative capabilities while maintaining the same NFT token ID and ownership.</p>
                  )}
                  {selectedFeature.id === 'oracle-verification' && (
                    <p>TEE oracles verify that AI metadata matches the original during transfers, 
                    providing cryptographic proof that no tampering occurred.</p>
                  )}
                  {selectedFeature.id === 'authorized-usage' && (
                    <p>A company can license their AI agent NFT to clients for usage without 
                    transferring ownership, enabling AI-as-a-Service business models.</p>
                  )}
                  {selectedFeature.id === 'clone-functionality' && (
                    <p>An AI researcher can clone their trained model NFT to create multiple 
                    instances for distribution while preserving the original.</p>
                  )}
                  {selectedFeature.id === 'real-time-updates' && (
                    <p>An AI assistant NFT receives continuous updates to its knowledge base 
                    and capabilities without breaking the NFT's integrity or ownership.</p>
                  )}
                  {selectedFeature.id === 'cross-chain-compatibility' && (
                    <p>An AI agent NFT can be deployed on Ethereum mainnet and later transferred 
                    to 0G Chain for enhanced performance and lower costs.</p>
                  )}
                  {selectedFeature.id === 'enterprise-grade' && (
                    <p>Financial institutions can tokenize AI trading algorithms with military-grade 
                    encryption, meeting regulatory compliance and audit requirements.</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Competitive Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gray-800 rounded-lg p-6"
      >
        <h2 className="text-2xl font-semibold text-white mb-6">🏆 Competitive Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-3">ENS (Current)</h3>
            <ul className="text-gray-300 space-y-2 text-sm">
              <li>• Static name resolution</li>
              <li>• Basic profile information</li>
              <li>• Simple address mapping</li>
              <li>• No social features</li>
              <li>• No intelligence</li>
              <li>• No real-time data</li>
            </ul>
          </div>
          <div className="bg-blue-600/20 border border-blue-500 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-3">Our iNS (Future)</h3>
            <ul className="text-white space-y-2 text-sm">
              <li>• AI-powered evolution</li>
              <li>• Multi-dimensional resolution</li>
              <li>• Real-time social integration</li>
              <li>• Financial intelligence</li>
              <li>• Gaming & metaverse ready</li>
              <li>• Predictive analytics</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
