// Script to check if employee exists in database
import { createClient } from '@supabase/supabase-js';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkEmployee() {
  console.log('🔍 Checking employee in database...');
  
  try {
    // Check if employee exists
    const { data: employee, error } = await supabase
      .from('employee')
      .select(`
        id,
        full_name,
        telegram_user_id,
        company_id,
        status,
        company:company_id (name)
      `)
      .eq('telegram_user_id', '123456789')
      .maybeSingle();
    
    if (error) {
      console.error('❌ Error checking employee:', error);
      return;
    }
    
    if (!employee) {
      console.log('❌ Employee not found');
      return;
    }
    
    console.log('✅ Employee found:');
    console.log('  ID:', employee.id);
    console.log('  Name:', employee.full_name);
    console.log('  Telegram ID:', employee.telegram_user_id);
    console.log('  Company ID:', employee.company_id);
    console.log('  Status:', employee.status);
    console.log('  Company:', employee.company?.name);
    
    // Check if there are any shifts for this employee today
    const today = new Date().toISOString().split('T')[0];
    const { data: shifts, error: shiftsError } = await supabase
      .from('shift')
      .select('*')
      .eq('employee_id', employee.id)
      .eq('date', today);
    
    if (shiftsError) {
      console.error('❌ Error checking shifts:', shiftsError);
      return;
    }
    
    console.log('📊 Shifts today:', shifts.length);
    if (shifts.length > 0) {
      console.log('  Shift details:', shifts[0]);
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkEmployee();