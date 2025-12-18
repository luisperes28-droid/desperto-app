/*
  # Fix RPC Permissions for Authentication Functions

  1. Changes
    - Grant EXECUTE permissions on authenticate_user function to anon and authenticated users
    - Grant EXECUTE permissions on verify_password function to anon and authenticated users
    - Ensure functions are accessible via Supabase RPC API
    
  2. Security
    - Functions are read-only and don't expose sensitive data
    - Password verification happens server-side using bcrypt
    - Safe to expose via RPC for authentication purposes
*/

-- Grant execute permissions on authenticate_user
GRANT EXECUTE ON FUNCTION authenticate_user(text, text) TO anon;
GRANT EXECUTE ON FUNCTION authenticate_user(text, text) TO authenticated;

-- Grant execute permissions on verify_password
GRANT EXECUTE ON FUNCTION verify_password(text, text) TO anon;
GRANT EXECUTE ON FUNCTION verify_password(text, text) TO authenticated;

-- Ensure functions use SECURITY DEFINER if needed (for accessing users table)
ALTER FUNCTION authenticate_user(text, text) SECURITY DEFINER;
ALTER FUNCTION verify_password(text, text) SECURITY DEFINER;