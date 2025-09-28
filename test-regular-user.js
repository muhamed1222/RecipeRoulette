import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

async function testRegularUser() {
  console.log('🔍 Testing regular user (without invite)...');
  
  try {
    // Test the tg function
    const tgUrl = `${SUPABASE_URL}/functions/v1/tg`;
    console.log(`\nTesting tg function at: ${tgUrl}`);
    
    // Create a mock Telegram update for the /start command WITHOUT invite payload
    // This simulates a regular user who is already registered
    const mockUpdate = {
      update_id: 123456792,
      message: {
        message_id: 4,
        from: {
          id: 123456789, // This is our test user ID
          is_bot: false,
          first_name: "Test Employee",
          username: "testuser"
        },
        chat: {
          id: 123456789,
          first_name: "Test Employee",
          username: "testuser",
          type: "private"
        },
        date: Math.floor(Date.now() / 1000),
        text: "/start"
        // Note: No entities array here, which means no payload
      }
    };
    
    console.log('Sending /start command from regular user...');
    
    // Send the mock update to the tg function
    const response = await fetch(tgUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mockUpdate)
    });
    
    console.log(`\nResponse Status: ${response.status}`);
    console.log(`Response Status Text: ${response.statusText}`);
    
    // Try to read response body
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const responseBody = await response.json();
        console.log(`Response Body (JSON):`, JSON.stringify(responseBody, null, 2));
      } else {
        const responseBody = await response.text();
        console.log(`Response Body (Text): ${responseBody.substring(0, 500)}${responseBody.length > 500 ? '...' : ''}`);
      }
    } catch (error) {
      console.log(`Could not parse response body: ${error.message}`);
    }
    
    if (response.ok) {
      console.log('✅ Regular user test completed successfully!');
    } else {
      console.log('⚠️  Regular user test completed with status:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Regular user test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testRegularUser();