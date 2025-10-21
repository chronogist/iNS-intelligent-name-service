const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("INSRegistry", function () {
  let registry;
  let owner, user1, user2, oracle, treasury;
  let basePrice, premiumPrice;

  const YEAR = 365 * 24 * 60 * 60;
  const METADATA_URI = "0g://encrypted-metadata-hash";
  const METADATA_HASH = ethers.keccak256(ethers.toUtf8Bytes("test-metadata"));

  beforeEach(async function () {
    [owner, user1, user2, oracle, treasury] = await ethers.getSigners();

    basePrice = ethers.parseEther("5");
    premiumPrice = ethers.parseEther("50");

    const INSRegistry = await ethers.getContractFactory("INSRegistry");
    registry = await upgrades.deployProxy(
      INSRegistry,
      [oracle.address, treasury.address, owner.address, basePrice, premiumPrice],
      { initializer: "initialize", kind: "uups" }
    );
    await registry.waitForDeployment();
  });

  describe("Initialization", function () {
    it("Should set correct initial values", async function () {
      expect(await registry.oracle()).to.equal(oracle.address);
      expect(await registry.treasury()).to.equal(treasury.address);
      expect(await registry.basePrice()).to.equal(basePrice);
      expect(await registry.premiumPrice()).to.equal(premiumPrice);
    });

    it("Should grant roles correctly", async function () {
      const DEFAULT_ADMIN_ROLE = await registry.DEFAULT_ADMIN_ROLE();
      const OPERATOR_ROLE = await registry.OPERATOR_ROLE();
      
      expect(await registry.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await registry.hasRole(OPERATOR_ROLE, owner.address)).to.be.true;
    });
  });

  describe("Domain Registration", function () {
    it("Should register a valid domain", async function () {
      const name = "testdomain";
      const duration = YEAR;
      const price = await registry.getPrice(name, duration);

      await expect(
        registry.connect(user1).register(
          name,
          user1.address,
          duration,
          METADATA_URI,
          METADATA_HASH,
          { value: price }
        )
      ).to.emit(registry, "NameRegistered");

      expect(await registry.available(name)).to.be.false;
      expect(await registry.ownerOf(name)).to.equal(user1.address);
    });

    it("Should deploy INFT on registration", async function () {
      const name = "testdomain";
      const duration = YEAR;
      const price = await registry.getPrice(name, duration);

      await registry.connect(user1).register(
        name,
        user1.address,
        duration,
        METADATA_URI,
        METADATA_HASH,
        { value: price }
      );

      const inftAddress = await registry.getINFT(name);
      expect(inftAddress).to.not.equal(ethers.ZeroAddress);

      const INFT = await ethers.getContractFactory("INFT");
      const inft = INFT.attach(inftAddress);
      expect(await inft.domainOwner()).to.equal(user1.address);
      expect(await inft.domainName()).to.equal(name);
    });

    it("Should reject name that's too short", async function () {
      const name = "ab";
      const duration = YEAR;
      const price = basePrice;

      await expect(
        registry.connect(user1).register(
          name,
          user1.address,
          duration,
          METADATA_URI,
          METADATA_HASH,
          { value: price }
        )
      ).to.be.revertedWithCustomError(registry, "NameTooShort");
    });

    it("Should reject name that's too long", async function () {
      const name = "a".repeat(64);
      const duration = YEAR;
      const price = basePrice;

      await expect(
        registry.connect(user1).register(
          name,
          user1.address,
          duration,
          METADATA_URI,
          METADATA_HASH,
          { value: price }
        )
      ).to.be.revertedWithCustomError(registry, "NameTooLong");
    });

    it("Should reject invalid characters", async function () {
      const name = "test_domain";
      const duration = YEAR;
      const price = basePrice;

      await expect(
        registry.connect(user1).register(
          name,
          user1.address,
          duration,
          METADATA_URI,
          METADATA_HASH,
          { value: price }
        )
      ).to.be.revertedWithCustomError(registry, "InvalidCharacters");
    });

    it("Should reject hyphen at start or end", async function () {
      let name = "-testdomain";
      const duration = YEAR;
      const price = basePrice;

      await expect(
        registry.connect(user1).register(
          name,
          user1.address,
          duration,
          METADATA_URI,
          METADATA_HASH,
          { value: price }
        )
      ).to.be.revertedWithCustomError(registry, "InvalidCharacters");

      name = "testdomain-";
      await expect(
        registry.connect(user1).register(
          name,
          user1.address,
          duration,
          METADATA_URI,
          METADATA_HASH,
          { value: price }
        )
      ).to.be.revertedWithCustomError(registry, "InvalidCharacters");
    });

    it("Should reject insufficient payment", async function () {
      const name = "testdomain";
      const duration = YEAR;
      const price = await registry.getPrice(name, duration);

      await expect(
        registry.connect(user1).register(
          name,
          user1.address,
          duration,
          METADATA_URI,
          METADATA_HASH,
          { value: price - ethers.parseEther("1") }
        )
      ).to.be.revertedWithCustomError(registry, "InsufficientPayment");
    });

    it("Should reject duration less than 1 year", async function () {
      const name = "testdomain";
      const duration = YEAR - 1;
      const price = basePrice;

      await expect(
        registry.connect(user1).register(
          name,
          user1.address,
          duration,
          METADATA_URI,
          METADATA_HASH,
          { value: price }
        )
      ).to.be.revertedWithCustomError(registry, "InvalidDuration");
    });

    it("Should reject already registered name", async function () {
      const name = "testdomain";
      const duration = YEAR;
      const price = await registry.getPrice(name, duration);

      await registry.connect(user1).register(
        name,
        user1.address,
        duration,
        METADATA_URI,
        METADATA_HASH,
        { value: price }
      );

      await expect(
        registry.connect(user2).register(
          name,
          user2.address,
          duration,
          METADATA_URI,
          METADATA_HASH,
          { value: price }
        )
      ).to.be.revertedWithCustomError(registry, "NameNotAvailable");
    });

    it("Should transfer payment to treasury", async function () {
      const name = "testdomain";
      const duration = YEAR;
      const price = await registry.getPrice(name, duration);

      const treasuryBalanceBefore = await ethers.provider.getBalance(treasury.address);

      await registry.connect(user1).register(
        name,
        user1.address,
        duration,
        METADATA_URI,
        METADATA_HASH,
        { value: price }
      );

      const treasuryBalanceAfter = await ethers.provider.getBalance(treasury.address);
      expect(treasuryBalanceAfter - treasuryBalanceBefore).to.equal(price);
    });
  });

  describe("Pricing", function () {
    it("Should charge premium for 3-char names", async function () {
      const name = "abc";
      const duration = YEAR;
      const price = await registry.getPrice(name, duration);
      expect(price).to.equal(premiumPrice);
    });

    it("Should charge premium for 4-char names", async function () {
      const name = "abcd";
      const duration = YEAR;
      const price = await registry.getPrice(name, duration);
      expect(price).to.equal(premiumPrice);
    });

    it("Should charge base price for 5+ char names", async function () {
      const name = "abcde";
      const duration = YEAR;
      const price = await registry.getPrice(name, duration);
      expect(price).to.equal(basePrice);
    });

    it("Should multiply price by years", async function () {
      const name = "testdomain";
      const duration = YEAR * 3;
      const price = await registry.getPrice(name, duration);
      expect(price).to.equal(basePrice * 3n);
    });
  });

  describe("Domain Renewal", function () {
    beforeEach(async function () {
      const name = "testdomain";
      const duration = YEAR;
      const price = await registry.getPrice(name, duration);

      await registry.connect(user1).register(
        name,
        user1.address,
        duration,
        METADATA_URI,
        METADATA_HASH,
        { value: price }
      );
    });

    it("Should renew a domain", async function () {
      const name = "testdomain";
      const duration = YEAR;
      const price = await registry.getPrice(name, duration);

      const expiryBefore = await registry.getExpiry(name);

      await expect(
        registry.connect(user1).renew(name, duration, { value: price })
      ).to.emit(registry, "NameRenewed");

      const expiryAfter = await registry.getExpiry(name);
      expect(expiryAfter - expiryBefore).to.equal(duration);
    });

    it("Should reject renewal with insufficient payment", async function () {
      const name = "testdomain";
      const duration = YEAR;
      const price = await registry.getPrice(name, duration);

      await expect(
        registry.connect(user1).renew(name, duration, { value: price - ethers.parseEther("1") })
      ).to.be.revertedWithCustomError(registry, "InsufficientPayment");
    });

    it("Should reject renewal of non-existent domain", async function () {
      const name = "nonexistent";
      const duration = YEAR;
      const price = basePrice;

      await expect(
        registry.connect(user1).renew(name, duration, { value: price })
      ).to.be.revertedWithCustomError(registry, "NameNotAvailable");
    });
  });

  describe("Address Resolution", function () {
    beforeEach(async function () {
      const name = "testdomain";
      const duration = YEAR;
      const price = await registry.getPrice(name, duration);

      await registry.connect(user1).register(
        name,
        user1.address,
        duration,
        METADATA_URI,
        METADATA_HASH,
        { value: price }
      );
    });

    it("Should set address for owned domain", async function () {
      const name = "testdomain";
      const targetAddr = user2.address;

      await expect(
        registry.connect(user1).setAddress(name, targetAddr)
      ).to.emit(registry, "AddressSet");

      expect(await registry.resolve(name)).to.equal(targetAddr);
    });

    it("Should reject setting address for non-owned domain", async function () {
      const name = "testdomain";
      const targetAddr = user2.address;

      await expect(
        registry.connect(user2).setAddress(name, targetAddr)
      ).to.be.revertedWithCustomError(registry, "Unauthorized");
    });
  });

  describe("Admin Functions", function () {
    it("Should update oracle", async function () {
      const newOracle = user1.address;

      await expect(
        registry.connect(owner).updateOracle(newOracle)
      ).to.emit(registry, "OracleUpdated");

      expect(await registry.oracle()).to.equal(newOracle);
    });

    it("Should update treasury", async function () {
      const newTreasury = user1.address;

      await expect(
        registry.connect(owner).updateTreasury(newTreasury)
      ).to.emit(registry, "TreasuryUpdated");

      expect(await registry.treasury()).to.equal(newTreasury);
    });

    it("Should update pricing", async function () {
      const newBase = ethers.parseEther("10");
      const newPremium = ethers.parseEther("100");

      await expect(
        registry.connect(owner).updatePricing(newBase, newPremium)
      ).to.emit(registry, "PriceUpdated");

      expect(await registry.basePrice()).to.equal(newBase);
      expect(await registry.premiumPrice()).to.equal(newPremium);
    });

    it("Should reject non-operator updating oracle", async function () {
      const newOracle = user1.address;

      await expect(
        registry.connect(user1).updateOracle(newOracle)
      ).to.be.reverted;
    });

    it("Should pause and unpause", async function () {
      await registry.connect(owner).pause();

      const name = "testdomain";
      const duration = YEAR;
      const price = await registry.getPrice(name, duration);

      await expect(
        registry.connect(user1).register(
          name,
          user1.address,
          duration,
          METADATA_URI,
          METADATA_HASH,
          { value: price }
        )
      ).to.be.reverted;

      await registry.connect(owner).unpause();

      await expect(
        registry.connect(user1).register(
          name,
          user1.address,
          duration,
          METADATA_URI,
          METADATA_HASH,
          { value: price }
        )
      ).to.emit(registry, "NameRegistered");
    });
  });

  describe("Domain Expiry", function () {
    it("Should allow re-registration after expiry + grace period", async function () {
      const name = "testdomain";
      const duration = YEAR;
      const price = await registry.getPrice(name, duration);

      await registry.connect(user1).register(
        name,
        user1.address,
        duration,
        METADATA_URI,
        METADATA_HASH,
        { value: price }
      );

      expect(await registry.available(name)).to.be.false;

      // Fast forward past expiry + grace period
      const GRACE_PERIOD = 90 * 24 * 60 * 60;
      await time.increase(YEAR + GRACE_PERIOD + 1);

      expect(await registry.available(name)).to.be.true;

      await registry.connect(user2).register(
        name,
        user2.address,
        duration,
        METADATA_URI,
        METADATA_HASH,
        { value: price }
      );

      expect(await registry.ownerOf(name)).to.equal(user2.address);
    });
  });
});