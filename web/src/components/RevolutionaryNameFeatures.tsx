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
  category: 'intelligence' | 'social' | 'financial' | 'gaming' | 'business' | 'creative';
  priority: 'core' | 'advanced' | 'premium';
  implementation: string;
  competitiveAdvantage: string;
}

const REVOLUTIONARY_FEATURES: NameFeature[] = [
  {
    id: 'ai-identity',
    title: 'AI-Powered Identity Evolution',
    description: 'Names that learn and evolve based on user behavior, creating personalized digital identities',
    icon: <Brain className="w-6 h-6" />,
    category: 'intelligence',
    priority: 'core',
    implementation: 'Machine learning models analyze user activity, social interactions, and preferences',
    competitiveAdvantage: 'ENS names are static - ours evolve and become more valuable over time'
  },
  {
    id: 'multi-resolution',
    title: 'Multi-Dimensional Resolution',
    description: 'Resolve to different addresses based on context, time, location, or conditions',
    icon: <Globe className="w-6 h-6" />,
    category: 'intelligence',
    priority: 'core',
    implementation: 'Smart contracts with conditional logic and cross-chain integration',
    competitiveAdvantage: 'ENS only resolves to one address - ours are context-aware'
  },
  {
    id: 'social-intelligence',
    title: 'Real-Time Social Integration',
    description: 'Live social media feeds, engagement metrics, and community reputation',
    icon: <Users className="w-6 h-6" />,
    category: 'social',
    priority: 'core',
    implementation: 'API integrations with major social platforms and real-time data processing',
    competitiveAdvantage: 'ENS has no social features - ours are social-first'
  },
  {
    id: 'financial-intelligence',
    title: 'Financial Portfolio Intelligence',
    description: 'Live portfolio tracking, investment preferences, and deal flow management',
    icon: <TrendingUp className="w-6 h-6" />,
    category: 'financial',
    priority: 'advanced',
    implementation: 'DeFi protocol integrations and portfolio analytics engines',
    competitiveAdvantage: 'ENS is just a name - ours is a financial identity hub'
  },
  {
    id: 'gaming-metaverse',
    title: 'Gaming & Metaverse Identity',
    description: 'Cross-platform gaming achievements, metaverse assets, and virtual identity',
    icon: <Gamepad2 className="w-6 h-6" />,
    category: 'gaming',
    priority: 'advanced',
    implementation: 'Gaming API integrations and metaverse platform partnerships',
    competitiveAdvantage: 'ENS doesn\'t integrate with gaming - ours is built for the metaverse'
  },
  {
    id: 'business-intelligence',
    title: 'Live Business Metrics',
    description: 'Real-time company data, hiring status, and market intelligence',
    icon: <BarChart3 className="w-6 h-6" />,
    category: 'business',
    priority: 'advanced',
    implementation: 'Business data APIs and market intelligence platforms',
    competitiveAdvantage: 'ENS is personal - ours serves businesses with live data'
  },
  {
    id: 'predictive-analytics',
    title: 'Predictive Analytics',
    description: 'AI-powered market predictions, personal insights, and trend analysis',
    icon: <Target className="w-6 h-6" />,
    category: 'intelligence',
    priority: 'premium',
    implementation: 'Advanced ML models trained on market and social data',
    competitiveAdvantage: 'ENS is reactive - ours predicts and advises'
  },
  {
    id: 'verification-system',
    title: 'Multi-Level Verification',
    description: 'KYC, social proof, and reputation-based trust scoring',
    icon: <Shield className="w-6 h-6" />,
    category: 'social',
    priority: 'premium',
    implementation: 'Identity verification services and social proof algorithms',
    competitiveAdvantage: 'ENS has no verification - ours builds trust systematically'
  },
  {
    id: 'emotional-evolution',
    title: 'Emotional & Mood Evolution',
    description: 'Names that reflect your current mood, creativity, and emotional state',
    icon: <Heart className="w-6 h-6" />,
    category: 'creative',
    priority: 'premium',
    implementation: 'Mood tracking APIs and emotional intelligence algorithms',
    competitiveAdvantage: 'ENS is cold and technical - ours has emotional intelligence'
  },
  {
    id: 'governance-integration',
    title: 'Governance & DAO Integration',
    description: 'Voting power, governance participation, and community leadership',
    icon: <Crown className="w-6 h-6" />,
    category: 'social',
    priority: 'advanced',
    implementation: 'DAO governance platform integrations and voting analytics',
    competitiveAdvantage: 'ENS governance is basic - ours is comprehensive and engaging'
  }
];

export default function RevolutionaryNameFeatures() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedFeature, setSelectedFeature] = useState<NameFeature | null>(null);

  const categories = [
    { id: 'all', name: 'All Features', icon: <Sparkles className="w-5 h-5" /> },
    { id: 'intelligence', name: 'AI Intelligence', icon: <Brain className="w-5 h-5" /> },
    { id: 'social', name: 'Social & Community', icon: <Users className="w-5 h-5" /> },
    { id: 'financial', name: 'Financial & Investment', icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'gaming', name: 'Gaming & Metaverse', icon: <Gamepad2 className="w-5 h-5" /> },
    { id: 'business', name: 'Business Intelligence', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'creative', name: 'Creative & Emotional', icon: <Heart className="w-5 h-5" /> }
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
        <h1 className="text-4xl font-bold text-white mb-4">🚀 Revolutionary Name Features</h1>
        <p className="text-gray-300 text-lg max-w-3xl mx-auto">
          Discover how our intelligent naming service goes far beyond ENS with AI-powered features, 
          real-time data integration, and dynamic evolution capabilities
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
              <span>Competitive Advantage</span>
            </div>
            <p className="text-gray-400 text-xs mt-1">{feature.competitiveAdvantage}</p>
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
                <h3 className="text-lg font-semibold text-white mb-2">Implementation</h3>
                <p className="text-gray-300">{selectedFeature.implementation}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Competitive Advantage</h3>
                <p className="text-gray-300">{selectedFeature.competitiveAdvantage}</p>
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-2">Example Use Case</h3>
                <div className="text-gray-300 text-sm">
                  {selectedFeature.id === 'ai-identity' && (
                    <p>Alice's name "alice.0g" evolves from "New User" to "Community Leader" 
                    based on her contributions, social interactions, and reputation growth.</p>
                  )}
                  {selectedFeature.id === 'multi-resolution' && (
                    <p>Business name "company.0g" resolves to different addresses during 
                    business hours vs after hours, or based on user location.</p>
                  )}
                  {selectedFeature.id === 'social-intelligence' && (
                    <p>Creator name "artist.0g" shows live social media feeds, current 
                    follower count, and real-time engagement metrics.</p>
                  )}
                  {selectedFeature.id === 'financial-intelligence' && (
                    <p>Investor name "vc.0g" displays live portfolio value, investment 
                    preferences, and current deal flow status.</p>
                  )}
                  {selectedFeature.id === 'gaming-metaverse' && (
                    <p>Gamer name "player.0g" shows achievements across multiple games, 
                    metaverse assets, and virtual identity status.</p>
                  )}
                  {selectedFeature.id === 'business-intelligence' && (
                    <p>Startup name "startup.0g" displays live metrics like user count, 
                    revenue, team size, and hiring status.</p>
                  )}
                  {selectedFeature.id === 'predictive-analytics' && (
                    <p>Analyst name "trader.0g" provides market predictions, portfolio 
                    recommendations, and risk alerts.</p>
                  )}
                  {selectedFeature.id === 'verification-system' && (
                    <p>Verified name "trusted.0g" shows KYC status, social proof, and 
                    community reputation score.</p>
                  )}
                  {selectedFeature.id === 'emotional-evolution' && (
                    <p>Artist name "creative.0g" reflects current mood, creative phase, 
                    and inspiration sources.</p>
                  )}
                  {selectedFeature.id === 'governance-integration' && (
                    <p>Governor name "dao.0g" shows voting power, participation rate, 
                    and governance reputation.</p>
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
