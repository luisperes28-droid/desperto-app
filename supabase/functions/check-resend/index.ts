import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("VITE_RESEND_API_KEY") || Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: "VITE_RESEND_API_KEY not set" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const keyPreview = resendApiKey.substring(0, 8) + "..." + resendApiKey.substring(resendApiKey.length - 4);

    const domainsRes = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${resendApiKey}` },
    });
    const domainsData = await domainsRes.json();

    const apiKeysRes = await fetch("https://api.resend.com/api-keys", {
      headers: { Authorization: `Bearer ${resendApiKey}` },
    });
    const apiKeysData = await apiKeysRes.json();

    return new Response(
      JSON.stringify({
        key_preview: keyPreview,
        domains: domainsData,
        api_keys: apiKeysData,
      }, null, 2),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
