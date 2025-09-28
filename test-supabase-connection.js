// Script to test Supabase connection directly
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables');
  process.exit(1);
}

console.log('🔍 Testing Supabase connection...');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  try {
    // Test a simple query to see if we can connect
    const { data, error } = await supabase
      .from('employee')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase connection failed:', error);
      return;
    }
    
    console.log('✅ Supabase connection successful!');
    console.log('Sample data:', data);
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testConnection();