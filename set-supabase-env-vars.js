// Script to provide instructions for setting environment variables in Supabase dashboard
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔧 Instructions for setting environment variables in Supabase Dashboard:\n');

console.log('1. Go to your Supabase project dashboard');
console.log('2. Navigate to Edge Functions');
console.log('3. Select the "tg" function');
console.log('4. Go to Settings → Environment Variables');
console.log('5. Add the following variables:\n');

console.log('Variable Name: SUPABASE_URL');
console.log('Value:', process.env.SUPABASE_URL);
console.log('');

console.log('Variable Name: SUPABASE_SERVICE_ROLE_KEY');
console.log('Value: ******** (your service role key)');
console.log('');

console.log('Variable Name: TELEGRAM_BOT_TOKEN');
console.log('Value: ******** (your Telegram bot token)');
console.log('');

console.log('Variable Name: TELEGRAM_BOT_USERNAME');
console.log('Value:', process.env.TELEGRAM_BOT_USERNAME);
console.log('');

console.log('Variable Name: TZ_DEFAULT');
console.log('Value:', process.env.TZ_DEFAULT || 'Europe/Amsterdam');
console.log('');

console.log('6. Click "Deploy" to apply changes\n');

console.log('⚠️  Important:');
console.log('- Make sure to use your actual service role key and bot token values');
console.log('- After setting the variables, click Deploy to apply changes');
console.log('- The function will restart with the new environment variables');