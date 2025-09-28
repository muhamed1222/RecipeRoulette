import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { getServiceClient } from "../_shared/supabase.ts";

serve(async (_req) => {
  try {
    console.log("Testing Supabase client initialization...");
    
    const client = getServiceClient();
    console.log("Supabase client initialized successfully");
    
    // Try a simple query
    const { data, error } = await client.from("company").select("id").limit(1);
    console.log("Query result:", { data, error });
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Supabase client is working",
      queryResult: { data, error }
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      }
    });
  } catch (error) {
    console.error("Error in test function:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      }
    });
  }
});