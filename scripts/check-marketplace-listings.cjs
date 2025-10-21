const { ethers } = require('ethers');

const MARKETPLACE_ADDRESS = '0xf20C0fB3D11BF0c9C8de177eC7886b868a248344';
const RPC_URL = 'https://evmrpc-testnet.0g.ai';

const MARKETPLACE_ABI = [
  'function saleListings(bytes32) view returns (address seller, uint256 price, uint256 listedAt, bool active)',
  'event DomainListedForSale(bytes32 indexed node, string domainName, address indexed seller, uint256 price, uint256 timestamp)',
];

async function main() {
  console.log('🔍 Checking Marketplace Listings...\n');

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const marketplace = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, provider);

  // Check if contract is deployed
  const code = await provider.getCode(MARKETPLACE_ADDRESS);
  console.log('✅ Contract deployed:', code.length > 10);

  // Get current block
  const currentBlock = await provider.getBlockNumber();
  console.log('📦 Current block:', currentBlock);

  // Check for DomainListedForSale events in last 50000 blocks
  console.log('\n🔎 Scanning for DomainListedForSale events...');
  const fromBlock = Math.max(0, currentBlock - 50000);

  try {
    const filter = marketplace.filters.DomainListedForSale();
    const events = await marketplace.queryFilter(filter, fromBlock, currentBlock);

    console.log(`📊 Found ${events.length} listing events\n`);

    if (events.length === 0) {
      console.log('❌ No domains have been listed yet.');
      console.log('\n💡 To list a domain:');
      console.log('   1. Go to /portfolio');
      console.log('   2. Click "Manage Listings"');
      console.log('   3. Select a domain');
      console.log('   4. Click "List for Sale"');
      console.log('   5. Set a price and confirm the transaction');
      console.log('   6. Wait for transaction to confirm (~30 seconds)');
    } else {
      console.log('📋 Listed Domains:\n');

      for (let i = 0; i < events.length; i++) {
        const event = events[i];
        const node = event.args[0];
        const domainName = event.args[1];
        const seller = event.args[2];
        const price = event.args[3];
        const timestamp = event.args[4];

        // Check if still active
        const listing = await marketplace.saleListings(node);

        console.log(`${i + 1}. ${domainName}.0g`);
        console.log(`   Seller: ${seller}`);
        console.log(`   Price: ${ethers.formatEther(price)} 0G`);
        console.log(`   Status: ${listing.active ? '🟢 Active' : '🔴 Canceled'}`);
        console.log(`   Block: ${event.blockNumber}`);
        console.log('');
      }
    }
  } catch (error) {
    console.error('❌ Error scanning events:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
