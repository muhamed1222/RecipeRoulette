// Test function to check environment variables
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

console.log("TEST_ENV_VARS_INIT");

// Log all environment variables (masked for security)
for (const [key, value] of Object.entries(Deno.env.toObject())) {
  if (key.includes('KEY') || key.includes('TOKEN')) {
    console.log(`${key}: ********`);
  } else {
    console.log(`${key}: ${value}`);
  }
}

serve(async (_req) => {
  try {
    console.log("Test env vars function called");
    
    // Return the environment variables (masked for security)
    const envVars = {};
    for (const [key, value] of Object.entries(Deno.env.toObject())) {
      if (key.includes('KEY') || key.includes('TOKEN')) {
        envVars[key] = '********';
      } else {
        envVars[key] = value;
      }
    }
    
    return new Response(
      JSON.stringify({ 
        ok: true, 
        envVars: envVars
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