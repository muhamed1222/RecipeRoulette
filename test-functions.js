import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

async function testFunctions() {
  console.log('🔍 Testing Edge Functions...');
  
  try {
    // Test the tg function
    const tgUrl = `${SUPABASE_URL}/functions/v1/tg`;
    console.log(`\nTesting tg function at: ${tgUrl}`);
    
    // Make a simple GET request to test if the function exists
    const tgResponse = await fetch(tgUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`  Status: ${tgResponse.status}`);
    console.log(`  Status Text: ${tgResponse.statusText}`);
    
    // Test the webapp function
    const webappUrl = `${SUPABASE_URL}/functions/v1/webapp`;
    console.log(`\nTesting webapp function at: ${webappUrl}`);
    
    const webappResponse = await fetch(webappUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`  Status: ${webappResponse.status}`);
    console.log(`  Status Text: ${webappResponse.statusText}`);
    
    // Test the scheduler function
    const schedulerUrl = `${SUPABASE_URL}/functions/v1/scheduler`;
    console.log(`\nTesting scheduler function at: ${schedulerUrl}`);
    
    const schedulerResponse = await fetch(schedulerUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`  Status: ${schedulerResponse.status}`);
    console.log(`  Status Text: ${schedulerResponse.statusText}`);
    
    // Test the admin function
    const adminUrl = `${SUPABASE_URL}/functions/v1/admin`;
    console.log(`\nTesting admin function at: ${adminUrl}`);
    
    const adminResponse = await fetch(adminUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`  Status: ${adminResponse.status}`);
    console.log(`  Status Text: ${adminResponse.statusText}`);
    
    console.log('\n✅ Function tests completed!');
    console.log('Note: 405 errors are expected for GET requests as these functions only accept POST requests.');
    
  } catch (error) {
    console.error('❌ Function tests failed:', error.message);
  }
}

// Run the tests
testFunctions();