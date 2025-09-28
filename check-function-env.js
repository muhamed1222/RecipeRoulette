// Script to check and set environment variables for Supabase functions
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME;
const TZ_DEFAULT = process.env.TZ_DEFAULT || 'Europe/Amsterdam';

console.log('🔍 Checking environment variables for Supabase functions...\n');

// Check required variables
const requiredVars = [
  { name: 'SUPABASE_URL', value: SUPABASE_URL },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', value: SUPABASE_SERVICE_ROLE_KEY ? '********' : undefined },
  { name: 'TELEGRAM_BOT_TOKEN', value: TELEGRAM_BOT_TOKEN ? '********' : undefined },
  { name: 'TELEGRAM_BOT_USERNAME', value: TELEGRAM_BOT_USERNAME },
  { name: 'TZ_DEFAULT', value: TZ_DEFAULT }
];

let missingVars = [];

requiredVars.forEach(({ name, value }) => {
  if (value) {
    console.log(`✅ ${name}: ${value}`);
  } else {
    console.log(`❌ ${name}: NOT SET`);
    missingVars.push(name);
  }
});

if (missingVars.length > 0) {
  console.log(`\n⚠️  Missing environment variables: ${missingVars.join(', ')}`);
  console.log('\nPlease set these variables in the Supabase Dashboard:');
  console.log('1. Go to your Supabase project');
  console.log('2. Navigate to Edge Functions');
  console.log('3. Select the "tg" function');
  console.log('4. Go to Settings → Environment Variables');
  console.log('5. Add the missing variables with their values');
  console.log('6. Click "Deploy" to apply changes');
} else {
  console.log('\n✅ All required environment variables are set!');
  console.log('\nNote: For security, sensitive variables (SERVICE_ROLE_KEY, BOT_TOKEN) are masked.');
  console.log('Make sure they are correctly set in the Supabase Dashboard.');
}

console.log('\n🔧 To set environment variables via Supabase CLI (if available):');
console.log('supabase functions env set tg SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY TELEGRAM_BOT_TOKEN TELEGRAM_BOT_USERNAME TZ_DEFAULT');