'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Save, 
  Eye, 
  Download, 
  Upload,
  Palette,
  User,
  Gamepad2,
  TrendingUp,
  Users,
  Globe,
  Clock
} from 'lucide-react';

interface DynamicMetadata {
  name: string;
  description: string;
  image: string;
  animation_url?: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
  external_url?: string;
  [key: string]: any; // Allow custom properties
}

const METADATA_TEMPLATES = {
  art: {
    name: "Dynamic Art NFT",
    description: "Changes based on conditions",
    image: "og://storage/dynamic_art.png",
    attributes: [
      { trait_type: "Weather", value: "Sunny" },
      { trait_type: "Time", value: "Day" },
      { trait_type: "Mood", value: "Happy" }
    ]
  },
  profile: {
    name: "alice.0g",
    description: "Dynamic profile",
    image: "og://storage/avatar.png",
    attributes: [
      { trait_type: "Status", value: "Online" },
      { trait_type: "Location", value: "New York" },
      { trait_type: "Reputation", value: "95" }
    ],
    external_url: "https://alice.0g",
    social_links: {
      twitter: "https://twitter.com/alice",
      github: "https://github.com/alice"
    }
  },
  game: {
    name: "Game Character",
    description: "Dynamic gaming character",
    image: "og://storage/character.png",
    attributes: [
      { trait_type: "Level", value: "1" },
      { trait_type: "Experience", value: "0" },
      { trait_type: "Health", value: "100" }
    ],
    game_data: {
      position: { x: 0, y: 0 },
      inventory: [],
      quests_completed: 0
    }
  },
  financial: {
    name: "Investment Portfolio",
    description: "Dynamic investment tracking",
    image: "og://storage/portfolio.png",
    attributes: [
      { trait_type: "Total Value", value: "$0" },
      { trait_type: "Daily Change", value: "0%" },
      { trait_type: "Risk Level", value: "Low" }
    ],
    portfolio_data: {
      holdings: {},
      performance_history: []
    }
  },
  social: {
    name: "Community Badge",
    description: "Dynamic community participation",
    image: "og://storage/badge.png",
    attributes: [
      { trait_type: "Member Since", value: new Date().toISOString().split('T')[0] },
      { trait_type: "Posts", value: "0" },
      { trait_type: "Reputation", value: "New" }
    ],
    community_data: {
      communities: [],
      contributions: [],
      rewards_earned: 0
    }
  },
  realtime: {
    name: "Live Data NFT",
    description: "Real-time data visualization",
    image: "og://storage/data.png",
    attributes: [
      { trait_type: "Temperature", value: "72°F" },
      { trait_type: "Humidity", value: "65%" },
      { trait_type: "Air Quality", value: "Good" }
    ],
    sensor_data: {
      last_updated: new Date().toISOString(),
      location: { lat: 0, lng: 0 },
      forecast: []
    }
  }
};

export default function DynamicMetadataCreator() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('art');
  const [metadata, setMetadata] = useState<DynamicMetadata>(METADATA_TEMPLATES.art);
  const [isEditing, setIsEditing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const handleTemplateChange = (template: string) => {
    setSelectedTemplate(template);
    setMetadata(METADATA_TEMPLATES[template as keyof typeof METADATA_TEMPLATES]);
  };

  const updateMetadata = (field: string, value: any) => {
    setMetadata(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateAttribute = (index: number, field: 'trait_type' | 'value', value: string) => {
    setMetadata(prev => ({
      ...prev,
      attributes: prev.attributes.map((attr, i) => 
        i === index ? { ...attr, [field]: value } : attr
      )
    }));
  };

  const addAttribute = () => {
    setMetadata(prev => ({
      ...prev,
      attributes: [...prev.attributes, { trait_type: '', value: '' }]
    }));
  };

  const removeAttribute = (index: number) => {
    setMetadata(prev => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index)
    }));
  };

  const exportMetadata = () => {
    const dataStr = JSON.stringify(metadata, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${metadata.name}_metadata.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importMetadata = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string);
          setMetadata(imported);
        } catch (error) {
          console.error('Error importing metadata:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold text-white mb-4">🎨 Dynamic Metadata Creator</h1>
        <p className="text-gray-300 text-lg">
          Create dynamic metadata that can change based on intelligence triggers
        </p>
      </motion.div>

      {/* Template Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gray-800 rounded-lg p-6"
      >
        <h2 className="text-2xl font-semibold text-white mb-4">📋 Choose Template</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(METADATA_TEMPLATES).map(([key, template]) => (
            <button
              key={key}
              onClick={() => handleTemplateChange(key)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedTemplate === key
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-gray-600 bg-gray-700 hover:border-gray-500'
              }`}
            >
              <div className="text-center">
                {key === 'art' && <Palette className="mx-auto mb-2 text-white" size={24} />}
                {key === 'profile' && <User className="mx-auto mb-2 text-white" size={24} />}
                {key === 'game' && <Gamepad2 className="mx-auto mb-2 text-white" size={24} />}
                {key === 'financial' && <TrendingUp className="mx-auto mb-2 text-white" size={24} />}
                {key === 'social' && <Users className="mx-auto mb-2 text-white" size={24} />}
                {key === 'realtime' && <Globe className="mx-auto mb-2 text-white" size={24} />}
                <p className="text-white text-sm font-medium capitalize">{key}</p>
              </div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Metadata Editor */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-800 rounded-lg p-6"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-white">✏️ Edit Metadata</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              <Eye size={16} />
              {previewMode ? 'Edit' : 'Preview'}
            </button>
            <button
              onClick={exportMetadata}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
            >
              <Download size={16} />
              Export
            </button>
            <label className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg cursor-pointer">
              <Upload size={16} />
              Import
              <input
                type="file"
                accept=".json"
                onChange={importMetadata}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {previewMode ? (
          // Preview Mode
          <div className="bg-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Preview</h3>
            <pre className="text-green-400 text-sm overflow-auto">
              {JSON.stringify(metadata, null, 2)}
            </pre>
          </div>
        ) : (
          // Edit Mode
          <div className="space-y-6">
            {/* Basic Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 mb-2">Name</label>
                <input
                  type="text"
                  value={metadata.name}
                  onChange={(e) => updateMetadata('name', e.target.value)}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2">Description</label>
                <input
                  type="text"
                  value={metadata.description}
                  onChange={(e) => updateMetadata('description', e.target.value)}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Image URI</label>
              <input
                type="text"
                value={metadata.image}
                onChange={(e) => updateMetadata('image', e.target.value)}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                placeholder="og://storage/image.png"
              />
            </div>

            {/* Attributes */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-gray-300">Attributes</label>
                <button
                  onClick={addAttribute}
                  className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                >
                  <Plus size={14} />
                  Add Attribute
                </button>
              </div>
              <div className="space-y-3">
                {metadata.attributes.map((attr, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={attr.trait_type}
                      onChange={(e) => updateAttribute(index, 'trait_type', e.target.value)}
                      placeholder="Trait Type"
                      className="flex-1 bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                    />
                    <input
                      type="text"
                      value={attr.value}
                      onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                      placeholder="Value"
                      className="flex-1 bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                    />
                    <button
                      onClick={() => removeAttribute(index)}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Fields */}
            <div>
              <label className="block text-gray-300 mb-2">External URL (optional)</label>
              <input
                type="text"
                value={metadata.external_url || ''}
                onChange={(e) => updateMetadata('external_url', e.target.value)}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                placeholder="https://example.com"
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* Intelligence Integration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gray-800 rounded-lg p-6"
      >
        <h2 className="text-2xl font-semibold text-white mb-4">🧠 Intelligence Integration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-medium text-white mb-3">Next Steps</h3>
            <ol className="text-gray-300 space-y-2 text-sm">
              <li>1. Export your metadata JSON</li>
              <li>2. Store it on 0G Storage</li>
              <li>3. Create intelligence rules</li>
              <li>4. Set up external data feeds</li>
              <li>5. Test the dynamic updates</li>
            </ol>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-medium text-white mb-3">Available Triggers</h3>
            <ul className="text-gray-300 space-y-1 text-sm">
              <li>• Time-based (daily, weekly)</li>
              <li>• Weather-based (rainy, sunny)</li>
              <li>• Social-based (viral, trending)</li>
              <li>• Price-based (bull market)</li>
              <li>• Custom logic</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
