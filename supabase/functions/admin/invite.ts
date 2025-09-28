import { getServiceClient } from "../_shared/supabase.ts";

console.log("ADMIN_INVITE_MODULE_INIT");

function supabase() {
  return getServiceClient();
}

const INVITE_CODE_LENGTH = 8;
const MAX_GENERATION_ATTEMPTS = 10;

export class InviteError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
    this.name = "InviteError";
  }
}

export interface CreateInviteRequest {
  fullName?: string;
  position?: string | null;
  companyId?: string;
  adminId?: string;
}

export interface CreateInviteResult {
  inviteId: string;
  code: string;
  deepLink: string | null;
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

export async function createInvite(payload: CreateInviteRequest): Promise<CreateInviteResult> {
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
