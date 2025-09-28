// Script to test the Supabase function with a minimal payload
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_PROJECT_URL = process.env.SUPABASE_URL;

async function testMinimalPayload() {
  console.log('🔍 Testing Supabase function with minimal payload...\n');
  
  try {
    // Minimal test data
    const testData = {
      "update_id": 123456789,
      "message": {
        "message_id": 1,
        "from": {
          "id": 123456789,
          "is_bot": false,
          "first_name": "Test",
          "username": "testuser",
          "language_code": "en"
        },
        "chat": {
          "id": 123456789,
          "first_name": "Test",
          "username": "testuser",
          "type": "private"
        },
        "date": Math.floor(Date.now() / 1000),
        "text": "/start",
        "entities": [
          {
            "offset": 0,
            "length": 6,
            "type": "bot_command"
          }
        ]
      }
    };

    console.log('Sending test data to function...');
    
    const response = await fetch(
      `${SUPABASE_PROJECT_URL}/functions/v1/tg-simple`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer fake-token'
        },
        body: JSON.stringify(testData),
      }
    );
    
    console.log(`Status Code: ${response.status}`);
    
    // Try to get response text
    const responseText = await response.text();
    console.log(`Response Text: ${responseText}`);
    
    if (response.status === 200) {
      try {
        const responseBody = JSON.parse(responseText);
        console.log('✅ Function endpoint responded successfully');
        console.log(`Response: ${JSON.stringify(responseBody, null, 2)}`);
      } catch (parseError) {
        console.log('✅ Function endpoint responded with non-JSON response');
        console.log(`Response: ${responseText}`);
      }
    } else {
      console.log('❌ Function endpoint returned error status');
      console.log(`Error: ${responseText}`);
    }
  } catch (error) {
    console.log('❌ Failed to test function endpoint:', error.message);
    console.log('Error stack:', error.stack);
  }
}

// Run the test
testMinimalPayload();