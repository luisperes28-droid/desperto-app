/*
  # Fix Authentication Functions

  ## Summary
  Restore the correct search_path configuration for authentication functions.
  
  ## Changes
  - Restore verify_password function with correct search_path TO 'public'
  - Restore create_user function with correct search_path TO 'public'
  
  ## Note
  The previous migration incorrectly set search_path = '' (empty string) which broke
  access to crypt() and gen_salt() functions. This restores the correct configuration.
*/

DROP FUNCTION IF EXISTS public.verify_password(uuid, text);
CREATE OR REPLACE FUNCTION public.verify_password(p_user_id uuid, p_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
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
  
  RETURN public.crypt(p_password, v_password_hash) = v_password_hash;
END;
$$;

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
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_password_hash text;
BEGIN
  v_password_hash := public.crypt(p_password, public.gen_salt('bf', 10));
  
  INSERT INTO public.users (email, password_hash, username, user_type, is_active)
  VALUES (p_email, v_password_hash, p_name, p_role::public.user_type, true)
  RETURNING id INTO v_user_id;
  
  RETURN v_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_password(uuid, text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.create_user(text, text, text, text) TO authenticated, anon;