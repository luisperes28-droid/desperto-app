import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EmailRequest {
  to_email: string;
  subject: string;
  message: string;
  to_name?: string;
}

const SITE_URL = "https://desperto.app";
const LOGO_URL = `${SITE_URL}/Logo_Desperto_qualidade.jpg`;
const GIF_URL = `${SITE_URL}/Criacao_de_Animacao_de_Logotipo_em_Loop.gif`;

async function getResendApiKey(): Promise<string> {
  const envKey = Deno.env.get("VITE_RESEND_API_KEY") || Deno.env.get("RESEND_API_KEY");
  if (envKey) return envKey;

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (supabaseUrl && serviceRoleKey) {
    try {
      const supabase = createClient(supabaseUrl, serviceRoleKey);
      const { data, error } = await supabase
        .rpc("get_secret", { secret_name: "VITE_RESEND_API_KEY" });
      if (!error && data) {
        const key = typeof data === "string" ? data : data[0]?.decrypted_secret;
        if (key) return key;
      }
    } catch (_) { /* fall through */ }
  }

  throw new Error("VITE_RESEND_API_KEY not configured");
}

function formatMessageToHtml(message: string): string {
  const lines = message.split('\n');
  let html = '';
  let inDetails = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === 'DETALHES DA MARCACAO:') {
      html += `<div style="background:#faf8f4;border-left:4px solid #c9a84c;border-radius:8px;padding:20px 24px;margin:24px 0;">`;
      html += `<h3 style="color:#1a1a1a;font-size:16px;font-weight:700;margin:0 0 16px 0;text-transform:uppercase;letter-spacing:1px;">Detalhes da Marcacao</h3>`;
      inDetails = true;
      continue;
    }

    if (trimmed === 'CONSULTA 100% ONLINE') {
      if (inDetails) {
        html += `</div>`;
        inDetails = false;
      }
      html += `<div style="background:#e8f4f0;border-left:4px solid #2d8a6e;border-radius:8px;padding:20px 24px;margin:24px 0;">`;
      html += `<h3 style="color:#1a1a1a;font-size:16px;font-weight:700;margin:0 0 12px 0;">Consulta 100% Online</h3>`;
      continue;
    }

    if (trimmed.startsWith('Antes da sessao:')) {
      html += `<p style="color:#555;font-size:14px;margin:12px 0 8px 0;font-weight:600;">Antes da sessao:</p>`;
      continue;
    }

    if (trimmed.startsWith('Se precisares de reagendar')) {
      html += `</div>`;
      html += `<p style="color:#666;font-size:13px;margin:20px 0 8px 0;">${trimmed}</p>`;
      continue;
    }

    if (trimmed.startsWith('Contacto:')) {
      html += `<p style="color:#666;font-size:13px;margin:4px 0;">Contacto: <a href="mailto:euestoudesperto@gmail.com" style="color:#c9a84c;text-decoration:none;">euestoudesperto@gmail.com</a></p>`;
      continue;
    }

    if (trimmed.startsWith('Com os melhores cumprimentos,')) {
      html += `<div style="margin-top:32px;padding-top:20px;border-top:1px solid #e5e5e5;">`;
      html += `<p style="color:#555;font-size:14px;margin:0;">Com os melhores cumprimentos,</p>`;
      continue;
    }

    if (trimmed === 'Equipa Desperto') {
      html += `<p style="color:#c9a84c;font-size:16px;font-weight:700;margin:4px 0 0 0;">Equipa Desperto</p>`;
      html += `</div>`;
      continue;
    }

    if (trimmed.startsWith('- ')) {
      html += `<p style="color:#555;font-size:14px;margin:4px 0 4px 12px;padding-left:8px;">&#8226; ${trimmed.substring(2)}</p>`;
      continue;
    }

    if (inDetails && trimmed.match(/^(Data|Hora|Terapeuta|Servico|Duracao|Valor|Pagamento):/)) {
      const [label, ...valueParts] = trimmed.split(':');
      const value = valueParts.join(':').trim();
      html += `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #ede9df;">`;
      html += `<span style="color:#888;font-size:14px;">${label}</span>`;
      html += `<span style="color:#1a1a1a;font-size:14px;font-weight:600;">${value}</span>`;
      html += `</div>`;
      continue;
    }

    if (trimmed.startsWith('Link da sessao')) {
      const url = trimmed.replace('Link da sessao (Google Meet): ', '');
      html += `<a href="${url}" style="display:inline-block;background:#c9a84c;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin:16px 0;">Entrar na Sessao</a>`;
      html += `<p style="color:#888;font-size:12px;margin:4px 0;">${url}</p>`;
      continue;
    }

    if (trimmed.startsWith('O link da sessao')) {
      html += `<p style="color:#2d8a6e;font-size:14px;margin:8px 0;font-style:italic;">${trimmed}</p>`;
      continue;
    }

    if (trimmed.startsWith('A tua sessao sera realizada')) {
      html += `<p style="color:#555;font-size:14px;margin:0 0 8px 0;">${trimmed}</p>`;
      continue;
    }

    if (trimmed.startsWith('Ola ')) {
      const name = trimmed.replace('Ola ', '').replace('!', '');
      html += `<h2 style="color:#1a1a1a;font-size:22px;font-weight:600;margin:0 0 8px 0;">Ola ${name}!</h2>`;
      continue;
    }

    if (trimmed === 'A tua marcacao foi confirmada com sucesso!') {
      html += `<p style="color:#2d8a6e;font-size:16px;font-weight:600;margin:0 0 16px 0;">A tua marcacao foi confirmada com sucesso!</p>`;
      continue;
    }

    if (trimmed === '') {
      continue;
    }

    html += `<p style="color:#555;font-size:14px;margin:8px 0;line-height:1.6;">${trimmed}</p>`;
  }

  if (inDetails) {
    html += `</div>`;
  }

  return html;
}

function buildHtmlEmail(emailData: EmailRequest): string {
  const formattedContent = formatMessageToHtml(emailData.message);

  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${emailData.subject || 'Desperto'}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f3ef;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f3ef;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding:0 0 24px 0;">
              <img src="${GIF_URL}" alt="Desperto" width="180" style="display:block;max-width:180px;height:auto;" />
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;box-shadow:0 2px 16px rgba(0,0,0,0.06);overflow:hidden;">

              <!-- Gold Accent Bar -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="height:4px;background:linear-gradient(90deg,#c9a84c,#e8d48b,#c9a84c);"></td>
                </tr>
              </table>

              <!-- Content -->
              <td style="padding:40px 36px;">
                ${formattedContent}
              </td>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:32px 16px 0;">
              <img src="${LOGO_URL}" alt="Desperto" width="120" style="display:block;max-width:120px;height:auto;margin-bottom:16px;" />
              <p style="color:#999;font-size:12px;margin:0 0 4px 0;">Desperto - Consultas Online</p>
              <p style="color:#999;font-size:12px;margin:0 0 4px 0;">
                <a href="mailto:euestoudesperto@gmail.com" style="color:#c9a84c;text-decoration:none;">euestoudesperto@gmail.com</a>
              </p>
              <p style="color:#bbb;font-size:11px;margin:16px 0 0 0;">Este email foi enviado automaticamente. Por favor nao responda diretamente.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const emailData: EmailRequest = await req.json();

    const resendApiKey = await getResendApiKey();
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const fromAddress = "Desperto <agendamentos@desperto.app>";
    const htmlBody = buildHtmlEmail(emailData);

    console.log(`Sending email from: ${fromAddress} to: ${emailData.to_email}`);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [emailData.to_email],
        subject: emailData.subject || 'Desperto - Notificacao',
        html: htmlBody,
      }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(`Resend API error: ${response.status} - ${JSON.stringify(responseData)}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        details: { to: emailData.to_email, id: responseData.id }
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
        error: error instanceof Error ? error.message : 'Internal server error',
        details: 'Failed to send email'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
