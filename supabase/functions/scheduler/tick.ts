// Scheduler Tick Function
// POST /scheduler/tick (cron job every 5 minutes)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// Initialize Supabase client with service role key for full access
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

// Telegram Bot API endpoint
const TELEGRAM_API_URL = `https://api.telegram.org/bot${Deno.env.get("TELEGRAM_BOT_TOKEN")}`;

// Send Telegram message with batching and jitter
async function sendTelegramMessages(messages: Array<{chatId: string, text: string, keyboard?: any}>) {
  // Process in batches of 20-30 with jitter
  const batchSize = 25;
  const delayBetweenBatches = 250; // 250ms jitter

  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize);
    
    // Send messages in batch
    const promises = batch.map(async (msg) => {
      try {
        const payload: any = {
          chat_id: msg.chatId,
          text: msg.text,
          parse_mode: "Markdown"
        };
        
        if (msg.keyboard) {
          payload.reply_markup = msg.keyboard;
        }
        
        const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Telegram API error for chat ${msg.chatId}:`, errorText);
        }
        
        return response.ok;
      } catch (error) {
        console.error(`Error sending message to chat ${msg.chatId}:`, error);
        return false;
      }
    });
    
    await Promise.all(promises);
    
    // Add jitter between batches
    if (i + batchSize < messages.length) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }
}

// Generate reminders for the next 24 hours
async function generateUpcomingReminders() {
  try {
    // Get employees with schedules for the next 24 hours
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const { data: schedules, error } = await supabase
      .from("employee_schedule")
      .select(`
        employee_id,
        schedule_id,
        valid_from,
        valid_to,
        employee:employee!inner (
          id,
          full_name,
          telegram_user_id,
          company_id,
          tz
        ),
        schedule:schedule_template!inner (
          id,
          name,
          rules
        )
      `)
      .lte("valid_from", tomorrow.toISOString().split("T")[0])
      .gte("valid_to", new Date().toISOString().split("T")[0])
      .or("valid_to.is.null,valid_to.gte." + new Date().toISOString().split("T")[0]);
    
    if (error) {
      console.error("Error fetching schedules:", error);
      return;
    }
    
    // For each employee schedule, generate reminders
    for (const schedule of schedules) {
      if (!schedule.employee.telegram_user_id) continue;
      
      const employeeTz = schedule.employee.tz || "Europe/Amsterdam";
      const now = new Date();
      
      // Parse schedule rules
      try {
        const rules = schedule.schedule.rules;
        if (!rules || !rules.work) continue;
        
        // Generate reminders for the next 24 hours
        for (let dayOffset = 0; dayOffset <= 1; dayOffset++) {
          const scheduleDate = new Date();
          scheduleDate.setDate(now.getDate() + dayOffset);
          
          // Check if this day is valid for the schedule
          const dayOfWeek = scheduleDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
          const validDays = rules.days || [1, 2, 3, 4, 5]; // Default to weekdays
          
          if (!validDays.includes(dayOfWeek)) continue;
          
          // Generate reminder times
          const workStart = rules.work.start; // "10:00"
          const workEnd = rules.work.end;     // "18:00"
          
          if (workStart && workEnd) {
            // Convert to Date objects with proper timezone
            const [startHours, startMinutes] = workStart.split(":").map(Number);
            const [endHours, endMinutes] = workEnd.split(":").map(Number);
            
            const startDate = new Date(scheduleDate);
            startDate.setHours(startHours, startMinutes, 0, 0);
            
            const endDate = new Date(scheduleDate);
            endDate.setHours(endHours, endMinutes, 0, 0);
            
            // Pre-start reminder (10 minutes before)
            const preStart = new Date(startDate);
            preStart.setMinutes(preStart.getMinutes() - 10);
            
            // Pre-end reminder (10 minutes before end)
            const preEnd = new Date(endDate);
            preEnd.setMinutes(preEnd.getMinutes() - 10);
            
            // Check if reminders already exist
            const reminderTimes = [
              { type: "pre_start", time: preStart },
              { type: "pre_end", time: preEnd }
            ];
            
            // Add lunch break reminders if defined
            if (rules.breaks && Array.isArray(rules.breaks)) {
              for (const breakRule of rules.breaks) {
                const [breakStart, breakEnd] = breakRule;
                if (breakStart && breakEnd) {
                  const [breakStartHours, breakStartMinutes] = breakStart.split(":").map(Number);
                  const [breakEndHours, breakEndMinutes] = breakEnd.split(":").map(Number);
                  
                  const breakStartDate = new Date(scheduleDate);
                  breakStartDate.setHours(breakStartHours, breakStartMinutes, 0, 0);
                  
                  const breakEndDate = new Date(scheduleDate);
                  breakEndDate.setHours(breakEndHours, breakEndMinutes, 0, 0);
                  
                  reminderTimes.push(
                    { type: "lunch_start", time: breakStartDate },
                    { type: "lunch_end", time: breakEndDate }
                  );
                }
              }
            }
            
            // Create reminders that don't already exist
            for (const { type, time } of reminderTimes) {
              if (time < now) continue; // Skip past reminders
              
              // Check if reminder already exists
              const { data: existing } = await supabase
                .from("reminder")
                .select("id")
                .eq("employee_id", schedule.employee_id)
                .eq("type", type)
                .eq("planned_at", time.toISOString())
                .maybeSingle();
              
              if (!existing) {
                // Create new reminder
                await supabase
                  .from("reminder")
                  .insert({
                    employee_id: schedule.employee_id,
                    type,
                    planned_at: time.toISOString()
                  });
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error processing schedule for employee ${schedule.employee_id}:`, error);
      }
    }
  } catch (error) {
    console.error("Error generating upcoming reminders:", error);
  }
}

// Process pending reminders
async function processPendingReminders() {
  try {
    const now = new Date();
    const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);
    
    // Get reminders that should be sent in the next 10 minutes and haven't been sent yet
    const { data: reminders, error } = await supabase
      .from("reminder")
      .select(`
        id,
        type,
        planned_at,
        sent_at,
        employee:employee!inner (
          id,
          full_name,
          telegram_user_id,
          status
        )
      `)
      .gte("planned_at", now.toISOString())
      .lte("planned_at", tenMinutesFromNow.toISOString())
      .is("sent_at", null)
      .eq("employee.status", "active");
    
    if (error) {
      console.error("Error fetching reminders:", error);
      return;
    }
    
    // Group messages by type
    const messagesToSend: Array<{chatId: string, text: string, keyboard?: any}> = [];
    
    for (const reminder of reminders) {
      if (!reminder.employee.telegram_user_id) continue;
      
      const chatId = reminder.employee.telegram_user_id;
      let text = "";
      let keyboard: { inline_keyboard: any[][] } | null = null;
      
      switch (reminder.type) {
        case "pre_start":
          text = "Через 10 минут старт вашей смены. Открыть форму плана?";
          keyboard = {
            inline_keyboard: [
              [
                { text: "Открыть", callback_data: "open_webapp" },
                { text: "Я опоздаю", callback_data: "late_start" }
              ]
            ]
          } as { inline_keyboard: any[][] };
          break;
          
        case "lunch_start":
          text = "Пора на обед.";
          keyboard = {
            inline_keyboard: [
              [
                { text: "Начать обед", callback_data: "lunch_start" }
              ]
            ]
          } as { inline_keyboard: any[][] };
          break;
          
        case "lunch_end":
          text = "Возвращаемся к работе.";
          keyboard = {
            inline_keyboard: [
              [
                { text: "Закончить обед", callback_data: "lunch_end" }
              ]
            ]
          } as { inline_keyboard: any[][] };
          break;
          
        case "pre_end":
          text = "Через 10 минут конец смены. Заполнить краткий отчёт?";
          keyboard = {
            inline_keyboard: [
              [
                { text: "Открыть", callback_data: "open_webapp" }
              ]
            ]
          } as { inline_keyboard: any[][] };
          break;
          
        default:
          continue;
      }
      
      messagesToSend.push({ chatId, text, keyboard });
    }
    
    // Send messages with batching and jitter
    if (messagesToSend.length > 0) {
      await sendTelegramMessages(messagesToSend);
    }
    
    // Mark reminders as sent
    const reminderIds = reminders.map(r => r.id);
    if (reminderIds.length > 0) {
      await supabase
        .from("reminder")
        .update({ sent_at: new Date().toISOString() })
        .in("id", reminderIds);
    }
  } catch (error) {
    console.error("Error processing pending reminders:", error);
  }
}

// Create exceptions for missed reports
async function createMissedReportExceptions() {
  try {
    const twoHoursAgo = new Date();
    twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

    // Find shifts that ended more than 2 hours ago
    const { data: shifts, error: shiftError } = await supabase
      .from("shift")
      .select(`
        id,
        employee_id,
        planned_end_at,
        employee:employee!inner (
          id,
          full_name
        )
      `)
      .lt("planned_end_at", twoHoursAgo.toISOString())
      .eq("status", "done");

    if (shiftError) {
      console.error("Error fetching shifts without reports:", shiftError);
      return;
    }

    if (!shifts || shifts.length === 0) {
      return;
    }

    const shiftIds = shifts.map((shift) => shift.id);

    let shiftsWithoutReports = shifts;

    if (shiftIds.length > 0) {
      const { data: reports, error: reportsError } = await supabase
        .from("daily_report")
        .select("shift_id")
        .in("shift_id", shiftIds)
        .not("submitted_at", "is", null);

      if (reportsError) {
        console.error("Error fetching submitted reports:", reportsError);
      } else if (reports) {
        const submittedShiftIds = new Set(reports.map((report) => report.shift_id));
        shiftsWithoutReports = shifts.filter((shift) => !submittedShiftIds.has(shift.id));
      }
    }

    for (const shift of shiftsWithoutReports) {
      const shiftDate = new Date(shift.planned_end_at).toISOString().split("T")[0];

      const { data: existing } = await supabase
        .from("exception")
        .select("id")
        .eq("employee_id", shift.employee_id)
        .eq("date", shiftDate)
        .eq("kind", "no_report")
        .maybeSingle();

      if (!existing) {
        await supabase
          .from("exception")
          .insert({
            employee_id: shift.employee_id,
            date: shiftDate,
            kind: "no_report",
            severity: 1,
            details: { shift_id: shift.id }
          });
      }
    }
  } catch (error) {
    console.error("Error creating missed report exceptions:", error);
  }
}

// Main function
export async function tick() {
  try {
    await generateUpcomingReminders();
    await processPendingReminders();
    await createMissedReportExceptions();

    return { ranAt: new Date().toISOString() };
  } catch (error) {
    console.error("Error in scheduler tick:", error);
    throw error;
  }
}
