// Telegram Webhook Handler
// POST /functions/v1/tg

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  Context,
  Telegraf,
  session,
  type SessionFlavor,
} from "https://esm.sh/telegraf@4.15.0";
import { getServiceClient } from "../_shared/supabase.ts";

console.log("TG_FUNCTION_INIT");

// Initialize Supabase client with service role key for full access
const supabase = getServiceClient();

interface SessionData {
  shiftId?: string;
  employeeId?: string;
}

type BotContext = Context & SessionFlavor<SessionData>;

// Initialize Telegraf bot
const bot = new Telegraf<BotContext>(Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "");

// Enable in-memory session storage for tracking user replies
bot.use(session<SessionData>({
  defaultSession: () => ({}),
}));

// Add middleware to log all updates (for debugging)
bot.use((ctx, next) => {
  console.log('TG_UPDATE', JSON.stringify(ctx.update, null, 2));
  return next();
});

// Handle callback queries
bot.action(/^start_shift$/, async (ctx) => {
  try {
    await ctx.answerCbQuery();

    const userId = ctx.from?.id.toString();
    if (!userId) {
      await ctx.reply("Ошибка идентификации пользователя");
      return;
    }

    // Find employee by telegram_user_id
    const { data: employee, error } = await supabase
      .from("employee")
      .select("*")
      .eq("telegram_user_id", userId)
      .single();

    if (error || !employee) {
      await ctx.reply("Сотрудник не найден. Обратитесь к администратору.");
      return;
    }

    // Get today's date
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];

    // Check if shift already exists for today
    const { data: existingShift, error: shiftError } = await supabase
      .from("shift")
      .select("*")
      .eq("employee_id", employee.id)
      .eq("date", dateString)
      .maybeSingle();

    if (shiftError) {
      console.error("Error checking existing shift:", shiftError);
      await ctx.reply("Ошибка при проверке смены");
      return;
    }

    if (existingShift) {
      await ctx.reply("Смена уже начата сегодня!");
      return;
    }

    // Create shift
    const { data: shift, error: insertError } = await supabase
      .from("shift")
      .insert({
        employee_id: employee.id,
        date: dateString,
        start_time: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating shift:", insertError);
      await ctx.reply("Ошибка при создании смены");
      return;
    }

    await ctx.reply("Смена начата! Удачного дня!");
  } catch (error) {
    console.error("Error in start_shift action:", error);
    await ctx.reply("Произошла ошибка. Попробуйте еще раз.");
  }
});

bot.action(/^lunch_start$/, async (ctx) => {
  try {
    await ctx.answerCbQuery();

    const userId = ctx.from?.id.toString();
    if (!userId) {
      await ctx.reply("Ошибка идентификации пользователя");
      return;
    }

    // Find employee by telegram_user_id
    const { data: employee, error } = await supabase
      .from("employee")
      .select("*")
      .eq("telegram_user_id", userId)
      .single();

    if (error || !employee) {
      await ctx.reply("Сотрудник не найден. Обратитесь к администратору.");
      return;
    }

    // Get today's date
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];

    // Find shift for today
    const { data: shift, error: shiftError } = await supabase
      .from("shift")
      .select("*")
      .eq("employee_id", employee.id)
      .eq("date", dateString)
      .maybeSingle();

    if (shiftError || !shift) {
      await ctx.reply("Смена не найдена. Начните смену сначала.");
      return;
    }

    // Update shift with break start time
    const { error: updateError } = await supabase
      .from("shift")
      .update({ break_start: new Date().toISOString() })
      .eq("id", shift.id);

    if (updateError) {
      console.error("Error updating shift:", updateError);
      await ctx.reply("Ошибка при начале перерыва");
      return;
    }

    await ctx.reply("Приятного аппетита! Перерыв начат.");
  } catch (error) {
    console.error("Error in lunch_start action:", error);
    await ctx.reply("Произошла ошибка. Попробуйте еще раз.");
  }
});

bot.action(/^lunch_end$/, async (ctx) => {
  try {
    await ctx.answerCbQuery();

    const userId = ctx.from?.id.toString();
    if (!userId) {
      await ctx.reply("Ошибка идентификации пользователя");
      return;
    }

    // Find employee by telegram_user_id
    const { data: employee, error } = await supabase
      .from("employee")
      .select("*")
      .eq("telegram_user_id", userId)
      .single();

    if (error || !employee) {
      await ctx.reply("Сотрудник не найден. Обратитесь к администратору.");
      return;
    }

    // Get today's date
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];

    // Find shift for today
    const { data: shift, error: shiftError } = await supabase
      .from("shift")
      .select("*")
      .eq("employee_id", employee.id)
      .eq("date", dateString)
      .maybeSingle();

    if (shiftError || !shift) {
      await ctx.reply("Смена не найдена. Начните смену сначала.");
      return;
    }

    // Update shift with break end time
    const { error: updateError } = await supabase
      .from("shift")
      .update({ break_end: new Date().toISOString() })
      .eq("id", shift.id);

    if (updateError) {
      console.error("Error updating shift:", updateError);
      await ctx.reply("Ошибка при завершении перерыва");
      return;
    }

    await ctx.reply("Отлично! Возвращаемся к работе.");
  } catch (error) {
    console.error("Error in lunch_end action:", error);
    await ctx.reply("Произошла ошибка. Попробуйте еще раз.");
  }
});

bot.action(/^finish_shift$/, async (ctx) => {
  try {
    await ctx.answerCbQuery();

    const userId = ctx.from?.id.toString();
    if (!userId) {
      await ctx.reply("Ошибка идентификации пользователя");
      return;
    }

    // Find employee by telegram_user_id
    const { data: employee, error } = await supabase
      .from("employee")
      .select("*")
      .eq("telegram_user_id", userId)
      .single();

    if (error || !employee) {
      await ctx.reply("Сотрудник не найден. Обратитесь к администратору.");
      return;
    }

    // Get today's date
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];

    // Find shift for today
    const { data: shift, error: shiftError } = await supabase
      .from("shift")
      .select("*")
      .eq("employee_id", employee.id)
      .eq("date", dateString)
      .maybeSingle();

    if (shiftError || !shift) {
      await ctx.reply("Смена не найдена. Начните смену сначала.");
      return;
    }

    // Ask for report
    await ctx.reply("Что вы сделали сегодня? Были ли проблемы?", {
      reply_markup: {
        force_reply: true
      }
    });

    // Store shift ID in session for later use
    ctx.session ??= {};
    ctx.session.shiftId = shift.id;
  } catch (error) {
    console.error("Error in finish_shift action:", error);
    await ctx.reply("Произошла ошибка. Попробуйте еще раз.");
  }
});

bot.action(/^absent_today$/, async (ctx) => {
  try {
    await ctx.answerCbQuery();

    const userId = ctx.from?.id.toString();
    if (!userId) {
      await ctx.reply("Ошибка идентификации пользователя");
      return;
    }

    // Find employee by telegram_user_id
    const { data: employee, error } = await supabase
      .from("employee")
      .select("*")
      .eq("telegram_user_id", userId)
      .single();

    if (error || !employee) {
      await ctx.reply("Сотрудник не найден. Обратитесь к администратору.");
      return;
    }

    // Ask for absence reason
    await ctx.reply("Укажите причину отсутствия:", {
      reply_markup: {
        force_reply: true
      }
    });

    // Store employee ID in session for later use
    ctx.session ??= {};
    ctx.session.employeeId = employee.id;
  } catch (error) {
    console.error("Error in absent_today action:", error);
    await ctx.reply("Произошла ошибка. Попробуйте еще раз.");
  }
});

// Handle text messages (for reports and absence reasons)
bot.on("text", async (ctx, next) => {
  try {
    const replyText = ctx.message?.reply_to_message?.text;
    if (!replyText) {
      return next();
    }

    const userId = ctx.from?.id.toString();
    if (!userId) {
      return next();
    }

    // Handle absence reason
    if (replyText.includes("Укажите причину отсутствия")) {
      const reason = ctx.message.text;
      const employeeId = ctx.session?.employeeId;

      if (employeeId && reason) {
        const today = new Date();
        const dateString = today.toISOString().split('T')[0];

        // Save absence
        const { error: insertError } = await supabase
          .from("absences")
          .insert({
            user_id: employeeId,
            date: dateString,
            reason: reason,
            status: "absent"
          });

        if (insertError) {
          console.error("Error saving absence:", insertError);
          await ctx.reply("Ошибка при сохранении причины отсутствия");
          return;
        }

        await ctx.reply("Причина отсутствия сохранена.");
        ctx.session.employeeId = undefined;
      }
    }

    // Handle shift report
    if (replyText.includes("Что вы сделали сегодня")) {
      const reportText = ctx.message.text;
      const shiftId = ctx.session?.shiftId;

      if (shiftId && reportText) {
        // Update shift with end time and report
        const { error: updateError } = await supabase
          .from("shift")
          .update({ 
            end_time: new Date().toISOString(),
            report_text: reportText
          })
          .eq("id", shiftId);

        if (updateError) {
          console.error("Error updating shift:", updateError);
          await ctx.reply("Ошибка при завершении смены");
          return;
        }

        await ctx.reply("Смена завершена! Спасибо за отчет.");
        ctx.session.shiftId = undefined;
      }
    }
  } catch (error) {
    console.error("Error handling text message:", error);
  }
  return next();
});

// Handle commands
bot.command("start", async (ctx) => {
  try {
    const userId = ctx.from?.id.toString();
    const payload = ctx.startPayload;
    console.log("TG_START", { userId, payload });

    if (payload && userId) {
      console.log("Processing invite payload for user:", userId);
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
                full_name: ctx.from?.first_name || "Unknown",
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

          await ctx.reply("✅ Вы успешно присоединились к компании.\nС завтрашнего дня вы будете получать уведомления о начале смены.");
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
      await ctx.reply("⛔ Вы не привязаны ни к одной компании.\nПолучите пригласительную ссылку от вашего руководителя.");
      return;
    }

    console.log("Sending main menu to registered user:", userId);
    // Send main menu
    await ctx.reply(
      "Добро пожаловать в систему учета рабочего времени!",
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "▶️ Начать смену", callback_data: "start_shift" }
            ],
            [
              { text: "🍽 Начать перерыв", callback_data: "lunch_start" },
              { text: "☑️ Вернулся", callback_data: "lunch_end" }
            ],
            [
              { text: "📝 Завершить смену", callback_data: "finish_shift" }
            ],
            [
              { text: "❌ Сегодня не смогу прийти", callback_data: "absent_today" }
            ]
          ]
        }
      }
    );
  } catch (error) {
    console.error("Error handling /start:", error);
    await ctx.reply("Произошла ошибка при обработке команды /start. Попробуйте позже.");
  }
});

bot.command("help", async (ctx) => {
  await ctx.reply(
    "Команды бота:\n" +
    "/start - Главное меню\n" +
    "/help - Помощь\n\n" +
    "Используйте кнопки для управления сменами."
  );
});

// Webhook handler
serve(async (req) => {
  try {
    // Verify webhook request
    if (req.method === "POST") {
      // Let Telegraf handle the update
      await bot.handleUpdate(await req.json());
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (error) {
    console.error("Error in webhook handler:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
