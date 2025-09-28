import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TELEGRAM_BOT_TOKEN) {
  console.error('Missing TELEGRAM_BOT_TOKEN. Please check your .env file.');
  process.exit(1);
}

async function testTelegramBot() {
  console.log('🚀 Testing Telegram bot connection...');
  
  try {
    // Test the bot API
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`);
    const data = await response.json();
    
    if (data.ok) {
      console.log('✅ Successfully connected to Telegram bot!');
      console.log('Bot Info:');
      console.log(`  - ID: ${data.result.id}`);
      console.log(`  - Name: ${data.result.first_name}`);
      console.log(`  - Username: @${data.result.username}`);
    } else {
      console.error('❌ Failed to connect to Telegram bot:', data.description);
    }
  } catch (error) {
    console.error('❌ Telegram bot connection failed:', error.message);
  }
}

// Run the test
testTelegramBot();