/*
  # Replace auth.uid() with Custom Authentication System
  
  ## Problem
  All RLS policies are using Supabase Auth's auth.uid() function, which doesn't work
  with our custom authentication system. This causes all queries to fail.
  
  ## Solution
  Replace all auth.uid() references with current_setting('app.current_user_id', true)::uuid
  which uses our custom authentication context set via set_current_user()
  
  ## Tables Updated
  - bookings (3 policies)
  - business_settings (3 policies)
  - coupon_usages (1 policy)
  - coupons (4 policies)
  - password_reset_tokens (1 policy)
  - payments (4 policies)
  - security_questions (1 policy)
  - services (4 policies)
  - therapist_notes (1 policy)
  - two_factor_auth_settings (1 policy)
*/

-- Helper function to get current user ID
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT current_setting('app.current_user_id', true)::uuid;
$$;

-- BOOKINGS POLICIES
DROP POLICY IF EXISTS "Users can view bookings" ON bookings;
CREATE POLICY "Users can view bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = get_current_user_id() AND user_type = 'admin')
    OR client_id = get_current_user_id()
    OR therapist_id = get_current_user_id()
  );

DROP POLICY IF EXISTS "Users can update bookings" ON bookings;
CREATE POLICY "Users can update bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = get_current_user_id() AND user_type = 'admin')
    OR client_id = get_current_user_id()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = get_current_user_id() AND user_type = 'admin')
    OR client_id = get_current_user_id()
  );

DROP POLICY IF EXISTS "Admins can delete bookings" ON bookings;
CREATE POLICY "Admins can delete bookings"
  ON bookings FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = get_current_user_id() AND user_type = 'admin')
  );

-- BUSINESS_SETTINGS POLICIES
DROP POLICY IF EXISTS "business_settings_select_policy" ON business_settings;
CREATE POLICY "business_settings_select_policy"
  ON business_settings FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "business_settings_insert_policy" ON business_settings;
CREATE POLICY "business_settings_insert_policy"
  ON business_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = get_current_user_id() AND user_type = 'admin')
  );

DROP POLICY IF EXISTS "business_settings_update_policy" ON business_settings;
CREATE POLICY "business_settings_update_policy"
  ON business_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = get_current_user_id() AND user_type = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = get_current_user_id() AND user_type = 'admin')
  );

DROP POLICY IF EXISTS "business_settings_delete_policy" ON business_settings;
CREATE POLICY "business_settings_delete_policy"
  ON business_settings FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = get_current_user_id() AND user_type = 'admin')
  );

-- COUPON_USAGES POLICIES
DROP POLICY IF EXISTS "Users can view coupon usages" ON coupon_usages;
CREATE POLICY "Users can view coupon usages"
  ON coupon_usages FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = get_current_user_id() AND user_type = 'admin')
    OR user_id = get_current_user_id()
  );

-- COUPONS POLICIES
DROP POLICY IF EXISTS "coupons_select_policy" ON coupons;
CREATE POLICY "coupons_select_policy"
  ON coupons FOR SELECT
  TO authenticated
  USING (
    (is_active = true AND (valid_until IS NULL OR valid_until > now()))
    OR EXISTS (SELECT 1 FROM users WHERE id = get_current_user_id() AND user_type = 'admin')
  );

DROP POLICY IF EXISTS "coupons_insert_policy" ON coupons;
CREATE POLICY "coupons_insert_policy"
  ON coupons FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = get_current_user_id() AND user_type = 'admin')
  );

DROP POLICY IF EXISTS "coupons_update_policy" ON coupons;
CREATE POLICY "coupons_update_policy"
  ON coupons FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = get_current_user_id() AND user_type = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = get_current_user_id() AND user_type = 'admin')
  );

DROP POLICY IF EXISTS "coupons_delete_policy" ON coupons;
CREATE POLICY "coupons_delete_policy"
  ON coupons FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = get_current_user_id() AND user_type = 'admin')
  );

-- PASSWORD_RESET_TOKENS POLICIES
DROP POLICY IF EXISTS "Users can view their own tokens" ON password_reset_tokens;
CREATE POLICY "Users can view their own tokens"
  ON password_reset_tokens FOR SELECT
  TO authenticated
  USING (user_id = get_current_user_id());

-- PAYMENTS POLICIES
DROP POLICY IF EXISTS "payments_select_policy" ON payments;
CREATE POLICY "payments_select_policy"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = get_current_user_id() AND user_type = 'admin')
    OR EXISTS (SELECT 1 FROM bookings WHERE id = payments.booking_id AND client_id = get_current_user_id())
  );

DROP POLICY IF EXISTS "payments_insert_policy" ON payments;
CREATE POLICY "payments_insert_policy"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = get_current_user_id() AND user_type = 'admin')
    OR get_current_user_id() IS NULL
  );

DROP POLICY IF EXISTS "payments_update_policy" ON payments;
CREATE POLICY "payments_update_policy"
  ON payments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = get_current_user_id() AND user_type = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = get_current_user_id() AND user_type = 'admin')
  );

DROP POLICY IF EXISTS "payments_delete_policy" ON payments;
CREATE POLICY "payments_delete_policy"
  ON payments FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = get_current_user_id() AND user_type = 'admin')
  );

-- SECURITY_QUESTIONS POLICIES
DROP POLICY IF EXISTS "Users can manage their security questions" ON security_questions;
CREATE POLICY "Users can manage their security questions"
  ON security_questions FOR ALL
  TO authenticated
  USING (user_id = get_current_user_id())
  WITH CHECK (user_id = get_current_user_id());

-- SERVICES POLICIES
DROP POLICY IF EXISTS "services_select_policy" ON services;
CREATE POLICY "services_select_policy"
  ON services FOR SELECT
  TO authenticated
  USING (
    is_active = true
    OR EXISTS (SELECT 1 FROM users WHERE id = get_current_user_id() AND user_type = 'admin')
    OR (therapist_id = get_current_user_id() AND EXISTS (SELECT 1 FROM users WHERE id = get_current_user_id() AND user_type = 'therapist'))
  );

DROP POLICY IF EXISTS "services_insert_policy" ON services;
CREATE POLICY "services_insert_policy"
  ON services FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = get_current_user_id() AND user_type = 'admin')
    OR (therapist_id = get_current_user_id() AND EXISTS (SELECT 1 FROM users WHERE id = get_current_user_id() AND user_type = 'therapist'))
  );

DROP POLICY IF EXISTS "services_update_policy" ON services;
CREATE POLICY "services_update_policy"
  ON services FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = get_current_user_id() AND user_type = 'admin')
    OR (therapist_id = get_current_user_id() AND EXISTS (SELECT 1 FROM users WHERE id = get_current_user_id() AND user_type = 'therapist'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = get_current_user_id() AND user_type = 'admin')
    OR (therapist_id = get_current_user_id() AND EXISTS (SELECT 1 FROM users WHERE id = get_current_user_id() AND user_type = 'therapist'))
  );

DROP POLICY IF EXISTS "services_delete_policy" ON services;
CREATE POLICY "services_delete_policy"
  ON services FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = get_current_user_id() AND user_type = 'admin')
    OR (therapist_id = get_current_user_id() AND EXISTS (SELECT 1 FROM users WHERE id = get_current_user_id() AND user_type = 'therapist'))
  );

-- THERAPIST_NOTES POLICIES
DROP POLICY IF EXISTS "Users can view and manage notes" ON therapist_notes;
CREATE POLICY "Users can view and manage notes"
  ON therapist_notes FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = get_current_user_id() AND user_type = 'admin')
    OR therapist_id = get_current_user_id()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = get_current_user_id() AND user_type = 'admin')
    OR therapist_id = get_current_user_id()
  );

-- TWO_FACTOR_AUTH_SETTINGS POLICIES
DROP POLICY IF EXISTS "Users can manage their 2FA settings" ON two_factor_auth_settings;
CREATE POLICY "Users can manage their 2FA settings"
  ON two_factor_auth_settings FOR ALL
  TO authenticated
  USING (user_id = get_current_user_id())
  WITH CHECK (user_id = get_current_user_id());

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_current_user_id() TO authenticated, anon;
