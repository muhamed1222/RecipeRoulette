// Script to set up environment variables for Supabase functions
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME;
const TZ_DEFAULT = process.env.TZ_DEFAULT || 'Europe/Amsterdam';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !TELEGRAM_BOT_TOKEN || !TELEGRAM_BOT_USERNAME) {
  console.error('Missing required environment variables. Please check your .env file.');
  console.error('Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_BOT_USERNAME');
  process.exit(1);
}

console.log('Setting up environment variables for Supabase functions...');
console.log('SUPABASE_URL:', SUPABASE_URL);
console.log('TELEGRAM_BOT_USERNAME:', TELEGRAM_BOT_USERNAME);
console.log('TZ_DEFAULT:', TZ_DEFAULT);

// Note: In a real implementation, we would use the Supabase API to set these variables
// For now, we're just showing what needs to be set in the Supabase dashboard

console.log('\nPlease set the following environment variables in the Supabase dashboard for the tg function:');
console.log('SUPABASE_URL:', SUPABASE_URL);
console.log('SUPABASE_SERVICE_ROLE_KEY:', '<your_service_role_key>');
console.log('TELEGRAM_BOT_TOKEN:', TELEGRAM_BOT_TOKEN);
console.log('TELEGRAM_BOT_USERNAME:', TELEGRAM_BOT_USERNAME);
console.log('TZ_DEFAULT:', TZ_DEFAULT);

console.log('\nYou can set these in the Supabase dashboard by going to:');
console.log('1. Your project');
console.log('2. Edge Functions');
console.log('3. Select the "tg" function');
console.log('4. Go to Settings -> Environment Variables');
console.log('5. Add each variable with the values shown above');