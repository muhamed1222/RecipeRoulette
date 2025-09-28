import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

let cachedClient: SupabaseClient | null = null;

export function getServiceClient(): SupabaseClient {
  if (cachedClient) {
    return cachedClient;
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
    Deno.env.get("SERVICE_ROLE_KEY");

  if (!supabaseUrl) {
    throw new Error("SUPABASE_URL is not set");
  }

  if (!serviceRoleKey) {
    throw new Error(
      "Service role key is not set. Provide SUPABASE_SERVICE_ROLE_KEY or SERVICE_ROLE_KEY secret.",
    );
  }

  cachedClient = createClient(supabaseUrl, serviceRoleKey);
  return cachedClient;
}
