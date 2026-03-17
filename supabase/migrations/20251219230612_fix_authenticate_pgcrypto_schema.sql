/*
  # Fix authenticate_user to use correct pgcrypto schema

  1. Changes
    - Update search_path to include 'extensions' schema where pgcrypto is installed
    - Fix crypt() function calls to use proper schema

  2. Security
    - Maintains SECURITY DEFINER
    - Password verification with extensions.crypt()
*/

DROP FUNCTION IF EXISTS public.authenticate_user(text, text);

CREATE OR REPLACE FUNCTION public.authenticate_user(
  p_identifier text,
  p_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'pg_temp'
AS $$
DECLARE
  v_user record;
BEGIN
  -- Find user by email or username
  SELECT
    u.id,
    u.user_type,
    u.username,
    u.email,
    u.password_hash,
    u.is_active,
    COALESCE(up.full_name, u.username) as full_name
  INTO v_user
  FROM public.users u
  LEFT JOIN public.user_profiles up ON u.id = up.user_id
  WHERE (u.email = p_identifier OR u.username = p_identifier)
  LIMIT 1;

  -- Check if user exists
  IF v_user.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Credenciais incorretas'
    );
  END IF;

  -- Check if user is active
  IF v_user.is_active = false THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Conta desativada'
    );
  END IF;

  -- Verify password with bcrypt
  IF v_user.password_hash = extensions.crypt(p_password, v_user.password_hash) THEN
    -- Password correct
    RETURN jsonb_build_object(
      'success', true,
      'user', jsonb_build_object(
        'id', v_user.id,
        'user_type', v_user.user_type,
        'username', v_user.username,
        'email', v_user.email,
        'full_name', v_user.full_name
      )
    );
  ELSE
    -- Password incorrect
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Credenciais incorretas'
    );
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.authenticate_user(text, text) TO authenticated, anon;
