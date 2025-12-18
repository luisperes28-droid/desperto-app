/*
  # Fix All Remaining Security and Performance Issues

  ## Summary
  This migration comprehensively addresses all remaining security and performance issues.
  
  ## 1. Index Management
  - Remove unused indexes that were created but not utilized
  - Add indexes for foreign keys that are actually being queried:
    * bookings.service_id
    * business_settings.updated_by
    * coupon_usages.booking_id
    * coupons.created_by
    * password_reset_tokens.user_id
    * security_questions.question_id

  ## 2. Consolidate All Multiple Permissive Policies
  Replace overlapping policies with single, comprehensive policies:
  - business_settings: Merge admin and public read policies
  - coupons: Merge admin and public active coupon policies
  - payments: Consolidate insert and select policies
  - services: Merge admin/therapist and public policies

  ## 3. Fix Function Security
  Recreate functions with proper immutable search paths using explicit schema qualification.
*/

-- =====================================================
-- SECTION 1: REMOVE UNUSED INDEXES
-- =====================================================

DROP INDEX IF EXISTS public.idx_bookings_client_id;
DROP INDEX IF EXISTS public.idx_bookings_therapist_id;
DROP INDEX IF EXISTS public.idx_coupon_usages_coupon_id;
DROP INDEX IF EXISTS public.idx_coupon_usages_user_id;
DROP INDEX IF EXISTS public.idx_payments_booking_id;
DROP INDEX IF EXISTS public.idx_services_therapist_id;
DROP INDEX IF EXISTS public.idx_therapist_notes_client_id;
DROP INDEX IF EXISTS public.idx_therapist_notes_therapist_id;

-- =====================================================
-- SECTION 2: ADD INDEXES FOR ACTUALLY QUERIED FOREIGN KEYS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON public.bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_business_settings_updated_by ON public.business_settings(updated_by);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_booking_id ON public.coupon_usages(booking_id);
CREATE INDEX IF NOT EXISTS idx_coupons_created_by ON public.coupons(created_by);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON public.password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_security_questions_question_id ON public.security_questions(question_id);

-- =====================================================
-- SECTION 3: FIX BUSINESS_SETTINGS POLICIES
-- =====================================================

-- Drop the overlapping policies
DROP POLICY IF EXISTS "Anyone can view business settings" ON public.business_settings;
DROP POLICY IF EXISTS "Admins can manage business settings" ON public.business_settings;

-- Create single consolidated SELECT policy (anyone can read)
CREATE POLICY "business_settings_select_policy"
  ON public.business_settings
  FOR SELECT
  USING (true);

-- Create admin-only management policies
CREATE POLICY "business_settings_insert_policy"
  ON public.business_settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
  );

CREATE POLICY "business_settings_update_policy"
  ON public.business_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
  );

CREATE POLICY "business_settings_delete_policy"
  ON public.business_settings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
  );

-- =====================================================
-- SECTION 4: FIX COUPONS POLICIES
-- =====================================================

-- Drop the overlapping policies
DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;

-- Create single consolidated SELECT policy
CREATE POLICY "coupons_select_policy"
  ON public.coupons
  FOR SELECT
  USING (
    -- Anyone can view active, valid coupons
    (is_active = true AND (valid_until IS NULL OR valid_until > now()))
    OR
    -- Admins can view all coupons
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
  );

-- Create admin-only management policies
CREATE POLICY "coupons_insert_policy"
  ON public.coupons
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
  );

CREATE POLICY "coupons_update_policy"
  ON public.coupons
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
  );

CREATE POLICY "coupons_delete_policy"
  ON public.coupons
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
  );

-- =====================================================
-- SECTION 5: FIX PAYMENTS POLICIES
-- =====================================================

-- Drop the overlapping policies
DROP POLICY IF EXISTS "Users can view payments" ON public.payments;
DROP POLICY IF EXISTS "System and admins can create payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can update and delete payments" ON public.payments;

-- Create single consolidated SELECT policy
CREATE POLICY "payments_select_policy"
  ON public.payments
  FOR SELECT
  USING (
    -- Admins can view all
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
    OR
    -- Users can view payments for their bookings
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = payments.booking_id
      AND bookings.client_id = auth.uid()
    )
  );

-- Create single consolidated INSERT policy
CREATE POLICY "payments_insert_policy"
  ON public.payments
  FOR INSERT
  WITH CHECK (
    -- Admins can create
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
    OR
    -- Service role can create (auth.uid() is null)
    auth.uid() IS NULL
  );

-- Create admin-only update policy
CREATE POLICY "payments_update_policy"
  ON public.payments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
  );

-- Create admin-only delete policy
CREATE POLICY "payments_delete_policy"
  ON public.payments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
  );

-- =====================================================
-- SECTION 6: FIX SERVICES POLICIES
-- =====================================================

-- Drop the overlapping policies
DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;
DROP POLICY IF EXISTS "Admins and therapists can manage services" ON public.services;

-- Create single consolidated SELECT policy
CREATE POLICY "services_select_policy"
  ON public.services
  FOR SELECT
  USING (
    -- Anyone can view active services
    is_active = true
    OR
    -- Admins can view all
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
    OR
    -- Therapists can view their own services
    (
      therapist_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.user_type = 'therapist'
      )
    )
  );

-- Create management policy for insert
CREATE POLICY "services_insert_policy"
  ON public.services
  FOR INSERT
  WITH CHECK (
    -- Admins can create any service
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
    OR
    -- Therapists can create their own services
    (
      therapist_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.user_type = 'therapist'
      )
    )
  );

-- Create management policy for update
CREATE POLICY "services_update_policy"
  ON public.services
  FOR UPDATE
  USING (
    -- Admins can update any service
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
    OR
    -- Therapists can update their own services
    (
      therapist_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.user_type = 'therapist'
      )
    )
  )
  WITH CHECK (
    -- Admins can update any service
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
    OR
    -- Therapists can update their own services
    (
      therapist_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.user_type = 'therapist'
      )
    )
  );

-- Create management policy for delete
CREATE POLICY "services_delete_policy"
  ON public.services
  FOR DELETE
  USING (
    -- Admins can delete any service
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
    OR
    -- Therapists can delete their own services
    (
      therapist_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.user_type = 'therapist'
      )
    )
  );

-- =====================================================
-- SECTION 7: FIX FUNCTION SECURITY WITH IMMUTABLE SEARCH PATHS
-- =====================================================

-- Drop and recreate verify_password with secure, immutable search_path
DROP FUNCTION IF EXISTS public.verify_password(uuid, text);
CREATE OR REPLACE FUNCTION public.verify_password(p_user_id uuid, p_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
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

-- Drop and recreate create_user with secure, immutable search_path
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
SET search_path TO 'public'
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.verify_password(uuid, text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.create_user(text, text, text, text) TO authenticated, anon;