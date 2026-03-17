/*
  # Fix pgcrypto search_path for all authentication functions

  ## Summary
  The pgcrypto extension functions (crypt, gen_salt) are in the 'extensions' schema,
  not 'public'. All authentication functions need to include 'extensions' in their
  search_path to access these functions.

  ## Changes Made
  1. Update hash_password function with correct search_path
  2. Update verify_password function with correct search_path  
  3. Update create_user function with correct search_path
  4. Update authenticate_user function (already done but ensuring consistency)

  ## Security
  - All functions maintain SECURITY DEFINER for proper privilege elevation
  - search_path includes only trusted schemas: public, extensions, pg_temp
*/

-- Fix hash_password function
DROP FUNCTION IF EXISTS public.hash_password(text);
CREATE OR REPLACE FUNCTION public.hash_password(password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'pg_temp'
AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf', 10));
END;
$$;

GRANT EXECUTE ON FUNCTION public.hash_password(text) TO anon, authenticated;

-- Fix verify_password function
DROP FUNCTION IF EXISTS public.verify_password(uuid, text);
CREATE OR REPLACE FUNCTION public.verify_password(p_user_id uuid, p_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path TO 'public', 'extensions', 'pg_temp'
AS $$
DECLARE
  v_password_hash text;
BEGIN
  SELECT password_hash INTO v_password_hash
  FROM public.users
  WHERE id = p_user_id;
  
  IF v_password_hash IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN crypt(p_password, v_password_hash) = v_password_hash;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_password(uuid, text) TO authenticated, anon;

-- Fix create_user function
DROP FUNCTION IF EXISTS public.create_user(text, text, text, text);
CREATE OR REPLACE FUNCTION public.create_user(
  p_email text,
  p_password text,
  p_name text,
  p_role text DEFAULT 'client'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
VOLATILE
SET search_path TO 'public', 'extensions', 'pg_temp'
AS $$
DECLARE
  v_user_id uuid;
  v_password_hash text;
BEGIN
  v_password_hash := crypt(p_password, gen_salt('bf', 10));
  
  INSERT INTO public.users (email, password_hash, username, user_type, is_active)
  VALUES (p_email, v_password_hash, p_name, p_role::public.user_type, true)
  RETURNING id INTO v_user_id;
  
  RETURN v_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_user(text, text, text, text) TO authenticated, anon;

-- Ensure authenticate_user also has correct search_path (redundant but ensures consistency)
DROP FUNCTION IF EXISTS public.authenticate_user(text, text);
CREATE OR REPLACE FUNCTION public.authenticate_user(
  p_identifier text,
  p_password text
)
RETURNS TABLE(user_id uuid, user_type text, username text, email text, full_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'pg_temp'
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