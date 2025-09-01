import { ethers } from 'ethers';
import { ogStorageBrowserService, NameMetadata } from './0g-storage-browser';
import { addressMappingService, NFTMetadata } from './address-mapping';

// Contract ABIs (simplified versions of the main functions we need)
const REGISTRY_ABI = [
  "function owners(bytes32) view returns (address)",
  "function resolvers(bytes32) view returns (address)",
  "function ttls(bytes32) view returns (uint64)"
];

const REGISTRAR_ABI = [
  "function nodeToTokenId(bytes32) view returns (uint256)",
  "function tokenIdToNode(uint256) view returns (bytes32)",
  "function priceWei() view returns (uint256)",
  "function purchase(string label, address resolver_, uint64 ttl, string encryptedURI, bytes32 metadataHash) payable returns (uint256 tokenId)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  // ERC7857 dynamism functions
  "function getMetadataHash(uint256 tokenId) view returns (bytes32)",
  "function getEncryptedURI(uint256 tokenId) view returns (string)",
  "function updateMetadata(uint256 tokenId, string newEncryptedURI, bytes32 newHash)",
  "function authorizeUsage(uint256 tokenId, address executor, bytes permissions)",
  "function transfer(address from, address to, uint256 tokenId, bytes sealedKey, bytes proof)",
  // Events for dynamism
  "event MetadataUpdated(uint256 indexed tokenId, bytes32 newHash)",
  "event UsageAuthorized(uint256 indexed tokenId, address indexed executor)",
  // Registration events
  "event NameRegistered(uint256 indexed tokenId, address indexed owner, string name, uint256 price)"
];

export interface ContractAddresses {
  registry: string;
  registrar: string;
  resolver: string;
  reverse: string;
  baseNode: string;
}

export class BlockchainService {
  private provider: ethers.BrowserProvider | ethers.JsonRpcProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  private registry: ethers.Contract | null = null;
  private registrar: ethers.Contract | null = null;
  private addresses: ContractAddresses | null = null;

  async initialize(): Promise<void> {
    if (typeof window === 'undefined') return;

    console.log('🔄 Starting blockchain service initialization...');

    // Load contract addresses first
    try {
      console.log('📡 Loading contract addresses...');
      const response = await fetch('/api/contract-addresses');
      this.addresses = await response.json();
      console.log('✅ Loaded contract addresses:', this.addresses);
    } catch (error) {
      console.error('❌ Could not load contract addresses:', error);
      throw new Error('Contracts not deployed or not accessible');
    }

    // Check if MetaMask is installed
    if (!window.ethereum) {
      console.warn('⚠️ MetaMask is not installed, using read-only mode');
      // Create read-only provider for 0G testnet
      this.provider = new ethers.JsonRpcProvider('https://evmrpc-testnet.0g.ai/');
      
      // Initialize contracts in read-only mode
      if (this.addresses) {
        this.registry = new ethers.Contract(this.addresses.registry, REGISTRY_ABI, this.provider);
        this.registrar = new ethers.Contract(this.addresses.registrar, REGISTRAR_ABI, this.provider);
        console.log('✅ Read-only contracts initialized');
      }
      return;
    }

    try {
      console.log('🔗 Connecting to MetaMask...');
      
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      console.log('✅ MetaMask account access granted');

      // Create provider and signer using MetaMask
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      this.provider = browserProvider;
      this.signer = await browserProvider.getSigner();
      console.log('✅ Provider and signer created');

      // Check if we're on the correct network (0G testnet)
      const network = await this.provider.getNetwork();
      console.log('Current network:', network);
      
      // 0G testnet chain ID is 0x40d9 (16601 in decimal)
      const OG_TESTNET_CHAIN_ID = 16601n;
      
      if (network.chainId !== OG_TESTNET_CHAIN_ID) {
        console.warn(`Not on 0G testnet (current: ${network.chainId}, required: ${OG_TESTNET_CHAIN_ID}), attempting to switch...`);
        
        // First, try to add the network if it doesn't exist
        try {
          console.log('Attempting to add 0G testnet to MetaMask...');
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x40d9',
              chainName: '0G Testnet (Galileo)',
              nativeCurrency: {
                name: '0G',
                symbol: '0G',
                decimals: 18
              },
              rpcUrls: ['https://evmrpc-testnet.0g.ai/'],
              blockExplorerUrls: ['https://testnet.0g.ai/']
            }]
          });
          console.log('✅ Successfully added 0G testnet to MetaMask');
        } catch (addError: any) {
          if (addError.code === 4001) {
            console.warn('User rejected adding 0G testnet');
            throw new Error('Please manually add 0G testnet to MetaMask and try again');
          } else if (addError.code === -32602) {
            console.log('0G testnet already exists, trying to switch...');
          } else {
            console.warn('Could not add 0G testnet:', addError);
          }
        }
        
        // Now try to switch to the network
        try {
          console.log('Attempting to switch to 0G testnet...');
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x40d9' }], // 0x40d9 = 16601 in hex
          });
          console.log('✅ Successfully switched to 0G testnet');
          
          // Re-create provider and signer after network switch
          const newProvider = new ethers.BrowserProvider(window.ethereum);
          this.provider = newProvider;
          this.signer = await newProvider.getSigner();
          console.log('✅ Re-created provider and signer after network switch');
          
        } catch (switchError: any) {
          if (switchError.code === 4001) {
            console.warn('User rejected switching to 0G testnet');
            throw new Error('Please manually switch to 0G testnet in MetaMask and try again');
          } else {
            console.warn('Could not switch to 0G testnet:', switchError);
            throw new Error('Please manually switch to 0G testnet in MetaMask. You can add it with: Chain ID: 16601, RPC URL: https://evmrpc-testnet.0g.ai/, Explorer: https://testnet.0g.ai/');
          }
        }
      } else {
        console.log('✅ Already on 0G testnet');
      }

      // Initialize 0G Storage service
      await ogStorageBrowserService.initialize();

      // Initialize contracts
      if (this.addresses) {
        console.log('📋 Initializing contracts...');
        this.registry = new ethers.Contract(this.addresses.registry, REGISTRY_ABI, this.provider);
        this.registrar = new ethers.Contract(this.addresses.registrar, REGISTRAR_ABI, this.provider);
        console.log('✅ Contracts initialized');
      } else {
        console.error('❌ No contract addresses available');
      }
    } catch (error) {
      console.warn('⚠️ Could not initialize blockchain service with MetaMask:', error);
      console.log('🔄 Falling back to read-only mode...');
      
      // Fallback to read-only mode
      this.provider = new ethers.JsonRpcProvider('https://evmrpc-testnet.0g.ai/');
      this.signer = null; // No signer in read-only mode
      
      if (this.addresses) {
        this.registry = new ethers.Contract(this.addresses.registry, REGISTRY_ABI, this.provider);
        this.registrar = new ethers.Contract(this.addresses.registrar, REGISTRAR_ABI, this.provider);
        console.log('✅ Read-only contracts initialized (fallback)');
      }
    }
    
    console.log('🎉 Blockchain service initialization complete');
    console.log('Provider:', this.provider ? '✅ Available' : '❌ Not available');
    console.log('Signer:', this.signer ? '✅ Available' : '❌ Not available');
    console.log('Registrar:', this.registrar ? '✅ Available' : '❌ Not available');
    console.log('Registry:', this.registry ? '✅ Available' : '❌ Not available');
  }

  private namehash(name: string): string {
    let node = ethers.ZeroHash;
    if (name) {
      const labels = name.split('.');
      for (let i = labels.length - 1; i >= 0; i--) {
        const labelHash = ethers.keccak256(ethers.toUtf8Bytes(labels[i]));
        const coder = ethers.AbiCoder.defaultAbiCoder();
        node = ethers.keccak256(coder.encode(['bytes32', 'bytes32'], [node, labelHash]));
      }
    }
    return node;
  }

  async checkNameAvailability(name: string): Promise<{ isAvailable: boolean; owner?: string; price?: bigint }> {
    // Auto-initialize if not already initialized
    if (!this.registrar || !this.addresses) {
      try {
        await this.initialize();
      } catch (error) {
        console.warn('Could not initialize blockchain service:', error);
        throw new Error('Blockchain service not available. Please ensure MetaMask is connected and contracts are deployed.');
      }
    }

    // Check if contracts are actually deployed and accessible
    if (!this.registrar || !this.addresses) {
      throw new Error('Contracts not deployed or not accessible. Please deploy the contracts first.');
    }

    // Normalize name to lowercase for case-insensitive checking
    const normalizedName = name.toLowerCase();

    // Create the full namehash for the label
    const labelHash = ethers.keccak256(ethers.toUtf8Bytes(normalizedName));
    const node = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(['bytes32', 'bytes32'], [this.addresses!.baseNode, labelHash]));

    try {
      // First check if the contract is deployed by trying to get the price
      const price = await this.registrar!.priceWei();
      
      // Check if the node is already registered
      const tokenId = await this.registrar!.nodeToTokenId(node);
      
      if (tokenId === 0n) {
        // Name is available
        return {
          isAvailable: true,
          price
        };
      } else {
        // Name is taken, get the owner
        const owner = await this.registrar!.ownerOf(tokenId);
        return {
          isAvailable: false,
          owner
        };
      }
    } catch (error) {
      console.error('Could not check name availability on blockchain:', error);
      
      // Check if this is a contract not deployed error
      if (error instanceof Error && error.message.includes('BAD_DATA')) {
        throw new Error('Contracts not deployed or not accessible. Please deploy the contracts first.');
      }
      
      throw new Error(`Failed to check name availability: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async registerName(
    name: string, 
    resolver: string = ethers.ZeroAddress,
    ttl: number = 0,
    encryptedURI: string = '',
    metadataHash: string = ethers.ZeroHash
  ): Promise<{ hash: string; tokenId?: string; metadataHash?: string; encryptedURI?: string }> {
    // Auto-initialize if not already initialized
    if (!this.registrar || !this.signer) {
      console.log('🔄 Auto-initializing blockchain service for registration...');
      try {
        await this.initialize();
      } catch (error) {
        console.error('Failed to auto-initialize for registration:', error);
        throw new Error('Blockchain service not initialized. Please ensure MetaMask is connected and contracts are deployed.');
      }
    }
    
    if (!this.registrar || !this.signer) {
      throw new Error('Blockchain service not initialized. Please ensure MetaMask is connected and contracts are deployed.');
    }

    try {
      // Normalize name to lowercase for case-insensitive registration
      const normalizedName = name.toLowerCase();
      const price = await this.registrar.priceWei();
      
      // If no metadata provided, automatically create and upload to 0G Storage
      let finalEncryptedURI = encryptedURI;
      let finalMetadataHash = metadataHash;
      
      if (!encryptedURI || metadataHash === ethers.ZeroHash) {
        try {
          // Get user address
          const userAddress = await this.signer.getAddress();
          
          // Generate encryption key from user's wallet
          const encryptionKey = await ogStorageBrowserService.generateEncryptionKey(userAddress);
          
          // Create initial metadata for the purchased name
          const initialMetadata: NameMetadata = {
            displayName: normalizedName.charAt(0).toUpperCase() + normalizedName.slice(1), // Capitalize first letter
            bio: `Welcome to ${normalizedName}.0g! This is your personal profile.`,
            avatar: "", // No avatar initially
            socialLinks: {
              twitter: "",
              github: "",
              website: "",
              telegram: ""
            },
            location: "",
            status: "Active",
            lastUpdated: Date.now(),
            version: "1.0.0"
          };
          
          // Upload initial metadata to 0G Storage
          const uploadResult = await ogStorageBrowserService.uploadNameMetadata(
            normalizedName,
            initialMetadata,
            encryptionKey
          );
          
          // Store reference in 0G KV for quick access
          await ogStorageBrowserService.storeMetadataInKV(
            name,
            uploadResult.metadataHash,
            uploadResult.rootHash
          );
          
          finalEncryptedURI = uploadResult.encryptedURI;
          finalMetadataHash = uploadResult.metadataHash;
          
          console.log(`✅ Auto-uploaded metadata to 0G Storage for ${name}.0g`);
        } catch (error) {
          console.error('Error auto-uploading metadata to 0G Storage:', error);
          // Continue with empty metadata if 0G Storage fails
        }
      }
      
      // Create contract instance with signer
      const registrarWithSigner = this.registrar.connect(this.signer) as ethers.Contract;
      
      // Purchase the name with metadata
      const tx = await registrarWithSigner.purchase(
        normalizedName,
        resolver,
        ttl,
        finalEncryptedURI,
        finalMetadataHash,
        { value: price }
      );
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      if (receipt?.status === 1) {
        // Try to get the token ID from the transaction
        let tokenId: string | undefined;
        try {
                  // Get the token ID by checking the node mapping after registration
        const labelHash = ethers.keccak256(ethers.toUtf8Bytes(normalizedName));
        const node = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(['bytes32', 'bytes32'], [this.addresses?.baseNode, labelHash]));
        const tokenIdBigInt = await this.registrar.nodeToTokenId(node);
          tokenId = tokenIdBigInt === 0n ? undefined : tokenIdBigInt.toString();
        } catch (error) {
          console.warn('Could not retrieve token ID:', error);
        }

        return { 
          hash: receipt.hash, 
          tokenId,
          metadataHash: finalMetadataHash,
          encryptedURI: finalEncryptedURI
        };
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error) {
      console.error('Could not register name on blockchain:', error);
      throw new Error(`Failed to register name: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getConnectedAddress(): Promise<string | null> {
    if (!this.signer) return null;
    return await this.signer.getAddress();
  }

  async isConnected(): Promise<boolean> {
    // Auto-initialize if not already initialized
    if (!this.provider) {
      console.log('🔄 Auto-initializing blockchain service...');
      try {
        await this.initialize();
      } catch (error) {
        console.error('Failed to auto-initialize:', error);
        return false;
      }
    }
    
    if (!this.provider) {
      console.log('❌ No provider available');
      return false;
    }
    
    try {
      // Try multiple methods to check if wallet is connected
      
      // Method 1: Check if we have a signer
      if (this.signer) {
        console.log('✅ Signer available');
        return true;
      }
      
      // Method 2: Check if MetaMask is connected
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[];
        console.log('MetaMask accounts:', accounts);
        if (accounts && accounts.length > 0) {
          console.log('✅ MetaMask connected with accounts');
          return true;
        }
      }
      
      // Method 3: Try provider.listAccounts()
      try {
        const accounts = await this.provider.listAccounts();
        console.log('Provider accounts:', accounts);
        return accounts.length > 0;
      } catch (providerError) {
        console.warn('Provider.listAccounts() failed:', providerError);
      }
      
      console.log('❌ No wallet connection found');
      return false;
    } catch (error) {
      console.error('Error checking wallet connection:', error);
      return false;
    }
  }

  async areContractsDeployed(): Promise<boolean> {
    try {
      if (!this.addresses) {
        console.log('❌ No contract addresses available');
        return false;
      }

      console.log('🔍 Testing contract deployment...');
      
      // Test registry contract
      if (this.registry) {
        try {
          // Try to call a simple view function
          await this.registry.owners(ethers.ZeroHash);
          console.log('✅ Registry contract is accessible');
        } catch (error) {
          console.error('❌ Registry contract not accessible:', error);
          return false;
        }
      }

      // Test registrar contract
      if (this.registrar) {
        try {
          // Try to get the price
          const price = await this.registrar.priceWei();
          console.log(`✅ Registrar contract is accessible, price: ${ethers.formatEther(price)} OG`);
        } catch (error) {
          console.error('❌ Registrar contract not accessible:', error);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('❌ Error checking contract deployment:', error);
      return false;
    }
  }

  async testContractConnection(): Promise<{ registry: boolean; registrar: boolean; price?: string }> {
    const result = {
      registry: false,
      registrar: false,
      price: undefined as string | undefined
    };

    try {
      // Test registry
      if (this.registry) {
        try {
          await this.registry.owners(ethers.ZeroHash);
          result.registry = true;
        } catch (error) {
          console.error('Registry test failed:', error);
        }
      }

      // Test registrar
      if (this.registrar) {
        try {
          const price = await this.registrar.priceWei();
          result.registrar = true;
          result.price = ethers.formatEther(price);
        } catch (error) {
          console.error('Registrar test failed:', error);
        }
      }

      return result;
    } catch (error) {
      console.error('Contract connection test failed:', error);
      return result;
    }
  }

  async getNetworkInfo(): Promise<{ chainId: bigint; name: string } | null> {
    if (!this.provider) return null;
    try {
      const network = await this.provider.getNetwork();
      return network;
    } catch {
      return null;
    }
  }

  async withdrawFees(toAddress: string): Promise<string> {
    if (!this.registrar || !this.signer) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const registrarWithSigner = this.registrar.connect(this.signer) as ethers.Contract;
      
      // Call the withdraw function
      const tx = await registrarWithSigner.withdraw(toAddress);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      if (receipt?.status === 1) {
        return receipt.hash;
      } else {
        throw new Error('Withdrawal transaction failed');
      }
    } catch (error) {
      console.error('Error withdrawing fees:', error);
      throw error;
    }
  }

  async getContractBalance(): Promise<bigint> {
    if (!this.registrar) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const balance = await this.provider?.getBalance(await this.registrar.getAddress());
      return balance || 0n;
    } catch (error) {
      console.error('Error getting contract balance:', error);
      throw error;
    }
  }

  async setPrice(newPriceWei: bigint): Promise<string> {
    if (!this.registrar || !this.signer) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const registrarWithSigner = this.registrar.connect(this.signer) as ethers.Contract;
      
      // Call the setPrice function
      const tx = await registrarWithSigner.setPrice(newPriceWei);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      if (receipt?.status === 1) {
        return receipt.hash;
      } else {
        throw new Error('Price update transaction failed');
      }
    } catch (error) {
      console.error('Error setting price:', error);
      throw error;
    }
  }

  async isContractOwner(): Promise<boolean> {
    if (!this.registrar || !this.signer) {
      return false;
    }

    try {
      const signerAddress = await this.signer.getAddress();
      const owner = await this.registrar.owner();
      return signerAddress.toLowerCase() === owner.toLowerCase();
    } catch (error) {
      console.error('Error checking contract ownership:', error);
      return false;
    }
  }

  async getUserProfile(): Promise<{ name: string; tokenId: string } | null> {
    if (!this.registrar || !this.signer) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const address = await this.signer.getAddress();
      console.log('🔍 Getting user profile for address:', address);
      
      // Method 1: Try to get from recent events first
      try {
        const events = await this.getRegistrationEvents();
        console.log('📋 Found registration events:', events.length);
        
        // Find the most recent registration by this address
        const userRegistration = events.find(event => 
          event.buyer.toLowerCase() === address.toLowerCase()
        );
        
        console.log('👤 User registration found in events:', userRegistration);
        
        if (userRegistration) {
          // Get the token ID for this registration
          const labelHash = ethers.keccak256(ethers.toUtf8Bytes(userRegistration.name));
          const node = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(['bytes32', 'bytes32'], [this.addresses?.baseNode, labelHash]));
          const tokenId = await this.registrar!.nodeToTokenId(node);
          
          const profile = {
            name: userRegistration.name,
            tokenId: tokenId.toString()
          };
          
          console.log('✅ User profile created from events:', profile);
          return profile;
        }
      } catch (eventError) {
        console.warn('Could not get user profile from events:', eventError);
      }
      
      // Method 2: Try to get from the registry contract directly
      try {
        console.log('🔍 Trying to get profile from registry contract...');
        
        // Get the registry contract
        if (!this.registry) {
          console.warn('Registry contract not available');
          return null;
        }
        
        // Method 2a: Try to get user's NFTs from the registrar contract
        try {
          console.log('🔍 Scanning for user NFTs...');
          
          // Get all user NFTs
          const userNFTs = await this.getUserNFTs();
          console.log('📊 User NFTs found:', userNFTs.length);
          
          if (userNFTs.length > 0) {
            // Return the first NFT as the primary profile
            const primaryNFT = userNFTs[0];
            const profile = {
              name: primaryNFT.name,
              tokenId: primaryNFT.tokenId
            };
            
            console.log('✅ User profile found from NFT scan:', profile);
            return profile;
          }
        } catch (nftError) {
          console.warn('Could not get user NFTs:', nftError);
        }
        
        // Method 2b: Fallback to checking common names (limited approach)
        console.log('🔍 Fallback: Checking common names...');
        const commonNames = ['alice', 'bob', 'charlie', 'david', 'eve', 'frank', 'grace', 'henry', 'iris', 'jack'];
        
        for (const name of commonNames) {
          try {
            const labelHash = ethers.keccak256(ethers.toUtf8Bytes(name));
            const node = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(['bytes32', 'bytes32'], [this.addresses?.baseNode, labelHash]));
            
            // Check if this node is owned by the current address
            const owner = await this.registry.owners(node);
            console.log(`Checking ownership of ${name}.0g: ${owner} vs ${address}`);
            
            if (owner.toLowerCase() === address.toLowerCase()) {
              // Get the token ID
              const tokenId = await this.registrar!.nodeToTokenId(node);
              
              const profile = {
                name: name,
                tokenId: tokenId.toString()
              };
              
              console.log('✅ User profile found from registry:', profile);
              return profile;
            }
          } catch (nameError) {
            console.warn(`Could not check ownership of ${name}:`, nameError);
          }
        }
      } catch (registryError) {
        console.warn('Could not get user profile from registry:', registryError);
      }
      
      console.log('❌ No user registration found');
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw new Error(`Failed to get user profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getFeeData(): Promise<{
    contractBalance: bigint;
    currentPrice: bigint;
    totalRegistrations: number;
    recentTransactions: Array<{
      hash: string;
      name: string;
      price: bigint;
      buyer: string;
      timestamp: string;
    }>;
  }> {
    if (!this.registrar) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      // Get contract balance
      const contractBalance = await this.getContractBalance();
      
      // Get current price
      const currentPrice = await this.registrar.priceWei();
      
      // Get total registrations by checking the next token ID
      // Note: This assumes the contract has a public _nextId variable
      // If not, we would need to query events or use a different method
      let totalRegistrations = 0;
      try {
        // Try to get the next token ID if the contract exposes it
        const nextId = await (this.registrar as ethers.Contract)._nextId();
        totalRegistrations = Number(nextId - 1n);
      } catch {
        // Fallback: count from events or use a different method
        const events = await this.getRegistrationEvents();
        totalRegistrations = events.length;
      }
      
      // Get recent transactions from blockchain events
      const recentTransactions = await this.getRegistrationEvents();
      
      return {
        contractBalance,
        currentPrice,
        totalRegistrations,
        recentTransactions
      };
    } catch (error) {
      console.error('Error getting fee data:', error);
      throw error;
    }
  }

  async getRegistrationEvents(fromBlock?: number, toBlock?: number): Promise<Array<{
    hash: string;
    name: string;
    price: bigint;
    buyer: string;
    timestamp: string;
    blockNumber: number;
  }>> {
    if (!this.registrar || !this.provider) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      // Check if the contract has the NameRegistered event
      if (!this.registrar.filters.NameRegistered) {
        console.warn('NameRegistered event not found in contract ABI, returning empty events');
        return [];
      }
      
      // Get NameRegistered events with a reasonable block range
      const filter = this.registrar.filters.NameRegistered();
      
      // Use a more reasonable block range to avoid RPC errors
      const currentBlock = await this.provider!.getBlockNumber();
      const fromBlockNumber = fromBlock || Math.max(0, currentBlock - 10000); // Last 10k blocks
      const toBlockNumber = toBlock || currentBlock;
      
      console.log(`Querying events from block ${fromBlockNumber} to ${toBlockNumber}`);
      const events = await this.registrar.queryFilter(filter, fromBlockNumber, toBlockNumber);
      
      console.log(`Found ${events.length} NameRegistered events`);
      
      const transactions = await Promise.all(
        events.map(async (event, index) => {
          console.log(`Processing event ${index + 1}/${events.length}:`, event);
          
          const block = await this.provider!.getBlock(event.blockNumber);
          
          // Get transaction details to extract name and price
          let name = '';
          let price = 0n;
          let buyer = '';
          
          try {
            // Get transaction details to get the actual value sent
            const tx = await this.provider!.getTransaction(event.transactionHash);
            if (tx) {
              price = tx.value || 0n;
              buyer = tx.from || '';
            }
            
            // Try to decode the event properly
            try {
              // The NameRegistered event has this signature:
              // event NameRegistered(bytes32 indexed node, uint256 indexed tokenId, address owner, address resolver)
              
              // Extract the owner (buyer) from the event
              if (event.topics && event.topics.length >= 3) {
                // The owner address should be in the event data (not indexed)
                // Let's try to decode the event data
                const eventData = event.data;
                if (eventData && eventData.length >= 66) { // 0x + 32 bytes for owner + 32 bytes for resolver
                  // Extract owner address (first 32 bytes after 0x)
                  const ownerHex = eventData.slice(2, 66); // Remove 0x and get first 32 bytes
                  buyer = '0x' + ownerHex.slice(24); // Remove padding and get the address
                }
              }
              
              // For the name, we need to decode it from the node
              // The node is keccak256(baseNode + keccak256(name))
              // We can't easily reverse this, so we'll try to get it from the transaction input
              try {
                const tx = await this.provider!.getTransaction(event.transactionHash);
                if (tx && tx.data) {
                  // The purchase function signature is:
                  // purchase(string label, address resolver_, uint64 ttl, string encryptedURI, bytes32 metadataHash)
                  
                  // Try to decode the function call data
                  const purchaseFunctionSelector = '0x' + ethers.keccak256(ethers.toUtf8Bytes('purchase(string,address,uint64,string,bytes32)')).slice(2, 10);
                  
                  if (tx.data.startsWith(purchaseFunctionSelector)) {
                    // Remove function selector
                    const encodedData = tx.data.slice(10);
                    
                    // Try to decode the first parameter (string label)
                    try {
                      // The string is encoded as: offset (32 bytes) + length (32 bytes) + data
                      const offset = parseInt(encodedData.slice(0, 64), 16);
                      const length = parseInt(encodedData.slice(64, 128), 16);
                      const nameData = encodedData.slice(128, 128 + length * 2);
                      
                      // Convert hex to string
                      name = ethers.toUtf8String('0x' + nameData);
                      console.log(`✅ Decoded name from transaction: ${name}`);
                    } catch (decodeError) {
                      console.warn('Could not decode name from transaction data:', decodeError);
                    }
                  }
                }
              } catch (txError) {
                console.warn('Could not get transaction data:', txError);
              }
              
              // If we still don't have a name, try to get it from the token URI
              if (!name) {
                try {
                  // Get the token ID from the event
                  if (event.topics && event.topics.length >= 2) {
                    const tokenIdHex = event.topics[2]; // tokenId is the second indexed parameter
                    const tokenId = parseInt(tokenIdHex, 16);
                    
                                         // Get the token URI
                     const tokenURI = await this.registrar!.tokenURI(tokenId);
                    if (tokenURI.startsWith('data:application/json;base64,')) {
                      const jsonB64 = tokenURI.replace('data:application/json;base64,', '');
                      const jsonStr = ethers.toUtf8String(ethers.getBytes('0x' + Buffer.from(jsonB64, 'base64').toString('hex')));
                      const tokenData = JSON.parse(jsonStr);
                      
                      if (tokenData.name && tokenData.name.endsWith('.0g')) {
                        name = tokenData.name.replace('.0g', '');
                        console.log(`✅ Got name from token URI: ${name}`);
                      }
                    }
                  }
                } catch (uriError) {
                  console.warn('Could not get name from token URI:', uriError);
                }
              }
              
            } catch (decodeError) {
              console.warn('Could not decode event properly:', decodeError);
            }
            
          } catch (error) {
            console.warn('Could not get transaction details:', error);
          }
          
          // Fallback: if we still don't have a name, use a placeholder
          if (!name) {
            name = `name_${event.blockNumber}`;
          }
          
          // Fallback: if we still don't have a buyer, use the transaction hash
          if (!buyer) {
            buyer = event.transactionHash.slice(0, 10) + '...';
          }
          
          const result = {
            hash: event.transactionHash,
            name,
            price,
            buyer,
            timestamp: block ? new Date(Number(block.timestamp) * 1000).toISOString() : new Date().toISOString(),
            blockNumber: event.blockNumber
          };
          
          console.log(`Event ${index + 1} result:`, result);
          return result;
        })
      );
      
      console.log('Final transactions:', transactions);
      return transactions;
    } catch (error) {
      console.error('Error getting registration events:', error);
      return [];
    }
  }

  // ERC7857 Dynamism Methods

  async getMetadataHash(tokenId: string): Promise<string> {
    if (!this.registrar) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const hash = await this.registrar.getMetadataHash(tokenId);
      return hash;
    } catch (error) {
      console.error('Error getting metadata hash:', error);
      throw error;
    }
  }

  async getEncryptedURI(tokenId: string): Promise<string> {
    if (!this.registrar) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const uri = await this.registrar.getEncryptedURI(tokenId);
      return uri;
    } catch (error) {
      console.error('Error getting encrypted URI:', error);
      throw error;
    }
  }

  async updateMetadata(
    tokenId: string, 
    newEncryptedURI: string, 
    newHash: string
  ): Promise<string> {
    if (!this.registrar || !this.signer) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const registrarWithSigner = this.registrar.connect(this.signer) as ethers.Contract;
      
      // Update the metadata
      const tx = await registrarWithSigner.updateMetadata(tokenId, newEncryptedURI, newHash);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      if (receipt?.status === 1) {
        return receipt.hash;
      } else {
        throw new Error('Metadata update transaction failed');
      }
    } catch (error) {
      console.error('Error updating metadata:', error);
      throw error;
    }
  }

  // 0G Storage Integrated Methods

  /**
   * Update name metadata using 0G Storage
   */
  async updateNameMetadata(
    name: string,
    tokenId: string,
    metadata: NameMetadata
  ): Promise<{
    txHash: string;
    encryptedURI: string;
    metadataHash: string;
    rootHash: string;
  }> {
    if (!this.signer) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      // Get user address
      const userAddress = await this.signer.getAddress();
      
      // Generate encryption key from user's wallet
      const encryptionKey = await ogStorageBrowserService.generateEncryptionKey(userAddress);
      
      // Upload metadata to 0G Storage
      const uploadResult = await ogStorageBrowserService.uploadNameMetadata(
        name,
        metadata,
        encryptionKey
      );
      
      // Update the NFT metadata on-chain
      const txHash = await this.updateMetadata(
        tokenId,
        uploadResult.encryptedURI,
        uploadResult.metadataHash
      );
      
      // Store reference in 0G KV for quick access
      await ogStorageBrowserService.storeMetadataInKV(
        name,
        uploadResult.metadataHash,
        uploadResult.rootHash
      );
      
      return {
        txHash,
        encryptedURI: uploadResult.encryptedURI,
        metadataHash: uploadResult.metadataHash,
        rootHash: uploadResult.rootHash
      };
    } catch (error) {
      console.error('Error updating name metadata:', error);
      throw error;
    }
  }

  /**
   * Get name metadata from 0G Storage
   */
  async getNameMetadata(
    name: string,
    tokenId: string
  ): Promise<NameMetadata | null> {
    if (!this.signer) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      // Get user address
      const userAddress = await this.signer.getAddress();
      
      // Generate encryption key
      const encryptionKey = await ogStorageBrowserService.generateEncryptionKey(userAddress);
      
      // Try to get metadata reference from KV first
      const kvReference = await ogStorageBrowserService.getMetadataFromKV(name);
      
      if (kvReference) {
        // Download metadata from 0G Storage using root hash
        const metadata = await ogStorageBrowserService.downloadNameMetadata(
          kvReference.rootHash,
          encryptionKey
        );
        return metadata;
      } else {
        // Fallback: get from on-chain data
        const encryptedURI = await this.registrar?.getEncryptedURI(tokenId);
        if (encryptedURI && encryptedURI.startsWith('og://storage/')) {
          const rootHash = encryptedURI.replace('og://storage/', '');
          const metadata = await ogStorageBrowserService.downloadNameMetadata(
            rootHash,
            encryptionKey
          );
          return metadata;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting name metadata:', error);
      return null;
    }
  }

  /**
   * Upload avatar to 0G Storage
   */
  async uploadAvatar(
    name: string,
    imageFile: File
  ): Promise<{
    avatarURI: string;
    rootHash: string;
    txHash: string;
  }> {
    try {
      const result = await ogStorageBrowserService.uploadAvatar(name, imageFile);
      return result;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  }

  /**
   * Get avatar from 0G Storage
   */
  async getAvatar(rootHash: string): Promise<Blob | null> {
    try {
      const avatar = await ogStorageBrowserService.getAvatar(rootHash);
      return avatar;
    } catch (error) {
      console.error('Error getting avatar:', error);
      return null;
    }
  }

  /**
   * Verify file integrity using 0G Storage Merkle proofs
   */
  async verifyFileIntegrity(rootHash: string): Promise<boolean> {
    try {
      const isValid = await ogStorageBrowserService.verifyFileIntegrity(rootHash);
      return isValid;
    } catch (error) {
      console.error('Error verifying file integrity:', error);
      return false;
    }
  }

  async authorizeUsage(
    tokenId: string, 
    executor: string, 
    permissions: string
  ): Promise<string> {
    if (!this.registrar || !this.signer) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const registrarWithSigner = this.registrar.connect(this.signer) as ethers.Contract;
      
      // Convert permissions string to bytes
      const permissionsBytes = ethers.toUtf8Bytes(permissions);
      
      // Authorize usage
      const tx = await registrarWithSigner.authorizeUsage(tokenId, executor, permissionsBytes);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      if (receipt?.status === 1) {
        return receipt.hash;
      } else {
        throw new Error('Usage authorization transaction failed');
      }
    } catch (error) {
      console.error('Error authorizing usage:', error);
      throw error;
    }
  }

  async transferWithMetadata(
    from: string,
    to: string,
    tokenId: string,
    sealedKey: string,
    proof: string = '0x'
  ): Promise<string> {
    if (!this.registrar || !this.signer) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const registrarWithSigner = this.registrar.connect(this.signer) as ethers.Contract;
      
      // Convert sealedKey string to bytes
      const sealedKeyBytes = ethers.toUtf8Bytes(sealedKey);
      const proofBytes = ethers.toUtf8Bytes(proof);
      
      // Transfer with metadata update
      const tx = await registrarWithSigner.transfer(from, to, tokenId, sealedKeyBytes, proofBytes);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      if (receipt?.status === 1) {
        return receipt.hash;
      } else {
        throw new Error('Transfer transaction failed');
      }
    } catch (error) {
      console.error('Error transferring with metadata:', error);
      throw error;
    }
  }

  async getMetadataUpdateEvents(
    tokenId?: string,
    fromBlock?: number,
    toBlock?: number
  ): Promise<Array<{
    tokenId: string;
    newHash: string;
    timestamp: string;
    blockNumber: number;
    transactionHash: string;
  }>> {
    if (!this.registrar || !this.provider) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      // Get MetadataUpdated events
      const filter = tokenId 
        ? this.registrar.filters.MetadataUpdated(tokenId)
        : this.registrar.filters.MetadataUpdated();
      
      const events = await this.registrar.queryFilter(filter, fromBlock, toBlock);
      
      const metadataUpdates = await Promise.all(
        events.map(async (event) => {
          const block = await this.provider!.getBlock(event.blockNumber);
          
          // Type guard to check if event has args
          const eventLog = event as ethers.EventLog;
          
          return {
            tokenId: eventLog.args?.[0]?.toString() || '',
            newHash: eventLog.args?.[1] || '',
            timestamp: block ? new Date(Number(block.timestamp) * 1000).toISOString() : new Date().toISOString(),
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash
          };
        })
      );
      
      return metadataUpdates;
    } catch (error) {
      console.error('Error getting metadata update events:', error);
      return [];
    }
  }

  async getCurrentMetadataState(tokenId: string): Promise<{
    metadataHash: string;
    encryptedURI: string;
    tokenURI: string;
    owner: string;
  }> {
    if (!this.registrar) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const [metadataHash, encryptedURI, tokenURI, owner] = await Promise.all([
        this.registrar.getMetadataHash(tokenId),
        this.registrar.getEncryptedURI(tokenId),
        this.registrar.tokenURI(tokenId),
        this.registrar.ownerOf(tokenId)
      ]);

      return {
        metadataHash,
        encryptedURI,
        tokenURI,
        owner
      };
    } catch (error) {
      console.error('Error getting current metadata state:', error);
      throw error;
    }
  }

  // Owner-Based Intelligence Methods

  async getOwnerIntelligenceData(ownerAddress: string): Promise<{
    socialScore: number;
    reputationScore: number;
    transactionCount: number;
    location: string;
    lastActive: string;
    nftInteractionCount: number;
  }> {
    if (!this.registrar) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      // Get real transaction count from blockchain
      const events = await this.getRegistrationEvents();
      const transactionCount = events.filter(event => 
        event.buyer.toLowerCase() === ownerAddress.toLowerCase()
      ).length;
      
      // Get recent activity timestamp
      const userEvents = events.filter(event => 
        event.buyer.toLowerCase() === ownerAddress.toLowerCase()
      );
      const lastActive = userEvents.length > 0 
        ? userEvents[userEvents.length - 1].timestamp 
        : new Date().toISOString();
      
      // For now, return real blockchain data where available
      // In a full implementation, you would integrate with the OwnerIntelligenceOracle contract
      return {
        socialScore: 0, // Would come from oracle
        reputationScore: 0, // Would come from oracle
        transactionCount,
        location: 'Unknown', // Would come from oracle
        lastActive,
        nftInteractionCount: transactionCount // Using transaction count as proxy
      };
    } catch (error) {
      console.error('Error getting owner intelligence data:', error);
      throw new Error(`Failed to get owner intelligence data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async trackOwnerActivity(ownerAddress: string, activityType: 'social' | 'transaction' | 'interaction' | 'location'): Promise<void> {
    if (!this.registrar) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      // In a real implementation, this would call the oracle to track activity
      console.log(`Tracking ${activityType} activity for owner ${ownerAddress}`);
      
      // Simulate oracle call
      // await this.oracle.trackOwnerTransaction(ownerAddress);
    } catch (error) {
      console.error('Error tracking owner activity:', error);
      throw error;
    }
  }

  async updateOwnerSocialScore(ownerAddress: string, newScore: number): Promise<string> {
    if (!this.registrar || !this.signer) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      // In a real implementation, this would call the OwnerIntelligenceOracle contract
      // For now, we'll throw an error indicating this needs to be implemented
      throw new Error('OwnerIntelligenceOracle integration not yet implemented. This would update social scores on-chain.');
    } catch (error) {
      console.error('Error updating owner social score:', error);
      throw error;
    }
  }

  async updateOwnerReputation(ownerAddress: string, newReputation: number): Promise<string> {
    if (!this.registrar || !this.signer) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      // In a real implementation, this would call the OwnerIntelligenceOracle contract
      // For now, we'll throw an error indicating this needs to be implemented
      throw new Error('OwnerIntelligenceOracle integration not yet implemented. This would update reputation scores on-chain.');
    } catch (error) {
      console.error('Error updating owner reputation:', error);
      throw error;
    }
  }

  async getOwnerBasedUpdateEvents(
    ownerAddress?: string,
    fromBlock?: number,
    toBlock?: number
  ): Promise<Array<{
    tokenId: string;
    owner: string;
    updateType: string;
    reason: string;
    timestamp: string;
    transactionHash: string;
  }>> {
    if (!this.registrar || !this.provider) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      // In a real implementation, this would query OwnerBasedUpdate events from the OwnerIntelligenceOracle
      // For now, we'll return an empty array since the oracle integration is not yet implemented
      console.warn('OwnerIntelligenceOracle integration not yet implemented. Returning empty events array.');
      return [];
    } catch (error) {
      console.error('Error getting owner-based update events:', error);
      throw new Error(`Failed to get owner-based update events: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getNameFromTokenId(tokenId: string): Promise<string | null> {
    if (!this.registrar || !this.registry) {
      return null;
    }

    try {
      // Get the node for this token ID
      const node = await this.registrar.tokenIdToNode(tokenId);
      
      // Get the resolver for this node
      const resolver = await this.registry.resolvers(node);
      
      // The name is encoded in the node
      // We need to decode it from the node hash
      // This is a simplified approach - in production you'd want proper decoding
      
      // For now, let's try to get the name from the registry
      // The node is keccak256(baseNode + keccak256(name))
      // We can't easily reverse this, so we'll use a different approach
      
      // Try to get the name from the resolver or other contract methods
      // This is a placeholder - the actual implementation depends on the contract structure
      
      return `token_${tokenId}`;
    } catch (error) {
      console.warn(`Could not get name for token ID ${tokenId}:`, error);
      return null;
    }
  }

  async getUserNFTs(): Promise<Array<{
    name: string;
    tokenId: string;
    registrationDate: string;
    price: bigint;
  }>> {
    if (!this.registrar || !this.signer) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const address = await this.signer.getAddress();
      return await this.getNFTsForAddress(address);
    } catch (error) {
      console.error('Error getting user NFTs:', error);
      throw new Error(`Failed to get user NFTs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getNFTsForAddress(address: string): Promise<Array<{
    name: string;
    tokenId: string;
    registrationDate: string;
    price: bigint;
  }>> {
    // Use the address mapping service for fast queries
    const nfts = await addressMappingService.getNFTsForAddress(address, this);
    
    // Convert to the expected format
    return nfts.map(nft => ({
      name: nft.name,
      tokenId: nft.tokenId,
      registrationDate: nft.registrationDate,
      price: nft.price
    }));
  }

  async getNFTsForAddressWithMetadata(address: string): Promise<NFTMetadata[]> {
    if (!this.registrar) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      console.log('🔍 Getting all NFTs for address:', address);
      
      // Simple but reliable approach - scan tokens and get names from URIs
      console.log('🔄 Scanning tokens for ownership...');
      
      const userNFTs = [];
      const maxTokenId = 20; // Scan first 20 tokens (should be enough for most cases)
      
      console.log(`Scanning token IDs 1 to ${maxTokenId}...`);
      
      for (let i = 1; i <= maxTokenId; i++) {
        try {
          const owner = await this.registrar.ownerOf(i);
          
          if (owner.toLowerCase() === address.toLowerCase()) {
            console.log(`✅ Found token ${i} owned by ${address}`);
            
            // Get the name from token URI
            try {
              const tokenURI = await this.registrar.tokenURI(i);
              
              if (tokenURI.startsWith('data:application/json;base64,')) {
                const jsonB64 = tokenURI.replace('data:application/json;base64,', '');
                const jsonStr = ethers.toUtf8String(ethers.getBytes('0x' + Buffer.from(jsonB64, 'base64').toString('hex')));
                const tokenData = JSON.parse(jsonStr);
                
                if (tokenData.name && tokenData.name.endsWith('.0g')) {
                  const name = tokenData.name.replace('.0g', '');
                  
                  userNFTs.push({
                    name: name,
                    tokenId: i.toString(),
                    registrationDate: new Date().toISOString(),
                    price: 0n
                  });
                  
                  console.log(`✅ Found NFT: ${name}.0g (Token ID: ${i})`);
                }
              }
            } catch (uriError) {
              console.warn(`Could not get token URI for ${i}:`, uriError);
              
              // Fallback: use token ID as name
              userNFTs.push({
                name: `token_${i}`,
                tokenId: i.toString(),
                registrationDate: new Date().toISOString(),
                price: 0n
              });
            }
          }
        } catch (error) {
          // Token doesn't exist or other error, continue
          continue;
        }
      }
      
      console.log('❌ No NFTs found for address:', address);
      return [];
    } catch (error) {
      console.error('Error getting NFTs for address:', error);
      throw new Error(`Failed to get NFTs for address: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Address Mapping Utility Methods

  async updateAddressMapping(): Promise<void> {
    await addressMappingService.updateMapping(this);
  }

  async searchNFTsByName(name: string): Promise<NFTMetadata[]> {
    return addressMappingService.searchNFTsByName(name);
  }

  async getNFTByTokenId(tokenId: string): Promise<NFTMetadata | null> {
    return addressMappingService.getNFTByTokenId(tokenId);
  }

  async getAllAddressesWithNFTs(): Promise<string[]> {
    return addressMappingService.getAllAddresses();
  }

  async getMappingStats(): Promise<{
    totalAddresses: number;
    totalNFTs: number;
    lastUpdate: Date;
    cacheAge: number;
  }> {
    return addressMappingService.getStats();
  }

  async clearAddressMappingCache(): Promise<void> {
    addressMappingService.clearCache();
  }

  // Get contract addresses
  getContractAddresses(): ContractAddresses | null {
    return this.addresses;
  }

  // Get registrar contract address
  getRegistrarAddress(): string | null {
    return this.addresses?.registrar || null;
  }

  // Convert name to token ID
  async getNameToTokenId(name: string): Promise<string | null> {
    if (!this.registrar) {
      return null;
    }

    try {
      const labelHash = ethers.keccak256(ethers.toUtf8Bytes(name));
      const node = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(['bytes32', 'bytes32'], ['0x0000000000000000000000000000000000000000000000000000000000000000', labelHash]));
      const tokenId = await this.registrar.nodeToTokenId(node);
      return tokenId.toString();
    } catch (error) {
      console.warn(`Could not get token ID for name ${name}:`, error);
      return null;
    }
  }
}

// Global instance
export const blockchainService = new BlockchainService();

// Type declarations for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}
