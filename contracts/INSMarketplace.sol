// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./INFT.sol";
import "./INSRegistry.sol";

/**
 * @title INSMarketplace
 * @notice Marketplace for trading and renting intelligent domain agents
 * @dev Supports direct sales, rentals, and offer system for domain agents
 */
contract INSMarketplace is
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    // ============ Roles ============

    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    // ============ Enums ============

    enum ListingType {
        NONE,       // Not listed
        SALE,       // For sale
        RENT,       // For rent
        BOTH        // Both sale and rent
    }

    enum OfferType {
        BUY,        // Offer to buy
        RENT        // Offer to rent
    }

    // ============ Structs ============

    struct SaleListing {
        address seller;
        uint256 price;
        uint256 listedAt;
        bool active;
    }

    struct RentalListing {
        address owner;
        uint256 pricePerDay;
        uint256 minDuration;    // Minimum rental days
        uint256 maxDuration;    // Maximum rental days
        uint256 listedAt;
        bool active;
    }

    struct ActiveRental {
        address renter;
        uint256 startTime;
        uint256 endTime;
        uint256 totalPaid;
        bool active;
    }

    struct Offer {
        address offerer;
        uint256 amount;
        OfferType offerType;
        uint256 duration;       // For rental offers (in days)
        uint256 expiresAt;
        bool active;
    }

    struct MarketplaceStats {
        uint256 totalSales;
        uint256 totalVolume;
        uint256 totalRentals;
        uint256 totalRentalVolume;
    }

    // ============ State Variables ============

    /// @notice INS Registry contract
    INSRegistry public registry;

    /// @notice Platform fee percentage (basis points, e.g., 250 = 2.5%)
    uint256 public platformFee;

    /// @notice Maximum platform fee (5%)
    uint256 public constant MAX_PLATFORM_FEE = 500;

    /// @notice Treasury address for fees
    address public treasury;

    /// @notice Domain node to sale listing
    mapping(bytes32 => SaleListing) public saleListings;

    /// @notice Domain node to rental listing
    mapping(bytes32 => RentalListing) public rentalListings;

    /// @notice Domain node to active rental
    mapping(bytes32 => ActiveRental) public activeRentals;

    /// @notice Domain node to offers array
    mapping(bytes32 => Offer[]) public offers;

    /// @notice User to their listed domains
    mapping(address => bytes32[]) private userListings;

    /// @notice User to their rented domains
    mapping(address => bytes32[]) private userRentals;

    /// @notice Overall marketplace statistics
    MarketplaceStats public stats;

    /// @notice Minimum rental duration (1 day)
    uint256 public constant MIN_RENTAL_DURATION = 1 days;

    /// @notice Maximum rental duration (365 days)
    uint256 public constant MAX_RENTAL_DURATION = 365 days;

    /// @notice Offer expiration period (7 days)
    uint256 public constant OFFER_EXPIRATION = 7 days;

    // ============ Events ============

    event DomainListedForSale(
        bytes32 indexed node,
        string domainName,
        address indexed seller,
        uint256 price,
        uint256 timestamp
    );

    event DomainListedForRent(
        bytes32 indexed node,
        string domainName,
        address indexed owner,
        uint256 pricePerDay,
        uint256 minDuration,
        uint256 maxDuration,
        uint256 timestamp
    );

    event DomainSold(
        bytes32 indexed node,
        string domainName,
        address indexed seller,
        address indexed buyer,
        uint256 price,
        uint256 platformFeeAmount,
        uint256 timestamp
    );

    event DomainRented(
        bytes32 indexed node,
        string domainName,
        address indexed owner,
        address indexed renter,
        uint256 duration,
        uint256 totalPrice,
        uint256 startTime,
        uint256 endTime
    );

    event RentalEnded(
        bytes32 indexed node,
        string domainName,
        address indexed owner,
        address indexed renter,
        uint256 endTime
    );

    event ListingCancelled(
        bytes32 indexed node,
        string domainName,
        address indexed seller,
        ListingType listingType,
        uint256 timestamp
    );

    event OfferMade(
        bytes32 indexed node,
        string domainName,
        address indexed offerer,
        uint256 amount,
        OfferType offerType,
        uint256 duration,
        uint256 expiresAt
    );

    event OfferAccepted(
        bytes32 indexed node,
        string domainName,
        address indexed offerer,
        address indexed seller,
        uint256 amount,
        OfferType offerType
    );

    event OfferCancelled(
        bytes32 indexed node,
        string domainName,
        address indexed offerer,
        uint256 offerIndex
    );

    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);

    // ============ Modifiers ============

    modifier onlyDomainOwner(bytes32 node) {
        address inftAddress = registry.nameToINFT(node);
        require(inftAddress != address(0), "Domain not registered");

        INFT inft = INFT(inftAddress);
        require(inft.ownerOf(0) == msg.sender, "Not domain owner");
        _;
    }

    modifier notRented(bytes32 node) {
        require(!activeRentals[node].active ||
                activeRentals[node].endTime < block.timestamp,
                "Domain currently rented");
        _;
    }

    // ============ Initialization ============

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _registry,
        address _treasury,
        uint256 _platformFee
    ) public initializer {
        require(_registry != address(0), "Invalid registry");
        require(_treasury != address(0), "Invalid treasury");
        require(_platformFee <= MAX_PLATFORM_FEE, "Fee too high");

        __AccessControl_init();
        __ReentrancyGuard_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);

        registry = INSRegistry(_registry);
        treasury = _treasury;
        platformFee = _platformFee;
    }

    // ============ Sale Functions ============

    /**
     * @notice List a domain for sale
     * @param node Domain node hash
     * @param price Sale price in wei
     */
    function listForSale(
        bytes32 node,
        uint256 price
    ) external nonReentrant whenNotPaused onlyDomainOwner(node) notRented(node) {
        require(price > 0, "Invalid price");
        require(!saleListings[node].active, "Already listed for sale");

        saleListings[node] = SaleListing({
            seller: msg.sender,
            price: price,
            listedAt: block.timestamp,
            active: true
        });

        userListings[msg.sender].push(node);

        string memory domainName = registry.nodeToDomainName(node);
        emit DomainListedForSale(node, domainName, msg.sender, price, block.timestamp);
    }

    /**
     * @notice Buy a listed domain
     * @param node Domain node hash
     */
    function buyDomain(bytes32 node) external payable nonReentrant whenNotPaused {
        SaleListing storage listing = saleListings[node];
        require(listing.active, "Not listed for sale");
        require(msg.value >= listing.price, "Insufficient payment");
        require(msg.sender != listing.seller, "Cannot buy own domain");

        address seller = listing.seller;
        uint256 price = listing.price;

        // Calculate platform fee
        uint256 feeAmount = (price * platformFee) / 10000;
        uint256 sellerAmount = price - feeAmount;

        // Mark as inactive
        listing.active = false;

        // Also cancel rental listing if exists
        if (rentalListings[node].active) {
            rentalListings[node].active = false;
        }

        // Transfer domain ownership
        address inftAddress = registry.nameToINFT(node);
        INFT inft = INFT(inftAddress);
        inft.safeTransferFrom(seller, msg.sender, 0);

        // Transfer funds
        payable(treasury).transfer(feeAmount);
        payable(seller).transfer(sellerAmount);

        // Refund excess payment
        if (msg.value > price) {
            payable(msg.sender).transfer(msg.value - price);
        }

        // Update stats
        stats.totalSales++;
        stats.totalVolume += price;

        string memory domainName = registry.nodeToDomainName(node);
        emit DomainSold(node, domainName, seller, msg.sender, price, feeAmount, block.timestamp);
    }

    // ============ Rental Functions ============

    /**
     * @notice List a domain for rent
     * @param node Domain node hash
     * @param pricePerDay Daily rental price in wei
     * @param minDuration Minimum rental duration in days
     * @param maxDuration Maximum rental duration in days
     */
    function listForRent(
        bytes32 node,
        uint256 pricePerDay,
        uint256 minDuration,
        uint256 maxDuration
    ) external nonReentrant whenNotPaused onlyDomainOwner(node) notRented(node) {
        require(pricePerDay > 0, "Invalid price");
        require(minDuration >= 1 && minDuration <= maxDuration, "Invalid duration");
        require(maxDuration <= 365, "Max duration is 365 days");
        require(!rentalListings[node].active, "Already listed for rent");

        rentalListings[node] = RentalListing({
            owner: msg.sender,
            pricePerDay: pricePerDay,
            minDuration: minDuration,
            maxDuration: maxDuration,
            listedAt: block.timestamp,
            active: true
        });

        userListings[msg.sender].push(node);

        string memory domainName = registry.nodeToDomainName(node);
        emit DomainListedForRent(node, domainName, msg.sender, pricePerDay, minDuration, maxDuration, block.timestamp);
    }

    /**
     * @notice Rent a domain
     * @param node Domain node hash
     * @param durationDays Rental duration in days
     */
    function rentDomain(
        bytes32 node,
        uint256 durationDays
    ) external payable nonReentrant whenNotPaused notRented(node) {
        RentalListing storage listing = rentalListings[node];
        require(listing.active, "Not listed for rent");
        require(durationDays >= listing.minDuration && durationDays <= listing.maxDuration, "Invalid duration");
        require(msg.sender != listing.owner, "Cannot rent own domain");

        uint256 totalPrice = listing.pricePerDay * durationDays;
        require(msg.value >= totalPrice, "Insufficient payment");

        address owner = listing.owner;
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + (durationDays * 1 days);

        // Calculate platform fee
        uint256 feeAmount = (totalPrice * platformFee) / 10000;
        uint256 ownerAmount = totalPrice - feeAmount;

        // Create rental record
        activeRentals[node] = ActiveRental({
            renter: msg.sender,
            startTime: startTime,
            endTime: endTime,
            totalPaid: totalPrice,
            active: true
        });

        userRentals[msg.sender].push(node);

        // Transfer funds
        payable(treasury).transfer(feeAmount);
        payable(owner).transfer(ownerAmount);

        // Refund excess payment
        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }

        // Update stats
        stats.totalRentals++;
        stats.totalRentalVolume += totalPrice;

        string memory domainName = registry.nodeToDomainName(node);
        emit DomainRented(node, domainName, owner, msg.sender, durationDays, totalPrice, startTime, endTime);
    }

    /**
     * @notice End a rental (can be called by owner or renter after expiry)
     * @param node Domain node hash
     */
    function endRental(bytes32 node) external nonReentrant {
        ActiveRental storage rental = activeRentals[node];
        require(rental.active, "No active rental");
        require(block.timestamp >= rental.endTime, "Rental period not ended");

        address renter = rental.renter;
        rental.active = false;

        string memory domainName = registry.nodeToDomainName(node);
        emit RentalEnded(node, domainName, rentalListings[node].owner, renter, block.timestamp);
    }

    // ============ Listing Management ============

    /**
     * @notice Cancel a sale listing
     * @param node Domain node hash
     */
    function cancelSaleListing(bytes32 node) external nonReentrant onlyDomainOwner(node) {
        require(saleListings[node].active, "Not listed for sale");

        saleListings[node].active = false;

        string memory domainName = registry.nodeToDomainName(node);
        emit ListingCancelled(node, domainName, msg.sender, ListingType.SALE, block.timestamp);
    }

    /**
     * @notice Cancel a rental listing
     * @param node Domain node hash
     */
    function cancelRentalListing(bytes32 node) external nonReentrant onlyDomainOwner(node) {
        require(rentalListings[node].active, "Not listed for rent");
        require(!activeRentals[node].active, "Cannot cancel during active rental");

        rentalListings[node].active = false;

        string memory domainName = registry.nodeToDomainName(node);
        emit ListingCancelled(node, domainName, msg.sender, ListingType.RENT, block.timestamp);
    }

    /**
     * @notice Update sale price
     * @param node Domain node hash
     * @param newPrice New price in wei
     */
    function updateSalePrice(bytes32 node, uint256 newPrice) external onlyDomainOwner(node) {
        require(saleListings[node].active, "Not listed for sale");
        require(newPrice > 0, "Invalid price");

        saleListings[node].price = newPrice;

        string memory domainName = registry.nodeToDomainName(node);
        emit DomainListedForSale(node, domainName, msg.sender, newPrice, block.timestamp);
    }

    // ============ Offer Functions ============

    /**
     * @notice Make an offer to buy or rent a domain
     * @param node Domain node hash
     * @param offerType Type of offer (BUY or RENT)
     * @param duration Rental duration in days (only for RENT offers)
     */
    function makeOffer(
        bytes32 node,
        OfferType offerType,
        uint256 duration
    ) external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "Invalid offer amount");

        address inftAddress = registry.nameToINFT(node);
        require(inftAddress != address(0), "Domain not registered");

        INFT inft = INFT(inftAddress);
        address owner = inft.ownerOf(0);
        require(msg.sender != owner, "Cannot offer on own domain");

        if (offerType == OfferType.RENT) {
            require(duration >= 1 && duration <= 365, "Invalid duration");
        }

        offers[node].push(Offer({
            offerer: msg.sender,
            amount: msg.value,
            offerType: offerType,
            duration: duration,
            expiresAt: block.timestamp + OFFER_EXPIRATION,
            active: true
        }));

        string memory domainName = registry.nodeToDomainName(node);
        emit OfferMade(node, domainName, msg.sender, msg.value, offerType, duration, block.timestamp + OFFER_EXPIRATION);
    }

    /**
     * @notice Accept an offer
     * @param node Domain node hash
     * @param offerIndex Index of the offer in the offers array
     */
    function acceptOffer(
        bytes32 node,
        uint256 offerIndex
    ) external nonReentrant whenNotPaused onlyDomainOwner(node) {
        require(offerIndex < offers[node].length, "Invalid offer index");

        Offer storage offer = offers[node][offerIndex];
        require(offer.active, "Offer not active");
        require(offer.expiresAt >= block.timestamp, "Offer expired");

        address offerer = offer.offerer;
        uint256 amount = offer.amount;
        OfferType offerType = offer.offerType;

        // Mark offer as inactive
        offer.active = false;

        // Calculate platform fee
        uint256 feeAmount = (amount * platformFee) / 10000;
        uint256 sellerAmount = amount - feeAmount;

        if (offerType == OfferType.BUY) {
            // Transfer domain ownership
            address inftAddress = registry.nameToINFT(node);
            INFT inft = INFT(inftAddress);
            inft.safeTransferFrom(msg.sender, offerer, 0);

            // Cancel active listings
            saleListings[node].active = false;
            rentalListings[node].active = false;

            // Update stats
            stats.totalSales++;
            stats.totalVolume += amount;

            string memory domainName = registry.nodeToDomainName(node);
            emit DomainSold(node, domainName, msg.sender, offerer, amount, feeAmount, block.timestamp);
        } else {
            // Create rental
            uint256 startTime = block.timestamp;
            uint256 endTime = startTime + (offer.duration * 1 days);

            activeRentals[node] = ActiveRental({
                renter: offerer,
                startTime: startTime,
                endTime: endTime,
                totalPaid: amount,
                active: true
            });

            userRentals[offerer].push(node);

            // Update stats
            stats.totalRentals++;
            stats.totalRentalVolume += amount;

            string memory domainName = registry.nodeToDomainName(node);
            emit DomainRented(node, domainName, msg.sender, offerer, offer.duration, amount, startTime, endTime);
        }

        // Transfer funds
        payable(treasury).transfer(feeAmount);
        payable(msg.sender).transfer(sellerAmount);

        string memory domainName = registry.nodeToDomainName(node);
        emit OfferAccepted(node, domainName, offerer, msg.sender, amount, offerType);
    }

    /**
     * @notice Cancel an offer and get refund
     * @param node Domain node hash
     * @param offerIndex Index of the offer in the offers array
     */
    function cancelOffer(bytes32 node, uint256 offerIndex) external nonReentrant {
        require(offerIndex < offers[node].length, "Invalid offer index");

        Offer storage offer = offers[node][offerIndex];
        require(offer.active, "Offer not active");
        require(offer.offerer == msg.sender, "Not your offer");

        uint256 refundAmount = offer.amount;
        offer.active = false;

        payable(msg.sender).transfer(refundAmount);

        string memory domainName = registry.nodeToDomainName(node);
        emit OfferCancelled(node, domainName, msg.sender, offerIndex);
    }

    // ============ View Functions ============

    /**
     * @notice Get all active offers for a domain
     * @param node Domain node hash
     */
    function getOffers(bytes32 node) external view returns (Offer[] memory) {
        return offers[node];
    }

    /**
     * @notice Get user's listed domains
     * @param user User address
     */
    function getUserListings(address user) external view returns (bytes32[] memory) {
        return userListings[user];
    }

    /**
     * @notice Get user's rented domains
     * @param user User address
     */
    function getUserRentals(address user) external view returns (bytes32[] memory) {
        return userRentals[user];
    }

    /**
     * @notice Check if domain is available for sale
     * @param node Domain node hash
     */
    function isListedForSale(bytes32 node) external view returns (bool) {
        return saleListings[node].active;
    }

    /**
     * @notice Check if domain is available for rent
     * @param node Domain node hash
     */
    function isListedForRent(bytes32 node) external view returns (bool) {
        return rentalListings[node].active && !activeRentals[node].active;
    }

    /**
     * @notice Check if domain is currently rented
     * @param node Domain node hash
     */
    function isCurrentlyRented(bytes32 node) external view returns (bool) {
        return activeRentals[node].active && activeRentals[node].endTime > block.timestamp;
    }

    /**
     * @notice Get marketplace statistics
     */
    function getMarketplaceStats() external view returns (MarketplaceStats memory) {
        return stats;
    }

    // ============ Admin Functions ============

    /**
     * @notice Update platform fee
     * @param newFee New fee in basis points
     */
    function updatePlatformFee(uint256 newFee) external onlyRole(OPERATOR_ROLE) {
        require(newFee <= MAX_PLATFORM_FEE, "Fee too high");

        uint256 oldFee = platformFee;
        platformFee = newFee;

        emit PlatformFeeUpdated(oldFee, newFee);
    }

    /**
     * @notice Update treasury address
     * @param newTreasury New treasury address
     */
    function updateTreasury(address newTreasury) external onlyRole(OPERATOR_ROLE) {
        require(newTreasury != address(0), "Invalid treasury");

        address oldTreasury = treasury;
        treasury = newTreasury;

        emit TreasuryUpdated(oldTreasury, newTreasury);
    }

    /**
     * @notice Pause the marketplace
     */
    function pause() external onlyRole(OPERATOR_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause the marketplace
     */
    function unpause() external onlyRole(OPERATOR_ROLE) {
        _unpause();
    }

    /**
     * @notice Authorize contract upgrade
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

    /**
     * @notice Get contract version
     */
    function version() external pure returns (string memory) {
        return "1.0.0";
    }
}
