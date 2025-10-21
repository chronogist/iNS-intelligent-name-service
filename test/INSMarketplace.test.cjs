const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("INSMarketplace", function () {
  let registry, marketplace;
  let owner, seller, buyer, renter, treasury;
  let testDomain = "test-agent";
  let testNode;
  let inftAddress;

  const REGISTRATION_PRICE = ethers.parseEther("0.1");
  const SALE_PRICE = ethers.parseEther("1.0");
  const RENT_PRICE_PER_DAY = ethers.parseEther("0.05");
  const PLATFORM_FEE = 250; // 2.5%

  beforeEach(async function () {
    [owner, seller, buyer, renter, treasury] = await ethers.getSigners();

    // Deploy Registry
    const INSRegistry = await ethers.getContractFactory("INSRegistry");
    registry = await upgrades.deployProxy(
      INSRegistry,
      [owner.address, treasury.address, owner.address, REGISTRATION_PRICE, ethers.parseEther("0.2")],
      { initializer: "initialize", kind: "uups" }
    );
    await registry.waitForDeployment();

    // Deploy Marketplace
    const INSMarketplace = await ethers.getContractFactory("INSMarketplace");
    marketplace = await upgrades.deployProxy(
      INSMarketplace,
      [await registry.getAddress(), treasury.address, PLATFORM_FEE],
      { initializer: "initialize", kind: "uups" }
    );
    await marketplace.waitForDeployment();

    // Register a test domain
    testNode = ethers.namehash(testDomain + ".0g");
    const metadataURI = "https://0g-storage.example/metadata.json";
    const metadataHash = ethers.keccak256(ethers.toUtf8Bytes("test metadata"));
    await registry.connect(seller).register(
      testDomain,
      seller.address,
      365 * 24 * 60 * 60, // 365 days in seconds
      metadataURI,
      metadataHash,
      "DeFi Trader", // agentType
      { value: REGISTRATION_PRICE }
    );

    // Get INFT address
    inftAddress = await registry.nameToINFT(testNode);
  });

  describe("Deployment", function () {
    it("Should set the correct registry", async function () {
      expect(await marketplace.registry()).to.equal(await registry.getAddress());
    });

    it("Should set the correct treasury", async function () {
      expect(await marketplace.treasury()).to.equal(treasury.address);
    });

    it("Should set the correct platform fee", async function () {
      expect(await marketplace.platformFee()).to.equal(PLATFORM_FEE);
    });

    it("Should have zero initial stats", async function () {
      const stats = await marketplace.getMarketplaceStats();
      expect(stats.totalSales).to.equal(0);
      expect(stats.totalVolume).to.equal(0);
      expect(stats.totalRentals).to.equal(0);
    });
  });

  describe("Sale Listings", function () {
    it("Should allow domain owner to list for sale", async function () {
      await expect(
        marketplace.connect(seller).listForSale(testNode, SALE_PRICE)
      ).to.emit(marketplace, "DomainListedForSale");

      const listing = await marketplace.saleListings(testNode);
      expect(listing.seller).to.equal(seller.address);
      expect(listing.price).to.equal(SALE_PRICE);
      expect(listing.active).to.be.true;
    });

    it("Should not allow non-owner to list", async function () {
      await expect(
        marketplace.connect(buyer).listForSale(testNode, SALE_PRICE)
      ).to.be.revertedWith("Not domain owner");
    });

    it("Should not allow listing with zero price", async function () {
      await expect(
        marketplace.connect(seller).listForSale(testNode, 0)
      ).to.be.revertedWith("Invalid price");
    });

    it("Should allow updating sale price", async function () {
      await marketplace.connect(seller).listForSale(testNode, SALE_PRICE);

      const newPrice = ethers.parseEther("1.5");
      await marketplace.connect(seller).updateSalePrice(testNode, newPrice);

      const listing = await marketplace.saleListings(testNode);
      expect(listing.price).to.equal(newPrice);
    });

    it("Should allow cancelling sale listing", async function () {
      await marketplace.connect(seller).listForSale(testNode, SALE_PRICE);

      await expect(
        marketplace.connect(seller).cancelSaleListing(testNode)
      ).to.emit(marketplace, "ListingCancelled");

      const listing = await marketplace.saleListings(testNode);
      expect(listing.active).to.be.false;
    });
  });

  describe("Buying Domains", function () {
    beforeEach(async function () {
      await marketplace.connect(seller).listForSale(testNode, SALE_PRICE);
    });

    it("Should allow buying a listed domain", async function () {
      const INFT = await ethers.getContractAt("INFT", inftAddress);

      // Approve marketplace to transfer INFT
      await INFT.connect(seller).approve(await marketplace.getAddress(), 0);

      await expect(
        marketplace.connect(buyer).buyDomain(testNode, { value: SALE_PRICE })
      ).to.emit(marketplace, "DomainSold");

      // Check ownership transferred
      expect(await INFT.ownerOf(0)).to.equal(buyer.address);

      // Check listing deactivated
      const listing = await marketplace.saleListings(testNode);
      expect(listing.active).to.be.false;

      // Check stats updated
      const stats = await marketplace.getMarketplaceStats();
      expect(stats.totalSales).to.equal(1);
      expect(stats.totalVolume).to.equal(SALE_PRICE);
    });

    it("Should distribute funds correctly", async function () {
      const INFT = await ethers.getContractAt("INFT", inftAddress);
      await INFT.connect(seller).approve(await marketplace.getAddress(), 0);

      const treasuryBalanceBefore = await ethers.provider.getBalance(treasury.address);
      const sellerBalanceBefore = await ethers.provider.getBalance(seller.address);

      await marketplace.connect(buyer).buyDomain(testNode, { value: SALE_PRICE });

      const treasuryBalanceAfter = await ethers.provider.getBalance(treasury.address);
      const sellerBalanceAfter = await ethers.provider.getBalance(seller.address);

      const expectedFee = (SALE_PRICE * BigInt(PLATFORM_FEE)) / BigInt(10000);
      const expectedSellerAmount = SALE_PRICE - expectedFee;

      expect(treasuryBalanceAfter - treasuryBalanceBefore).to.equal(expectedFee);
      expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(expectedSellerAmount);
    });

    it("Should refund excess payment", async function () {
      const INFT = await ethers.getContractAt("INFT", inftAddress);
      await INFT.connect(seller).approve(await marketplace.getAddress(), 0);

      const excessPayment = ethers.parseEther("2.0"); // Paying 2 ETH for 1 ETH item
      const buyerBalanceBefore = await ethers.provider.getBalance(buyer.address);

      const tx = await marketplace.connect(buyer).buyDomain(testNode, { value: excessPayment });
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const buyerBalanceAfter = await ethers.provider.getBalance(buyer.address);

      // Buyer should only pay the sale price + gas
      expect(buyerBalanceBefore - buyerBalanceAfter).to.be.closeTo(
        SALE_PRICE + gasUsed,
        ethers.parseEther("0.001") // Allow small variance
      );
    });

    it("Should not allow buying with insufficient payment", async function () {
      await expect(
        marketplace.connect(buyer).buyDomain(testNode, { value: ethers.parseEther("0.5") })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("Should not allow buying own domain", async function () {
      await expect(
        marketplace.connect(seller).buyDomain(testNode, { value: SALE_PRICE })
      ).to.be.revertedWith("Cannot buy own domain");
    });

    it("Should not allow buying unlisted domain", async function () {
      await marketplace.connect(seller).cancelSaleListing(testNode);

      await expect(
        marketplace.connect(buyer).buyDomain(testNode, { value: SALE_PRICE })
      ).to.be.revertedWith("Not listed for sale");
    });
  });

  describe("Rental Listings", function () {
    it("Should allow domain owner to list for rent", async function () {
      await expect(
        marketplace.connect(seller).listForRent(testNode, RENT_PRICE_PER_DAY, 1, 30)
      ).to.emit(marketplace, "DomainListedForRent");

      const listing = await marketplace.rentalListings(testNode);
      expect(listing.owner).to.equal(seller.address);
      expect(listing.pricePerDay).to.equal(RENT_PRICE_PER_DAY);
      expect(listing.minDuration).to.equal(1);
      expect(listing.maxDuration).to.equal(30);
      expect(listing.active).to.be.true;
    });

    it("Should not allow listing with invalid duration", async function () {
      await expect(
        marketplace.connect(seller).listForRent(testNode, RENT_PRICE_PER_DAY, 30, 10)
      ).to.be.revertedWith("Invalid duration");
    });

    it("Should not allow duration exceeding 365 days", async function () {
      await expect(
        marketplace.connect(seller).listForRent(testNode, RENT_PRICE_PER_DAY, 1, 400)
      ).to.be.revertedWith("Max duration is 365 days");
    });

    it("Should allow cancelling rental listing", async function () {
      await marketplace.connect(seller).listForRent(testNode, RENT_PRICE_PER_DAY, 1, 30);

      await expect(
        marketplace.connect(seller).cancelRentalListing(testNode)
      ).to.emit(marketplace, "ListingCancelled");

      const listing = await marketplace.rentalListings(testNode);
      expect(listing.active).to.be.false;
    });
  });

  describe("Renting Domains", function () {
    const RENTAL_DAYS = 7;
    const TOTAL_RENTAL_PRICE = RENT_PRICE_PER_DAY * BigInt(RENTAL_DAYS);

    beforeEach(async function () {
      await marketplace.connect(seller).listForRent(testNode, RENT_PRICE_PER_DAY, 1, 30);
    });

    it("Should allow renting a listed domain", async function () {
      await expect(
        marketplace.connect(renter).rentDomain(testNode, RENTAL_DAYS, { value: TOTAL_RENTAL_PRICE })
      ).to.emit(marketplace, "DomainRented");

      const rental = await marketplace.activeRentals(testNode);
      expect(rental.renter).to.equal(renter.address);
      expect(rental.active).to.be.true;
      expect(rental.totalPaid).to.equal(TOTAL_RENTAL_PRICE);

      // Check stats updated
      const stats = await marketplace.getMarketplaceStats();
      expect(stats.totalRentals).to.equal(1);
      expect(stats.totalRentalVolume).to.equal(TOTAL_RENTAL_PRICE);
    });

    it("Should distribute rental funds correctly", async function () {
      const treasuryBalanceBefore = await ethers.provider.getBalance(treasury.address);
      const sellerBalanceBefore = await ethers.provider.getBalance(seller.address);

      await marketplace.connect(renter).rentDomain(testNode, RENTAL_DAYS, { value: TOTAL_RENTAL_PRICE });

      const treasuryBalanceAfter = await ethers.provider.getBalance(treasury.address);
      const sellerBalanceAfter = await ethers.provider.getBalance(seller.address);

      const expectedFee = (TOTAL_RENTAL_PRICE * BigInt(PLATFORM_FEE)) / BigInt(10000);
      const expectedOwnerAmount = TOTAL_RENTAL_PRICE - expectedFee;

      expect(treasuryBalanceAfter - treasuryBalanceBefore).to.equal(expectedFee);
      expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(expectedOwnerAmount);
    });

    it("Should not allow renting with invalid duration", async function () {
      await expect(
        marketplace.connect(renter).rentDomain(testNode, 100, { value: TOTAL_RENTAL_PRICE })
      ).to.be.revertedWith("Invalid duration");
    });

    it("Should not allow renting own domain", async function () {
      await expect(
        marketplace.connect(seller).rentDomain(testNode, RENTAL_DAYS, { value: TOTAL_RENTAL_PRICE })
      ).to.be.revertedWith("Cannot rent own domain");
    });

    it("Should allow ending rental after expiry", async function () {
      await marketplace.connect(renter).rentDomain(testNode, RENTAL_DAYS, { value: TOTAL_RENTAL_PRICE });

      // Fast forward time
      await time.increase(RENTAL_DAYS * 24 * 60 * 60 + 1);

      await expect(
        marketplace.connect(seller).endRental(testNode)
      ).to.emit(marketplace, "RentalEnded");

      const rental = await marketplace.activeRentals(testNode);
      expect(rental.active).to.be.false;
    });

    it("Should not allow ending rental before expiry", async function () {
      await marketplace.connect(renter).rentDomain(testNode, RENTAL_DAYS, { value: TOTAL_RENTAL_PRICE });

      await expect(
        marketplace.connect(seller).endRental(testNode)
      ).to.be.revertedWith("Rental period not ended");
    });
  });

  describe("Offers", function () {
    const OFFER_AMOUNT = ethers.parseEther("0.8");

    it("Should allow making a buy offer", async function () {
      await expect(
        marketplace.connect(buyer).makeOffer(testNode, 0, 0, { value: OFFER_AMOUNT })
      ).to.emit(marketplace, "OfferMade");

      const offers = await marketplace.getOffers(testNode);
      expect(offers.length).to.equal(1);
      expect(offers[0].offerer).to.equal(buyer.address);
      expect(offers[0].amount).to.equal(OFFER_AMOUNT);
      expect(offers[0].active).to.be.true;
    });

    it("Should allow making a rent offer", async function () {
      const RENTAL_DURATION = 10;

      await expect(
        marketplace.connect(renter).makeOffer(testNode, 1, RENTAL_DURATION, { value: OFFER_AMOUNT })
      ).to.emit(marketplace, "OfferMade");

      const offers = await marketplace.getOffers(testNode);
      expect(offers[0].duration).to.equal(RENTAL_DURATION);
    });

    it("Should not allow zero amount offer", async function () {
      await expect(
        marketplace.connect(buyer).makeOffer(testNode, 0, 0, { value: 0 })
      ).to.be.revertedWith("Invalid offer amount");
    });

    it("Should allow seller to accept buy offer", async function () {
      const INFT = await ethers.getContractAt("INFT", inftAddress);
      await INFT.connect(seller).approve(await marketplace.getAddress(), 0);

      await marketplace.connect(buyer).makeOffer(testNode, 0, 0, { value: OFFER_AMOUNT });

      await expect(
        marketplace.connect(seller).acceptOffer(testNode, 0)
      ).to.emit(marketplace, "OfferAccepted");

      // Check ownership transferred
      expect(await INFT.ownerOf(0)).to.equal(buyer.address);

      // Check offer deactivated
      const offers = await marketplace.getOffers(testNode);
      expect(offers[0].active).to.be.false;
    });

    it("Should allow offerer to cancel offer", async function () {
      await marketplace.connect(buyer).makeOffer(testNode, 0, 0, { value: OFFER_AMOUNT });

      const buyerBalanceBefore = await ethers.provider.getBalance(buyer.address);

      await expect(
        marketplace.connect(buyer).cancelOffer(testNode, 0)
      ).to.emit(marketplace, "OfferCancelled");

      // Check refund received
      const buyerBalanceAfter = await ethers.provider.getBalance(buyer.address);
      expect(buyerBalanceAfter).to.be.gt(buyerBalanceBefore);

      // Check offer deactivated
      const offers = await marketplace.getOffers(testNode);
      expect(offers[0].active).to.be.false;
    });
  });

  describe("Admin Functions", function () {
    it("Should allow operator to update platform fee", async function () {
      const newFee = 300;

      await expect(
        marketplace.connect(owner).updatePlatformFee(newFee)
      ).to.emit(marketplace, "PlatformFeeUpdated");

      expect(await marketplace.platformFee()).to.equal(newFee);
    });

    it("Should not allow fee higher than max", async function () {
      await expect(
        marketplace.connect(owner).updatePlatformFee(600)
      ).to.be.revertedWith("Fee too high");
    });

    it("Should allow operator to update treasury", async function () {
      const [, , , , , newTreasury] = await ethers.getSigners();

      await expect(
        marketplace.connect(owner).updateTreasury(newTreasury.address)
      ).to.emit(marketplace, "TreasuryUpdated");

      expect(await marketplace.treasury()).to.equal(newTreasury.address);
    });

    it("Should allow pausing and unpausing", async function () {
      await marketplace.connect(owner).pause();

      await expect(
        marketplace.connect(seller).listForSale(testNode, SALE_PRICE)
      ).to.be.revertedWithCustomError(marketplace, "EnforcedPause");

      await marketplace.connect(owner).unpause();

      await expect(
        marketplace.connect(seller).listForSale(testNode, SALE_PRICE)
      ).to.not.be.reverted;
    });
  });

  describe("View Functions", function () {
    it("Should return correct listing status", async function () {
      expect(await marketplace.isListedForSale(testNode)).to.be.false;

      await marketplace.connect(seller).listForSale(testNode, SALE_PRICE);

      expect(await marketplace.isListedForSale(testNode)).to.be.true;
    });

    it("Should return user listings", async function () {
      await marketplace.connect(seller).listForSale(testNode, SALE_PRICE);

      const listings = await marketplace.getUserListings(seller.address);
      expect(listings.length).to.be.gt(0);
    });

    it("Should return marketplace version", async function () {
      expect(await marketplace.version()).to.equal("1.0.0");
    });
  });
});
