const { ethers, upgrades } = require("hardhat");
require("dotenv").config();
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🔄 Upgrading iNS contracts...\n");

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log("Upgrading with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "tokens\n");

  // Read the latest deployment file
  const deploymentsDir = path.join(__dirname, "../deployments");
  const deploymentFiles = fs.readdirSync(deploymentsDir);
  const latestDeployment = deploymentFiles.sort().reverse()[0];
  const deploymentPath = path.join(deploymentsDir, latestDeployment);
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

  const proxyAddress = deployment.contracts.INSRegistry.proxy;
  const oldImplementation = deployment.contracts.INSRegistry.implementation;

  console.log("📍 Current deployment:");
  console.log("- Proxy:", proxyAddress);
  console.log("- Old Implementation:", oldImplementation);
  console.log();

  // Upgrade INSRegistry
  console.log("🚀 Upgrading INSRegistry...");
  const INSRegistryV2 = await ethers.getContractFactory("INSRegistry");

  const upgraded = await upgrades.upgradeProxy(proxyAddress, INSRegistryV2);
  await upgraded.waitForDeployment();

  // Get new implementation address
  const newImplementation = await upgrades.erc1967.getImplementationAddress(proxyAddress);

  console.log("✅ INSRegistry upgraded!");
  console.log("- Proxy (unchanged):", proxyAddress);
  console.log("- New Implementation:", newImplementation);

  // Verify the upgrade
  console.log("\n🔍 Verifying upgrade...");
  const oracle = await upgraded.oracle();
  const treasury = await upgraded.treasury();
  const base = await upgraded.basePrice();
  const premium = await upgraded.premiumPrice();

  console.log("- Oracle:", oracle);
  console.log("- Treasury:", treasury);
  console.log("- Base price:", ethers.formatEther(base), "tokens");
  console.log("- Premium price:", ethers.formatEther(premium), "tokens");

  // Save upgrade info
  const upgradeInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    upgrader: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      INSRegistry: {
        proxy: proxyAddress,
        oldImplementation: oldImplementation,
        newImplementation: newImplementation
      }
    }
  };

  const filename = `upgrade-${Date.now()}.json`;
  fs.writeFileSync(
    path.join(deploymentsDir, filename),
    JSON.stringify(upgradeInfo, null, 2)
  );

  console.log(`\n💾 Upgrade info saved to: deployments/${filename}`);
  console.log("\n✅ Upgrade completed successfully!");
  console.log("\n🔍 Verify on explorer:");
  console.log(`   https://chainscan-galileo.0g.ai/address/${proxyAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Upgrade failed:", error);
    process.exit(1);
  });
