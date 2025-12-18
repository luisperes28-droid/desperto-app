import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AuthRequest {
  action: 'login' | 'register'
  username: string
  email?: string
  password: string
  fullName?: string
  userType?: 'client' | 'therapist' | 'admin'
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

    const { action, username, email, password, fullName, userType }: AuthRequest = await req.json()

    if (action === 'login') {
      // Authenticate user
      const { data: authData, error: authError } = await supabase
        .rpc('authenticate_user', {
          username_input: username,
          password_input: password
        })

      if (authError || !authData || authData.length === 0) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid credentials' }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const user = authData[0]

      // Set user context for RLS
      await supabase.rpc('set_current_user', { user_id_input: user.user_id })

      return new Response(
        JSON.stringify({
          success: true,
          user: {
            id: user.user_id,
            username: user.username,
            email: user.email,
            userType: user.user_type,
            fullName: user.full_name
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (action === 'register') {
      if (!email || !fullName) {
        return new Response(
          JSON.stringify({ success: false, error: 'Email and full name are required' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Create new user
      const { data: userId, error: createError } = await supabase
        .rpc('create_user', {
          username_input: username,
          email_input: email,
          password_input: password,
          full_name_input: fullName,
          user_type_input: userType || 'client'
        })

      if (createError) {
        let errorMessage = 'Registration failed'
        if (createError.message.includes('duplicate key')) {
          errorMessage = 'Username or email already exists'
        } else if (createError.message.includes('Username must be')) {
          errorMessage = 'Username must be at least 3 characters long'
        } else if (createError.message.includes('Password must be')) {
          errorMessage = 'Password must be at least 6 characters long'
        }

        return new Response(
          JSON.stringify({ success: false, error: errorMessage }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Auto-login after registration
      const { data: authData, error: authError } = await supabase
        .rpc('authenticate_user', {
          username_input: username,
          password_input: password
        })

      if (authError || !authData || authData.length === 0) {
        return new Response(
          JSON.stringify({ success: false, error: 'Registration successful but login failed' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const user = authData[0]

      // Set user context for RLS
      await supabase.rpc('set_current_user', { user_id_input: user.user_id })

      return new Response(
        JSON.stringify({
          success: true,
          user: {
            id: user.user_id,
            username: user.username,
            email: user.email,
            userType: user.user_type,
            fullName: user.full_name
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Auth function error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})