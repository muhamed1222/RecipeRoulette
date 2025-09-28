// Script to fix the Telegram bot webhook to point to Supabase function
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SUPABASE_PROJECT_URL = 'https://lmpmkszgwwwqvbdhxest.supabase.co';

if (!TELEGRAM_BOT_TOKEN) {
  console.error('Missing TELEGRAM_BOT_TOKEN. Please check your .env file.');
  process.exit(1);
}

async function fixWebhook() {
  console.log('🔧 Fixing Telegram bot webhook...');
  
  try {
    // Set webhook to Supabase function
    const webhookUrl = `${SUPABASE_PROJECT_URL}/functions/v1/tg`;
    console.log(`Setting webhook to: ${webhookUrl}`);
    
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ['message', 'callback_query']
        }),
      }
    );
    
    const data = await response.json();
    
    if (data.ok) {
      console.log('✅ Webhook successfully updated!');
      console.log('Result:', data.result);
      console.log('Description:', data.description);
      
      // Verify the webhook was set correctly
      console.log('\n🔍 Verifying webhook configuration...');
      const verifyResponse = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`
      );
      const verifyData = await verifyResponse.json();
      
      if (verifyData.ok) {
        console.log('Current webhook URL:', verifyData.result.url);
        console.log('Pending updates:', verifyData.result.pending_update_count);
        console.log('Allowed updates:', verifyData.result.allowed_updates);
        
        if (verifyData.result.url === webhookUrl) {
          console.log('✅ Webhook is correctly set to Supabase function!');
        } else {
          console.log('❌ Webhook URL mismatch. Expected:', webhookUrl);
        }
      } else {
        console.error('Failed to verify webhook:', verifyData.description);
      }
    } else {
      console.error('❌ Failed to set webhook:', data.description);
    }
  } catch (error) {
    console.error('❌ Webhook update failed:', error.message);
  }
}

// Run the fix
fixWebhook();