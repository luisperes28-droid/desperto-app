/*
  # Create get_secret RPC function

  1. New Functions
    - `get_secret(secret_name text)` - Reads a decrypted secret from the vault by name
  2. Security
    - Only accessible by service_role (used internally by edge functions)
*/

CREATE OR REPLACE FUNCTION get_secret(secret_name text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT decrypted_secret
  FROM vault.decrypted_secrets
  WHERE name = secret_name
  LIMIT 1;
$$;