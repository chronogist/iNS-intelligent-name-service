const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying iNS contracts with onchain metadata...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "tokens\n");

  // Deploy INSRegistry as implementation (non-upgradeable for now)
  console.log("📝 Deploying INSRegistry...");
  const INSRegistry = await ethers.getContractFactory("INSRegistry");

  const basePrice = ethers.parseEther("0.1");
  const premiumPrice = ethers.parseEther("0.1");

  // For simplicity, deploy as non-upgradeable contract
  const registry = await INSRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();

  console.log("✅ INSRegistry deployed at:", registryAddress);
  console.log("   Initializing...");

  // Initialize the contract
  const tx = await registry.initialize(
    deployer.address, // oracle
    deployer.address, // treasury
    basePrice,
    premiumPrice
  );
  await tx.wait();

  console.log("✅ Initialized successfully");
  console.log("   Base price:", ethers.formatEther(basePrice), "tokens");
  console.log("   Premium price:", ethers.formatEther(premiumPrice), "tokens\n");

  console.log("🎉 Deployment complete!\n");
  console.log("📋 Contract Addresses:");
  console.log("   Registry:", registryAddress);
  console.log("\n💡 Update your .env.local:");
  console.log(`   NEXT_PUBLIC_REGISTRY_ADDRESS=${registryAddress}`);
  console.log("\n🔍 Verify on explorer:");
  console.log(`   https://chainscan-galileo.0g.ai/address/${registryAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
