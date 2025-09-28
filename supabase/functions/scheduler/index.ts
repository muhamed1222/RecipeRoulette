import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { tick } from "./tick.ts";

serve(async (_req) => {
  try {
    const result = await tick();
    return new Response(JSON.stringify({ ok: true, result }), {
      headers: { "content-type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ ok: false, error: message }), {
      headers: { "content-type": "application/json" },
      status: 500,
    });
  }
});
