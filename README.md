# iNS - Intelligent Name Service

A revolutionary Web3 name service that combines traditional domain registration with AI-powered intelligence and dynamic metadata capabilities.

## 🚀 Features

### Core Name Service
- **Domain Registration**: Register `.0g` domains with instant ownership
- **iNFT Integration**: Each domain is represented as an Intelligent NFT (iNFT)
- **Reverse Resolution**: Link addresses to human-readable names
- **DNS Resolution**: Standard DNS record management

### Advanced Intelligence
- **ERC-7857 Dynamic Metadata**: Real-time metadata updates without token transfers
- **AI-Powered Oracles**: Intelligent data feeds for enhanced domain functionality
- **Owner Intelligence**: Context-aware domain behavior based on ownership patterns
- **Dynamic Content**: Live content updates through decentralized storage

### Web3 Integration
- **Wallet Connection**: Seamless MetaMask and Web3 wallet integration
- **Multi-Network Support**: Deployable across multiple blockchain networks
- **Real-time Updates**: Event-driven architecture for instant state synchronization
- **Decentralized Storage**: 0G Storage integration for metadata persistence

## 🏗️ Architecture

### Smart Contracts
- **Name0gRegistry**: Core registry for domain management
- **Name0gRegistrar7857**: Registration logic with ERC-7857 support
- **0GINFT**: Intelligent NFT (iNFT) implementation for domains
- **IntelligentOracle**: AI-powered data feed system
- **Name0gSimpleResolver**: DNS resolution implementation
- **ReverseRegistrar**: Reverse name resolution

### Frontend Stack
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Smooth animations
- **Ethers.js**: Blockchain interaction

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- MetaMask or Web3 wallet
- Hardhat (for smart contract development)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd iNS
```

2. **Install dependencies**
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd web
npm install
```

3. **Environment Setup**
```bash
# Copy environment variables
cp .env.example .env
# Configure your environment variables
```

4. **Smart Contract Deployment**
```bash
# Compile contracts
npx hardhat compile

# Deploy to local network
npx hardhat node
npx hardhat deploy --network localhost

# Deploy to testnet/mainnet
npx hardhat deploy --network <network-name>
```

5. **Start Development Server**
```bash
cd web
npm run dev
```

## 📖 Usage

### Registering a Domain
1. Connect your wallet to the application
2. Search for available domain names
3. Click "Register" to claim your domain
4. Confirm the transaction in your wallet
5. Your domain is now live as an Intelligent NFT (iNFT)!

### Managing Your Domain
- **View Profile**: Access your domain's profile page
- **iNFT Details**: View detailed iNFT information and metadata
- **Dynamic Features**: Explore ERC-7857 dynamic metadata capabilities
- **Storage Management**: Manage decentralized storage content

### Advanced Features
- **Owner Intelligence**: AI-powered domain behavior
- **Dynamic Metadata**: Real-time content updates
- **0G Storage**: Decentralized content storage
- **Intelligence Demo**: Interactive AI features

## 🔧 Development

### Project Structure
```
iNS/
├── contracts/          # Smart contracts
├── artifacts/          # Compiled contract artifacts
├── web/               # Frontend application
│   ├── src/
│   │   ├── app/       # Next.js app router pages
│   │   ├── components/ # React components
│   │   └── lib/       # Utility libraries
│   └── public/        # Static assets
├── scripts/           # Deployment and utility scripts
└── hardhat.config.ts  # Hardhat configuration
```

### Key Components
- **WalletContext**: Global wallet state management
- **BlockchainService**: Smart contract interaction layer
- **DynamicMetadataManager**: ERC-7857 metadata management
- **IntelligenceTriggers**: AI-powered feature triggers

### Testing
```bash
# Run smart contract tests
npx hardhat test

# Run frontend tests
cd web
npm test
```

## 🌐 Networks

The application supports multiple blockchain networks:
- **Local Development**: Hardhat local network
- **Testnets**: Sepolia, Goerli
- **Mainnet**: Ethereum mainnet

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live Demo**: [ins.app](https://ins.app)
- **Documentation**: [docs.ins.app](https://docs.ins.app)
- **Smart Contracts**: [Etherscan](https://etherscan.io)

## 🆘 Support

For support and questions:
- **Discord**: [Join our community](https://discord.gg/ins)
- **Twitter**: [@iNS_Protocol](https://twitter.com/iNS_Protocol)
- **Email**: support@ins.app

---

Built with ❤️ by the iNS team
