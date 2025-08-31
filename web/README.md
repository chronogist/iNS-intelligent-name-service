# iNS Frontend - Blockchain Connected

This is the frontend application for the iNS (Identity Name Service) project, now fully connected to the blockchain backend.

## Features

- 🔗 **Blockchain Integration**: Direct connection to smart contracts for name registration and availability checking
- 💳 **Wallet Connection**: MetaMask integration for secure transactions
- ⚡ **Real-time Updates**: Live name availability checking from the blockchain
- 🎨 **Modern UI**: Beautiful, responsive interface with smooth animations
- 📱 **Mobile Friendly**: Optimized for all device sizes

## Prerequisites

1. **MetaMask**: Install the MetaMask browser extension
2. **Blockchain Network**: Configure MetaMask to connect to the correct network (Chain ID: 16601)
3. **Test ETH**: Ensure you have some test ETH for transactions

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Deploy Smart Contracts** (if not already deployed):
   ```bash
   # From the parent directory
   npm run deploy
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

4. **Open Browser**: Navigate to `http://localhost:3000`

## Usage

### Connecting Your Wallet

1. Click the "Connect Wallet" button
2. Approve the MetaMask connection request
3. Ensure you're connected to the correct network (Chain ID: 16601)

### Checking Name Availability

1. Enter a name in the search field (minimum 3 characters, a-z, 0-9)
2. The system will automatically check availability on the blockchain
3. View real-time status updates

### Registering a Name

1. Ensure your wallet is connected
2. Find an available name
3. Click the registration button
4. Approve the transaction in MetaMask
5. Wait for confirmation

## Architecture

### Frontend Components

- **BlockchainService** (`src/lib/blockchain.ts`): Handles all blockchain interactions
- **WalletConnect** (`src/components/WalletConnect.tsx`): MetaMask connection component
- **Main Page** (`src/app/page.tsx`): Main application interface

### Smart Contracts

- **Name0gRegistry**: Core registry for name ownership
- **Name0gRegistrar7857**: ERC-7857 compatible registrar for name registration
- **Name0gSimpleResolver**: Name resolution service
- **ReverseRegistrar**: Reverse resolution service

### API Routes

- `/api/contract-addresses`: Serves deployed contract addresses
- `/api/health`: Health check endpoint

## Development

### Adding New Features

1. **Blockchain Interactions**: Extend `BlockchainService` class
2. **UI Components**: Create new components in `src/components/`
3. **API Routes**: Add new routes in `src/app/api/`

### Testing

```bash
# Run linting
npm run lint

# Build for production
npm run build
```

## Configuration

### Environment Variables

Create a `.env.local` file in the web directory:

```env
NEXT_PUBLIC_CHAIN_ID=16601
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
```

### Contract Addresses

The application automatically loads contract addresses from the deployment script output (`.ins.addresses.json`). For local development, default addresses are used.

## Troubleshooting

### Common Issues

1. **MetaMask Not Installed**: Install the MetaMask browser extension
2. **Wrong Network**: Switch to the correct network (Chain ID: 16601)
3. **Insufficient Balance**: Ensure you have test ETH for transactions
4. **Contract Not Deployed**: Deploy smart contracts first

### Error Messages

- "MetaMask is not installed": Install MetaMask extension
- "Failed to connect wallet": Check MetaMask permissions
- "Transaction failed": Check balance and network settings
- "Name already taken": Choose a different name

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
