import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface BookingRequest {
  action: 'create' | 'update' | 'cancel' | 'list'
  bookingId?: string
  clientId?: string
  therapistId?: string
  serviceId?: string
  bookingDate?: string
  status?: string
  paymentStatus?: string
  notes?: string
}

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

    // Get user from authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const userId = authHeader.replace('Bearer ', '')
    
    // Set user context for RLS
    await supabase.rpc('set_current_user', { user_id_input: userId })

    if (req.method === 'GET') {
      // List bookings
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          *,
          client:users!client_id(username, email),
          therapist:users!therapist_id(username),
          service:services(name, duration, price),
          payments(*)
        `)
        .order('booking_date', { ascending: true })

      if (error) {
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ success: true, bookings }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (req.method === 'POST') {
      const { action, ...bookingData }: BookingRequest = await req.json()

      if (action === 'create') {
        // Create new booking
        const { data: booking, error } = await supabase
          .from('bookings')
          .insert({
            client_id: bookingData.clientId,
            therapist_id: bookingData.therapistId,
            service_id: bookingData.serviceId,
            booking_date: bookingData.bookingDate,
            status: bookingData.status || 'pending',
            payment_status: bookingData.paymentStatus || 'pending',
            notes: bookingData.notes
          })
          .select()
          .single()

        if (error) {
          return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        return new Response(
          JSON.stringify({ success: true, booking }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      if (action === 'update') {
        // Update existing booking
        const { data: booking, error } = await supabase
          .from('bookings')
          .update({
            status: bookingData.status,
            payment_status: bookingData.paymentStatus,
            notes: bookingData.notes,
            reschedule_request: bookingData.rescheduleRequest
          })
          .eq('id', bookingData.bookingId)
          .select()
          .single()

        if (error) {
          return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        return new Response(
          JSON.stringify({ success: true, booking }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      if (action === 'cancel') {
        // Cancel booking
        const { data: booking, error } = await supabase
          .from('bookings')
          .update({ status: 'cancelled' })
          .eq('id', bookingData.bookingId)
          .select()
          .single()

        if (error) {
          return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        return new Response(
          JSON.stringify({ success: true, booking }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid request' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Bookings function error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})