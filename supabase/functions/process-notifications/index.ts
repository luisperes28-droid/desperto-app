import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log('🔄 Processing pending notifications...');

    // First, process pending reminders
    const { error: reminderError } = await supabase.rpc('process_pending_reminders');
    if (reminderError) {
      console.error('❌ Error processing reminders:', reminderError);
    } else {
      console.log('✅ Reminders processed successfully');
    }

    // Get pending notifications (limit to 50 at a time)
    const { data: notifications, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .lt('retry_count', 3)
      .order('scheduled_for', { ascending: true })
      .limit(50);

    if (fetchError) {
      throw fetchError;
    }

    if (!notifications || notifications.length === 0) {
      console.log('📭 No pending notifications to process');
      return new Response(
        JSON.stringify({ success: true, processed: 0 }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`📬 Found ${notifications.length} pending notifications`);

    const results = {
      sent: 0,
      failed: 0,
      skipped: 0
    };

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    for (const notification of notifications) {
      try {
        if (notification.type === 'email') {
          await processEmailNotification(notification, supabase);
          results.sent++;
          await delay(600);
        } else if (notification.type === 'sms') {
          await processSMSNotification(notification, supabase);
          results.sent++;
          await delay(200);
        } else {
          console.warn(`Unknown notification type: ${notification.type}`);
          results.skipped++;
        }
      } catch (error) {
        console.error(`Failed to process notification ${notification.id}:`, error);

        await supabase
          .from('notifications')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            retry_count: notification.retry_count + 1
          })
          .eq('id', notification.id);

        results.failed++;
        await delay(600);
      }
    }

    console.log('✅ Notifications processing complete:', results);

    return new Response(
      JSON.stringify({
        success: true,
        processed: notifications.length,
        results
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Process notifications error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function processEmailNotification(notification: any, supabase: any) {
  console.log(`📧 Sending email to ${notification.recipient_email}...`);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  // Call the send-email edge function
  const emailPayload = {
    to_email: notification.recipient_email,
    subject: notification.subject,
    message: notification.message,
    to_name: notification.recipient_email.split('@')[0]
  };

  const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseServiceKey}`
    },
    body: JSON.stringify(emailPayload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Send email function error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to send email');
  }

  // Update notification as sent
  await supabase
    .from('notifications')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString()
    })
    .eq('id', notification.id);

  console.log(`✅ Email sent successfully to ${notification.recipient_email}`);
}

async function processSMSNotification(notification: any, supabase: any) {
  console.log(`📱 Sending SMS to ${notification.recipient_phone}...`);

  // Check if Twilio credentials are configured
  const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

  if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
    console.warn('⚠️ Twilio not configured, marking SMS as sent (simulation mode)');

    // Mark as sent even in simulation mode
    await supabase
      .from('notifications')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        error_message: 'Simulated (Twilio not configured)'
      })
      .eq('id', notification.id);

    return;
  }

  // Send SMS via Twilio
  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;

  const formData = new URLSearchParams({
    From: twilioPhoneNumber,
    To: notification.recipient_phone,
    Body: notification.message
  });

  const response = await fetch(twilioUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: formData
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Twilio API error: ${response.status} - ${errorText}`);
  }

  // Update notification as sent
  await supabase
    .from('notifications')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString()
    })
    .eq('id', notification.id);

  console.log(`✅ SMS sent successfully to ${notification.recipient_phone}`);
}
