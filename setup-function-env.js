import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

console.log('🔧 Setting up environment variables for Edge Functions');
console.log('');

// Get the required environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7702024149:AAEwYiA7qqhWkKIDpC-OQrfiHclX-sJ6gC4';
const TELEGRAM_BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || '@outtimeagency_bot';
const TZ_DEFAULT = process.env.TZ_DEFAULT || 'Europe/Amsterdam';

console.log('Required environment variables:');
console.log(`  SUPABASE_URL: ${SUPABASE_URL}`);
console.log(`  SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY ? '[SET]' : '[NOT SET]'}`);
console.log(`  TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN}`);
console.log(`  TELEGRAM_BOT_USERNAME: ${TELEGRAM_BOT_USERNAME}`);
console.log(`  TZ_DEFAULT: ${TZ_DEFAULT}`);
console.log('');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required Supabase credentials!');
  console.error('Please make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file.');
  process.exit(1);
}

console.log('📋 Instructions for setting up environment variables in Supabase:');
console.log('');
console.log('1. Go to your Supabase project dashboard');
console.log('2. Navigate to "Functions" in the left sidebar');
console.log('3. For each function (tg, webapp, scheduler, admin):');
console.log('   a. Click on the function name');
console.log('   b. Go to the "Settings" tab');
console.log('   c. Add the following environment variables:');
console.log(`      - SUPABASE_URL: ${SUPABASE_URL}`);
console.log(`      - SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}`);
console.log(`      - TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN}`);
console.log(`      - TELEGRAM_BOT_USERNAME: ${TELEGRAM_BOT_USERNAME}`);
console.log(`      - TZ_DEFAULT: ${TZ_DEFAULT}`);
console.log('');
console.log('4. Click "Save" for each function');
console.log('');
console.log('✅ Environment variables setup complete!');