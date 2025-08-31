// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./IOracle.sol";

/**
 * @title IntelligentOracle
 * @dev Demonstrates how ERC7857 metadata can change intelligently based on external data
 * This is what makes iNFTs truly "intelligent" - they respond to real-world events
 */
contract IntelligentOracle is IOracle {
    
    // Event emitted when oracle triggers a metadata update
    event MetadataUpdateTriggered(
        uint256 indexed tokenId,
        string reason,
        bytes32 newHash,
        uint256 timestamp
    );

    // Different types of intelligence triggers
    enum IntelligenceType {
        TIME_BASED,      // Changes based on time (daily, weekly, etc.)
        WEATHER_BASED,   // Changes based on weather data
        SOCIAL_BASED,    // Changes based on social media activity
        PRICE_BASED,     // Changes based on cryptocurrency prices
        CUSTOM_LOGIC     // Custom business logic
    }

    struct IntelligenceRule {
        IntelligenceType ruleType;
        uint256 tokenId;
        string triggerCondition;
        string newMetadataURI;
        bytes32 newMetadataHash;
        bool isActive;
        uint256 lastTriggered;
        uint256 cooldownPeriod;
    }

    // Mapping from tokenId to intelligence rules
    mapping(uint256 => IntelligenceRule[]) public tokenIntelligenceRules;
    
    // External data feeds (in real implementation, these would be Chainlink oracles)
    mapping(string => uint256) public externalDataFeeds;
    
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
     * @dev Add an intelligence rule for a token
     * This is what makes the NFT "intelligent" - it will automatically change based on conditions
     */
    function addIntelligenceRule(
        uint256 tokenId,
        IntelligenceType ruleType,
        string calldata triggerCondition,
        string calldata newMetadataURI,
        bytes32 newMetadataHash,
        uint256 cooldownPeriod
    ) external onlyAdmin {
        IntelligenceRule memory newRule = IntelligenceRule({
            ruleType: ruleType,
            tokenId: tokenId,
            triggerCondition: triggerCondition,
            newMetadataURI: newMetadataURI,
            newMetadataHash: newMetadataHash,
            isActive: true,
            lastTriggered: 0,
            cooldownPeriod: cooldownPeriod
        });
        
        tokenIntelligenceRules[tokenId].push(newRule);
    }

    /**
     * @dev Check and execute intelligence rules
     * This function would be called by a keeper or scheduled task
     */
    function checkAndExecuteIntelligence(uint256 tokenId) external {
        IntelligenceRule[] storage rules = tokenIntelligenceRules[tokenId];
        
        for (uint i = 0; i < rules.length; i++) {
            IntelligenceRule storage rule = rules[i];
            
            if (!rule.isActive) continue;
            
            // Check cooldown
            if (block.timestamp < rule.lastTriggered + rule.cooldownPeriod) continue;
            
            // Check if condition is met
            if (shouldTriggerRule(rule)) {
                executeRule(rule);
            }
        }
    }

    /**
     * @dev Determine if a rule should be triggered based on current conditions
     */
    function shouldTriggerRule(IntelligenceRule storage rule) internal view returns (bool) {
        if (rule.ruleType == IntelligenceType.TIME_BASED) {
            return checkTimeBasedCondition(rule.triggerCondition);
        } else if (rule.ruleType == IntelligenceType.WEATHER_BASED) {
            return checkWeatherBasedCondition(rule.triggerCondition);
        } else if (rule.ruleType == IntelligenceType.SOCIAL_BASED) {
            return checkSocialBasedCondition(rule.triggerCondition);
        } else if (rule.ruleType == IntelligenceType.PRICE_BASED) {
            return checkPriceBasedCondition(rule.triggerCondition);
        }
        return false;
    }

    /**
     * @dev Execute a triggered rule by updating metadata
     */
    function executeRule(IntelligenceRule storage rule) internal {
        rule.lastTriggered = block.timestamp;
        
        // In a real implementation, this would call the registrar contract
        // to update the metadata for the token
        emit MetadataUpdateTriggered(
            rule.tokenId,
            rule.triggerCondition,
            rule.newMetadataHash,
            block.timestamp
        );
    }

    // Example condition checkers (simplified)
    function checkTimeBasedCondition(string memory condition) internal view returns (bool) {
        // Example: "daily" - change every 24 hours
        if (keccak256(abi.encodePacked(condition)) == keccak256(abi.encodePacked("daily"))) {
            return block.timestamp % 86400 < 3600; // Trigger once per day
        }
        return false;
    }

    function checkWeatherBasedCondition(string memory condition) internal view returns (bool) {
        // Example: "rainy" - change when weather data shows rain
        // In real implementation, this would query a weather oracle
        return externalDataFeeds["weather_condition"] > 0;
    }

    function checkSocialBasedCondition(string memory condition) internal view returns (bool) {
        // Example: "viral" - change when social media activity is high
        return externalDataFeeds["social_activity"] > 1000;
    }

    function checkPriceBasedCondition(string memory condition) internal view returns (bool) {
        // Example: "bull_market" - change when crypto prices are rising
        return externalDataFeeds["eth_price"] > 3000;
    }

    /**
     * @dev Update external data feeds (in real implementation, these would be from oracles)
     */
    function updateExternalData(string calldata feedName, uint256 value) external onlyAdmin {
        externalDataFeeds[feedName] = value;
    }

    /**
     * @dev Get all intelligence rules for a token
     */
    function getTokenIntelligenceRules(uint256 tokenId) external view returns (IntelligenceRule[] memory) {
        return tokenIntelligenceRules[tokenId];
    }

    /**
     * @dev Toggle a rule on/off
     */
    function toggleRule(uint256 tokenId, uint256 ruleIndex) external onlyAdmin {
        require(ruleIndex < tokenIntelligenceRules[tokenId].length, "Invalid rule index");
        tokenIntelligenceRules[tokenId][ruleIndex].isActive = !tokenIntelligenceRules[tokenId][ruleIndex].isActive;
    }

    /**
     * @dev Implement IOracle interface
     */
    function verifyProof(bytes calldata proof) external view returns (bool) {
        // In a real implementation, this would verify cryptographic proofs
        // For now, return true for demonstration
        return true;
    }
}
