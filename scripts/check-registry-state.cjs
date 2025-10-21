const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking INSRegistry state...\n");

  const registryAddress = process.env.REGISTRY_ADDRESS || "0xfDf463C23df9ac82D6946A34b9c8A8dDF23d44a3";

  const registry = await ethers.getContractAt("INSRegistry", registryAddress);

  console.log("Registry address:", registryAddress);

  try {
    const paused = await registry.paused();
    console.log("Is paused:", paused);

    const oracle = await registry.oracle();
    console.log("Oracle address:", oracle);

    const treasury = await registry.treasury();
    console.log("Treasury address:", treasury);

    const basePrice = await registry.basePrice();
    console.log("Base price:", ethers.formatEther(basePrice), "tokens");

    const premiumPrice = await registry.premiumPrice();
    console.log("Premium price:", ethers.formatEther(premiumPrice), "tokens");

    // Try to get the price for a test domain
    const testDomain = "kraze";
    const duration = 365 * 24 * 60 * 60; // 1 year
    const price = await registry.getPrice(testDomain, duration);
    console.log(`\nPrice for '${testDomain}' (1 year):`, ethers.formatEther(price), "tokens");

    // Check if the test domain is available
    const node = ethers.keccak256(ethers.solidityPacked(
      ["bytes32", "bytes32"],
      [ethers.keccak256(ethers.toUtf8Bytes("0g")), ethers.keccak256(ethers.toUtf8Bytes(testDomain))]
    ));

    const inftAddress = await registry.nameToINFT(node);
    console.log(`INFT address for '${testDomain}':`, inftAddress);
    console.log(`Is '${testDomain}' available:`, inftAddress === ethers.ZeroAddress);

  } catch (error) {
    console.error("Error checking state:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
