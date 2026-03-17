/*
  # Fix login_audit_logs insert policy

  1. Changes
    - Allow anon role to insert login audit logs (login attempts happen before authentication)
    - Keep SELECT restricted to authenticated users viewing their own logs
*/

DROP POLICY IF EXISTS "Allow insert login audit logs" ON login_audit_logs;

CREATE POLICY "Allow insert login audit logs from anon"
  ON login_audit_logs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
