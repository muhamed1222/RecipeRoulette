import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function verifyEmployee() {
  console.log('🔍 Verifying employee...');
  
  try {
    // Check if test employee exists
    const { data: employee, error } = await supabase
      .from('employee')
      .select('*')
      .eq('telegram_user_id', '123456789')
      .single();

    if (error) {
      console.error('❌ Error querying employee:', error);
      return;
    }

    if (!employee) {
      console.log('⚠️  Test employee not found');
      return;
    }

    console.log('✅ Employee found:');
    console.log(`  ID: ${employee.id}`);
    console.log(`  Name: ${employee.full_name}`);
    console.log(`  Telegram ID: ${employee.telegram_user_id}`);
    console.log(`  Company ID: ${employee.company_id}`);
    console.log(`  Status: ${employee.status}`);
    
    // Check if company exists
    const { data: company, error: companyError } = await supabase
      .from('company')
      .select('name')
      .eq('id', employee.company_id)
      .single();
    
    if (companyError) {
      console.error('❌ Error querying company:', companyError);
    } else {
      console.log(`  Company: ${company.name}`);
    }
    
    // Check if employee has any invites
    const { data: invites, error: invitesError } = await supabase
      .from('employee_invite')
      .select('*')
      .eq('company_id', employee.company_id);
    
    if (invitesError) {
      console.error('❌ Error querying invites:', invitesError);
    } else {
      console.log(`  Company invites: ${invites.length}`);
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

// Run the verification
verifyEmployee();