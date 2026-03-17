/*
  # Grant Permissions on set_current_user Function

  1. Changes
    - Grant EXECUTE permissions on set_current_user function to authenticated users
    - Ensure function is accessible via Supabase RPC API for RLS context setting
    
  2. Security
    - Only authenticated users can call this function
    - Function is used to set user context for Row Level Security policies
*/

-- Grant execute permissions on set_current_user
GRANT EXECUTE ON FUNCTION set_current_user(uuid) TO authenticated;

-- Ensure function uses SECURITY DEFINER
ALTER FUNCTION set_current_user(uuid) SECURITY DEFINER;