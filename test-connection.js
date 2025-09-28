import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Try to get the current time from the database
    const { data, error } = await supabase.rpc('now');
    
    if (error) {
      console.error('Connection failed:', error.message);
      return;
    }
    
    console.log('✅ Successfully connected to Supabase!');
    console.log('Current database time:', data);
  } catch (error) {
    console.error('Connection failed:', error.message);
  }
}

testConnection();