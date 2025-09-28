// Script to test if environment variables are correctly set
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const requiredVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_BOT_USERNAME'
];

console.log('🔍 Checking environment variables...\n');

let allSet = true;

requiredVars.forEach((varName) => {
  const value = process.env[varName];
  if (value) {
    // Mask sensitive variables
    const displayValue = varName.includes('KEY') || varName.includes('TOKEN') ? '********' : value;
    console.log(`✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
    allSet = false;
  }
});

if (allSet) {
  console.log('\n✅ All required environment variables are set in .env file');
  console.log('\n⚠️  Remember to also set these variables in the Supabase Dashboard:');
  console.log('1. Go to your Supabase project');
  console.log('2. Navigate to Edge Functions');
  console.log('3. Select the "tg" function');
  console.log('4. Go to Settings → Environment Variables');
  console.log('5. Add all the variables with their actual values');
  console.log('6. Click "Deploy" to apply changes');
} else {
  console.log('\n❌ Some required environment variables are missing');
}