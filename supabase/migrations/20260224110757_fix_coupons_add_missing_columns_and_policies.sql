/*
  # Fix Coupons Table - Add Missing Columns and Update Policies

  1. Modified Tables
    - `coupons`
      - Added `service_id` (uuid, nullable) - links coupon to a specific service
      - Added `client_id` (uuid, nullable) - links coupon to a specific client
      - Added `description` (text, nullable) - coupon description
      - Added `status` (text, default 'active') - coupon status: active, used, expired, cancelled

  2. Security Changes
    - Updated RLS policies for `coupons` to allow anon role SELECT on active coupons
    - Updated RLS policies for `coupon_usages` to allow anon role INSERT
    - Allow therapists to create/manage coupons (not just admins)

  3. Important Notes
    - The `is_active` column is kept for backward compatibility
    - The new `status` column provides more granular state tracking
    - Anon users need SELECT on coupons to validate during booking
    - Anon users need INSERT on coupon_usages to record usage during booking
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coupons' AND column_name = 'service_id'
  ) THEN
    ALTER TABLE coupons ADD COLUMN service_id uuid REFERENCES services(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coupons' AND column_name = 'client_id'
  ) THEN
    ALTER TABLE coupons ADD COLUMN client_id uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coupons' AND column_name = 'description'
  ) THEN
    ALTER TABLE coupons ADD COLUMN description text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coupons' AND column_name = 'status'
  ) THEN
    ALTER TABLE coupons ADD COLUMN status text DEFAULT 'active';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_coupons_status ON coupons(status);
CREATE INDEX IF NOT EXISTS idx_coupons_service_id ON coupons(service_id);
CREATE INDEX IF NOT EXISTS idx_coupons_client_id ON coupons(client_id);

DROP POLICY IF EXISTS coupons_select_policy ON coupons;
DROP POLICY IF EXISTS coupons_insert_policy ON coupons;
DROP POLICY IF EXISTS coupons_update_policy ON coupons;
DROP POLICY IF EXISTS coupons_delete_policy ON coupons;

CREATE POLICY "coupons_select_active"
  ON coupons FOR SELECT
  USING (
    (status = 'active' AND is_active = true AND (valid_until IS NULL OR valid_until > now()))
    OR
    (EXISTS (
      SELECT 1 FROM users
      WHERE users.id = get_current_user_id()
      AND users.user_type IN ('admin', 'therapist')
    ))
  );

CREATE POLICY "coupons_insert_staff"
  ON coupons FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = get_current_user_id()
      AND users.user_type IN ('admin', 'therapist')
    )
  );

CREATE POLICY "coupons_update_staff"
  ON coupons FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = get_current_user_id()
      AND users.user_type IN ('admin', 'therapist')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = get_current_user_id()
      AND users.user_type IN ('admin', 'therapist')
    )
  );

CREATE POLICY "coupons_delete_admin"
  ON coupons FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = get_current_user_id()
      AND users.user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can view their coupon usages" ON coupon_usages;
DROP POLICY IF EXISTS "System can create coupon usages" ON coupon_usages;

CREATE POLICY "coupon_usages_select_own"
  ON coupon_usages FOR SELECT
  USING (
    user_id = get_current_user_id()
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = get_current_user_id()
      AND users.user_type IN ('admin', 'therapist')
    )
  );

CREATE POLICY "coupon_usages_insert_any"
  ON coupon_usages FOR INSERT
  WITH CHECK (true);
