import { getServiceClient } from "../_shared/supabase.ts";

function supabase() {
  return getServiceClient();
}

export class SubmitError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
    this.name = "SubmitError";
  }
}

type SubmitType = "plan" | "report" | "lunch";

interface SubmitRequest {
  initData?: string;
  type?: SubmitType;
  payload?: Record<string, unknown>;
}

interface SubmitResult {
  status: number;
  body: Record<string, unknown>;
}

interface Employee {
  id: string;
}

function verifyInitData(initData: string, botToken: string): boolean {
  try {
    return Boolean(initData && initData.length > 0 && botToken);
  } catch (error) {
    console.error("Error verifying initData:", error);
    return false;
  }
}

function parseUserId(initData: string): string | null {
  try {
    const params = new URLSearchParams(initData);
    const userJson = params.get("user");
    if (!userJson) return null;
    const user = JSON.parse(userJson);
    return user.id ? String(user.id) : null;
  } catch (error) {
    console.error("Error parsing user from initData:", error);
    return null;
  }
}

async function findEmployeeByTelegramId(telegramUserId: string): Promise<Employee> {
  const { data, error } = await supabase()
    .from("employee")
    .select("id")
    .eq("telegram_user_id", telegramUserId)
    .single();

  if (error || !data) {
    throw new SubmitError("Employee not found", 404);
  }

  return data;
}

type PlanPayload = {
  plannedStartAt?: string;
  plannedEndAt?: string;
  plannedItems?: string[];
  tasksLinks?: string[];
};

type ReportPayload = {
  doneItems?: string[];
  blockers?: string;
  timeSpent?: Record<string, number>;
  attachments?: unknown[];
};

type LunchPayload = {
  action?: "start" | "end";
};

async function handlePlan(employee: Employee, payload: PlanPayload | undefined, userId: string): Promise<SubmitResult> {
  const now = new Date();
  const plannedStart = payload?.plannedStartAt ? new Date(payload.plannedStartAt) : now;
  const plannedEnd = payload?.plannedEndAt ? new Date(payload.plannedEndAt) : new Date(now.getTime() + 8 * 60 * 60 * 1000);

  const { data: shift, error: shiftError } = await supabase()
    .from("shift")
    .insert({
      employee_id: employee.id,
      planned_start_at: plannedStart,
      planned_end_at: plannedEnd,
      status: "active"
    })
    .select("id")
    .single();

  if (shiftError || !shift) {
    console.error("Error creating shift:", shiftError);
    throw new SubmitError("Error creating shift", 500);
  }

  const { error: intervalError } = await supabase()
    .from("work_interval")
    .insert({
      shift_id: shift.id,
      start_at: now,
      source: "bot"
    });

  if (intervalError) {
    console.error("Error creating work interval:", intervalError);
    throw new SubmitError("Error creating work interval", 500);
  }

  if (payload?.plannedItems && payload.plannedItems.length > 0) {
    const { error: reportError } = await supabase()
      .from("daily_report")
      .insert({
        shift_id: shift.id,
        planned_items: payload.plannedItems,
        tasks_links: payload.tasksLinks ?? [],
        submitted_at: null
      });

    if (reportError) {
      console.error("Error creating daily report:", reportError);
    }
  }

  await supabase()
    .from("audit_log")
    .insert({
      actor: `tg:${userId}`,
      action: "submit_plan",
      entity: `shift:${shift.id}`,
      payload: { shift_id: shift.id, planned_items: payload?.plannedItems ?? [] }
    });

  return {
    status: 200,
    body: { success: true, shiftId: shift.id }
  };
}

async function findActiveShift(employeeId: string): Promise<{ id: string }> {
  const { data, error } = await supabase()
    .from("shift")
    .select("id")
    .eq("employee_id", employeeId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    throw new SubmitError("Active shift not found", 404);
  }

  return data;
}

async function handleReport(employee: Employee, payload: ReportPayload | undefined, userId: string): Promise<SubmitResult> {
  const shift = await findActiveShift(employee.id);
  const now = new Date();

  const { error: workIntervalUpdateError } = await supabase()
    .from("work_interval")
    .update({ end_at: now })
    .eq("shift_id", shift.id)
    .is("end_at", null);

  if (workIntervalUpdateError) {
    console.error("Error closing work interval:", workIntervalUpdateError);
  }

  const { error: shiftUpdateError } = await supabase()
    .from("shift")
    .update({ status: "done", planned_end_at: now })
    .eq("id", shift.id);

  if (shiftUpdateError) {
    console.error("Error updating shift:", shiftUpdateError);
  }

  const { data: existingReport, error: reportFetchError } = await supabase()
    .from("daily_report")
    .select("id")
    .eq("shift_id", shift.id)
    .maybeSingle();

  if (reportFetchError) {
    console.error("Error fetching existing daily report:", reportFetchError);
  }

  const reportData = {
    done_items: payload?.doneItems ?? [],
    blockers: payload?.blockers ?? "",
    time_spent: payload?.timeSpent ?? {},
    attachments: payload?.attachments ?? [],
    submitted_at: now
  };

  if (existingReport) {
    const { error: updateReportError } = await supabase()
      .from("daily_report")
      .update(reportData)
      .eq("id", existingReport.id);

    if (updateReportError) {
      console.error("Error updating daily report:", updateReportError);
    }
  } else {
    const { error: insertReportError } = await supabase()
      .from("daily_report")
      .insert({
        shift_id: shift.id,
        ...reportData
      });

    if (insertReportError) {
      console.error("Error creating daily report:", insertReportError);
    }
  }

  await supabase()
    .from("audit_log")
    .insert({
      actor: `tg:${userId}`,
      action: "submit_report",
      entity: `shift:${shift.id}`,
      payload: { shift_id: shift.id, report_data: payload ?? {} }
    });

  return {
    status: 200,
    body: { success: true }
  };
}

async function handleLunch(employee: Employee, payload: LunchPayload | undefined, userId: string): Promise<SubmitResult> {
  const shift = await findActiveShift(employee.id);
  const action = payload?.action;

  if (action !== "start" && action !== "end") {
    throw new SubmitError("Invalid lunch action", 400);
  }

  const now = new Date();

  if (action === "start") {
    const { error: workIntervalUpdateError } = await supabase()
      .from("work_interval")
      .update({ end_at: now })
      .eq("shift_id", shift.id)
      .is("end_at", null);

    if (workIntervalUpdateError) {
      console.error("Error closing work interval:", workIntervalUpdateError);
    }

    const { error: breakInsertError } = await supabase()
      .from("break_interval")
      .insert({
        shift_id: shift.id,
        start_at: now,
        type: "lunch",
        source: "bot"
      });

    if (breakInsertError) {
      console.error("Error creating break interval:", breakInsertError);
      throw new SubmitError("Error creating break interval", 500);
    }

    await supabase()
      .from("audit_log")
      .insert({
        actor: `tg:${userId}`,
        action: "start_lunch",
        entity: `shift:${shift.id}`,
        payload: { shift_id: shift.id }
      });
  } else {
    const { error: breakUpdateError } = await supabase()
      .from("break_interval")
      .update({ end_at: now })
      .eq("shift_id", shift.id)
      .is("end_at", null)
      .eq("type", "lunch");

    if (breakUpdateError) {
      console.error("Error closing break interval:", breakUpdateError);
    }

    const { error: workIntervalInsertError } = await supabase()
      .from("work_interval")
      .insert({
        shift_id: shift.id,
        start_at: now,
        source: "bot"
      });

    if (workIntervalInsertError) {
      console.error("Error creating work interval:", workIntervalInsertError);
      throw new SubmitError("Error creating work interval", 500);
    }

    await supabase()
      .from("audit_log")
      .insert({
        actor: `tg:${userId}`,
        action: "end_lunch",
        entity: `shift:${shift.id}`,
        payload: { shift_id: shift.id }
      });
  }

  return {
    status: 200,
    body: { success: true }
  };
}

export async function handleSubmit(request: SubmitRequest): Promise<SubmitResult> {
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!botToken) {
    throw new SubmitError("TELEGRAM_BOT_TOKEN is not configured", 500);
  }

  const initData = typeof request.initData === "string" ? request.initData : undefined;
  const type = request.type;

  if (!initData || !type) {
    throw new SubmitError("initData and type are required", 400);
  }

  if (!verifyInitData(initData, botToken)) {
    throw new SubmitError("Invalid initData", 403);
  }

  const userId = parseUserId(initData);
  if (!userId) {
    throw new SubmitError("User not found in initData", 400);
  }

  const employee = await findEmployeeByTelegramId(userId);

  switch (type) {
    case "plan":
      return handlePlan(employee, request.payload as PlanPayload, userId);
    case "report":
      return handleReport(employee, request.payload as ReportPayload, userId);
    case "lunch":
      return handleLunch(employee, request.payload as LunchPayload, userId);
    default:
      throw new SubmitError("Invalid form type", 400);
  }
}
