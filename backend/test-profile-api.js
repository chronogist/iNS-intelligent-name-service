const axios = require('axios');

const API_URL = 'http://localhost:3003/api';

async function testProfileAPI() {
  console.log('🧪 Testing Profile API\n');

  // Test 1: Health Check
  console.log('1️⃣  Testing health endpoint...');
  try {
    const health = await axios.get('http://localhost:3003/health');
    console.log('✅ Health check:', health.data.status);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }

  // Test 2: Non-existent domain
  console.log('\n2️⃣  Testing non-existent domain...');
  try {
    await axios.get(`${API_URL}/profile/nonexistent`);
    console.log('❌ Should have returned 404');
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('✅ Correctly returned 404 for non-existent domain');
    } else {
      console.log('❌ Unexpected error:', error.message);
    }
  }

  // Test 3: Registry info
  console.log('\n3️⃣  Testing registry info...');
  try {
    const info = await axios.get(`${API_URL}/info`);
    console.log('✅ Registry info:');
    console.log('   Address:', info.data.data.registryAddress);
    console.log('   Chain ID:', info.data.data.chainId);
  } catch (error) {
    console.log('❌ Registry info failed:', error.message);
  }

  console.log('\n✅ API Tests Complete!\n');
  console.log('📝 Next Steps:');
  console.log('   1. Register a domain with profile data');
  console.log('   2. Test GET /api/profile/yourdomain');
  console.log('   3. Verify profile data is returned correctly\n');
}

testProfileAPI().catch(console.error);
