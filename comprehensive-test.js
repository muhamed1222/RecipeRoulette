// Comprehensive test for the Telegram bot
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

async function testBotLogic() {
  console.log('🔍 Testing bot logic directly...');
  
  const userId = '123456789'; // Test user ID
  const payload = null; // No invite payload for regular user
  
  console.log('User ID:', userId);
  console.log('Payload:', payload);
  
  try {
    if (payload && userId) {
      console.log('Processing invite payload for user:', userId);
      // Handle invitation
      const { data: invite, error: inviteError } = await supabase
        .from("employee_invite")
        .select("id, company_id")
        .eq("code", payload)
        .is("used_at", null)
        .maybeSingle();

      if (!inviteError && invite) {
        console.log("Valid invite found for user:", userId);
        // Check if employee already exists
        const { data: existingEmployee, error: employeeError } = await supabase
          .from("employee")
          .select("id")
          .eq("telegram_user_id", userId)
          .maybeSingle();

        if (!employeeError) {
          if (existingEmployee) {
            console.log("Existing employee found, updating:", existingEmployee.id);
            // Update existing employee
            await supabase
              .from("employee")
              .update({
                company_id: invite.company_id,
                status: "active"
              })
              .eq("id", existingEmployee.id);
          } else {
            console.log("Creating new employee for user:", userId);
            // Create new employee
            await supabase
              .from("employee")
              .insert({
                telegram_user_id: userId,
                company_id: invite.company_id,
                full_name: "Test User",
                status: "active"
              });
          }

          // Mark invite as used
          await supabase
            .from("employee_invite")
            .update({
              used_by_employee: existingEmployee?.id || null,
              used_at: new Date().toISOString()
            })
            .eq("id", invite.id);

          console.log("✅ Invite processed successfully");
          return;
        }
      } else {
        console.log("Invalid or expired invite for user:", userId, "Error:", inviteError);
      }
    }
    
    console.log("Checking if user is already registered:", userId);
    // Check if user is already registered
    const { data: employee, error } = await supabase
      .from("employee")
      .select("*")
      .eq("telegram_user_id", userId)
      .maybeSingle();

    console.log("Employee lookup result:", { employee, error });

    if (error || !employee) {
      console.log("User not registered or error occurred:", userId, error);
      console.log("❌ Would send: ⛔ Вы не привязаны ни к одной компании.\nПолучите пригласительную ссылку от вашего руководителя.");
      return;
    }

    console.log("✅ User is registered, would send main menu to:", userId);
    console.log("Employee details:", employee);
  } catch (error) {
    console.error("Error in bot logic:", error);
  }
}

testBotLogic();