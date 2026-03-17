/*
  # Create login_audit_logs table

  1. New Tables
    - `login_audit_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable, references users)
      - `ip_address` (text, nullable)
      - `user_agent` (text, nullable)
      - `status` (text) - login attempt status (success, invalid_credentials, wrong_user_type, user_not_found)
      - `details` (jsonb, nullable) - additional context
      - `attempt_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `login_audit_logs` table
    - Add policy for authenticated users to read their own logs
    - Add policy for authenticated users to insert logs (for login tracking)

  3. Indexes
    - Index on user_id for fast lookups
    - Index on attempt_at for chronological queries
*/

CREATE TABLE IF NOT EXISTS login_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  ip_address text,
  user_agent text,
  status text NOT NULL DEFAULT '',
  details jsonb,
  attempt_at timestamptz DEFAULT now()
);

ALTER TABLE login_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own login logs"
  ON login_audit_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Allow insert login audit logs"
  ON login_audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_login_audit_logs_user_id'
  ) THEN
    CREATE INDEX idx_login_audit_logs_user_id ON login_audit_logs(user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_login_audit_logs_attempt_at'
  ) THEN
    CREATE INDEX idx_login_audit_logs_attempt_at ON login_audit_logs(attempt_at DESC);
  END IF;
END $$;
