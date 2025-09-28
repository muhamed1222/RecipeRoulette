import { spawn } from 'child_process';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🚀 Starting Full Deployment of outTime System');
console.log('=============================================');

// Function to execute shell commands
function executeCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    console.log(`\n🔧 Executing: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, { stdio: 'inherit' });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

const SUPABASE_PASSWORD = process.env.SUPABASE_DB_PASSWORD;

async function fullDeploy() {
  try {
    if (!SUPABASE_PASSWORD) {
      throw new Error('SUPABASE_DB_PASSWORD не задан. Экспортируйте пароль перед запуском.');
    }

    // Step 1: Apply database migrations
    console.log('\n1. Running database migrations...');
    await executeCommand('supabase', [
      'db',
      'push',
      '--project-ref',
      'lmpmkszgwwwqvbdhxest',
      '--password',
      SUPABASE_PASSWORD
    ]);

    // Step 2: Deploy Edge Functions
    console.log('\n2. Deploying Edge Functions...');
    await executeCommand('./deploy-functions.sh');
    
    // Step 3: Set up scheduler cron job
    console.log('\n3. Setting up scheduler cron job...');
    await executeCommand('supabase', [
      'functions', 
      'schedule', 
      'scheduler', 
      '--project-ref', 
      'lmpmkszgwwwqvbdhxest', 
      '--cron', 
      '*/5 * * * *'
    ]);
    
    // Step 4: Show instructions for setting up environment variables
    console.log('\n4. Environment Variables Setup:');
    console.log('   Please set up the environment variables for each function in the Supabase dashboard:');
    console.log('   - SUPABASE_URL: https://lmpmkszgwwwqvbdhxest.supabase.co');
    console.log('   - SUPABASE_SERVICE_ROLE_KEY: [Your service role key]');
    console.log('   - TELEGRAM_BOT_TOKEN: 7702024149:AAEwYiA7qqhWkKIDpC-OQrfiHclX-sJ6gC4');
    console.log('   - TELEGRAM_BOT_USERNAME: @outtimeagency_bot');
    console.log('   - TZ_DEFAULT: Europe/Amsterdam');
    
    // Step 5: Show next steps
    console.log('\n✅ Deployment completed successfully!');
    console.log('\nNext steps:');
    console.log('  1. Set up environment variables for each function в Supabase');
    console.log('  2. Разверните фронтенд-приложение');
    console.log('  3. Настройте Telegram webhook через ./setup-webhook.sh');
    console.log('  4. Протестируйте систему');
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    console.log('\nPlease check the error message above and try again.');
    process.exit(1);
  }
}

// Run the full deployment
fullDeploy();
