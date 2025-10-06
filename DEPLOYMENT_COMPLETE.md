# 🚀 Complete Deployment Guide - Backend + Frontend

## ✅ **Backend Deployed Successfully!**
**URL:** https://ins-intelligent-name-service.onrender.com

---

## 🎯 **Frontend Vercel Configuration**

### **Step 1: Update Vercel Environment Variables**

Go to your Vercel project settings and add/update these environment variables:

```env
# 🔗 Backend API (Your Render Deployment)
NEXT_PUBLIC_API_URL=https://ins-intelligent-name-service.onrender.com/api

# 🌐 0G Network Configuration
NEXT_PUBLIC_RPC_URL=https://evmrpc-testnet.0g.ai
NEXT_PUBLIC_INDEXER_RPC=https://indexer-storage-testnet-turbo.0g.ai
NEXT_PUBLIC_CHAIN_ID=16602
NEXT_PUBLIC_CHAIN_NAME=0G Testnet
NEXT_PUBLIC_EXPLORER_URL=https://chainscan-galileo.0g.ai

# 📜 Smart Contract (Latest Deployment)
NEXT_PUBLIC_REGISTRY_ADDRESS=0x507d8324A029f87BdFFF2025215AABBA0326a7bd

# 🔐 WalletConnect (Get from https://cloud.walletconnect.com)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

### **Step 2: Vercel Project Settings**

Make sure your Vercel project has:
- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`

### **Step 3: Deploy**

After updating environment variables:
1. Go to Vercel Dashboard
2. Click "Redeploy" on your latest build
3. Or push this commit to trigger auto-deployment

---

## 🔧 **Architecture Overview**

```
Frontend (Vercel)              Backend (Render)              Smart Contracts (0G)
├── Next.js App               ├── Express API               ├── INSRegistry
├── 0G Storage Integration    ├── Domain Validation         ├── iNFT Tokens  
├── Wallet Integration        ├── Price Calculation         ├── AI Learning
└── AI Agent Interface        └── Metadata Endpoints        └── 0G Network
     │                             │                             │
     └─────────────────────────────┼─────────────────────────────┘
                                   │
                    HTTPS API Calls to Render
```

---

## 🧪 **Test Your Deployment**

### **1. Test Backend API**
```bash
# Check if backend is responding
curl https://ins-intelligent-name-service.onrender.com/api/health

# Test domain availability
curl https://ins-intelligent-name-service.onrender.com/api/domains/available/test-domain

# Test domain pricing
curl https://ins-intelligent-name-service.onrender.com/api/domains/price/test-domain
```

### **2. Test Frontend Integration**
Once Vercel is deployed:
1. **Visit your Vercel URL**
2. **Connect Wallet** (0G Testnet)
3. **Search for a domain**
4. **Check if pricing loads** (this tests backend integration)
5. **Try registration** (this tests smart contract integration)

---

## 📊 **What's Deployed Where**

### **Backend (Render) ✅**
- **URL:** https://ins-intelligent-name-service.onrender.com
- **Features:**
  - Domain availability checking
  - Price calculation
  - Metadata endpoints
  - Rate limiting
  - CORS configured

### **Smart Contracts (0G Network) ✅**
- **Registry:** `0x507d8324A029f87BdFFF2025215AABBA0326a7bd`
- **Network:** 0G Testnet (Chain ID: 16602)
- **Features:**
  - iNFT minting
  - AI agent metadata
  - 0G Storage integration
  - Upgradeable contracts

### **Frontend (Vercel) 🔄**
- **Status:** Ready to deploy with correct configuration
- **Features:**
  - AI agent registration
  - Domain search & marketplace
  - Wallet integration
  - 0G Storage UI

---

## 🔍 **Troubleshooting**

### **If Frontend API Calls Fail:**
1. Check Vercel environment variables
2. Verify `NEXT_PUBLIC_API_URL` points to: https://ins-intelligent-name-service.onrender.com/api
3. Check browser network tab for 404/500 errors

### **If Smart Contract Calls Fail:**
1. Verify `NEXT_PUBLIC_REGISTRY_ADDRESS` is: `0x507d8324A029f87BdFFF2025215AABBA0326a7bd`
2. Ensure wallet is on 0G Testnet
3. Check if user has testnet tokens

### **If Render Backend is Slow:**
- Render free tier has cold starts (10-15 seconds)
- First API call might be slow, subsequent calls will be fast

---

## ✅ **Next Steps**

1. **Update Vercel environment variables** (see above)
2. **Redeploy Vercel frontend**
3. **Test the full flow**: Search → Register → View Domain
4. **Optional:** Add custom domain to Vercel deployment

Your iNS system is now fully deployed across:
- **Smart Contracts** → 0G Network ✅
- **Backend API** → Render ✅  
- **Frontend** → Vercel (pending config) 🔄
- **Storage** → 0G Storage ✅

🎉 **You're almost there!**