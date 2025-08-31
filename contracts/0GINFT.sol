// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IOracle {
    function verifyProof(bytes calldata proof) external view returns (bool);
}

/**
 * @title 0G INFT Contract
 * @dev Follows 0G INFT Integration Guide for AI Agents
 * @notice Implements ERC7857 with 0G ecosystem integration
 */
contract OGINFT is ERC721, Ownable, ReentrancyGuard {
    // State variables for AI agent metadata
    mapping(uint256 => bytes32) private _metadataHashes;
    mapping(uint256 => string) private _encryptedURIs;
    mapping(uint256 => mapping(address => bytes)) private _authorizations;
    
    // 0G ecosystem integration
    address public oracle;
    address public ogStorage;
    address public ogCompute;
    
    uint256 private _nextTokenId = 1;
    
    // AI Agent specific events
    event MetadataUpdated(uint256 indexed tokenId, bytes32 newHash);
    event UsageAuthorized(uint256 indexed tokenId, address indexed executor);
    event AIAgentMinted(uint256 indexed tokenId, address indexed owner, string modelType);
    event InferenceExecuted(uint256 indexed tokenId, address indexed executor, bytes32 resultHash);
    
    // AI Agent metadata structure
    struct AIAgentMetadata {
        string modelType;        // e.g., "GPT-4", "Stable Diffusion"
        string capabilities;     // JSON string of capabilities
        uint256 version;         // Model version
        uint256 maxRequests;     // Maximum inference requests
        bool isActive;           // Agent availability
    }
    
    mapping(uint256 => AIAgentMetadata) public agentMetadata;
    
    constructor(
        string memory name,
        string memory symbol,
        address _oracle,
        address _ogStorage,
        address _ogCompute
    ) ERC721(name, symbol) Ownable(msg.sender) {
        oracle = _oracle;
        ogStorage = _ogStorage;
        ogCompute = _ogCompute;
    }
    
    /**
     * @dev Mint a new AI Agent INFT
     * @param to The recipient of the AI agent
     * @param encryptedURI 0G Storage URI containing encrypted AI model data
     * @param metadataHash Hash of the AI agent metadata
     * @param agentData AI agent configuration data
     */
    function mintAIAgent(
        address to,
        string calldata encryptedURI,
        bytes32 metadataHash,
        AIAgentMetadata calldata agentData
    ) external onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        
        _encryptedURIs[tokenId] = encryptedURI;
        _metadataHashes[tokenId] = metadataHash;
        agentMetadata[tokenId] = agentData;
        
        emit AIAgentMinted(tokenId, to, agentData.modelType);
        return tokenId;
    }
    
    /**
     * @dev Transfer AI agent with secure metadata update
     * @param from Current owner
     * @param to New owner
     * @param tokenId AI agent token ID
     * @param sealedKey Encrypted key for new owner
     * @param proof 0G DA proof for transfer verification
     */
    function transfer(
        address from,
        address to,
        uint256 tokenId,
        bytes calldata sealedKey,
        bytes calldata proof
    ) external nonReentrant {
        require(ownerOf(tokenId) == from, "Not owner");
        require(IOracle(oracle).verifyProof(proof), "Invalid proof");
        
        // Update metadata access for new owner
        _updateMetadataAccess(tokenId, to, sealedKey, proof);
        
        // Transfer token ownership
        _transfer(from, to, tokenId);
        
        emit MetadataUpdated(tokenId, keccak256(sealedKey));
    }
    
    /**
     * @dev Authorize usage of AI agent for inference
     * @param tokenId AI agent token ID
     * @param executor Address authorized to use the agent
     * @param permissions JSON string of permissions
     */
    function authorizeUsage(
        uint256 tokenId,
        address executor,
        bytes calldata permissions
    ) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        _authorizations[tokenId][executor] = permissions;
        emit UsageAuthorized(tokenId, executor);
    }
    
    /**
     * @dev Execute AI inference using 0G Compute
     * @param tokenId AI agent token ID
     * @param input Encrypted input data
     * @param proof Authorization proof
     */
    function executeInference(
        uint256 tokenId,
        bytes calldata input,
        bytes calldata proof
    ) external returns (bytes32 resultHash) {
        require(IOracle(oracle).verifyProof(proof), "Invalid proof");
        
        // Verify authorization
        bytes memory permissions = _authorizations[tokenId][msg.sender];
        require(permissions.length > 0, "Not authorized");
        
        // Check agent availability
        AIAgentMetadata memory agent = agentMetadata[tokenId];
        require(agent.isActive, "Agent not available");
        
        // Execute on 0G Compute (simulated)
        resultHash = _executeOnOGCompute(tokenId, input, msg.sender);
        
        emit InferenceExecuted(tokenId, msg.sender, resultHash);
        return resultHash;
    }
    
    /**
     * @dev Update AI agent metadata
     * @param tokenId AI agent token ID
     * @param newEncryptedURI New 0G Storage URI
     * @param newHash New metadata hash
     * @param newAgentData Updated agent configuration
     */
    function updateAIAgent(
        uint256 tokenId,
        string calldata newEncryptedURI,
        bytes32 newHash,
        AIAgentMetadata calldata newAgentData
    ) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        
        _encryptedURIs[tokenId] = newEncryptedURI;
        _metadataHashes[tokenId] = newHash;
        agentMetadata[tokenId] = newAgentData;
        
        emit MetadataUpdated(tokenId, newHash);
    }
    
    /**
     * @dev Get AI agent metadata
     * @param tokenId AI agent token ID
     */
    function getAIAgentMetadata(uint256 tokenId) external view returns (AIAgentMetadata memory) {
        return agentMetadata[tokenId];
    }
    
    /**
     * @dev Get metadata hash (ERC7857 compliance)
     */
    function getMetadataHash(uint256 tokenId) external view returns (bytes32) {
        return _metadataHashes[tokenId];
    }
    
    /**
     * @dev Get encrypted URI (ERC7857 compliance)
     */
    function getEncryptedURI(uint256 tokenId) external view returns (string memory) {
        return _encryptedURIs[tokenId];
    }
    
    /**
     * @dev Get authorization for executor
     * @param tokenId AI agent token ID
     * @param executor Address to check
     */
    function getAuthorization(uint256 tokenId, address executor) external view returns (bytes memory) {
        return _authorizations[tokenId][executor];
    }
    
    /**
     * @dev Internal function to update metadata access
     */
    function _updateMetadataAccess(
        uint256 tokenId,
        address newOwner,
        bytes calldata sealedKey,
        bytes calldata proof
    ) internal {
        // Extract new metadata hash from proof
        bytes32 newHash = bytes32(proof[0:32]);
        _metadataHashes[tokenId] = newHash;
        
        // Update encrypted URI if provided in proof
        if (proof.length > 64) {
            string memory newURI = string(proof[64:]);
            _encryptedURIs[tokenId] = newURI;
        }
    }
    
    /**
     * @dev Internal function to execute on 0G Compute
     * @notice This is a simulation - in production, this would call 0G Compute
     */
    function _executeOnOGCompute(
        uint256 tokenId,
        bytes calldata input,
        address executor
    ) internal returns (bytes32) {
        // Simulate 0G Compute execution
        // In production, this would:
        // 1. Call 0G Compute service
        // 2. Execute AI inference securely
        // 3. Return encrypted result
        
        bytes32 resultHash = keccak256(abi.encodePacked(tokenId, input, executor, block.timestamp));
        return resultHash;
    }
    
    /**
     * @dev ERC7857 interface support
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721) returns (bool) {
        return interfaceId == type(IOracle).interfaceId || super.supportsInterface(interfaceId);
    }
}
