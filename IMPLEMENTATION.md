# iNS Smart Profile Implementation Plan
## 3-Day Sprint to MVP

**Goal:** Enable users to create rich profiles during domain registration and view them via `gathin.0g` links.

**Scope:** Profile creation, storage, and display. NO AI agent or Telegram integration yet.

---

## 📅 Day 1: Smart Contract & Backend (8 hours)

### Morning (4 hours): Smart Contract Updates

#### Task 1.1: Update INFT Metadata Structure (1 hour)
**File:** `contracts/INFT.sol`

**Current metadata:**
```solidity
{
  routingRules: [...],
  owner: "0x...",
  timestamp: 123456
}
```

**New metadata structure:**
```solidity
{
  // Profile Info
  profile: {
    displayName: "Gathin",
    bio: "Smart Contract Developer",
    avatar: "ipfs://Qm...",

    // Social Links
    social: {
      twitter: "@gathin",
      chronogist: "gathin",
      linkedin: "gathin-dev",
      website: "gathin.xyz",
      telegram: "@gathin",
      discord: "gathin#1234"
    },

    // Professional Info
    professional: {
      role: "Blockchain Developer",
      skills: ["Solidity", "Rust", "DeFi"],
      availability: "available", // available, busy, unavailable
      hourlyRate: 150,
      currency: "USD",
      timezone: "UTC+1",
      languages: ["English", "French"]
    },

    // Portfolio
    portfolio: [
      { name: "Project 1", link: "https://...", type: "code" },
      { name: "NFT Collection", link: "https://...", type: "nft" }
    ],

    // Settings
    settings: {
      acceptingMessages: true,
      requireDeposit: true,
      depositAmount: "0.01", // in 0G
      preferredContact: "telegram"
    }
  },

  // Keep for backwards compatibility (can be removed later)
  routingRules: [...],
  owner: "0x...",
  timestamp: 123456
}
```

**Action Items:**
- ✅ No smart contract changes needed (metadata is flexible JSON)
- ✅ Contract already accepts any metadata structure
- ⏭️ Move to frontend implementation

---

### Afternoon (4 hours): Backend API for Profile Resolution

#### Task 1.2: Create Profile Resolution API (2 hours)
**File:** `backend/routes/profiles.js`

**Endpoints:**
```javascript
// Get profile by domain name
GET /api/profile/:domain
Response: {
  domain: "gathin.0g",
  owner: "0x...",
  inftAddress: "0x...",
  profile: { ...metadata from INFT },
  registered: "2025-10-04",
  expires: "2026-10-04"
}

// Update profile (owner only)
PUT /api/profile/:domain
Body: { profile: {...}, signature: "0x..." }
Response: { success: true, txHash: "0x..." }
```

**Implementation:**
```javascript
const express = require('express');
const { ethers } = require('ethers');
const router = express.Router();

const REGISTRY_ABI = require('../contracts/INSRegistry.json');
const INFT_ABI = require('../contracts/INFT.json');

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const registryAddress = process.env.REGISTRY_ADDRESS;

// GET /api/profile/:domain
router.get('/:domain', async (req, res) => {
  try {
    const { domain } = req.params;

    // 1. Get INFT address from registry
    const registry = new ethers.Contract(registryAddress, REGISTRY_ABI, provider);
    const inftAddress = await registry.getINFT(domain);

    if (inftAddress === ethers.ZeroAddress) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    // 2. Get metadata from INFT
    const inft = new ethers.Contract(inftAddress, INFT_ABI, provider);
    const [metadataURI, metadataHash, owner] = await Promise.all([
      inft.metadataURI(),
      inft.metadataHash(),
      inft.domainOwner()
    ]);

    // 3. Fetch metadata from 0G Storage or IPFS
    // For now, parse from metadataURI if it's embedded JSON
    let profile = {};
    if (metadataURI.startsWith('data:')) {
      const json = Buffer.from(metadataURI.split(',')[1], 'base64').toString();
      profile = JSON.parse(json);
    }

    // 4. Get registration info
    const expiry = await registry.getExpiry(domain);

    res.json({
      domain: `${domain}.0g`,
      owner,
      inftAddress,
      profile,
      expires: new Date(Number(expiry) * 1000).toISOString()
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

module.exports = router;
```

#### Task 1.3: Integrate Profile API (1 hour)
**File:** `backend/index.js`

```javascript
const profileRoutes = require('./routes/profiles');
app.use('/api/profile', profileRoutes);
```

#### Task 1.4: Test API (1 hour)
```bash
# Test getting profile
curl http://localhost:3000/api/profile/gathin

# Expected response
{
  "domain": "gathin.0g",
  "owner": "0x...",
  "profile": {
    "displayName": "Gathin",
    "bio": "Smart Contract Developer",
    ...
  }
}
```

---

## 📅 Day 2: Frontend - Registration Flow (8 hours)

### Morning (4 hours): Profile Setup Form

#### Task 2.1: Create Profile Setup Component (2 hours)
**File:** `frontend/components/ProfileSetup.tsx`

```typescript
'use client';

import { useState } from 'react';
import { User, Briefcase, Link as LinkIcon, Settings, Upload } from 'lucide-react';

interface ProfileData {
  displayName: string;
  bio: string;
  avatar: string;
  social: {
    twitter: string;
    chronogist: string;
    linkedin: string;
    website: string;
  };
  professional: {
    role: string;
    skills: string[];
    availability: 'available' | 'busy' | 'unavailable';
    hourlyRate: number;
    timezone: string;
    languages: string[];
  };
  portfolio: Array<{
    name: string;
    link: string;
    type: string;
  }>;
  settings: {
    acceptingMessages: boolean;
    requireDeposit: boolean;
    depositAmount: string;
  };
}

export default function ProfileSetup({
  onComplete
}: {
  onComplete: (profile: ProfileData) => void
}) {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<ProfileData>({
    displayName: '',
    bio: '',
    avatar: '',
    social: { twitter: '', chronogist: '', linkedin: '', website: '' },
    professional: {
      role: '',
      skills: [],
      availability: 'available',
      hourlyRate: 0,
      timezone: 'UTC',
      languages: ['English']
    },
    portfolio: [],
    settings: {
      acceptingMessages: true,
      requireDeposit: false,
      depositAmount: '0.01'
    }
  });

  const [currentSkill, setCurrentSkill] = useState('');

  const addSkill = () => {
    if (currentSkill && !profile.professional.skills.includes(currentSkill)) {
      setProfile({
        ...profile,
        professional: {
          ...profile.professional,
          skills: [...profile.professional.skills, currentSkill]
        }
      });
      setCurrentSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setProfile({
      ...profile,
      professional: {
        ...profile.professional,
        skills: profile.professional.skills.filter(s => s !== skill)
      }
    });
  };

  const addPortfolioItem = () => {
    setProfile({
      ...profile,
      portfolio: [...profile.portfolio, { name: '', link: '', type: 'project' }]
    });
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-8">
        {[
          { num: 1, label: 'Basic', icon: User },
          { num: 2, label: 'Professional', icon: Briefcase },
          { num: 3, label: 'Links', icon: LinkIcon },
          { num: 4, label: 'Settings', icon: Settings }
        ].map((s, idx) => (
          <div key={s.num} className="flex items-center flex-1">
            <div className={`flex flex-col items-center flex-1 ${
              step >= s.num ? 'opacity-100' : 'opacity-40'
            }`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step >= s.num
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600'
                  : 'bg-white/10'
              }`}>
                <s.icon className="w-5 h-5" />
              </div>
              <span className="text-xs mt-2">{s.label}</span>
            </div>
            {idx < 3 && (
              <div className={`h-0.5 flex-1 ${
                step > s.num ? 'bg-primary-500' : 'bg-white/10'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="space-y-6">
          <h3 className="text-2xl font-display font-bold">Basic Information</h3>

          <div>
            <label className="block text-sm font-medium mb-2">Display Name</label>
            <input
              type="text"
              value={profile.displayName}
              onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
              placeholder="Your name or alias"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Bio</label>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="Tell people about yourself..."
              rows={4}
              className="input-field resize-none"
            />
            <p className="text-xs text-dark-400 mt-1">
              {profile.bio.length}/200 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Avatar URL (optional)</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={profile.avatar}
                onChange={(e) => setProfile({ ...profile, avatar: e.target.value })}
                placeholder="https://... or ipfs://..."
                className="input-field flex-1"
              />
              <button className="btn-secondary">
                <Upload className="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!profile.displayName || !profile.bio}
            className="btn-primary w-full"
          >
            Continue
          </button>
        </div>
      )}

      {/* Step 2: Professional Info */}
      {step === 2 && (
        <div className="space-y-6">
          <h3 className="text-2xl font-display font-bold">Professional Details</h3>

          <div>
            <label className="block text-sm font-medium mb-2">Role</label>
            <input
              type="text"
              value={profile.professional.role}
              onChange={(e) => setProfile({
                ...profile,
                professional: { ...profile.professional, role: e.target.value }
              })}
              placeholder="e.g., Smart Contract Developer"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Skills</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={currentSkill}
                onChange={(e) => setCurrentSkill(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                placeholder="Add a skill and press Enter"
                className="input-field flex-1"
              />
              <button onClick={addSkill} className="btn-secondary">
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.professional.skills.map(skill => (
                <span
                  key={skill}
                  className="badge-primary px-3 py-1 flex items-center gap-2 cursor-pointer"
                  onClick={() => removeSkill(skill)}
                >
                  {skill}
                  <span className="text-xs">×</span>
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Availability</label>
              <select
                value={profile.professional.availability}
                onChange={(e) => setProfile({
                  ...profile,
                  professional: { ...profile.professional, availability: e.target.value as any }
                })}
                className="input-field"
              >
                <option value="available">🟢 Available</option>
                <option value="busy">🟡 Busy</option>
                <option value="unavailable">🔴 Unavailable</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Hourly Rate (USD)</label>
              <input
                type="number"
                value={profile.professional.hourlyRate}
                onChange={(e) => setProfile({
                  ...profile,
                  professional: { ...profile.professional, hourlyRate: parseInt(e.target.value) || 0 }
                })}
                placeholder="0"
                className="input-field"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button onClick={() => setStep(1)} className="btn-secondary flex-1">
              Back
            </button>
            <button onClick={() => setStep(3)} className="btn-primary flex-1">
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Social Links */}
      {step === 3 && (
        <div className="space-y-6">
          <h3 className="text-2xl font-display font-bold">Social Links</h3>

          <div className="space-y-4">
            {Object.entries({
              twitter: { label: 'Twitter/X', placeholder: '@username' },
              chronogist: { label: 'Chronogist', placeholder: 'username' },
              linkedin: { label: 'LinkedIn', placeholder: 'username or profile URL' },
              website: { label: 'Website', placeholder: 'https://yoursite.com' }
            }).map(([key, { label, placeholder }]) => (
              <div key={key}>
                <label className="block text-sm font-medium mb-2">{label}</label>
                <input
                  type="text"
                  value={profile.social[key as keyof typeof profile.social]}
                  onChange={(e) => setProfile({
                    ...profile,
                    social: { ...profile.social, [key]: e.target.value }
                  })}
                  placeholder={placeholder}
                  className="input-field"
                />
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <button onClick={() => setStep(2)} className="btn-secondary flex-1">
              Back
            </button>
            <button onClick={() => setStep(4)} className="btn-primary flex-1">
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Settings */}
      {step === 4 && (
        <div className="space-y-6">
          <h3 className="text-2xl font-display font-bold">Profile Settings</h3>

          <div className="glass-card p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={profile.settings.acceptingMessages}
                onChange={(e) => setProfile({
                  ...profile,
                  settings: { ...profile.settings, acceptingMessages: e.target.checked }
                })}
                className="mt-1"
              />
              <div className="flex-1">
                <p className="font-medium">Accept Messages</p>
                <p className="text-sm text-dark-400">
                  Allow people to contact you through your profile
                </p>
              </div>
            </label>
          </div>

          <div className="glass-card p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={profile.settings.requireDeposit}
                onChange={(e) => setProfile({
                  ...profile,
                  settings: { ...profile.settings, requireDeposit: e.target.checked }
                })}
                className="mt-1"
              />
              <div className="flex-1">
                <p className="font-medium">Require Contact Deposit</p>
                <p className="text-sm text-dark-400">
                  Charge a small fee to prevent spam (recommended)
                </p>
              </div>
            </label>

            {profile.settings.requireDeposit && (
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">Deposit Amount (0G)</label>
                <input
                  type="text"
                  value={profile.settings.depositAmount}
                  onChange={(e) => setProfile({
                    ...profile,
                    settings: { ...profile.settings, depositAmount: e.target.value }
                  })}
                  placeholder="0.01"
                  className="input-field"
                />
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <button onClick={() => setStep(3)} className="btn-secondary flex-1">
              Back
            </button>
            <button
              onClick={() => onComplete(profile)}
              className="btn-primary flex-1"
            >
              Complete Profile Setup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

#### Task 2.2: Integrate Profile Setup into Registration (2 hours)
**File:** `frontend/app/register/page.tsx`

Update the registration flow to include profile setup between Step 1 and Step 2.

---

### Afternoon (4 hours): Profile Display Page

#### Task 2.3: Create Profile Display Component (3 hours)
**File:** `frontend/app/profile/[domain]/page.tsx`

```typescript
'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin, Clock, Globe, Twitter, Github, Linkedin,
  MessageCircle, Send, Star, Briefcase, CheckCircle
} from 'lucide-react';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import { useAccount } from 'wagmi';

export default function ProfilePage() {
  const params = useParams();
  const domain = params.domain as string;
  const { address } = useAccount();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    fetchProfile();
  }, [domain]);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API_URL}/profile/${domain}`);
      setProfile(res.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-dark-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">404</h1>
          <p className="text-dark-400">Domain not found</p>
        </div>
      </div>
    );
  }

  const { displayName, bio, avatar, social, professional, portfolio, settings } = profile.profile;
  const availabilityColors = {
    available: 'text-green-400',
    busy: 'text-yellow-400',
    unavailable: 'text-red-400'
  };

  const availabilityDots = {
    available: '🟢',
    busy: '🟡',
    unavailable: '🔴'
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 mb-6"
          >
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-4xl font-bold">
                {avatar ? (
                  <img src={avatar} alt={displayName} className="w-full h-full rounded-full object-cover" />
                ) : (
                  displayName?.[0]?.toUpperCase()
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-display font-bold mb-2">
                  {displayName}
                </h1>
                <p className="text-lg text-primary-400 mb-2">{professional?.role}</p>
                <p className={`text-sm font-medium mb-3 ${availabilityColors[professional?.availability]}`}>
                  {availabilityDots[professional?.availability]} {professional?.availability?.charAt(0).toUpperCase() + professional?.availability?.slice(1)}
                </p>
                <p className="text-dark-300">{bio}</p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 w-full md:w-auto">
                {settings?.acceptingMessages && (
                  <button className="btn-primary flex items-center gap-2 justify-center">
                    <MessageCircle className="w-4 h-4" />
                    Send Message
                    {settings?.requireDeposit && (
                      <span className="text-xs opacity-75">
                        ({settings.depositAmount} 0G)
                      </span>
                    )}
                  </button>
                )}
                <button className="btn-secondary flex items-center gap-2 justify-center">
                  <Send className="w-4 h-4" />
                  Send Payment
                </button>
              </div>
            </div>
          </motion.div>

          {/* Professional Info */}
          {professional && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-6 mb-6"
            >
              <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary-400" />
                Professional
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-dark-400 mb-2">Hourly Rate</p>
                  <p className="text-2xl font-bold gradient-text">
                    ${professional.hourlyRate}/hr
                  </p>
                </div>

                <div>
                  <p className="text-sm text-dark-400 mb-2">Timezone</p>
                  <p className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-dark-400" />
                    {professional.timezone}
                  </p>
                </div>
              </div>

              {professional.skills?.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm text-dark-400 mb-3">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {professional.skills.map((skill: string) => (
                      <span key={skill} className="badge-primary px-3 py-1">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {professional.languages?.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm text-dark-400 mb-3">Languages</p>
                  <div className="flex flex-wrap gap-2">
                    {professional.languages.map((lang: string) => (
                      <span key={lang} className="text-sm text-dark-300">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Social Links */}
          {social && Object.values(social).some(v => v) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6 mb-6"
            >
              <h2 className="text-xl font-display font-bold mb-4">Connect</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {social.twitter && (
                  <a
                    href={`https://twitter.com/${social.twitter.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-dark-300 hover:text-primary-400 transition-colors"
                  >
                    <Twitter className="w-4 h-4" />
                    Twitter
                  </a>
                )}
                {social.chronogist && (
                  <a
                    href={`https://chronogist.com/${social.chronogist}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-dark-300 hover:text-primary-400 transition-colors"
                  >
                    <Github className="w-4 h-4" />
                    Chronogist
                  </a>
                )}
                {social.linkedin && (
                  <a
                    href={social.linkedin.startsWith('http') ? social.linkedin : `https://linkedin.com/in/${social.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-dark-300 hover:text-primary-400 transition-colors"
                  >
                    <Linkedin className="w-4 h-4" />
                    LinkedIn
                  </a>
                )}
                {social.website && (
                  <a
                    href={social.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-dark-300 hover:text-primary-400 transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    Website
                  </a>
                )}
              </div>
            </motion.div>
          )}

          {/* Portfolio */}
          {portfolio?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-6"
            >
              <h2 className="text-xl font-display font-bold mb-4">Portfolio</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {portfolio.map((item: any, idx: number) => (
                  <a
                    key={idx}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-card p-4 hover:bg-white/10 transition-colors"
                  >
                    <p className="font-medium mb-1">{item.name}</p>
                    <p className="text-sm text-dark-400 truncate">{item.link}</p>
                  </a>
                ))}
              </div>
            </motion.div>
          )}

          {/* Domain Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 text-center text-sm text-dark-400"
          >
            <p>Owner: {profile.owner}</p>
            <p>Domain: {profile.domain}</p>
            <p>Expires: {new Date(profile.expires).toLocaleDateString()}</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
```

#### Task 2.4: Test Profile Display (1 hour)
- Register a test domain with profile
- Visit `/profile/testdomain`
- Verify all fields display correctly

---

## 📅 Day 3: Integration & Polish (8 hours)

### Morning (4 hours): Complete Registration Integration

#### Task 3.1: Wire Up Profile Setup in Registration (2 hours)
**File:** `frontend/app/register/page.tsx`

Add ProfileSetup component between duration selection and confirmation:
```
Step 1: Domain + Duration ✓
Step 2: Profile Setup ← NEW
Step 3: Review & Confirm
Step 4: Processing
```

#### Task 3.2: Update Metadata Encoding (1 hour)
Encode full profile metadata when registering:
```javascript
const metadata = {
  profile: profileData, // From ProfileSetup
  owner: address,
  timestamp: Date.now()
};

const metadataJSON = JSON.stringify(metadata);
const metadataHash = keccak256(toUtf8Bytes(metadataJSON));

// For now, embed in URI as base64
const metadataURI = `data:application/json;base64,${Buffer.from(metadataJSON).toString('base64')}`;
```

#### Task 3.3: Test End-to-End Flow (1 hour)
1. Search for domain
2. Click Register
3. Fill out profile (all 4 steps)
4. Review and confirm
5. Pay 0.1 0G
6. Visit `/profile/yourdomain`
7. Verify everything displays

---

### Afternoon (4 hours): Polish & Documentation

#### Task 3.4: Add Profile Editing (2 hours)
**File:** `frontend/app/profile/[domain]/edit/page.tsx`

- Same form as ProfileSetup
- Pre-fill with existing data
- Only owner can access
- Call INFT.updateMetadata() when saving

#### Task 3.5: Add Domain Sharing Features (1 hour)
- QR code generation for profile URL
- Copy link button
- Social share buttons
- "Add to contacts" button

#### Task 3.6: Create Documentation (1 hour)
**File:** `PROFILE_FEATURES.md`

Document:
- How to create a profile
- How to view profiles
- How to edit profiles
- Future features (AI agent, Telegram)

---

## ✅ Success Criteria

By end of Day 3, you should be able to:

1. ✅ Register `gathin.0g` with full profile
2. ✅ Visit `ins.0g/profile/gathin` and see:
   - Name, bio, avatar
   - Professional info (role, rate, skills)
   - Social links
   - Availability status
3. ✅ Share the link with anyone
4. ✅ Edit profile as owner
5. ✅ All data stored on-chain in INFT

---

## 🚫 Out of Scope (Future Features)

- ❌ AI agent responses
- ❌ Telegram notifications
- ❌ Contact form functionality
- ❌ Payment processing
- ❌ Analytics/tracking
- ❌ Search/discovery
- ❌ Reputation system

These will be added in Sprint 2 (AI Integration) after the basic profile system works.

---

## 📊 Resource Allocation

**Smart Contracts:** 0 hours (no changes needed)
**Backend:** 4 hours (API endpoints)
**Frontend:** 16 hours (forms + display)
**Testing:** 3 hours
**Documentation:** 1 hour

**Total:** 24 hours = 3 days × 8 hours

---

## 🎯 Quick Start Guide

### Day 1 Setup
```bash
# Backend
cd backend
npm install
# Create routes/profiles.js
node index.js

# Test
curl http://localhost:3000/api/profile/test
```

### Day 2 Setup
```bash
# Frontend
cd frontend
# Create components/ProfileSetup.tsx
# Create app/profile/[domain]/page.tsx
npm run dev
```

### Day 3 Integration
- Wire everything together
- Test full flow
- Deploy and share!

---

**Ready to build?** Let's ship this in 3 days! 🚀
