/*
  # Fix login audit logs RLS policy

  1. Security Changes
    - Add policy to allow anonymous users to insert login audit logs
    - This is necessary for logging failed login attempts and successful logins
    - Only allows INSERT operations for audit logging purposes

  2. Changes Made
    - Create policy for anonymous role to insert audit logs
    - Maintain existing admin view policy
*/

-- Allow anonymous users to insert login audit logs (for tracking login attempts)
CREATE POLICY "Allow anonymous to insert login audit logs"
  ON login_audit_logs
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated users to insert their own login audit logs
CREATE POLICY "Allow authenticated users to insert login audit logs"
  ON login_audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);