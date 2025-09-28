// Simplified Telegram Webhook Handler for testing
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

console.log("TG_SIMPLE_FUNCTION_INIT");

serve(async (req) => {
  try {
    console.log("TG_SIMPLE_FUNCTION_CALLED");
    
    // Log the incoming request
    const update = await req.json();
    console.log("Received update:", JSON.stringify(update, null, 2));
    
    // Return success response
    return new Response(
      JSON.stringify({ ok: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error in simple tg function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});