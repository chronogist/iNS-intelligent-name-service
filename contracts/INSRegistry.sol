// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./INFT.sol";

/**
 * @title INSRegistry
 * @notice Main registry for .0g domain names with INFT tokens
 * @dev Upgradeable registry with role-based access control
 */
contract INSRegistry is 
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable 
{
    // ============ Roles ============
    
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    
    // ============ State Variables ============
    
    /// @notice Base node for .0g TLD
    bytes32 public constant BASE_NODE = keccak256(abi.encodePacked(bytes32(0), keccak256("0g")));
    
    /// @notice Name to INFT address mapping
    mapping(bytes32 => address) public nameToINFT;
    
    /// @notice Name to expiry timestamp
    mapping(bytes32 => uint256) public nameExpiry;
    
    /// @notice Name to primary address mapping (resolution cache)
    mapping(bytes32 => address) public nameToAddress;
    
    /// @notice Oracle address for secure transfers
    address public oracle;
    
    /// @notice Treasury address for fees
    address public treasury;
    
    /// @notice Minimum registration period (1 year)
    uint256 public constant MIN_REGISTRATION_PERIOD = 365 days;
    
    /// @notice Grace period after expiry
    uint256 public constant GRACE_PERIOD = 90 days;
    
    /// @notice Minimum name length
    uint256 public constant MIN_NAME_LENGTH = 3;
    
    /// @notice Maximum name length
    uint256 public constant MAX_NAME_LENGTH = 63;
    
    /// @notice Base registration price (in wei)
    uint256 public basePrice;
    
    /// @notice Premium price for short names (3-4 chars)
    uint256 public premiumPrice;

    /// @notice Mapping of owner to their domain names (for fast lookup)
    mapping(address => string[]) private ownerDomains;

    /// @notice Mapping to track domain index in owner's array
    mapping(bytes32 => uint256) private domainIndexInOwnerArray;

    /// @notice Mapping of node to domain name (for reverse lookup)
    mapping(bytes32 => string) public nodeToDomainName;

    /// @notice Mapping of address to their primary domain name (reverse resolution)
    mapping(address => string) public primaryName;

    // ============ Events ============
    
    event NameRegistered(
        string indexed name,
        bytes32 indexed node,
        address indexed owner,
        address inftAddress,
        uint256 expires,
        uint256 paid
    );
    
    event NameRenewed(
        string indexed name,
        bytes32 indexed node,
        uint256 expires,
        uint256 paid
    );
    
    event AddressSet(
        bytes32 indexed node,
        address indexed addr
    );
    
    event OracleUpdated(
        address indexed oldOracle,
        address indexed newOracle
    );
    
    event TreasuryUpdated(
        address indexed oldTreasury,
        address indexed newTreasury
    );
    
    event PriceUpdated(
        uint256 basePrice,
        uint256 premiumPrice
    );

    event PrimaryNameSet(
        address indexed owner,
        string indexed name
    );

    // ============ Errors ============
    
    error NameNotAvailable();
    error NameExpired();
    error InvalidName();
    error InvalidDuration();
    error Unauthorized();
    error InsufficientPayment();
    error InvalidAddress();
    error TransferFailed();
    error NameTooShort();
    error NameTooLong();
    error InvalidCharacters();
    
    // ============ Initialization ============
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    function initialize(
        address _oracle,
        address _treasury,
        address _admin,
        uint256 _basePrice,
        uint256 _premiumPrice
    ) public initializer {
        __AccessControl_init();
        __ReentrancyGuard_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
        
        if (_oracle == address(0) || _treasury == address(0) || _admin == address(0)) {
            revert InvalidAddress();
        }
        
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(OPERATOR_ROLE, _admin);
        _grantRole(UPGRADER_ROLE, _admin);
        
        oracle = _oracle;
        treasury = _treasury;
        basePrice = _basePrice;
        premiumPrice = _premiumPrice;
    }
    
    // ============ Core Functions ============
    
    /**
     * @notice Register a new .0g domain with AI agent capabilities
     * @param name Domain name without .0g suffix
     * @param owner Address that will own the domain
     * @param duration Registration duration in seconds
     * @param metadataURI Encrypted metadata URI on 0G Storage
     * @param metadataHash Hash of encrypted metadata
     * @param agentType Type of AI agent (defi_trader, gas_optimizer, etc.)
     * @return inftAddress Address of deployed INFT
     */
    function register(
        string calldata name,
        address owner,
        uint256 duration,
        string calldata metadataURI,
        bytes32 metadataHash,
        string calldata agentType
    )
        external
        payable
        nonReentrant
        whenNotPaused
        returns (address inftAddress) 
    {
        // Validate inputs
        _validateName(name);
        if (owner == address(0)) {
            revert InvalidAddress();
        }
        if (duration < MIN_REGISTRATION_PERIOD) {
            revert InvalidDuration();
        }
        if (bytes(metadataURI).length == 0 || metadataHash == bytes32(0)) {
            revert InvalidAddress();
        }
        
        bytes32 node = _makeNode(name);
        
        // Check availability
        if (!_isAvailable(node)) {
            revert NameNotAvailable();
        }
        
        // Check payment
        uint256 price = getPrice(name, duration);
        if (msg.value < price) {
            revert InsufficientPayment();
        }
        
        // Deploy INFT
        INFT inft = new INFT(
            name,
            owner,
            oracle,
            metadataURI,
            metadataHash,
            agentType
        );
        inftAddress = address(inft);
        
        // Set expiry
        uint256 expires = block.timestamp + duration;
        
        // Update registry
        nameToINFT[node] = inftAddress;
        nameExpiry[node] = expires;
        nameToAddress[node] = owner;

        // Track domain ownership for fast lookups
        nodeToDomainName[node] = name;
        _addDomainToOwner(owner, name, node);

        // Set as primary name if owner has no primary name yet
        if (bytes(primaryName[owner]).length == 0) {
            primaryName[owner] = name;
            emit PrimaryNameSet(owner, name);
        }

        // Transfer payment to treasury
        (bool success, ) = treasury.call{value: msg.value}("");
        if (!success) {
            revert TransferFailed();
        }
        
        emit NameRegistered(name, node, owner, inftAddress, expires, msg.value);
        
        return inftAddress;
    }
    
    /**
     * @notice Renew a domain registration
     * @param name Domain name
     * @param duration Additional duration in seconds
     */
    function renew(
        string calldata name,
        uint256 duration
    ) 
        external 
        payable
        nonReentrant
        whenNotPaused
    {
        if (duration < MIN_REGISTRATION_PERIOD) {
            revert InvalidDuration();
        }
        
        bytes32 node = _makeNode(name);
        
        if (nameToINFT[node] == address(0)) {
            revert NameNotAvailable();
        }
        
        // Check payment
        uint256 price = getPrice(name, duration);
        if (msg.value < price) {
            revert InsufficientPayment();
        }
        
        // Extend expiry
        nameExpiry[node] += duration;
        
        // Transfer payment to treasury
        (bool success, ) = treasury.call{value: msg.value}("");
        if (!success) {
            revert TransferFailed();
        }
        
        emit NameRenewed(name, node, nameExpiry[node], msg.value);
    }
    
    /**
     * @notice Set primary address for a name (owner only)
     * @param name Domain name
     * @param addr Address to set
     */
    function setAddress(
        string calldata name,
        address addr
    )
        external
        nonReentrant
    {
        bytes32 node = _makeNode(name);
        address inftAddress = nameToINFT[node];

        if (inftAddress == address(0)) {
            revert NameNotAvailable();
        }

        // Check ownership
        INFT inft = INFT(inftAddress);
        if (inft.domainOwner() != msg.sender) {
            revert Unauthorized();
        }

        nameToAddress[node] = addr;

        emit AddressSet(node, addr);
    }

    /**
     * @notice Set primary name for caller's address (reverse resolution)
     * @param name Domain name to set as primary
     */
    function setPrimaryName(string calldata name) external {
        bytes32 node = _makeNode(name);
        address inftAddress = nameToINFT[node];

        if (inftAddress == address(0)) {
            revert NameNotAvailable();
        }

        // Check ownership
        INFT inft = INFT(inftAddress);
        if (inft.domainOwner() != msg.sender) {
            revert Unauthorized();
        }

        primaryName[msg.sender] = name;

        emit PrimaryNameSet(msg.sender, name);
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Update oracle address
     * @param _newOracle New oracle address
     */
    function updateOracle(address _newOracle) external onlyRole(OPERATOR_ROLE) {
        if (_newOracle == address(0)) {
            revert InvalidAddress();
        }
        
        address oldOracle = oracle;
        oracle = _newOracle;
        
        emit OracleUpdated(oldOracle, _newOracle);
    }
    
    /**
     * @notice Update treasury address
     * @param _newTreasury New treasury address
     */
    function updateTreasury(address _newTreasury) external onlyRole(OPERATOR_ROLE) {
        if (_newTreasury == address(0)) {
            revert InvalidAddress();
        }
        
        address oldTreasury = treasury;
        treasury = _newTreasury;
        
        emit TreasuryUpdated(oldTreasury, _newTreasury);
    }
    
    /**
     * @notice Update pricing
     * @param _basePrice New base price
     * @param _premiumPrice New premium price
     */
    function updatePricing(
        uint256 _basePrice,
        uint256 _premiumPrice
    ) external onlyRole(OPERATOR_ROLE) {
        basePrice = _basePrice;
        premiumPrice = _premiumPrice;
        
        emit PriceUpdated(_basePrice, _premiumPrice);
    }
    
    /**
     * @notice Pause contract
     */
    function pause() external onlyRole(OPERATOR_ROLE) {
        _pause();
    }
    
    /**
     * @notice Unpause contract
     */
    function unpause() external onlyRole(OPERATOR_ROLE) {
        _unpause();
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Check if name is available
     * @param name Domain name
     * @return True if available
     */
    function available(string calldata name) external view returns (bool) {
        bytes32 node = _makeNode(name);
        return _isAvailable(node);
    }
    
    /**
     * @notice Get INFT address for a name
     * @param name Domain name
     * @return INFT address
     */
    function getINFT(string calldata name) external view returns (address) {
        return nameToINFT[_makeNode(name)];
    }
    
    /**
     * @notice Get owner of a domain
     * @param name Domain name
     * @return Owner address
     */
    function ownerOf(string calldata name) external view returns (address) {
        bytes32 node = _makeNode(name);
        address inftAddress = nameToINFT[node];
        
        if (inftAddress == address(0)) {
            return address(0);
        }
        
        return INFT(inftAddress).domainOwner();
    }
    
    /**
     * @notice Resolve name to address
     * @param name Domain name
     * @return Resolved address
     */
    function resolve(string calldata name) external view returns (address) {
        return nameToAddress[_makeNode(name)];
    }
    
    /**
     * @notice Get registration price
     * @param name Domain name
     * @param duration Duration in seconds
     * @return Price in wei
     */
    function getPrice(string calldata name, uint256 duration) public view returns (uint256) {
        uint256 nameLength = bytes(name).length;
        uint256 numYears = duration / 365 days;

        if (numYears == 0) numYears = 1;

        if (nameLength <= 4) {
            return premiumPrice * numYears;
        }

        return basePrice * numYears;
    }
    
    /**
     * @notice Get expiry timestamp
     * @param name Domain name
     * @return Expiry timestamp
     */
    function getExpiry(string calldata name) external view returns (uint256) {
        return nameExpiry[_makeNode(name)];
    }

    /**
     * @notice Get all domains owned by an address (FAST - single call)
     * @param owner Address to query
     * @return Array of domain names owned by the address
     */
    function getOwnerDomains(address owner) external view returns (string[] memory) {
        return ownerDomains[owner];
    }

    /**
     * @notice Get count of domains owned by an address
     * @param owner Address to query
     * @return Number of domains owned
     */
    function getOwnerDomainCount(address owner) external view returns (uint256) {
        return ownerDomains[owner].length;
    }

    /**
     * @notice Get domain name from node hash
     * @param node Node hash
     * @return Domain name
     */
    function getDomainName(bytes32 node) external view returns (string memory) {
        return nodeToDomainName[node];
    }

    /**
     * @notice Get primary name for an address (reverse resolution)
     * @param addr Address to query
     * @return Primary domain name (without .0g suffix)
     */
    function getPrimaryName(address addr) external view returns (string memory) {
        return primaryName[addr];
    }

    /**
     * @notice Migrate existing domain to new tracking system (admin only)
     * @param name Domain name to migrate
     */
    function migrateDomain(string calldata name) external onlyRole(OPERATOR_ROLE) {
        bytes32 node = _makeNode(name);
        address inftAddress = nameToINFT[node];

        if (inftAddress == address(0)) {
            revert NameNotAvailable();
        }

        // Get current owner from INFT
        INFT inft = INFT(inftAddress);
        address owner = inft.domainOwner();

        // Only migrate if not already tracked
        if (bytes(nodeToDomainName[node]).length == 0) {
            nodeToDomainName[node] = name;
            _addDomainToOwner(owner, name, node);
        }
    }

    /**
     * @notice Batch migrate multiple domains (admin only)
     * @param names Array of domain names to migrate
     */
    function migrateDomainsBatch(string[] calldata names) external onlyRole(OPERATOR_ROLE) {
        for (uint256 i = 0; i < names.length; i++) {
            bytes32 node = _makeNode(names[i]);
            address inftAddress = nameToINFT[node];

            if (inftAddress != address(0)) {
                INFT inft = INFT(inftAddress);
                address owner = inft.domainOwner();

                // Only migrate if not already tracked
                if (bytes(nodeToDomainName[node]).length == 0) {
                    nodeToDomainName[node] = names[i];
                    _addDomainToOwner(owner, names[i], node);
                }
            }
        }
    }

    // ============ Internal Functions ============

    function _makeNode(string calldata name) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(BASE_NODE, keccak256(bytes(name))));
    }

    /**
     * @dev Add domain to owner's domain list
     */
    function _addDomainToOwner(address owner, string memory name, bytes32 node) internal {
        uint256 index = ownerDomains[owner].length;
        ownerDomains[owner].push(name);
        domainIndexInOwnerArray[node] = index;
    }

    /**
     * @dev Remove domain from owner's domain list
     */
    function _removeDomainFromOwner(address owner, bytes32 node) internal {
        uint256 index = domainIndexInOwnerArray[node];
        uint256 lastIndex = ownerDomains[owner].length - 1;

        // Move last element to the deleted spot
        if (index != lastIndex) {
            string memory lastDomain = ownerDomains[owner][lastIndex];
            ownerDomains[owner][index] = lastDomain;

            // Update index for moved domain
            bytes32 lastNode = keccak256(abi.encodePacked(BASE_NODE, keccak256(bytes(lastDomain))));
            domainIndexInOwnerArray[lastNode] = index;
        }

        // Remove last element
        ownerDomains[owner].pop();
        delete domainIndexInOwnerArray[node];
    }

    /**
     * @dev Transfer domain ownership tracking
     */
    function _transferDomainOwnership(address from, address to, string memory name, bytes32 node) internal {
        if (from != address(0)) {
            _removeDomainFromOwner(from, node);
        }
        _addDomainToOwner(to, name, node);
    }
    
    function _isAvailable(bytes32 node) internal view returns (bool) {
        return nameToINFT[node] == address(0) || 
               (nameExpiry[node] + GRACE_PERIOD < block.timestamp);
    }
    
    function _validateName(string calldata name) internal pure {
        bytes memory nameBytes = bytes(name);
        uint256 len = nameBytes.length;
        
        if (len < MIN_NAME_LENGTH) {
            revert NameTooShort();
        }
        if (len > MAX_NAME_LENGTH) {
            revert NameTooLong();
        }
        
        // Check valid characters (a-z, 0-9, hyphen)
        for (uint256 i = 0; i < len; i++) {
            bytes1 char = nameBytes[i];
            bool isValid = (char >= 0x61 && char <= 0x7A) || // a-z
                          (char >= 0x30 && char <= 0x39) || // 0-9
                          (char == 0x2D); // hyphen
            
            if (!isValid) {
                revert InvalidCharacters();
            }
            
            // No hyphen at start or end
            if (char == 0x2D && (i == 0 || i == len - 1)) {
                revert InvalidCharacters();
            }
        }
    }
    
    function _authorizeUpgrade(address newImplementation) 
        internal 
        override 
        onlyRole(UPGRADER_ROLE) 
    {}
}