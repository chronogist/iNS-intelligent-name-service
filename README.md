# iNS - Intelligent Naming Service

> **ERC-7857 Intelligent NFT Domains with AI Agents on 0G Network**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.22-blue.svg)](https://docs.soliditylang.org/)
[![0G Network](https://img.shields.io/badge/0G-Network-green.svg)](https://0g.ai/)

iNS is a revolutionary naming service that combines traditional domain functionality with AI-powered intelligent agents. Each domain (`.0g`) is backed by an **Intelligent NFT (iNFT)** that stores encrypted AI agent metadata on **0G Storage**, creating domains that learn and evolve with their users.

---

## 🌟 Key Features

### 🧠 Intelligent NFT Domains
- **ERC-7857 Intelligent NFTs**: Each domain is an AI-powered NFT that learns from user interactions
- **AI Agent Types**: DeFi Trader, Gas Optimizer, Yield Farmer, Arbitrage Bot, NFT Analyzer, Custom
- **Intelligence Scoring**: Dynamic 0-1000 intelligence score based on performance metrics
- **Learning Evolution**: Agents improve over time through successful actions

### 🔒 0G Storage Integration
- **Encrypted Metadata**: AI agent "brains" stored securely on 0G Storage network
- **Decentralized Storage**: No single point of failure for agent intelligence data
- **Verifiable Integrity**: On-chain metadata hashes ensure data authenticity
- **Cost-Effective**: Leveraging 0G's efficient storage for large metadata files

### 🏪 AI Agent Marketplace
- **Buy & Sell**: Trade trained AI agents with proven performance
- **Rental System**: Rent agents for specific time periods
- **Performance Metrics**: Transparent success rates and value generation data
- **Intelligence Transfer**: Agents retain their learned knowledge across ownership

---

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │  Smart Contracts│
│   (Next.js)     │    │   (Express)     │    │   (Hardhat)     │
│                 │    │                 │    │                 │
│ • Domain Search │◄──►│ • Profile API   │◄──►│ • INSRegistry   │
│ • Registration  │    │ • 0G Storage    │    │ • iNFT Tokens   │
│ • Marketplace   │    │ • Analytics     │    │ • AI Learning   │
│ • Agent Config  │    │ • Indexing      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                    ┌─────────────────┐    ┌─────────────────┐
                    │   0G Storage    │    │   0G Network    │
                    │                 │    │                 │
                    │ • AI Metadata   │    │ • EVM Compatible│
                    │ • Encrypted     │    │ • Low Gas Fees  │
                    │ • Decentralized │    │ • High Speed    │
                    └─────────────────┘    └─────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Yarn or npm
- 0G Network testnet tokens
- MetaMask or compatible wallet

### 1. Clone Repository
```bash
git clone https://github.com/chronogist/iNS-intelligent-name-service.git
cd iNS-intelligent-name-service
```

### 2. Install Dependencies
```bash
# Root project
npm install

# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

### 3. Environment Setup
Create `.env` files in the root, frontend, and backend directories:

**Root `.env`:**
```env
PRIVATE_KEY=your_private_key_here
OG_TESTNET_RPC=https://evmrpc-testnet.0g.ai
OG_MAINNET_RPC=https://evmrpc-mainnet.0g.ai
ETHERSCAN_API_KEY=your_etherscan_api_key
```

**Frontend `.env.local`:**
```env
NEXT_PUBLIC_RPC_URL=https://evmrpc-testnet.0g.ai
NEXT_PUBLIC_INDEXER_RPC=https://indexer-storage-testnet-turbo.0g.ai
NEXT_PUBLIC_REGISTRY_ADDRESS=0x507d8324A029f87BdFFF2025215AABBA0326a7bd
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Backend `.env`:**
```env
RPC_URL=https://evmrpc-testnet.0g.ai
INDEXER_RPC=https://indexer-storage-testnet-turbo.0g.ai
REGISTRY_ADDRESS=0x507d8324A029f87BdFFF2025215AABBA0326a7bd
PORT=3001
```

### 4. Start Development Servers

**Frontend:**
```bash
cd frontend
npm run dev
# Open http://localhost:3000
```

**Backend:**
```bash
cd backend
npm run dev
# API running on http://localhost:3001
```

---

## 📋 Deployed Contracts

### 0G Testnet (Chain ID: 16602)

| Contract | Address | Type |
|----------|---------|------|
| **INSRegistry** | `0x507d8324A029f87BdFFF2025215AABBA0326a7bd` | UUPS Proxy |
| Implementation | `0x0Dcde347f53442bEC80D2642Be2A2b2970803Ed1` | Logic Contract |

**Explorer:** [0G Chain Explorer](https://chainscan-galileo.0g.ai/address/0x507d8324A029f87BdFFF2025215AABBA0326a7bd)

---

## 🔧 0G Storage Integration

### How 0G Storage is Used

**1. AI Agent Metadata Storage**
Located in: `frontend/lib/0g-storage.ts`

```typescript
// AI Agent metadata structure stored on 0G
export interface AIAgentMetadata {
  domain: string;
  agentType: 'defi_trader' | 'gas_optimizer' | 'nft_analyzer' | ...;
  intelligence: {
    parameters: Record<string, any>;
    performanceHistory: PerformanceRecord[];
    strategies: Strategy[];
  };
  metrics: {
    intelligenceScore: number;  // 0-1000 scale
    totalActions: number;
    successfulActions: number;
  };
}
```

**2. Upload Process**
```typescript
const storageService = new ZeroGStorageService();

// Upload encrypted metadata to 0G Storage
const { rootHash, metadataHash } = await storageService.uploadAgentMetadata(
  metadata,
  signer
);

// Store reference on-chain in iNFT
await iNFT.updateMetadata(rootHash, metadataHash);
```

**3. Retrieval Process**
```typescript
// Get metadata URI from on-chain iNFT
const metadataURI = await iNFT.metadataURI();

// Download and decrypt from 0G Storage
const agentData = await storageService.downloadAgentMetadata(metadataURI);
```

### 0G Storage Benefits
- **Cost Efficiency**: ~99% cheaper than on-chain storage
- **Scalability**: Store large AI models and training data
- **Decentralization**: No reliance on centralized cloud providers
- **Integrity**: Cryptographic verification of data authenticity

---

## 🎨 iNFT Smart Contract

### Contract Overview
Located in: `contracts/INFT.sol`

Each domain name gets its own **Intelligent NFT (iNFT)** contract deployed by the INSRegistry:

```solidity
contract INFT is ERC721, Ownable, ReentrancyGuard {
    // Core metadata
    string public domainName;           // e.g., "my-agent"
    string public metadataURI;          // 0G Storage URI
    bytes32 public metadataHash;        // Verification hash
    
    // AI Agent properties
    string public agentType;            // AI agent category
    uint256 public intelligenceScore;   // 0-1000 performance score
    uint256 public totalActions;        // Lifetime action count
    uint256 public successfulActions;   // Successful action count
    uint256 public agentVersion;        // Learning iteration
    
    // Metadata management
    address public oracle;              // Authorized updater
    bool public metadataLocked;         // Prevents updates
}
```

### Key Features

**1. ERC-7857 Compliance**
- Intelligent NFT standard with learning capabilities
- Metadata evolution through oracle updates
- Performance tracking on-chain

**2. 0G Storage Integration**
- `metadataURI` points to 0G Storage file hash
- `metadataHash` ensures data integrity
- Encrypted agent "brain" stored off-chain

**3. Intelligence Tracking**
```solidity
event IntelligenceUpdated(
    uint256 indexed newScore,
    uint256 totalActions,
    uint256 successfulActions,
    uint256 agentVersion
);
```

---

## 🏪 AI Agent Marketplace

### Frontend Integration
Located in: `frontend/app/marketplace/page.tsx`

**Features:**
- Browse AI agents by type and performance
- Filter by intelligence score, success rate
- Buy trained agents with proven track records
- Rent agents for specific time periods

**Marketplace Metrics:**
```typescript
interface MarketplaceAgent {
  domain: string;
  agentType: string;
  intelligenceScore: number;
  successRate: number;
  totalValueManaged: string;
  profitGenerated: string;
  isListed: boolean;
  listingPrice: string;
  rentalAvailable: boolean;
  rentalPricePerDay: string;
}
```

---

## 🧪 Testing

### Smart Contract Tests
```bash
npm run test
npm run coverage
```

### Frontend Development
```bash
cd frontend
npm run dev
```

### Backend API Tests
```bash
cd backend
npm run dev
node test-profile-api.js
```

---

## 🚀 Deployment

### Smart Contracts
```bash
# Compile contracts
npm run compile

# Deploy to 0G Testnet
npm run deploy:testnet

# Deploy to 0G Mainnet
npm run deploy:mainnet
```

### Frontend (Vercel)

**Quick Deploy:**
1. Connect your GitHub repository to Vercel
2. Set Root Directory to `frontend` (or use the included `vercel.json`)
3. Add environment variables (see below)
4. Deploy!

**Environment Variables for Vercel:**
```env
NEXT_PUBLIC_RPC_URL=https://evmrpc-testnet.0g.ai
NEXT_PUBLIC_INDEXER_RPC=https://indexer-storage-testnet-turbo.0g.ai
NEXT_PUBLIC_REGISTRY_ADDRESS=0x507d8324A029f87BdFFF2025215AABBA0326a7bd
NEXT_PUBLIC_CHAIN_ID=16602
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

**Manual Build (if needed):**
```bash
cd frontend
npm run build
vercel deploy
```

### Backend (Production)
```bash
cd backend
npm start
```

---

## 🛣️ Roadmap

### Phase 1: Foundation ✅
- [x] Smart contract architecture
- [x] 0G Storage integration
- [x] Basic frontend interface
- [x] iNFT deployment system

### Phase 2: AI Enhancement 🚧
- [ ] Advanced learning algorithms
- [ ] Multi-chain agent deployment
- [ ] Agent-to-agent communication
- [ ] Performance optimization

### Phase 3: Ecosystem 🔮
- [ ] Third-party integrations
- [ ] Mobile applications
- [ ] Enterprise solutions
- [ ] DAO governance

---

## 📚 Documentation

### Key Files
- **Smart Contracts**: `/contracts/`
  - `INSRegistry.sol` - Main domain registry
  - `INFT.sol` - Intelligent NFT implementation
  
- **0G Storage Service**: `/frontend/lib/0g-storage.ts`
  - Upload/download AI metadata
  - Encryption/decryption utilities
  - 0G network integration

- **AI Learning**: `/frontend/lib/agent-learning.ts`
  - Intelligence score calculation
  - Performance tracking
  - Learning data management

- **Frontend**: `/frontend/app/`
  - Domain registration flow
  - Agent marketplace
  - Performance analytics

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

- **Documentation**: [GitHub Wiki](https://github.com/chronogist/iNS-intelligent-name-service/wiki)
- **Issues**: [GitHub Issues](https://github.com/chronogist/iNS-intelligent-name-service/issues)
- **Discord**: [Join our community](https://discord.gg/ins-community)
- **Twitter**: [@iNS_Protocol](https://twitter.com/iNS_Protocol)

---

## 🙏 Acknowledgments

- **0G Labs** for the innovative storage infrastructure
- **OpenZeppelin** for secure smart contract libraries
- **Hardhat** for development framework
- **Next.js** for the frontend framework
- **ERC-7857** standard for Intelligent NFTs

---

<div align="center">
  <strong>Built with ❤️ by the iNS Team</strong>
  <br>
  <em>Intelligent domains for the decentralized future</em>
</div>