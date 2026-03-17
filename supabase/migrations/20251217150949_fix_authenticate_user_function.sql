/*
  # Fix authenticate_user function to accept email OR username

  ## Summary
  The authenticate_user function was only checking email, but users may login with username.
  This migration updates the function to accept both email and username.
  
  ## Changes
  - Drop existing authenticate_user function
  - Create new version that checks both email AND username
  - Maintain the same return structure
*/

DROP FUNCTION IF EXISTS public.authenticate_user(text, text);

CREATE OR REPLACE FUNCTION public.authenticate_user(
  p_identifier text,
  p_password text
)
RETURNS TABLE(user_id uuid, user_type text, username text, email text, full_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.user_type::text,
    u.username,
    u.email,
    COALESCE(up.full_name, u.username) as full_name
  FROM public.users u
  LEFT JOIN public.user_profiles up ON u.id = up.user_id
  WHERE (u.email = p_identifier OR u.username = p_identifier)
    AND u.password_hash = crypt(p_password, u.password_hash)
    AND u.is_active = true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.authenticate_user(text, text) TO authenticated, anon;