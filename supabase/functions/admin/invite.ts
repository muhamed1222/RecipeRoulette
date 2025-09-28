import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { getServiceClient } from "../_shared/supabase.ts";

function supabase() {
  return getServiceClient();
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const INVITE_CODE_LENGTH = 8;
const MAX_GENERATION_ATTEMPTS = 10;

class InviteError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
    this.name = "InviteError";
  }
}

class RegisterError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
    this.name = "RegisterError";
  }
}

interface CreateInviteRequest {
  fullName?: string;
  position?: string | null;
  companyId?: string;
  adminId?: string;
}

interface CreateInviteResult {
  inviteId: string;
  code: string;
  deepLink: string | null;
}

interface RegisterRequest {
  email?: string;
  password?: string;
  companyName?: string;
}

interface RegisterResult {
  userId: string;
  companyId: string;
}

function generateInviteCode(length: number = INVITE_CODE_LENGTH): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let index = 0; index < length; index += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function generateUniqueInviteCode(): Promise<string> {
  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
    const candidate = generateInviteCode();

    const { data, error } = await supabase()
      .from("employee_invite")
      .select("id")
      .eq("code", candidate)
      .maybeSingle();

    if (error) {
      console.error("Error checking invite code uniqueness:", error);
      throw new InviteError("Unable to verify invite code uniqueness", 500);
    }

    if (!data) {
      return candidate;
    }
  }

  throw new InviteError("Failed to generate unique invite code", 500);
}

async function createInvite(payload: CreateInviteRequest): Promise<CreateInviteResult> {
  const { fullName, position, companyId, adminId } = payload;

  if (!fullName || !companyId) {
    throw new InviteError("fullName and companyId are required", 400);
  }

  const inviteCode = await generateUniqueInviteCode();

  const { data: invite, error: inviteError } = await supabase()
    .from("employee_invite")
    .insert({
      company_id: companyId,
      code: inviteCode,
      full_name: fullName,
      position: position ?? null
    })
    .select("id")
    .single();

  if (inviteError || !invite) {
    console.error("Error creating employee invite:", inviteError);
    throw new InviteError("Error creating employee invite", 500);
  }

  const botUsername = Deno.env.get("TELEGRAM_BOT_USERNAME");
  const deepLink = botUsername ? `https://t.me/${botUsername}?start=${inviteCode}` : null;

  const actorId = adminId ? `admin:${adminId}` : "admin:unknown";
  const { error: auditError } = await supabase()
    .from("audit_log")
    .insert({
      actor: actorId,
      action: "create_invite",
      entity: `employee_invite:${invite.id}`,
      payload: { invite_id: invite.id, company_id: companyId }
    });

  if (auditError) {
    console.error("Error writing audit log for invite creation:", auditError);
  }

  return {
    inviteId: invite.id,
    code: inviteCode,
    deepLink
  };
}

async function registerAdmin(payload: RegisterRequest): Promise<RegisterResult> {
  const email = payload.email?.trim().toLowerCase();
  const password = payload.password;
  const companyName = payload.companyName?.trim();

  if (!email || !password || !companyName) {
    throw new RegisterError("email, password and companyName are required", 400);
  }

  const client = supabase();

  const { data: existingUser } = await client.auth.admin.getUserByEmail(email);
  if (existingUser) {
    throw new RegisterError("Пользователь с таким email уже существует", 409);
  }

  const { data: createdUser, error: createUserError } = await client.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (createUserError || !createdUser?.user) {
    console.error("Error creating auth user:", createUserError);
    throw new RegisterError("Не удалось создать пользователя", 500);
  }

  const { data: company, error: companyError } = await client
    .from("company")
    .insert({ name: companyName })
    .select("id")
    .single();

  if (companyError || !company) {
    console.error("Error creating company:", companyError);
    throw new RegisterError("Не удалось создать компанию", 500);
  }

  const { error: adminInsertError } = await client
    .from("admin_user")
    .insert({
      id: createdUser.user.id,
      company_id: company.id,
      role: "owner"
    });

  if (adminInsertError) {
    console.error("Error creating admin user:", adminInsertError);
    throw new RegisterError("Не удалось завершить регистрацию", 500);
  }

  return {
    userId: createdUser.user.id,
    companyId: company.id
  };
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "content-type": "application/json"
    }
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const pathname = url.pathname.replace(/^\/+|\/+$/g, "");
  const method = req.method.toUpperCase();

  try {
    if (pathname === "invite" && method === "POST") {
      const authHeader = req.headers.get("authorization") ?? "";
      const tokenMatch = authHeader.match(/Bearer\s+(.*)/i);
      const accessToken = tokenMatch ? tokenMatch[1] : undefined;

      if (!accessToken) {
        throw new InviteError("Unauthorized", 401);
      }

      const client = supabase();
      const { data: userData, error: userError } = await client.auth.getUser(accessToken);

      if (userError || !userData?.user) {
        throw new InviteError("Unauthorized", 401);
      }

      const adminId = userData.user.id;

      const body = (await req.json()) as CreateInviteRequest;

      const { data: adminRecord, error: adminError } = await client
        .from("admin_user")
        .select("company_id")
        .eq("id", adminId)
        .maybeSingle();

      if (adminError || !adminRecord?.company_id) {
        throw new InviteError("Недостаточно прав", 403);
      }

      const result = await createInvite({
        fullName: body.fullName,
        position: body.position,
        companyId: adminRecord.company_id,
        adminId
      });

      return jsonResponse({ success: true, data: result });
    }

    if (pathname === "register" && method === "POST") {
      const body = (await req.json()) as RegisterRequest;
      const result = await registerAdmin(body);
      return jsonResponse({ success: true, data: result }, 201);
    }

    return jsonResponse({ success: false, error: "Not Found" }, 404);
  } catch (error) {
    if (error instanceof InviteError || error instanceof RegisterError) {
      return jsonResponse({ success: false, error: error.message }, error.status);
    }

    console.error("Unexpected admin function error:", error);
    return jsonResponse({ success: false, error: "Internal Server Error" }, 500);
  }
});
