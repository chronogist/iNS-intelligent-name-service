const { ethers } = require('ethers');
require('dotenv').config();

const MARKETPLACE_ADDRESS = process.env.MARKETPLACE_ADDRESS || '0xf20C0fB3D11BF0c9C8de177eC7886b868a248344';
const REGISTRY_ADDRESS = process.env.REGISTRY_ADDRESS || '0x507d8324A029f87BdFFF2025215AABBA0326a7bd';
const RPC_URL = process.env.RPC_URL || 'https://evmrpc-testnet.0g.ai';

const MARKETPLACE_ABI = [
  'function saleListings(bytes32) view returns (address seller, uint256 price, uint256 listedAt, bool active)',
  'function rentalListings(bytes32) view returns (address owner, uint256 pricePerDay, uint256 minDuration, uint256 maxDuration, uint256 listedAt, bool active)',
];

const REGISTRY_ABI = [
  'function ownerOf(string name) view returns (address)',
  'function getINFT(string name) view returns (address)',
];

async function checkDomain(domainName) {
  console.log(`\n🔍 Checking domain: ${domainName}.0g\n`);

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const marketplace = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, provider);
  const registry = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, provider);

  try {
    // Get domain owner
    const owner = await registry.ownerOf(domainName);
    console.log('👤 Owner:', owner);

    // Compute node hash
    const node = ethers.keccak256(ethers.toUtf8Bytes(domainName));
    console.log('🔗 Node:', node);

    // Check sale listing
    const saleListing = await marketplace.saleListings(node);
    console.log('\n💰 Sale Listing:');
    console.log('  Active:', saleListing.active);
    if (saleListing.active) {
      console.log('  Seller:', saleListing.seller);
      console.log('  Price:', ethers.formatEther(saleListing.price), '0G');
      console.log('  Listed at:', new Date(Number(saleListing.listedAt) * 1000).toLocaleString());
    } else {
      console.log('  ❌ Not listed for sale');
    }

    // Check rental listing
    const rentalListing = await marketplace.rentalListings(node);
    console.log('\n🏠 Rental Listing:');
    console.log('  Active:', rentalListing.active);
    if (rentalListing.active) {
      console.log('  Owner:', rentalListing.owner);
      console.log('  Price/Day:', ethers.formatEther(rentalListing.pricePerDay), '0G');
      console.log('  Duration:', rentalListing.minDuration.toString(), '-', rentalListing.maxDuration.toString(), 'days');
    } else {
      console.log('  ❌ Not listed for rent');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.message.includes('Domain not registered')) {
      console.log('\n💡 This domain is not registered yet.');
      console.log('   Register it first at: /register');
    }
  }
}

const domainName = process.argv[2];

if (!domainName) {
  console.log('Usage: node check-domain-listing.cjs <domain-name>');
  console.log('Example: node check-domain-listing.cjs chris');
  process.exit(1);
}

checkDomain(domainName)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
