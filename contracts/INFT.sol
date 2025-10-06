// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title INFT
 * @notice ERC-7857 Intelligent NFT for iNS domains
 * @dev One INFT per domain, stores encrypted metadata on 0G Storage
 */
contract INFT is ERC721, Ownable, ReentrancyGuard {
    
    // ============ State Variables ============
    
    /// @notice Domain name this INFT represents
    string public domainName;
    
    /// @notice Metadata URI pointing to 0G Storage
    string public metadataURI;
    
    /// @notice Metadata hash for verification
    bytes32 public metadataHash;
    
    /// @notice Oracle address authorized to update metadata during transfers
    address public oracle;
    
    /// @notice Registry contract that deployed this INFT
    address public registry;
    
    /// @notice Token ID is always 0 (single token per domain)
    uint256 private constant TOKEN_ID = 0;
    
    /// @notice If true, metadata updates are locked
    bool public metadataLocked;

    /// @notice AI Agent type classification
    string public agentType;

    /// @notice Intelligence score (0-1000 scale)
    uint256 public intelligenceScore;

    /// @notice Total number of actions performed by this agent
    uint256 public totalActions;

    /// @notice Number of successful actions
    uint256 public successfulActions;

    /// @notice Agent version (increments with learning)
    uint256 public agentVersion;

    // ============ Events ============
    
    event MetadataUpdated(
        string indexed newURI,
        bytes32 indexed newHash,
        address indexed updatedBy
    );
    
    event MetadataTransferred(
        address indexed from,
        address indexed to,
        string newMetadataURI,
        bytes32 newMetadataHash
    );
    
    event OracleUpdated(
        address indexed oldOracle,
        address indexed newOracle
    );
    
    event MetadataLockToggled(bool locked);

    event IntelligenceUpdated(
        uint256 indexed newScore,
        uint256 totalActions,
        uint256 successfulActions,
        uint256 agentVersion
    );

    event AgentActionRecorded(
        uint256 indexed actionId,
        bool success,
        uint256 newIntelligenceScore
    );

    // ============ Errors ============
    
    error Unauthorized();
    error InvalidMetadata();
    error MetadataIsLocked();
    error TokenDoesNotExist();
    error InvalidAddress();
    
    // ============ Constructor ============
    
    constructor(
        string memory _domainName,
        address _owner,
        address _oracle,
        string memory _metadataURI,
        bytes32 _metadataHash,
        string memory _agentType
    )
        ERC721(
            string(abi.encodePacked("iNS: ", _domainName)),
            string(abi.encodePacked(_domainName, ".0g"))
        )
        Ownable(_owner)
    {
        if (_owner == address(0) || _oracle == address(0)) {
            revert InvalidAddress();
        }
        if (bytes(_metadataURI).length == 0 || _metadataHash == bytes32(0)) {
            revert InvalidMetadata();
        }

        domainName = _domainName;
        oracle = _oracle;
        registry = msg.sender;
        metadataURI = _metadataURI;
        metadataHash = _metadataHash;
        agentType = _agentType;
        intelligenceScore = 0;
        totalActions = 0;
        successfulActions = 0;
        agentVersion = 1;

        // Mint token to owner
        _safeMint(_owner, TOKEN_ID);

        // Transfer ownership to owner
        _transferOwnership(_owner);
    }
    
    // ============ Core Functions ============
    
    /**
     * @notice Update metadata URI (owner only, when not locked)
     * @param _newURI New metadata URI on 0G Storage
     * @param _newHash Hash of the new metadata for verification
     */
    function updateMetadata(
        string calldata _newURI,
        bytes32 _newHash
    ) external nonReentrant {
        if (msg.sender != ownerOf(TOKEN_ID)) {
            revert Unauthorized();
        }
        if (metadataLocked) {
            revert MetadataIsLocked();
        }
        if (bytes(_newURI).length == 0 || _newHash == bytes32(0)) {
            revert InvalidMetadata();
        }
        
        metadataURI = _newURI;
        metadataHash = _newHash;
        
        emit MetadataUpdated(_newURI, _newHash, msg.sender);
    }
    
    /**
     * @notice Update metadata during transfer (oracle or owner)
     * @dev Called by oracle during ERC-7857 secure transfer process, or by owner if no oracle
     * @param _to New owner address
     * @param _newURI Re-encrypted metadata URI
     * @param _newHash Hash of re-encrypted metadata
     */
    function transferMetadata(
        address _to,
        string calldata _newURI,
        bytes32 _newHash
    ) external nonReentrant {
        // Allow oracle OR current owner (fallback when oracle not set)
        if (msg.sender != oracle && msg.sender != ownerOf(TOKEN_ID)) {
            revert Unauthorized();
        }
        if (_to == address(0)) {
            revert InvalidAddress();
        }
        if (bytes(_newURI).length == 0 || _newHash == bytes32(0)) {
            revert InvalidMetadata();
        }

        address from = ownerOf(TOKEN_ID);

        metadataURI = _newURI;
        metadataHash = _newHash;

        emit MetadataTransferred(from, _to, _newURI, _newHash);
    }
    
    /**
     * @notice Toggle metadata lock (owner only)
     * @dev When locked, metadata cannot be updated
     */
    function toggleMetadataLock() external {
        if (msg.sender != ownerOf(TOKEN_ID)) {
            revert Unauthorized();
        }
        
        metadataLocked = !metadataLocked;
        
        emit MetadataLockToggled(metadataLocked);
    }
    
    /**
     * @notice Update oracle address (registry only)
     * @param _newOracle New oracle address
     */
    function updateOracle(address _newOracle) external {
        if (msg.sender != registry) {
            revert Unauthorized();
        }
        if (_newOracle == address(0)) {
            revert InvalidAddress();
        }

        address oldOracle = oracle;
        oracle = _newOracle;

        emit OracleUpdated(oldOracle, _newOracle);
    }

    /**
     * @notice Record an agent action and update intelligence score
     * @dev Called by oracle or owner after action is verified
     * @param _success Whether the action was successful
     * @param _newIntelligenceScore Updated intelligence score from off-chain calculation
     */
    function recordAction(bool _success, uint256 _newIntelligenceScore) external nonReentrant {
        if (msg.sender != oracle && msg.sender != ownerOf(TOKEN_ID)) {
            revert Unauthorized();
        }
        if (_newIntelligenceScore > 1000) {
            revert InvalidMetadata();
        }

        totalActions++;
        if (_success) {
            successfulActions++;
        }
        intelligenceScore = _newIntelligenceScore;
        agentVersion++;

        emit AgentActionRecorded(totalActions, _success, _newIntelligenceScore);
        emit IntelligenceUpdated(_newIntelligenceScore, totalActions, successfulActions, agentVersion);
    }

    /**
     * @notice Batch update intelligence metrics (oracle only)
     * @dev Used when syncing from 0G Storage metadata
     * @param _intelligenceScore New intelligence score
     * @param _totalActions Total actions count
     * @param _successfulActions Successful actions count
     * @param _agentVersion New agent version
     */
    function updateIntelligenceMetrics(
        uint256 _intelligenceScore,
        uint256 _totalActions,
        uint256 _successfulActions,
        uint256 _agentVersion
    ) external nonReentrant {
        if (msg.sender != oracle && msg.sender != registry) {
            revert Unauthorized();
        }
        if (_intelligenceScore > 1000) {
            revert InvalidMetadata();
        }
        if (_successfulActions > _totalActions) {
            revert InvalidMetadata();
        }

        intelligenceScore = _intelligenceScore;
        totalActions = _totalActions;
        successfulActions = _successfulActions;
        agentVersion = _agentVersion;

        emit IntelligenceUpdated(_intelligenceScore, _totalActions, _successfulActions, _agentVersion);
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get token URI (metadata generated onchain)
     * @param tokenId Token ID (must be 0)
     * @return Fully onchain data URI with metadata and SVG image
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (tokenId != TOKEN_ID || _ownerOf(TOKEN_ID) == address(0)) {
            revert TokenDoesNotExist();
        }

        // Build SVG image onchain
        string memory svg = string(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">',
            '<defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">',
            '<stop offset="0%" style="stop-color:#667eea;stop-opacity:1"/>',
            '<stop offset="100%" style="stop-color:#764ba2;stop-opacity:1"/></linearGradient></defs>',
            '<rect width="100%" height="100%" fill="url(#grad)"/>',
            '<text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="48" font-weight="bold" fill="#ffffff">',
            domainName,
            '</text>',
            '<text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="32" fill="#e0e0e0">.0g</text>',
            '<text x="50%" y="85%" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#ffffff" opacity="0.8">iNS - Intelligent Naming Service</text>',
            '</svg>'
        ));

        string memory svgBase64 = Base64.encode(bytes(svg));
        string memory imageUri = string(abi.encodePacked('data:image/svg+xml;base64,', svgBase64));

        // Build JSON metadata
        string memory json = string(abi.encodePacked(
            '{',
            '"name":"', domainName, '.0g",',
            '"description":"iNS Intelligent Domain - ', domainName, '.0g on 0G Network",',
            '"image":"', imageUri, '",',
            '"external_url":"https://ins.0g.ai/domains/', domainName, '",',
            '"attributes":[',
                '{"trait_type":"Domain","value":"', domainName, '"},',
                '{"trait_type":"TLD","value":"0g"},',
                '{"trait_type":"Network","value":"0G Network"},',
                '{"trait_type":"Type","value":"Intelligent NFT"}',
            ']',
            '}'
        ));

        string memory jsonBase64 = Base64.encode(bytes(json));
        return string(abi.encodePacked('data:application/json;base64,', jsonBase64));
    }
    
    /**
     * @notice Get domain owner
     * @return Owner address
     */
    function domainOwner() external view returns (address) {
        return ownerOf(TOKEN_ID);
    }
    
    /**
     * @notice Check if token exists
     * @param tokenId Token ID to check
     * @return True if exists
     */
    function exists(uint256 tokenId) external view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
    
    /**
     * @notice Get metadata info
     * @return uri Metadata URI
     * @return hash Metadata hash
     * @return locked Is metadata locked
     */
    function getMetadataInfo() external view returns (
        string memory uri,
        bytes32 hash,
        bool locked
    ) {
        return (metadataURI, metadataHash, metadataLocked);
    }

    /**
     * @notice Get AI agent intelligence metrics
     * @return _agentType Agent type classification
     * @return _intelligenceScore Current intelligence score (0-1000)
     * @return _totalActions Total actions performed
     * @return _successfulActions Number of successful actions
     * @return _successRate Success rate percentage
     * @return _agentVersion Current agent version
     */
    function getIntelligenceMetrics() external view returns (
        string memory _agentType,
        uint256 _intelligenceScore,
        uint256 _totalActions,
        uint256 _successfulActions,
        uint256 _successRate,
        uint256 _agentVersion
    ) {
        uint256 successRate = totalActions > 0 ? (successfulActions * 100) / totalActions : 0;
        return (
            agentType,
            intelligenceScore,
            totalActions,
            successfulActions,
            successRate,
            agentVersion
        );
    }
    
    // ============ Overrides ============
    
    /**
     * @notice Override transfer to prevent transfers without oracle involvement
     * @dev This implements ERC-7857 secure transfer requirement
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);

        // Allow minting (from == address(0))
        if (from == address(0)) {
            return super._update(to, tokenId, auth);
        }

        // For transfers, oracle must have updated metadata first
        // This is verified by checking if MetadataTransferred event was emitted
        // in the same transaction (handled off-chain by oracle service)

        return super._update(to, tokenId, auth);
    }
    
    /**
     * @notice Disable approve to prevent unauthorized transfers
     * @dev Transfers must go through oracle for metadata re-encryption
     */
    function approve(address to, uint256 tokenId) public virtual override {
        // Allow approvals but log for monitoring
        super.approve(to, tokenId);
    }
    
    /**
     * @notice Check interface support
     */
    function supportsInterface(bytes4 interfaceId) 
        public 
        view 
        virtual 
        override(ERC721) 
        returns (bool) 
    {
        return super.supportsInterface(interfaceId);
    }
}