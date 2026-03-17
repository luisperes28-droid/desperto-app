import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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
    const { action, amount, phoneNumber, paymentId } = await req.json();

    const accountId = Deno.env.get("EASYPAY_ACCOUNT_ID");
    const apiKey = Deno.env.get("EASYPAY_API_KEY");
    const environment = Deno.env.get("EASYPAY_ENVIRONMENT") || "prod";

    const baseUrl = environment === "sandbox"
      ? "https://api.test.easypay.pt/2.0"
      : "https://api.prod.easypay.pt/2.0";

    console.log("Checking Easypay credentials...");
    console.log("Account ID present:", !!accountId);
    console.log("API Key present:", !!apiKey);
    console.log("Environment:", environment);
    console.log("Base URL:", baseUrl);

    if (!accountId || !apiKey) {
      const missingVars = [];
      if (!accountId) missingVars.push("EASYPAY_ACCOUNT_ID");
      if (!apiKey) missingVars.push("EASYPAY_API_KEY");

      return new Response(JSON.stringify({
        success: false,
        error: `Credenciais Easypay não configuradas. Faltam: ${missingVars.join(", ")}. Configure em: https://supabase.com/dashboard/project/dnswlrvleqvsueawxzfy/settings/vault/secrets`
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (action === "create") {
      const phone = phoneNumber.replace(/[^0-9]/g, "").slice(-9);

      console.log("Creating MB WAY payment");
      console.log("Amount:", amount);
      console.log("Phone:", "351" + phone);

      // CRITICAL: Use 'mbw' as method (not 'mbway')
      const body = JSON.stringify({
        type: "sale",
        method: "mbw",
        value: amount,
        currency: "EUR",
        customer: {
          phone: "351" + phone,
          phone_indicative: "351"
        },
        capture: {
          descriptive: "Desperto"
        }
      });

      console.log("Request body:", body);

      console.log("Request URL:", `${baseUrl}/single`);
      console.log("Request headers:", {
        "AccountId": accountId?.substring(0, 8) + "...",
        "ApiKey": apiKey?.substring(0, 8) + "...",
      });

      const response = await fetch(`${baseUrl}/single`, {
        method: "POST",
        headers: {
          "AccountId": accountId,
          "ApiKey": apiKey,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: body
      });

      const responseText = await response.text();
      console.log("Easypay response status:", response.status);
      console.log("Easypay response:", responseText);

      if (!response.ok) {
        throw new Error(responseText);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error("Non-JSON response: " + responseText);
      }

      return new Response(JSON.stringify({
        success: true,
        paymentId: data.id,
        phoneNumber: phoneNumber,
        qrCodeUrl: data.method?.url || null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (action === "check") {
      const response = await fetch(`${baseUrl}/single/${paymentId}`, {
        method: "GET",
        headers: {
          "AccountId": accountId,
          "ApiKey": apiKey,
          "Content-Type": "application/json"
        }
      });

      const responseText = await response.text();
      console.log("Easypay check response:", responseText);

      if (!response.ok) {
        throw new Error(responseText);
      }

      const data = JSON.parse(responseText);

      return new Response(JSON.stringify({
        success: true,
        paid: data.method?.status === "success" || data.status === "paid"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({
      error: "Unknown action"
    }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Fatal error:", error.message);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});