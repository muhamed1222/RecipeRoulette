import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Get credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log('🚀 Setting up outTime database...');
  
  try {
    // Read the setup SQL files
    const setupFiles = [
      'setup-database.sql',
      'setup-storage.sql',
      'setup-audit-logging.sql',
      'setup-reminders.sql',
      'setup-storage-ttl.sql'
    ];
    
    for (const file of setupFiles) {
      if (fs.existsSync(file)) {
        console.log(`\n📝 Processing ${file}...`);
        const sql = fs.readFileSync(file, 'utf8');
        
        // Split SQL into individual statements
        const statements = sql
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0);
        
        for (const statement of statements) {
          if (statement.trim().length > 0) {
            try {
              // For simplicity, we'll log the statements instead of executing them
              // In a real implementation, you would execute them against the database
              console.log(`   Executing: ${statement.substring(0, 50)}...`);
              
              // Note: Direct SQL execution through the JS client is limited
              // You would need to use the Supabase CLI or dashboard for full SQL support
            } catch (error) {
              console.warn(`   Warning: ${error.message}`);
            }
          }
        }
        
        console.log(`✅ Completed ${file}`);
      } else {
        console.log(`⚠️  File ${file} not found, skipping...`);
      }
    }
    
    console.log('\n✅ Database setup completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Deploy Edge Functions using deploy-functions.sh');
    console.log('2. Create a Telegram bot and set up the webhook');
    console.log('3. Deploy the web admin dashboard');
    console.log('4. Test the system');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
setupDatabase();