import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

    return new Response(
      JSON.stringify({
        success: true,
        secrets: {
          RESEND_API_KEY: resendKey ? `exists (length: ${resendKey.length}, starts: ${resendKey.substring(0, 7)}...)` : 'NOT FOUND',
          SUPABASE_URL: supabaseUrl ? `exists (${supabaseUrl})` : 'NOT FOUND',
          SUPABASE_SERVICE_ROLE_KEY: supabaseKey ? `exists (length: ${supabaseKey.length})` : 'NOT FOUND',
          TWILIO_ACCOUNT_SID: twilioSid ? `exists (length: ${twilioSid.length}, value: ${twilioSid})` : 'NOT FOUND',
          TWILIO_AUTH_TOKEN: twilioToken ? `exists (length: ${twilioToken.length}, starts: ${twilioToken.substring(0, 8)}...)` : 'NOT FOUND',
          TWILIO_PHONE_NUMBER: twilioPhone ? `exists (value: ${twilioPhone})` : 'NOT FOUND',
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
