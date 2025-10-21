const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("🔄 Migrating existing domains to new tracking system...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Migrating with account:", deployer.address);

  const REGISTRY_ADDRESS = "0xfDf463C23df9ac82D6946A34b9c8A8dDF23d44a3";

  // Get contract instance
  const INSRegistry = await ethers.getContractFactory("INSRegistry");
  const registry = INSRegistry.attach(REGISTRY_ADDRESS);

  // List of domains to migrate (add your domains here)
  const domainsToMigrate = [
    "gathin"
  ];

  console.log(`📋 Domains to migrate: ${domainsToMigrate.join(", ")}\n`);

  // Migrate each domain
  for (const domain of domainsToMigrate) {
    console.log(`Migrating ${domain}.0g...`);

    try {
      const tx = await registry.migrateDomain(domain);
      await tx.wait();
      console.log(`✅ ${domain}.0g migrated successfully!`);
    } catch (error) {
      console.error(`❌ Failed to migrate ${domain}.0g:`, error.message);
    }
  }

  console.log("\n🎉 Migration complete!");
  console.log("\n📝 Verifying migration...");

  // Verify by getting owner domains
  const ownerDomains = await registry.getOwnerDomains(deployer.address);
  console.log(`\nDomains owned by ${deployer.address}:`);
  ownerDomains.forEach((domain, index) => {
    console.log(`  ${index + 1}. ${domain}.0g`);
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  });
