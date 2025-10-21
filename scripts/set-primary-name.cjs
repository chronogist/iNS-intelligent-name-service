const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("🔧 Setting primary name...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Setting with account:", deployer.address);

  const REGISTRY_ADDRESS = "0xfDf463C23df9ac82D6946A34b9c8A8dDF23d44a3";

  // Get contract instance
  const INSRegistry = await ethers.getContractFactory("INSRegistry");
  const registry = INSRegistry.attach(REGISTRY_ADDRESS);

  // Domain to set as primary
  const domainName = "gathin";

  console.log(`Setting ${domainName}.0g as primary name...`);

  try {
    const tx = await registry.setPrimaryName(domainName);
    await tx.wait();
    console.log(`✅ Primary name set successfully!`);

    // Verify
    const primaryName = await registry.getPrimaryName(deployer.address);
    console.log(`\n📝 Primary name for ${deployer.address}:`);
    console.log(`   ${primaryName}.0g`);
  } catch (error) {
    console.error(`❌ Failed to set primary name:`, error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
