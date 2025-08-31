import { ethers } from 'ethers';

// 0G Ecosystem Configuration
const OG_CONFIG = {
  RPC_URL: process.env.NEXT_PUBLIC_OG_RPC_URL || 'https://evmrpc-testnet.0g.ai',
  STORAGE_URL: process.env.NEXT_PUBLIC_OG_STORAGE_URL || 'https://storage-testnet.0g.ai',
  COMPUTE_URL: process.env.NEXT_PUBLIC_OG_COMPUTE_URL || 'https://compute-testnet.0g.ai',
  DA_URL: process.env.NEXT_PUBLIC_OG_DA_URL || 'https://da-testnet.0g.ai'
};

// 0G INFT Contract ABI (following the integration guide)
const OG_INFT_ABI = [
  "function mintAIAgent(address to, string encryptedURI, bytes32 metadataHash, tuple(string modelType, string capabilities, uint256 version, uint256 maxRequests, bool isActive) agentData) external returns (uint256)",
  "function transfer(address from, address to, uint256 tokenId, bytes sealedKey, bytes proof) external",
  "function authorizeUsage(uint256 tokenId, address executor, bytes permissions) external",
  "function executeInference(uint256 tokenId, bytes input, bytes proof) external returns (bytes32)",
  "function updateAIAgent(uint256 tokenId, string newEncryptedURI, bytes32 newHash, tuple(string modelType, string capabilities, uint256 version, uint256 maxRequests, bool isActive) newAgentData) external",
  "function getAIAgentMetadata(uint256 tokenId) external view returns (tuple(string modelType, string capabilities, uint256 version, uint256 maxRequests, bool isActive))",
  "function getMetadataHash(uint256 tokenId) external view returns (bytes32)",
  "function getEncryptedURI(uint256 tokenId) external view returns (string)",
  "function getAuthorization(uint256 tokenId, address executor) external view returns (bytes)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  // Events
  "event AIAgentMinted(uint256 indexed tokenId, address indexed owner, string modelType)",
  "event InferenceExecuted(uint256 indexed tokenId, address indexed executor, bytes32 resultHash)",
  "event MetadataUpdated(uint256 indexed tokenId, bytes32 newHash)",
  "event UsageAuthorized(uint256 indexed tokenId, address indexed executor)"
];

export interface AIAgentMetadata {
  modelType: string;
  capabilities: string;
  version: number;
  maxRequests: number;
  isActive: boolean;
}

export interface AIAgentData {
  model: string;
  weights: string;
  config: any;
  capabilities: string[];
}

export class OGIntegrationService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  private inftContract: ethers.Contract | null = null;
  private contractAddress: string | null = null;

  async initialize(contractAddress: string): Promise<void> {
    if (typeof window === 'undefined') return;

    // Check if MetaMask is installed
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    // Request account access
    await window.ethereum.request({ method: 'eth_requestAccounts' });

    // Create provider and signer
    this.provider = new ethers.BrowserProvider(window.ethereum);
    this.signer = await this.provider.getSigner();
    
    // Initialize 0G INFT contract
    this.contractAddress = contractAddress;
    this.inftContract = new ethers.Contract(contractAddress, OG_INFT_ABI, this.provider);
  }

  /**
   * Create AI Agent metadata following 0G integration guide
   */
  async createAIAgent(agentData: AIAgentData, ownerPublicKey: string): Promise<{
    encryptedURI: string;
    metadataHash: string;
    agentMetadata: AIAgentMetadata;
  }> {
    if (!this.inftContract) {
      throw new Error('0G Integration service not initialized');
    }

    try {
      // Prepare AI agent metadata (following 0G guide)
      const metadata = {
        model: agentData.model,
        weights: agentData.weights,
        config: agentData.config,
        capabilities: agentData.capabilities,
        version: '1.0',
        createdAt: Date.now()
      };

      // Generate encryption key
      const encryptionKey = ethers.randomBytes(32);
      
      // Encrypt metadata (in production, this would use 0G Storage)
      const encryptedData = await this.encryptMetadata(JSON.stringify(metadata), encryptionKey);
      
      // Store on 0G Storage (simulated)
      const storageURI = await this.storeOnOGStorage(encryptedData);
      
      // Seal key for owner
      const sealedKey = await this.sealKey(encryptionKey, ownerPublicKey);
      
      // Create metadata hash
      const metadataHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(metadata)));
      
      // Prepare AI agent metadata structure
      const agentMetadata: AIAgentMetadata = {
        modelType: agentData.model,
        capabilities: JSON.stringify(agentData.capabilities),
        version: 1,
        maxRequests: 1000,
        isActive: true
      };

      return {
        encryptedURI: storageURI,
        metadataHash,
        agentMetadata
      };
    } catch (error) {
      console.error('Error creating AI agent:', error);
      throw error;
    }
  }

  /**
   * Mint AI Agent INFT
   */
  async mintAIAgent(
    to: string,
    encryptedURI: string,
    metadataHash: string,
    agentMetadata: AIAgentMetadata
  ): Promise<{ tokenId: string; txHash: string }> {
    if (!this.inftContract || !this.signer) {
      throw new Error('0G Integration service not initialized');
    }

    try {
      const contractWithSigner = this.inftContract.connect(this.signer) as ethers.Contract;
      
      const tx = await contractWithSigner.mintAIAgent(
        to,
        encryptedURI,
        metadataHash,
        [
          agentMetadata.modelType,
          agentMetadata.capabilities,
          agentMetadata.version,
          agentMetadata.maxRequests,
          agentMetadata.isActive
        ]
      );
      
      const receipt = await tx.wait();
      
      if (receipt?.status === 1) {
        // Get token ID from event
        const event = receipt.logs.find((log: any) => 
          log.topics[0] === ethers.keccak256(ethers.toUtf8Bytes('AIAgentMinted(uint256,address,string)'))
        );
        
        const tokenId = event ? ethers.getBigInt(event.topics[1]).toString() : '0';
        
        return {
          tokenId,
          txHash: receipt.hash
        };
      } else {
        throw new Error('Minting transaction failed');
      }
    } catch (error) {
      console.error('Error minting AI agent:', error);
      throw error;
    }
  }

  /**
   * Execute AI inference using 0G Compute
   */
  async executeInference(
    tokenId: string,
    input: string,
    proof: string
  ): Promise<{ resultHash: string; result: any }> {
    if (!this.inftContract || !this.signer) {
      throw new Error('0G Integration service not initialized');
    }

    try {
      const contractWithSigner = this.inftContract.connect(this.signer) as ethers.Contract;
      
      // Convert input to bytes
      const inputBytes = ethers.toUtf8Bytes(input);
      const proofBytes = ethers.toUtf8Bytes(proof);
      
      const tx = await contractWithSigner.executeInference(tokenId, inputBytes, proofBytes);
      const receipt = await tx.wait();
      
      if (receipt?.status === 1) {
        // Get result hash from event
        const event = receipt.logs.find((log: any) => 
          log.topics[0] === ethers.keccak256(ethers.toUtf8Bytes('InferenceExecuted(uint256,address,bytes32)'))
        );
        
        const resultHash = event ? event.topics[3] : '';
        
        // In production, this would decrypt the result from 0G Compute
        const result = await this.decryptInferenceResult(resultHash);
        
        return {
          resultHash,
          result
        };
      } else {
        throw new Error('Inference execution failed');
      }
    } catch (error) {
      console.error('Error executing inference:', error);
      throw error;
    }
  }

  /**
   * Authorize usage of AI agent
   */
  async authorizeUsage(
    tokenId: string,
    executor: string,
    permissions: {
      maxRequests: number;
      allowedOperations: string[];
      rateLimit: number;
    }
  ): Promise<string> {
    if (!this.inftContract || !this.signer) {
      throw new Error('0G Integration service not initialized');
    }

    try {
      const contractWithSigner = this.inftContract.connect(this.signer) as ethers.Contract;
      
      const permissionsBytes = ethers.toUtf8Bytes(JSON.stringify(permissions));
      
      const tx = await contractWithSigner.authorizeUsage(tokenId, executor, permissionsBytes);
      const receipt = await tx.wait();
      
      if (receipt?.status === 1) {
        return receipt.hash;
      } else {
        throw new Error('Authorization transaction failed');
      }
    } catch (error) {
      console.error('Error authorizing usage:', error);
      throw error;
    }
  }

  /**
   * Transfer AI agent with secure metadata update
   */
  async transferAIAgent(
    from: string,
    to: string,
    tokenId: string,
    sealedKey: string,
    proof: string
  ): Promise<string> {
    if (!this.inftContract || !this.signer) {
      throw new Error('0G Integration service not initialized');
    }

    try {
      const contractWithSigner = this.inftContract.connect(this.signer) as ethers.Contract;
      
      const sealedKeyBytes = ethers.toUtf8Bytes(sealedKey);
      const proofBytes = ethers.toUtf8Bytes(proof);
      
      const tx = await contractWithSigner.transfer(from, to, tokenId, sealedKeyBytes, proofBytes);
      const receipt = await tx.wait();
      
      if (receipt?.status === 1) {
        return receipt.hash;
      } else {
        throw new Error('Transfer transaction failed');
      }
    } catch (error) {
      console.error('Error transferring AI agent:', error);
      throw error;
    }
  }

  /**
   * Get AI agent metadata
   */
  async getAIAgentMetadata(tokenId: string): Promise<AIAgentMetadata> {
    if (!this.inftContract) {
      throw new Error('0G Integration service not initialized');
    }

    try {
      const metadata = await this.inftContract.getAIAgentMetadata(tokenId);
      
      return {
        modelType: metadata[0],
        capabilities: metadata[1],
        version: Number(metadata[2]),
        maxRequests: Number(metadata[3]),
        isActive: metadata[4]
      };
    } catch (error) {
      console.error('Error getting AI agent metadata:', error);
      throw error;
    }
  }

  /**
   * Get AI agent inference history
   */
  async getInferenceHistory(tokenId: string): Promise<Array<{
    executor: string;
    resultHash: string;
    timestamp: string;
    blockNumber: number;
  }>> {
    if (!this.inftContract || !this.provider) {
      throw new Error('0G Integration service not initialized');
    }

    try {
      const filter = this.inftContract.filters.InferenceExecuted(tokenId);
      const events = await this.inftContract.queryFilter(filter);
      
      const history = await Promise.all(
        events.map(async (event) => {
          const block = await this.provider!.getBlock(event.blockNumber);
          
          return {
            executor: event.args?.[1] || '',
            resultHash: event.args?.[2] || '',
            timestamp: block ? new Date(Number(block.timestamp) * 1000).toISOString() : new Date().toISOString(),
            blockNumber: event.blockNumber
          };
        })
      );
      
      return history;
    } catch (error) {
      console.error('Error getting inference history:', error);
      return [];
    }
  }

  // Helper methods (simulated for demo)

  private async encryptMetadata(data: string, key: Uint8Array): Promise<string> {
    // In production, this would use proper encryption
    return ethers.base64Encode(ethers.toUtf8Bytes(data));
  }

  private async storeOnOGStorage(data: string): Promise<string> {
    // In production, this would call 0G Storage API
    return `og://storage/${ethers.keccak256(ethers.toUtf8Bytes(data))}`;
  }

  private async sealKey(key: Uint8Array, publicKey: string): Promise<string> {
    // In production, this would use proper key sealing
    return ethers.base64Encode(key);
  }

  private async decryptInferenceResult(resultHash: string): Promise<any> {
    // In production, this would decrypt the result from 0G Compute
    return {
      output: `AI inference result for hash: ${resultHash}`,
      confidence: 0.95,
      processingTime: 1.2
    };
  }
}

// Global instance
export const ogIntegrationService = new OGIntegrationService();

