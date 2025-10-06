const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log("🚀 Deploying upgraded iNS contracts with onchain metadata...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "tokens\n");

  // Deploy INSRegistry
  console.log("📝 Deploying INSRegistry...");
  const INSRegistry = await ethers.getContractFactory("INSRegistry");

  const basePrice = ethers.parseEther("0.1"); // 0.1 tokens for regular names
  const premiumPrice = ethers.parseEther("0.1"); // 0.1 tokens for short names

  const registry = await upgrades.deployProxy(
    INSRegistry,
    [
      deployer.address, // oracle (can be deployer for now)
      deployer.address, // treasury
      basePrice,
      premiumPrice
    ],
    { initializer: "initialize", kind: "uups" }
  );

  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();

  console.log("✅ INSRegistry deployed at:", registryAddress);
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
