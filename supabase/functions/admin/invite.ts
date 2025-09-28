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

  console.log('Registering admin with payload:', { email, companyName });

  if (!email || !password || !companyName) {
    throw new RegisterError("email, password and companyName are required", 400);
  }

  const client = supabase();

  try {
    console.log('Creating auth user...');
    const { data: createdUser, error: createUserError } = await client.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (createUserError || !createdUser?.user) {
      console.error("Error creating auth user:", createUserError);
      const message = createUserError?.message ?? "Не удалось создать пользователя";
      const normalized = message.toLowerCase();
      if (
        normalized.includes("already been registered") ||
        normalized.includes("already registered") ||
        normalized.includes("duplicate")
      ) {
        throw new RegisterError("Пользователь с таким email уже существует", 409);
      }
      throw new RegisterError(message, 500);
    }

    const userId = createdUser.user.id;
    console.log('Created auth user with ID:', userId);

    console.log('Creating company...');
    const { data: company, error: companyError } = await client
      .from("company")
      .insert({ name: companyName })
      .select("id")
      .single();

    console.log('Create company result:', { company, companyError });

    if (companyError || !company) {
      console.error("Error creating company:", companyError);
      throw new RegisterError("Не удалось создать компанию", 500);
    }

    console.log('Created company:', company.id);

    console.log('Creating admin user...');
    const { error: adminInsertError } = await client
      .from("admin_user")
      .insert({
        id: userId,
        company_id: company.id,
        role: "owner"
      });

    console.log('Create admin user result:', { adminInsertError });

    if (adminInsertError) {
      console.error("Error creating admin user:", adminInsertError);
      throw new RegisterError("Не удалось завершить регистрацию", 500);
    }

    console.log('Registration completed successfully');
    return {
      userId: userId,
      companyId: company.id
    };
  } catch (error) {
    console.error("Unexpected error in registerAdmin:", error);
    throw error;
  }
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

  // Add a simple test endpoint
  const url = new URL(req.url);
  if (url.pathname.endsWith('/test')) {
    return new Response(JSON.stringify({ success: true, message: "Test endpoint working" }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "content-type": "application/json"
      }
    });
  }

  const pathname = url.pathname.replace(/^\/+|\/+$/g, "");
  const method = req.method.toUpperCase();
  const segments = pathname.split("/").filter(Boolean);
  const adminIndex = segments.lastIndexOf("admin");
  const subPathSegments = adminIndex >= 0 ? segments.slice(adminIndex + 1) : segments;
  const subPath = subPathSegments.join("/");

  try {
    if (!subPath) {
      return jsonResponse({
        success: true,
        info: "Admin function is live. Use /register or /invite endpoints."
      }, 200);
    }

    // Add a simple test for the register endpoint
    if (subPath === "register" && method === "POST") {
      console.log("Register endpoint called");
      // For debugging, return a simple response immediately
      // return jsonResponse({ success: true, message: "Register endpoint reached" }, 200);
      
      // Parse the request body
      let body: RegisterRequest;
      try {
        body = (await req.json()) as RegisterRequest;
        console.log("Request body:", body);
      } catch (parseError) {
        console.error("Error parsing request body:", parseError);
        return jsonResponse({ success: false, error: "Invalid JSON in request body" }, 400);
      }
      
      try {
        const result = await registerAdmin(body);
        return jsonResponse({ success: true, data: result }, 201);
      } catch (error) {
        console.error("Error in registerAdmin:", error);
        return jsonResponse({ success: false, error: error.message || "Internal Server Error" }, 500);
      }
    }

    if (subPath === "invite" && method === "POST") {
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

    return jsonResponse({ success: false, error: "Not Found" }, 404);
  } catch (error) {
    if (error instanceof InviteError || error instanceof RegisterError) {
      return jsonResponse({ success: false, error: error.message }, error.status);
    }

    console.error("Unexpected admin function error:", error);
    return jsonResponse({ success: false, error: "Internal Server Error" }, 500);
  }
});
