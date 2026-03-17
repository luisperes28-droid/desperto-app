/*
  # Fix set_current_user Function Parameter Name
  
  ## Changes
  
  1. Drop and recreate set_current_user function with correct parameter name
     - Changes parameter from `user_id_input` to `user_id` to match latest standard
     - Maintains SECURITY DEFINER and stable search_path for security
     - Uses transaction-local setting (third parameter = true)
  
  ## Security
  
  - Function remains SECURITY DEFINER to allow setting session variables
  - Search path is explicitly set to prevent search path attacks
  - Only sets a session variable, does not modify data
*/

-- Drop existing function (all variants)
DROP FUNCTION IF EXISTS public.set_current_user(uuid);

-- Recreate with correct parameter name
CREATE FUNCTION public.set_current_user(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id::text, true);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.set_current_user(uuid) TO anon, authenticated;
