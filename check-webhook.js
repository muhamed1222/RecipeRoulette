import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TELEGRAM_BOT_TOKEN) {
  console.error('Missing TELEGRAM_BOT_TOKEN. Please check your .env file.');
  process.exit(1);
}

async function checkWebhook() {
  console.log('🔍 Checking Telegram bot webhook...');
  
  try {
    // Get webhook info
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`);
    const data = await response.json();
    
    if (data.ok) {
      console.log('✅ Successfully retrieved webhook info!');
      console.log('Webhook Info:');
      console.log(`  - URL: ${data.result.url || 'Not set'}`);
      console.log(`  - Has custom certificate: ${data.result.has_custom_certificate}`);
      console.log(`  - Pending update count: ${data.result.pending_update_count}`);
      if (data.result.last_error_date) {
        console.log(`  - Last error date: ${new Date(data.result.last_error_date * 1000)}`);
      }
      if (data.result.last_error_message) {
        console.log(`  - Last error message: ${data.result.last_error_message}`);
      }
      console.log(`  - Max connections: ${data.result.max_connections}`);
      console.log(`  - Allowed updates: ${JSON.stringify(data.result.allowed_updates)}`);
    } else {
      console.error('❌ Failed to retrieve webhook info:', data.description);
    }
  } catch (error) {
    console.error('❌ Webhook check failed:', error.message);
  }
}

// Run the check
checkWebhook();