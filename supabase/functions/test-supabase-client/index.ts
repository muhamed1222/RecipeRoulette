// Test function to check Supabase client initialization
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getServiceClient } from "../_shared/supabase.ts";

console.log("TEST_SUPABASE_CLIENT_INIT");

try {
  console.log("Attempting to initialize Supabase client...");
  const supabase = getServiceClient();
  console.log("Supabase client initialized successfully");
} catch (error) {
  console.error("Error initializing Supabase client:", error);
}

serve(async (_req) => {
  try {
    console.log("Test supabase client function called");
    return new Response(
      JSON.stringify({ 
        ok: true, 
        message: "Test function working" 
      }),
      {
        status: 200,
        headers: { 
          "Content-Type": "application/json" 
        },
      },
    );
  } catch (error) {
    console.error("Error in test function:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        message: error.message
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json" 
        },
      },
    );
  }
});