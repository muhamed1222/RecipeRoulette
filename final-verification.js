// Final verification script to test the complete Telegram bot flow
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SUPABASE_PROJECT_URL = 'https://lmpmkszgwwwqvbdhxest.supabase.co';

async function finalVerification() {
  console.log('🔍 Final verification of Telegram bot setup...\n');
  
  // 1. Check bot info
  console.log('1. Checking bot information...');
  try {
    const botInfoResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`
    );
    const botInfo = await botInfoResponse.json();
    
    if (botInfo.ok) {
      console.log('✅ Bot is active');
      console.log(`   Name: ${botInfo.result.first_name}`);
      console.log(`   Username: @${botInfo.result.username}`);
    } else {
      console.log('❌ Bot is not accessible:', botInfo.description);
      return;
    }
  } catch (error) {
    console.log('❌ Failed to get bot info:', error.message);
    return;
  }
  
  // 2. Check webhook
  console.log('\n2. Checking webhook configuration...');
  try {
    const webhookResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`
    );
    const webhookInfo = await webhookResponse.json();
    
    if (webhookInfo.ok) {
      const expectedUrl = `${SUPABASE_PROJECT_URL}/functions/v1/tg`;
      console.log('✅ Webhook info retrieved');
      console.log(`   Current URL: ${webhookInfo.result.url}`);
      console.log(`   Expected URL: ${expectedUrl}`);
      console.log(`   Pending updates: ${webhookInfo.result.pending_update_count}`);
      
      if (webhookInfo.result.url === expectedUrl) {
        console.log('✅ Webhook is correctly set to Supabase function');
      } else {
        console.log('❌ Webhook URL mismatch!');
        return;
      }
    } else {
      console.log('❌ Failed to get webhook info:', webhookInfo.description);
      return;
    }
  } catch (error) {
    console.log('❌ Failed to check webhook:', error.message);
    return;
  }
  
  // 3. Test function endpoint
  console.log('\n3. Testing Supabase function endpoint...');
  try {
    // Test data that simulates a Telegram webhook update
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

    const functionResponse = await fetch(
      `${SUPABASE_PROJECT_URL}/functions/v1/tg`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      }
    );
    
    console.log(`   Status Code: ${functionResponse.status}`);
    
    if (functionResponse.status === 200) {
      const responseBody = await functionResponse.json();
      console.log('✅ Function endpoint is responding correctly');
      console.log(`   Response: ${JSON.stringify(responseBody)}`);
    } else {
      console.log('❌ Function endpoint returned error status');
      const errorText = await functionResponse.text();
      console.log(`   Error: ${errorText}`);
      return;
    }
  } catch (error) {
    console.log('❌ Failed to test function endpoint:', error.message);
    return;
  }
  
  console.log('\n🎉 All checks passed! Your Telegram bot should now be working correctly.');
  console.log('\n📝 Next steps:');
  console.log('1. Open Telegram and search for your bot (@outtimeagency_bot)');
  console.log('2. Send any message to initiate a conversation');
  console.log('3. Send the /start command');
  console.log('4. You should receive the main menu');
  console.log('\n💡 If the bot still doesn\'t respond:');
  console.log('- Check Supabase function logs for TG_START messages');
  console.log('- Ensure environment variables are correctly set in Supabase Dashboard');
  console.log('- Verify the employee record exists in the database for your Telegram ID');
}

// Run the verification
finalVerification();