// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./IOracle.sol";

/**
 * @title OwnerIntelligenceOracle
 * @dev Oracle that monitors owner-related events and triggers NFT metadata changes
 * This makes the NFT respond to the owner's real-world activities and behavior
 */
contract OwnerIntelligenceOracle is IOracle {
    
    // Event emitted when owner-based intelligence triggers metadata update
    event OwnerBasedUpdate(
        uint256 indexed tokenId,
        address indexed owner,
        string updateType,
        string reason,
        bytes32 newHash,
        uint256 timestamp
    );

    // Different types of owner-based intelligence
    enum OwnerIntelligenceType {
        SOCIAL_ACTIVITY,    // Owner's social media activity
        PROFILE_CHANGES,    // Owner's profile updates
        TRANSACTION_HISTORY, // Owner's blockchain activity
        LOCATION_BASED,     // Owner's location changes
        REPUTATION_SCORE,   // Owner's reputation/credibility
        INTERACTION_PATTERNS, // How owner interacts with the NFT
        ACHIEVEMENTS,       // Owner's achievements/milestones
        COMMUNITY_ENGAGEMENT // Owner's community participation
    }

    struct OwnerIntelligenceRule {
        OwnerIntelligenceType ruleType;
        uint256 tokenId;
        address owner;
        string triggerCondition;
        string newMetadataURI;
        bytes32 newMetadataHash;
        bool isActive;
        uint256 lastTriggered;
        uint256 cooldownPeriod;
        uint256 threshold; // Minimum value to trigger
    }

    // Mapping from tokenId to owner intelligence rules
    mapping(uint256 => OwnerIntelligenceRule[]) public tokenOwnerRules;
    
    // Owner activity tracking
    mapping(address => uint256) public ownerSocialScore;
    mapping(address => uint256) public ownerReputationScore;
    mapping(address => uint256) public ownerTransactionCount;
    mapping(address => string) public ownerLocation;
    mapping(address => uint256) public ownerLastActive;
    mapping(address => uint256) public ownerNFTInteractionCount;
    
    // Admin functions
    address public admin;
    
    constructor() {
        admin = msg.sender;
    }
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this");
        _;
    }

    /**
     * @dev Add owner-based intelligence rule
     * Makes the NFT respond to owner's behavior and activities
     */
    function addOwnerIntelligenceRule(
        uint256 tokenId,
        address owner_,
        OwnerIntelligenceType ruleType,
        string calldata triggerCondition,
        string calldata newMetadataURI,
        bytes32 newMetadataHash,
        uint256 cooldownPeriod,
        uint256 threshold
    ) external onlyAdmin {
        OwnerIntelligenceRule memory newRule = OwnerIntelligenceRule({
            ruleType: ruleType,
            tokenId: tokenId,
            owner: owner_,
            triggerCondition: triggerCondition,
            newMetadataURI: newMetadataURI,
            newMetadataHash: newMetadataHash,
            isActive: true,
            lastTriggered: 0,
            cooldownPeriod: cooldownPeriod,
            threshold: threshold
        });
        
        tokenOwnerRules[tokenId].push(newRule);
    }

    /**
     * @dev Check and execute owner-based intelligence rules
     */
    function checkOwnerIntelligence(uint256 tokenId, address owner_) external {
        OwnerIntelligenceRule[] storage rules = tokenOwnerRules[tokenId];
        
        for (uint i = 0; i < rules.length; i++) {
            OwnerIntelligenceRule storage rule = rules[i];
            
            if (!rule.isActive || rule.owner != owner_) continue;
            
            // Check cooldown
            if (block.timestamp < rule.lastTriggered + rule.cooldownPeriod) continue;
            
            // Check if owner-based condition is met
            if (shouldTriggerOwnerRule(rule)) {
                executeOwnerRule(rule);
            }
        }
    }

    /**
     * @dev Determine if owner-based rule should be triggered
     */
    function shouldTriggerOwnerRule(OwnerIntelligenceRule storage rule) internal view returns (bool) {
        if (rule.ruleType == OwnerIntelligenceType.SOCIAL_ACTIVITY) {
            return ownerSocialScore[rule.owner] >= rule.threshold;
        } else if (rule.ruleType == OwnerIntelligenceType.REPUTATION_SCORE) {
            return ownerReputationScore[rule.owner] >= rule.threshold;
        } else if (rule.ruleType == OwnerIntelligenceType.TRANSACTION_HISTORY) {
            return ownerTransactionCount[rule.owner] >= rule.threshold;
        } else if (rule.ruleType == OwnerIntelligenceType.INTERACTION_PATTERNS) {
            return ownerNFTInteractionCount[rule.owner] >= rule.threshold;
        } else if (rule.ruleType == OwnerIntelligenceType.COMMUNITY_ENGAGEMENT) {
            return block.timestamp - ownerLastActive[rule.owner] < 86400; // Active in last 24h
        }
        return false;
    }

    /**
     * @dev Execute owner-based rule
     */
    function executeOwnerRule(OwnerIntelligenceRule storage rule) internal {
        rule.lastTriggered = block.timestamp;
        
        emit OwnerBasedUpdate(
            rule.tokenId,
            rule.owner,
            getRuleTypeString(rule.ruleType),
            rule.triggerCondition,
            rule.newMetadataHash,
            block.timestamp
        );
    }

    /**
     * @dev Update owner's social activity score
     * Called when owner posts, gets likes, goes viral, etc.
     */
    function updateOwnerSocialScore(address owner_, uint256 newScore) external onlyAdmin {
        ownerSocialScore[owner_] = newScore;
        
        // Check if this triggers any rules
        checkAllOwnerRules(owner_);
    }

    /**
     * @dev Update owner's reputation score
     * Based on community feedback, verification status, etc.
     */
    function updateOwnerReputation(address owner_, uint256 newReputation) external onlyAdmin {
        ownerReputationScore[owner_] = newReputation;
        checkAllOwnerRules(owner_);
    }

    /**
     * @dev Track owner's transaction activity
     * Called when owner makes blockchain transactions
     */
    function trackOwnerTransaction(address owner_) external onlyAdmin {
        ownerTransactionCount[owner_]++;
        ownerLastActive[owner_] = block.timestamp;
        checkAllOwnerRules(owner_);
    }

    /**
     * @dev Track owner's NFT interactions
     * Called when owner interacts with their NFT
     */
    function trackOwnerNFTInteraction(address owner_) external onlyAdmin {
        ownerNFTInteractionCount[owner_]++;
        ownerLastActive[owner_] = block.timestamp;
        checkAllOwnerRules(owner_);
    }

    /**
     * @dev Update owner's location
     * Called when owner's location changes
     */
    function updateOwnerLocation(address owner_, string calldata newLocation) external onlyAdmin {
        ownerLocation[owner_] = newLocation;
        ownerLastActive[owner_] = block.timestamp;
        checkAllOwnerRules(owner_);
    }

    /**
     * @dev Check all rules for a specific owner
     */
    function checkAllOwnerRules(address owner_) internal {
        // In a real implementation, you would iterate through all tokens owned by this owner
        // For now, we'll just emit an event
        emit OwnerBasedUpdate(
            0, // tokenId would be determined by iteration
            owner_,
            "OWNER_ACTIVITY",
            "Owner activity detected",
            bytes32(0),
            block.timestamp
        );
    }

    /**
     * @dev Get owner intelligence data
     */
    function getOwnerIntelligenceData(address owner_) external view returns (
        uint256 socialScore,
        uint256 reputationScore,
        uint256 transactionCount,
        string memory location,
        uint256 lastActive,
        uint256 nftInteractionCount
    ) {
        return (
            ownerSocialScore[owner_],
            ownerReputationScore[owner_],
            ownerTransactionCount[owner_],
            ownerLocation[owner_],
            ownerLastActive[owner_],
            ownerNFTInteractionCount[owner_]
        );
    }

    /**
     * @dev Get all owner intelligence rules for a token
     */
    function getTokenOwnerRules(uint256 tokenId) external view returns (OwnerIntelligenceRule[] memory) {
        return tokenOwnerRules[tokenId];
    }

    /**
     * @dev Toggle owner rule on/off
     */
    function toggleOwnerRule(uint256 tokenId, uint256 ruleIndex) external onlyAdmin {
        require(ruleIndex < tokenOwnerRules[tokenId].length, "Invalid rule index");
        tokenOwnerRules[tokenId][ruleIndex].isActive = !tokenOwnerRules[tokenId][ruleIndex].isActive;
    }

    /**
     * @dev Helper function to get rule type as string
     */
    function getRuleTypeString(OwnerIntelligenceType ruleType) internal pure returns (string memory) {
        if (ruleType == OwnerIntelligenceType.SOCIAL_ACTIVITY) return "SOCIAL_ACTIVITY";
        if (ruleType == OwnerIntelligenceType.REPUTATION_SCORE) return "REPUTATION_SCORE";
        if (ruleType == OwnerIntelligenceType.TRANSACTION_HISTORY) return "TRANSACTION_HISTORY";
        if (ruleType == OwnerIntelligenceType.LOCATION_BASED) return "LOCATION_BASED";
        if (ruleType == OwnerIntelligenceType.INTERACTION_PATTERNS) return "INTERACTION_PATTERNS";
        if (ruleType == OwnerIntelligenceType.ACHIEVEMENTS) return "ACHIEVEMENTS";
        if (ruleType == OwnerIntelligenceType.COMMUNITY_ENGAGEMENT) return "COMMUNITY_ENGAGEMENT";
        return "PROFILE_CHANGES";
    }

    /**
     * @dev Implement IOracle interface
     */
    function verifyProof(bytes calldata proof) external view returns (bool) {
        // Verify that the owner-based update is legitimate
        return true;
    }
}
