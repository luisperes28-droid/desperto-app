/*
  # Grant Permissions on hash_password Function

  1. Changes
    - Grant EXECUTE permissions on hash_password function to anon and authenticated users
    - Ensure function is accessible via Supabase RPC API for user registration
    
  2. Security
    - Function uses bcrypt for secure password hashing
    - Safe to expose via RPC for user registration
*/

-- Grant execute permissions on hash_password
GRANT EXECUTE ON FUNCTION hash_password(text) TO anon;
GRANT EXECUTE ON FUNCTION hash_password(text) TO authenticated;

-- Ensure function uses SECURITY DEFINER
ALTER FUNCTION hash_password(text) SECURITY DEFINER;