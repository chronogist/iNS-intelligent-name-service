const { ethers } = require('ethers');
require('dotenv').config();

// Registry ABI (only the functions we need)
const REGISTRY_ABI = [
  "function register(string name, address owner, uint256 duration, string metadataURI, bytes32 metadataHash) payable returns (address)",
  "function renew(string name, uint256 duration) payable",
  "function available(string name) view returns (bool)",
  "function getINFT(string name) view returns (address)",
  "function ownerOf(string name) view returns (address)",
  "function resolve(string name) view returns (address)",
  "function getPrice(string name, uint256 duration) view returns (uint256)",
  "function getExpiry(string name) view returns (uint256)",
  "function setAddress(string name, address addr)",
  "event NameRegistered(string indexed name, bytes32 indexed node, address indexed owner, address inftAddress, uint256 expires, uint256 paid)",
  "event NameRenewed(string indexed name, bytes32 indexed node, uint256 expires, uint256 paid)",
  "event AddressSet(bytes32 indexed node, address indexed addr)"
];

class BlockchainService {
  constructor() {
    this.provider = null;
    this.registry = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      const rpcUrl = process.env.RPC_URL;
      const registryAddress = process.env.REGISTRY_ADDRESS;

      if (!rpcUrl) {
        throw new Error('RPC_URL not configured');
      }
      if (!registryAddress) {
        throw new Error('REGISTRY_ADDRESS not configured');
      }

      // Setup provider
      this.provider = new ethers.JsonRpcProvider(rpcUrl);

      // Test connection
      const network = await this.provider.getNetwork();
      console.log(`✅ Connected to 0G Chain (ChainID: ${network.chainId})`);

      // Setup registry contract
      this.registry = new ethers.Contract(
        registryAddress,
        REGISTRY_ABI,
        this.provider
      );

      console.log(`✅ Registry contract loaded at ${registryAddress}`);

      this.initialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize blockchain connection:', error.message);
      throw error;
    }
  }

  async checkAvailability(name) {
    await this.initialize();
    return await this.registry.available(name);
  }

  async getPrice(name, duration) {
    await this.initialize();
    const price = await this.registry.getPrice(name, duration);
    return ethers.formatEther(price);
  }

  async getDomainInfo(name) {
    await this.initialize();
    
    try {
      const [inftAddress, owner, resolvedAddress, expiry] = await Promise.all([
        this.registry.getINFT(name),
        this.registry.ownerOf(name),
        this.registry.resolve(name),
        this.registry.getExpiry(name)
      ]);

      return {
        name,
        inftAddress,
        owner,
        resolvedAddress,
        expiry: Number(expiry),
        expiryDate: new Date(Number(expiry) * 1000).toISOString()
      };
    } catch (error) {
      return null;
    }
  }

  async getOwner(name) {
    await this.initialize();
    return await this.registry.ownerOf(name);
  }

  async getExpiry(name) {
    await this.initialize();
    const expiry = await this.registry.getExpiry(name);
    return Number(expiry);
  }

  getRegistryAddress() {
    return process.env.REGISTRY_ADDRESS;
  }

  getProvider() {
    return this.provider;
  }

  getRegistry() {
    return this.registry;
  }
}

module.exports = new BlockchainService();