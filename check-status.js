import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

console.log('🔍 Checking outTime System Status');
console.log('=====================================');

// Check environment variables
console.log('\n1. Environment Variables:');
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_BOT_USERNAME'
];

let allEnvVarsSet = true;
for (const envVar of requiredEnvVars) {
  if (process.env[envVar]) {
    console.log(`  ✅ ${envVar}: SET`);
  } else {
    console.log(`  ❌ ${envVar}: NOT SET`);
    allEnvVarsSet = false;
  }
}

// Check if .env file exists
console.log('\n2. Configuration Files:');
if (fs.existsSync('.env')) {
  console.log('  ✅ .env file: EXISTS');
} else {
  console.log('  ❌ .env file: NOT FOUND');
}

// Check function directories
console.log('\n3. Edge Functions:');
const functionDirs = ['tg', 'webapp', 'scheduler', 'admin'];
let allFunctionsExist = true;
for (const func of functionDirs) {
  const funcPath = `supabase/functions/${func}`;
  if (fs.existsSync(funcPath)) {
    console.log(`  ✅ ${func}: EXISTS`);
  } else {
    console.log(`  ❌ ${func}: NOT FOUND`);
    allFunctionsExist = false;
  }
}

// Check SQL setup files
console.log('\n4. Database Setup Files:');
const sqlFiles = [
  'setup-database.sql',
  'setup-storage.sql',
  'setup-audit-logging.sql',
  'setup-reminders.sql',
  'setup-storage-ttl.sql'
];

let allSqlFilesExist = true;
for (const sqlFile of sqlFiles) {
  if (fs.existsSync(sqlFile)) {
    console.log(`  ✅ ${sqlFile}: EXISTS`);
  } else {
    console.log(`  ❌ ${sqlFile}: NOT FOUND`);
    allSqlFilesExist = false;
  }
}

// Summary
console.log('\n5. Summary:');
if (allEnvVarsSet) {
  console.log('  ✅ Environment variables: ALL SET');
} else {
  console.log('  ❌ Environment variables: SOME MISSING');
}

if (allFunctionsExist) {
  console.log('  ✅ Edge Functions: ALL EXIST');
} else {
  console.log('  ❌ Edge Functions: SOME MISSING');
}

if (allSqlFilesExist) {
  console.log('  ✅ Database setup files: ALL EXIST');
} else {
  console.log('  ❌ Database setup files: SOME MISSING');
}

if (allEnvVarsSet && allFunctionsExist && allSqlFilesExist) {
  console.log('\n🎉 All checks passed! You are ready to deploy.');
  console.log('\nNext steps:');
  console.log('  1. Deploy Edge Functions: ./deploy-functions.sh');
  console.log('  2. Set up function environment variables');
  console.log('  3. Deploy database schema using SQL files');
  console.log('  4. Deploy frontend application');
  console.log('  5. Set up Telegram webhook: ./setup-webhook.sh');
} else {
  console.log('\n⚠️  Some checks failed. Please review the issues above.');
}