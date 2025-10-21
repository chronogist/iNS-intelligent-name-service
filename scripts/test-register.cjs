const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing domain registration...\n");

  const [signer] = await ethers.getSigners();
  const registryAddress = "0xfDf463C23df9ac82D6946A34b9c8A8dDF23d44a3";
  const registry = await ethers.getContractAt("INSRegistry", registryAddress);

  const domain = "testdomain123";
  const duration = 365 * 24 * 60 * 60; // 1 year
  const price = await registry.getPrice(domain, duration);

  console.log("Attempting to register:", domain);
  console.log("Duration:", duration, "seconds (1 year)");
  console.log("Price:", ethers.formatEther(price), "tokens");
  console.log("Signer:", signer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(signer.address)), "tokens\n");

  const metadata = {
    agentType: "custom",
    owner: signer.address,
    registeredAt: Date.now(),
    intelligenceScore: 0
  };
  const metadataJSON = JSON.stringify(metadata);
  const metadataHash = ethers.keccak256(ethers.toUtf8Bytes(metadataJSON));
  const metadataURI = `http://localhost:3003/api/metadata/${domain}`;

  console.log("Metadata URI:", metadataURI);
  console.log("Metadata Hash:", metadataHash);
  console.log();

  try {
    console.log("Sending transaction...");
    const tx = await registry.register(
      domain,
      signer.address,
      duration,
      metadataURI,
      metadataHash,
      "custom",
      { value: price, gasLimit: 5000000 }
    );

    console.log("Transaction sent:", tx.hash);
    console.log("Waiting for confirmation...");

    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed!");
    console.log("Gas used:", receipt.gasUsed.toString());

  } catch (error) {
    console.error("❌ Transaction failed:");
    console.error("Error:", error.message);

    if (error.data) {
      console.error("Error data:", error.data);
    }

    // Try to decode the revert reason
    if (error.reason) {
      console.error("Revert reason:", error.reason);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
