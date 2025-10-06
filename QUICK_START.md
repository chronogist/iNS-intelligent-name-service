# 🚀 Quick Start - AI Agent Domains

## ✅ Deployment Complete!

Your AI Agent Domain system is now **LIVE** on 0G Testnet!

---

## 📍 Deployed Contracts

### INSRegistry (UUPS Proxy)
```
Proxy:          0xfDf463C23df9ac82D6946A34b9c8A8dDF23d44a3
Implementation: 0x0Dcde347f53442bEC80D2642Be2A2b2970803Ed1
Network:        0G Testnet (Chain ID: 16602)
Explorer:       https://chainscan-galileo.0g.ai/address/0xfDf463C23df9ac82D6946A34b9c8A8dDF23d44a3
```

---

## 🏃 Run the App

### 1. Start Frontend
```bash
cd frontend
npm run dev
```

Open: **http://localhost:3000**

### 2. Test Registration with AI Agent
1. **Connect Wallet** (make sure you're on 0G Testnet)
2. **Search for domain**: e.g., "my-defi-agent"
3. **Select AI Agent Type**:
   - DeFi Trader
   - Gas Optimizer
   - Yield Farmer
   - Arbitrage Bot
   - NFT Analyzer
   - Custom
4. **Configure routing rules**
5. **Register** (0.1 tokens)

### 3. Visit Marketplace
Navigate to: **http://localhost:3000/marketplace**

- See AI agents for sale/rent
- Filter by type
- Sort by intelligence/price
- View performance metrics

---

## 🎯 What's New - AI Agent Features

### For Users
1. **Register Intelligent Domains**
   - Choose agent type during registration
   - Agent starts with 0 intelligence
   - Learns and improves over time

2. **Agent Learning**
   - Performs actions (trades, optimizations, etc.)
   - Records success/failure
   - Updates intelligence score (0-1000)
   - Metadata stored on 0G Storage

3. **Buy/Sell Agents**
   - List domain with proven intelligence
   - Buyers get complete agent brain
   - Intelligence transfers with ownership
   - Price reflects learned value

4. **Rent Agents**
   - Rent AI strategies by the day
   - Access proven performance
   - No full ownership needed

### For Developers
1. **Smart Contract Integration**
   ```typescript
   // Get agent intelligence
   const metrics = await inft.getIntelligenceMetrics();
   // Returns: agentType, intelligenceScore, totalActions, successRate, etc.
   ```

2. **Agent Learning Tracker**
   ```typescript
   import { AgentLearningTracker } from '@/lib/agent-learning';

   const tracker = new AgentLearningTracker(domain, metadata);
   await tracker.recordAction(action, signer);
   ```

3. **0G Storage Integration**
   ```typescript
   import { BrowserZeroGStorageService } from '@/lib/0g-storage';

   const storage = new BrowserZeroGStorageService();
   const { rootHash } = await storage.uploadAgentMetadata(metadata, signer);
   ```

---

## 📊 Intelligence Score System

**Scale:** 0-1000 points

| Score | Level | Description |
|-------|-------|-------------|
| 900-1000 | Genius 🌟 | Elite performance, maximum optimization |
| 800-899 | Expert 💎 | Proven strategies, high success rate |
| 700-799 | Advanced 🔥 | Experienced, reliable performance |
| 600-699 | Intermediate ✨ | Learning patterns, decent results |
| 0-599 | Beginner 🌱 | Early stage, building experience |

**Scoring Components:**
- Success Rate: 300 pts
- Experience: 200 pts
- Value Managed: 200 pts
- Profit: 200 pts
- Gas Optimization: 100 pts

---

## 🔧 Configuration

All environment variables are already set in `frontend/.env.local`:

```bash
# 0G Network
NEXT_PUBLIC_RPC_URL=https://evmrpc-testnet.0g.ai
NEXT_PUBLIC_CHAIN_ID=16602
NEXT_PUBLIC_EXPLORER_URL=https://chainscan-galileo.0g.ai

# Contracts (AI Agent Support Enabled)
NEXT_PUBLIC_REGISTRY_ADDRESS=0xfDf463C23df9ac82D6946A34b9c8A8dDF23d44a3

# 0G Storage
NEXT_PUBLIC_INDEXER_RPC=https://indexer-storage-testnet-turbo.0g.ai
```

---

## 🧪 Testing Checklist

### ✅ Basic Functions
- [ ] Register domain with AI agent type
- [ ] View domain in "My Domains"
- [ ] Set/change primary name
- [ ] View domain details page

### ✅ AI Agent Features
- [ ] Check INFT has agent type on-chain
- [ ] Verify intelligence score is 0 for new domain
- [ ] Test marketplace displays mock agents
- [ ] Filter/sort agents in marketplace

### ✅ Advanced (requires backend)
- [ ] Upload metadata to 0G Storage
- [ ] Record agent actions
- [ ] Update intelligence score
- [ ] Buy/sell agents

---

## 📁 Key Files

### Smart Contracts
- `contracts/INFT.sol` - AI agent intelligence tracking
- `contracts/INSRegistry.sol` - Registration with agent type

### Frontend Libraries
- `lib/0g-storage.ts` - 0G Storage integration
- `lib/agent-learning.ts` - Learning tracker

### Pages
- `app/marketplace/page.tsx` - AI agent marketplace
- `app/register/page.tsx` - Registration with agent type
- `app/domains/[name]/page.tsx` - Domain management

---

## 🐛 Troubleshooting

### Build Errors
If you encounter build errors:
```bash
cd frontend
rm -rf .next node_modules
npm install
npm run build
```

### Wallet Connection
- Ensure you're on 0G Testnet (Chain ID: 16602)
- Get testnet tokens from 0G Discord faucet

### 0G Storage Upload Fails
- Check `NEXT_PUBLIC_INDEXER_RPC` is correct
- Verify RPC_URL is accessible
- For browser, may need API proxy (not yet implemented)

---

## 🎉 What Makes This Special

### vs Traditional Domain Names
- **Static Identity** → **Living Intelligence**
- **One-time purchase** → **Appreciating asset**
- **Name only** → **Name + proven strategies**

### vs SPACE ID
- SPACE ID: Basic .0g domains
- iNS: AI Agent domains that learn and improve

### Real Value
1. **DeFi Trader Agent** (Intelligence: 847)
   - Performed 1,250 trades
   - 89.2% success rate
   - Managed $125K, Generated $15K profit
   - **Listed at 2.5 0G** (domain + brain)

2. **Gas Optimizer Agent** (Intelligence: 923)
   - Optimized 2,100 transactions
   - 95.8% success rate
   - Saved $12K in gas fees
   - **Rental: 0.05 0G/day**

---

## 📚 Next Steps

### Immediate
1. ✅ Test all features
2. ✅ Register test domains with different agent types
3. ✅ Verify on-chain data

### Short-term
1. Implement real marketplace buy/sell
2. Add backend for 0G Storage upload
3. Deploy TEE oracle for action verification
4. Build agent performance dashboard

### Long-term
1. Agent strategy marketplace
2. Agent cloning/forking
3. Cross-domain collaboration
4. AI model integration

---

## 💡 Ideas to Explore

1. **DeFi Trading Competition**
   - Agents compete for best returns
   - Leaderboard by intelligence score
   - Prize pool for top performers

2. **Agent Rental Marketplace**
   - Rent proven strategies
   - Daily/weekly/monthly plans
   - Revenue sharing model

3. **Strategy Cloning**
   - Fork successful agents
   - Create specialized variants
   - Build agent families

4. **Cross-Chain Agents**
   - Deploy same agent on multiple chains
   - Aggregate learning across networks
   - Universal intelligence

---

## 🔗 Resources

- **0G Docs:** https://docs.0g.ai
- **0G Explorer:** https://chainscan-galileo.0g.ai
- **0G Storage SDK:** https://github.com/0glabs/0g-storage-ts-starter-kit
- **Deployment Details:** See `AI_AGENT_DEPLOYMENT.md`

---

## 🚀 You're All Set!

The world's first **AI Agent Domain** system is ready to use.

Start by:
1. Running `npm run dev` in the frontend folder
2. Connecting your wallet
3. Registering your first intelligent domain

**Happy Building!** 🎉
