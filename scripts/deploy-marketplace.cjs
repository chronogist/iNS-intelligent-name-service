const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log("🚀 Deploying INSMarketplace...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Get deployed registry address (from previous deployment)
  const REGISTRY_ADDRESS = process.env.REGISTRY_ADDRESS || "0x507d8324A029f87BdFFF2025215AABBA0326a7bd";

  // Treasury address (you can change this)
  const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS || deployer.address;

  // Platform fee (2.5% = 250 basis points)
  const PLATFORM_FEE = 250;

  console.log("Configuration:");
  console.log("- Registry Address:", REGISTRY_ADDRESS);
  console.log("- Treasury Address:", TREASURY_ADDRESS);
  console.log("- Platform Fee:", PLATFORM_FEE / 100, "%\n");

  // Deploy marketplace as upgradeable proxy
  const INSMarketplace = await ethers.getContractFactory("INSMarketplace");

  console.log("⏳ Deploying marketplace proxy and implementation...");
  const marketplace = await upgrades.deployProxy(
    INSMarketplace,
    [REGISTRY_ADDRESS, TREASURY_ADDRESS, PLATFORM_FEE],
    {
      initializer: "initialize",
      kind: "uups",
    }
  );

  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();

  console.log("✅ INSMarketplace deployed to:", marketplaceAddress);

  // Get implementation address
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(marketplaceAddress);
  console.log("📝 Implementation address:", implementationAddress);

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const version = await marketplace.version();
  const fee = await marketplace.platformFee();
  const treasury = await marketplace.treasury();
  const stats = await marketplace.getMarketplaceStats();

  console.log("- Version:", version);
  console.log("- Platform Fee:", fee.toString(), "basis points");
  console.log("- Treasury:", treasury);
  console.log("- Total Sales:", stats.totalSales.toString());
  console.log("- Total Volume:", ethers.formatEther(stats.totalVolume), "ETH");

  console.log("\n✨ Deployment complete!");
  console.log("\n📋 Add to your .env file:");
  console.log(`MARKETPLACE_ADDRESS=${marketplaceAddress}`);
  console.log(`MARKETPLACE_IMPLEMENTATION=${implementationAddress}`);

  console.log("\n🔗 Verification command:");
  console.log(`npx hardhat verify --network ogTestnet ${implementationAddress}`);

  // Save deployment info
  const fs = require("fs");
  const deploymentInfo = {
    network: "ogTestnet",
    marketplace: {
      proxy: marketplaceAddress,
      implementation: implementationAddress,
    },
    registry: REGISTRY_ADDRESS,
    treasury: TREASURY_ADDRESS,
    platformFee: PLATFORM_FEE,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(
    "marketplace-deployment.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\n💾 Deployment info saved to marketplace-deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
