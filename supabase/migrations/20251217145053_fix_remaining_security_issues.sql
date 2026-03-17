/*
  # Fix Remaining Security and Performance Issues

  ## Summary
  This migration addresses additional security and performance issues:
  
  ## 1. Add Missing Foreign Key Indexes
  Adding indexes for foreign keys that were missing:
  - bookings.client_id
  - bookings.therapist_id
  - coupon_usages.coupon_id
  - coupon_usages.user_id
  - payments.booking_id
  - services.therapist_id
  - therapist_notes.client_id
  - therapist_notes.therapist_id

  ## 2. Remove Unused Indexes
  Cleaning up indexes that are not being used:
  - idx_bookings_service_id
  - idx_business_settings_updated_by
  - idx_coupon_usages_booking_id
  - idx_coupons_created_by
  - idx_password_reset_tokens_user_id
  - idx_security_questions_question_id

  ## 3. Consolidate Multiple Permissive Policies
  Combining multiple permissive policies into single policies with OR logic
  for better performance and clarity.

  ## 4. Fix Function Search Paths
  Ensuring all functions have immutable, secure search paths.
*/

-- =====================================================
-- SECTION 1: ADD MISSING FOREIGN KEY INDEXES
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
-- SECTION 2: REMOVE UNUSED INDEXES
-- =====================================================

DROP INDEX IF EXISTS public.idx_bookings_service_id;
DROP INDEX IF EXISTS public.idx_business_settings_updated_by;
DROP INDEX IF EXISTS public.idx_coupon_usages_booking_id;
DROP INDEX IF EXISTS public.idx_coupons_created_by;
DROP INDEX IF EXISTS public.idx_password_reset_tokens_user_id;
DROP INDEX IF EXISTS public.idx_security_questions_question_id;

-- =====================================================
-- SECTION 3: CONSOLIDATE RLS POLICIES - BOOKINGS
-- =====================================================

-- Drop existing multiple permissive policies
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Clients can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Therapists can view assigned bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can update all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Clients can update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can delete bookings" ON public.bookings;

-- Create consolidated policies with OR logic
CREATE POLICY "Users can view bookings"
  ON public.bookings
  FOR SELECT
  USING (
    -- Admins can view all
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (select auth.uid())
      AND users.user_type = 'admin'
    )
    OR
    -- Clients can view their own
    client_id = (select auth.uid())
    OR
    -- Therapists can view their assigned bookings
    therapist_id = (select auth.uid())
  );

CREATE POLICY "Users can update bookings"
  ON public.bookings
  FOR UPDATE
  USING (
    -- Admins can update all
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (select auth.uid())
      AND users.user_type = 'admin'
    )
    OR
    -- Clients can update their own
    client_id = (select auth.uid())
  )
  WITH CHECK (
    -- Admins can update all
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (select auth.uid())
      AND users.user_type = 'admin'
    )
    OR
    -- Clients can update their own
    client_id = (select auth.uid())
  );

CREATE POLICY "Admins can delete bookings"
  ON public.bookings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (select auth.uid())
      AND users.user_type = 'admin'
    )
  );

-- =====================================================
-- SECTION 4: CONSOLIDATE RLS POLICIES - BUSINESS_SETTINGS
-- =====================================================

-- Drop existing multiple permissive policies
DROP POLICY IF EXISTS "Admins can manage business settings" ON public.business_settings;
DROP POLICY IF EXISTS "Anyone can view business settings" ON public.business_settings;

-- Create consolidated policies
CREATE POLICY "Anyone can view business settings"
  ON public.business_settings
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage business settings"
  ON public.business_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (select auth.uid())
      AND users.user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (select auth.uid())
      AND users.user_type = 'admin'
    )
  );

-- =====================================================
-- SECTION 5: CONSOLIDATE RLS POLICIES - COUPON_USAGES
-- =====================================================

-- Drop existing multiple permissive policies
DROP POLICY IF EXISTS "Admins can view all coupon usages" ON public.coupon_usages;
DROP POLICY IF EXISTS "Users can view their coupon usages" ON public.coupon_usages;

-- Create consolidated policy
CREATE POLICY "Users can view coupon usages"
  ON public.coupon_usages
  FOR SELECT
  USING (
    -- Admins can view all
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (select auth.uid())
      AND users.user_type = 'admin'
    )
    OR
    -- Users can view their own
    user_id = (select auth.uid())
  );

-- =====================================================
-- SECTION 6: CONSOLIDATE RLS POLICIES - COUPONS
-- =====================================================

-- Drop existing multiple permissive policies
DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;

-- Create consolidated policies
CREATE POLICY "Anyone can view active coupons"
  ON public.coupons
  FOR SELECT
  USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));

CREATE POLICY "Admins can manage coupons"
  ON public.coupons
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (select auth.uid())
      AND users.user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (select auth.uid())
      AND users.user_type = 'admin'
    )
  );

-- =====================================================
-- SECTION 7: CONSOLIDATE RLS POLICIES - PAYMENTS
-- =====================================================

-- Drop existing multiple permissive policies
DROP POLICY IF EXISTS "Admins can manage all payments" ON public.payments;
DROP POLICY IF EXISTS "Users can view payments for their bookings" ON public.payments;
DROP POLICY IF EXISTS "System can create payments" ON public.payments;

-- Create consolidated policies
CREATE POLICY "Users can view payments"
  ON public.payments
  FOR SELECT
  USING (
    -- Admins can view all
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (select auth.uid())
      AND users.user_type = 'admin'
    )
    OR
    -- Users can view payments for their bookings
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = payments.booking_id
      AND bookings.client_id = (select auth.uid())
    )
  );

CREATE POLICY "System and admins can create payments"
  ON public.payments
  FOR INSERT
  WITH CHECK (
    -- Admins can create
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (select auth.uid())
      AND users.user_type = 'admin'
    )
    OR
    -- Allow system/service role to create (auth.uid() is null for service role)
    (select auth.uid()) IS NULL
  );

CREATE POLICY "Admins can update and delete payments"
  ON public.payments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (select auth.uid())
      AND users.user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (select auth.uid())
      AND users.user_type = 'admin'
    )
  );

-- =====================================================
-- SECTION 8: CONSOLIDATE RLS POLICIES - SERVICES
-- =====================================================

-- Drop existing multiple permissive policies
DROP POLICY IF EXISTS "Admins can manage all services" ON public.services;
DROP POLICY IF EXISTS "Therapists can manage their services" ON public.services;
DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;

-- Create consolidated policies
CREATE POLICY "Anyone can view active services"
  ON public.services
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins and therapists can manage services"
  ON public.services
  FOR ALL
  USING (
    -- Admins can manage all
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (select auth.uid())
      AND users.user_type = 'admin'
    )
    OR
    -- Therapists can manage their own
    (
      therapist_id = (select auth.uid())
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = (select auth.uid())
        AND users.user_type = 'therapist'
      )
    )
  )
  WITH CHECK (
    -- Admins can manage all
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (select auth.uid())
      AND users.user_type = 'admin'
    )
    OR
    -- Therapists can manage their own
    (
      therapist_id = (select auth.uid())
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = (select auth.uid())
        AND users.user_type = 'therapist'
      )
    )
  );

-- =====================================================
-- SECTION 9: CONSOLIDATE RLS POLICIES - THERAPIST_NOTES
-- =====================================================

-- Drop existing multiple permissive policies
DROP POLICY IF EXISTS "Admins can view all notes" ON public.therapist_notes;
DROP POLICY IF EXISTS "Therapists can manage their notes" ON public.therapist_notes;

-- Create consolidated policy
CREATE POLICY "Users can view and manage notes"
  ON public.therapist_notes
  FOR ALL
  USING (
    -- Admins can view all
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (select auth.uid())
      AND users.user_type = 'admin'
    )
    OR
    -- Therapists can manage their own notes
    therapist_id = (select auth.uid())
  )
  WITH CHECK (
    -- Admins can manage all
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (select auth.uid())
      AND users.user_type = 'admin'
    )
    OR
    -- Therapists can manage their own notes
    therapist_id = (select auth.uid())
  );

-- =====================================================
-- SECTION 10: FIX FUNCTION SEARCH PATHS
-- =====================================================

-- Recreate verify_password with proper search_path attribute
DROP FUNCTION IF EXISTS public.verify_password(uuid, text);
CREATE FUNCTION public.verify_password(p_user_id uuid, p_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
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
  
  RETURN crypt(p_password, v_password_hash) = v_password_hash;
END;
$$;

-- Recreate create_user with proper search_path attribute
DROP FUNCTION IF EXISTS public.create_user(text, text, text, text);
CREATE FUNCTION public.create_user(
  p_email text,
  p_password text,
  p_name text,
  p_role text DEFAULT 'client'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
VOLATILE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_password_hash text;
BEGIN
  v_password_hash := crypt(p_password, gen_salt('bf', 10));
  
  INSERT INTO public.users (email, password_hash, username, user_type, is_active)
  VALUES (p_email, v_password_hash, p_name, p_role::user_type, true)
  RETURNING id INTO v_user_id;
  
  RETURN v_user_id;
END;
$$;