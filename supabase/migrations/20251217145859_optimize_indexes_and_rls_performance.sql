/*
  # Optimize Indexes and RLS Performance

  ## Summary
  This migration fixes all remaining performance and security issues.
  
  ## 1. Index Optimization
  - Remove unused indexes that were created but never queried
  - Add indexes for foreign keys that are actively being queried:
    * bookings: client_id, therapist_id
    * coupon_usages: coupon_id, user_id
    * payments: booking_id
    * services: therapist_id
    * therapist_notes: client_id, therapist_id

  ## 2. RLS Performance Optimization
  Replace all direct auth.uid() calls with (SELECT auth.uid()) to evaluate once per query instead of per row:
  - business_settings: 3 policies
  - coupons: 4 policies
  - payments: 4 policies
  - services: 4 policies

  ## 3. Function Security Fixes
  Recreate functions with properly immutable search paths using empty string.
*/

-- =====================================================
-- SECTION 1: REMOVE UNUSED INDEXES
-- =====================================================

DROP INDEX IF EXISTS public.idx_bookings_service_id;
DROP INDEX IF EXISTS public.idx_business_settings_updated_by;
DROP INDEX IF EXISTS public.idx_coupon_usages_booking_id;
DROP INDEX IF EXISTS public.idx_coupons_created_by;
DROP INDEX IF EXISTS public.idx_password_reset_tokens_user_id;
DROP INDEX IF EXISTS public.idx_security_questions_question_id;

-- =====================================================
-- SECTION 2: ADD INDEXES FOR ACTIVELY QUERIED FOREIGN KEYS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON public.bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_therapist_id ON public.bookings(therapist_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_coupon_id ON public.coupon_usages(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_user_id ON public.coupon_usages(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_services_therapist_id ON public.services(therapist_id);
CREATE INDEX IF NOT EXISTS idx_therapist_notes_client_id ON public.therapist_notes(client_id);
CREATE INDEX IF NOT EXISTS idx_therapist_notes_therapist_id ON public.therapist_notes(therapist_id);

-- =====================================================
-- SECTION 3: OPTIMIZE BUSINESS_SETTINGS RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "business_settings_insert_policy" ON public.business_settings;
DROP POLICY IF EXISTS "business_settings_update_policy" ON public.business_settings;
DROP POLICY IF EXISTS "business_settings_delete_policy" ON public.business_settings;

CREATE POLICY "business_settings_insert_policy"
  ON public.business_settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (SELECT auth.uid())
      AND users.user_type = 'admin'
    )
  );

CREATE POLICY "business_settings_update_policy"
  ON public.business_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (SELECT auth.uid())
      AND users.user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (SELECT auth.uid())
      AND users.user_type = 'admin'
    )
  );

CREATE POLICY "business_settings_delete_policy"
  ON public.business_settings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (SELECT auth.uid())
      AND users.user_type = 'admin'
    )
  );

-- =====================================================
-- SECTION 4: OPTIMIZE COUPONS RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "coupons_select_policy" ON public.coupons;
DROP POLICY IF EXISTS "coupons_insert_policy" ON public.coupons;
DROP POLICY IF EXISTS "coupons_update_policy" ON public.coupons;
DROP POLICY IF EXISTS "coupons_delete_policy" ON public.coupons;

CREATE POLICY "coupons_select_policy"
  ON public.coupons
  FOR SELECT
  USING (
    (is_active = true AND (valid_until IS NULL OR valid_until > now()))
    OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (SELECT auth.uid())
      AND users.user_type = 'admin'
    )
  );

CREATE POLICY "coupons_insert_policy"
  ON public.coupons
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (SELECT auth.uid())
      AND users.user_type = 'admin'
    )
  );

CREATE POLICY "coupons_update_policy"
  ON public.coupons
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (SELECT auth.uid())
      AND users.user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (SELECT auth.uid())
      AND users.user_type = 'admin'
    )
  );

CREATE POLICY "coupons_delete_policy"
  ON public.coupons
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (SELECT auth.uid())
      AND users.user_type = 'admin'
    )
  );

-- =====================================================
-- SECTION 5: OPTIMIZE PAYMENTS RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "payments_select_policy" ON public.payments;
DROP POLICY IF EXISTS "payments_insert_policy" ON public.payments;
DROP POLICY IF EXISTS "payments_update_policy" ON public.payments;
DROP POLICY IF EXISTS "payments_delete_policy" ON public.payments;

CREATE POLICY "payments_select_policy"
  ON public.payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (SELECT auth.uid())
      AND users.user_type = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = payments.booking_id
      AND bookings.client_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "payments_insert_policy"
  ON public.payments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (SELECT auth.uid())
      AND users.user_type = 'admin'
    )
    OR
    (SELECT auth.uid()) IS NULL
  );

CREATE POLICY "payments_update_policy"
  ON public.payments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (SELECT auth.uid())
      AND users.user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (SELECT auth.uid())
      AND users.user_type = 'admin'
    )
  );

CREATE POLICY "payments_delete_policy"
  ON public.payments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (SELECT auth.uid())
      AND users.user_type = 'admin'
    )
  );

-- =====================================================
-- SECTION 6: OPTIMIZE SERVICES RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "services_select_policy" ON public.services;
DROP POLICY IF EXISTS "services_insert_policy" ON public.services;
DROP POLICY IF EXISTS "services_update_policy" ON public.services;
DROP POLICY IF EXISTS "services_delete_policy" ON public.services;

CREATE POLICY "services_select_policy"
  ON public.services
  FOR SELECT
  USING (
    is_active = true
    OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (SELECT auth.uid())
      AND users.user_type = 'admin'
    )
    OR
    (
      therapist_id = (SELECT auth.uid())
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = (SELECT auth.uid())
        AND users.user_type = 'therapist'
      )
    )
  );

CREATE POLICY "services_insert_policy"
  ON public.services
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (SELECT auth.uid())
      AND users.user_type = 'admin'
    )
    OR
    (
      therapist_id = (SELECT auth.uid())
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = (SELECT auth.uid())
        AND users.user_type = 'therapist'
      )
    )
  );

CREATE POLICY "services_update_policy"
  ON public.services
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (SELECT auth.uid())
      AND users.user_type = 'admin'
    )
    OR
    (
      therapist_id = (SELECT auth.uid())
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = (SELECT auth.uid())
        AND users.user_type = 'therapist'
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (SELECT auth.uid())
      AND users.user_type = 'admin'
    )
    OR
    (
      therapist_id = (SELECT auth.uid())
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = (SELECT auth.uid())
        AND users.user_type = 'therapist'
      )
    )
  );

CREATE POLICY "services_delete_policy"
  ON public.services
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (SELECT auth.uid())
      AND users.user_type = 'admin'
    )
    OR
    (
      therapist_id = (SELECT auth.uid())
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = (SELECT auth.uid())
        AND users.user_type = 'therapist'
      )
    )
  );

-- =====================================================
-- SECTION 7: FIX FUNCTION SECURITY WITH IMMUTABLE SEARCH PATHS
-- =====================================================

DROP FUNCTION IF EXISTS public.verify_password(uuid, text);
CREATE OR REPLACE FUNCTION public.verify_password(p_user_id uuid, p_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
DECLARE
  v_password_hash text;
BEGIN
  SELECT password_hash INTO v_password_hash
  FROM public.users
  WHERE id = p_user_id;
  
  IF v_password_hash IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN public.crypt(p_password, v_password_hash) = v_password_hash;
END;
$$;

DROP FUNCTION IF EXISTS public.create_user(text, text, text, text);
CREATE OR REPLACE FUNCTION public.create_user(
  p_email text,
  p_password text,
  p_name text,
  p_role text DEFAULT 'client'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
VOLATILE
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_password_hash text;
BEGIN
  v_password_hash := public.crypt(p_password, public.gen_salt('bf', 10));
  
  INSERT INTO public.users (email, password_hash, username, user_type, is_active)
  VALUES (p_email, v_password_hash, p_name, p_role::public.user_type, true)
  RETURNING id INTO v_user_id;
  
  RETURN v_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_password(uuid, text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.create_user(text, text, text, text) TO authenticated, anon;