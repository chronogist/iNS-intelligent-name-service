const { ethers, upgrades } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("🚀 Starting iNS Deployment...\n");

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "0G\n");

  // Get config from .env
  const oracleAddress = process.env.ORACLE_ADDRESS || deployer.address;
  const treasuryAddress = process.env.TREASURY_ADDRESS || "0x55FfDb42694Eca4B1dBB23a57Ffd40E2C26450c9";
  const adminAddress = process.env.ADMIN_ADDRESS || deployer.address;
  const basePrice = process.env.BASE_PRICE || ethers.parseEther("0.1"); // 0.1 0G for 5+ char names
  const premiumPrice = process.env.PREMIUM_PRICE || ethers.parseEther("0.1"); // 0.1 0G for 3-4 char names

  console.log("Configuration:");
  console.log("- Oracle:", oracleAddress);
  console.log("- Treasury:", treasuryAddress);
  console.log("- Admin:", adminAddress);
  console.log("- Base Price:", ethers.formatEther(basePrice), "tokens/year");
  console.log("- Premium Price:", ethers.formatEther(premiumPrice), "tokens/year\n");

  // Deploy INSRegistry as UUPS Proxy
  console.log("📝 Deploying INSRegistry (UUPS Proxy)...");
  const INSRegistry = await ethers.getContractFactory("INSRegistry");
  
  const registry = await upgrades.deployProxy(
    INSRegistry,
    [
      oracleAddress,
      treasuryAddress,
      adminAddress,
      basePrice,
      premiumPrice
    ],
    {
      initializer: "initialize",
      kind: "uups"
    }
  );

  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  
  console.log("✅ INSRegistry deployed to:", registryAddress);
  
  // Get implementation address
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(registryAddress);
  console.log("📦 Implementation address:", implementationAddress);
  console.log("🔐 Admin address:", await upgrades.erc1967.getAdminAddress(registryAddress));

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const oracle = await registry.oracle();
  const treasury = await registry.treasury();
  const base = await registry.basePrice();
  const premium = await registry.premiumPrice();
  
  console.log("- Oracle set to:", oracle);
  console.log("- Treasury set to:", treasury);
  console.log("- Base price:", ethers.formatEther(base), "tokens");
  console.log("- Premium price:", ethers.formatEther(premium), "tokens");

  // Save deployment info
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      INSRegistry: {
        proxy: registryAddress,
        implementation: implementationAddress
      }
    },
    config: {
      oracle: oracleAddress,
      treasury: treasuryAddress,
      admin: adminAddress,
      basePrice: basePrice.toString(),
      premiumPrice: premiumPrice.toString()
    }
  };

  console.log("\n📄 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Save to file
  const fs = require("fs");
  const path = require("path");
  const deploymentsDir = path.join(__dirname, "../deployments");
  
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  const filename = `deployment-${Date.now()}.json`;
  fs.writeFileSync(
    path.join(deploymentsDir, filename),
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log(`\n💾 Deployment info saved to: deployments/${filename}`);

  console.log("\n✅ Deployment completed successfully!");
  console.log("\n📋 Next steps:");
  console.log("1. Verify contracts on block explorer:");
  console.log(`   npx hardhat verify --network ${network.name} ${registryAddress}`);
  console.log("2. Test registration on testnet");
  console.log("3. Set up oracle service");
  console.log("4. Deploy backend and frontend\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });