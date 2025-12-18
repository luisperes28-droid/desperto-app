/*
  # Security and Performance Optimization

  ## Summary
  This migration fixes multiple security and performance issues identified by Supabase:
  
  ## 1. Foreign Key Indexes
  Adding missing indexes on foreign key columns to improve query performance:
  - bookings.service_id
  - business_settings.updated_by
  - coupon_usages.booking_id
  - coupons.created_by
  - password_reset_tokens.user_id
  - security_questions.question_id

  ## 2. RLS Policy Optimization
  Optimizing all RLS policies to use `(select auth.uid())` pattern instead of `auth.uid()`
  to prevent re-evaluation for each row, improving performance at scale.
  
  ## 3. Index Cleanup
  Removing unused indexes that consume storage without providing query benefits.
  
  ## 4. Function Security
  Setting secure search_path for all functions to prevent search_path injection attacks.
*/

-- =====================================================
-- SECTION 1: ADD MISSING FOREIGN KEY INDEXES
-- =====================================================

-- Add index for bookings.service_id
CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON public.bookings(service_id);

-- Add index for business_settings.updated_by
CREATE INDEX IF NOT EXISTS idx_business_settings_updated_by ON public.business_settings(updated_by);

-- Add index for coupon_usages.booking_id
CREATE INDEX IF NOT EXISTS idx_coupon_usages_booking_id ON public.coupon_usages(booking_id);

-- Add index for coupons.created_by
CREATE INDEX IF NOT EXISTS idx_coupons_created_by ON public.coupons(created_by);

-- Add index for password_reset_tokens.user_id
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON public.password_reset_tokens(user_id);

-- Add index for security_questions.question_id
CREATE INDEX IF NOT EXISTS idx_security_questions_question_id ON public.security_questions(question_id);

-- =====================================================
-- SECTION 2: REMOVE UNUSED INDEXES
-- =====================================================

DROP INDEX IF EXISTS public.idx_users_type;
DROP INDEX IF EXISTS public.idx_services_therapist;
DROP INDEX IF EXISTS public.idx_services_active;
DROP INDEX IF EXISTS public.idx_bookings_client;
DROP INDEX IF EXISTS public.idx_bookings_therapist;
DROP INDEX IF EXISTS public.idx_bookings_date;
DROP INDEX IF EXISTS public.idx_bookings_status;
DROP INDEX IF EXISTS public.idx_payments_booking;
DROP INDEX IF EXISTS public.idx_therapist_notes_therapist;
DROP INDEX IF EXISTS public.idx_therapist_notes_client;
DROP INDEX IF EXISTS public.idx_coupons_code;
DROP INDEX IF EXISTS public.idx_coupon_usages_coupon;
DROP INDEX IF EXISTS public.idx_coupon_usages_user;

-- =====================================================
-- SECTION 3: FIX RLS POLICIES - SERVICES TABLE
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage all services" ON public.services;
DROP POLICY IF EXISTS "Therapists can manage their services" ON public.services;

-- Recreate with optimized auth calls
CREATE POLICY "Admins can manage all services"
  ON public.services
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

CREATE POLICY "Therapists can manage their services"
  ON public.services
  FOR ALL
  USING (
    therapist_id = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (select auth.uid())
      AND users.user_type = 'therapist'
    )
  )
  WITH CHECK (
    therapist_id = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (select auth.uid())
      AND users.user_type = 'therapist'
    )
  );

-- =====================================================
-- SECTION 4: FIX RLS POLICIES - BOOKINGS TABLE
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can update all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can delete bookings" ON public.bookings;
DROP POLICY IF EXISTS "Clients can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Clients can update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Therapists can view assigned bookings" ON public.bookings;

-- Recreate with optimized auth calls
CREATE POLICY "Admins can view all bookings"
  ON public.bookings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (select auth.uid())
      AND users.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can update all bookings"
  ON public.bookings
  FOR UPDATE
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

CREATE POLICY "Clients can view own bookings"
  ON public.bookings
  FOR SELECT
  USING (client_id = (select auth.uid()));

CREATE POLICY "Clients can update own bookings"
  ON public.bookings
  FOR UPDATE
  USING (client_id = (select auth.uid()))
  WITH CHECK (client_id = (select auth.uid()));

CREATE POLICY "Therapists can view assigned bookings"
  ON public.bookings
  FOR SELECT
  USING (therapist_id = (select auth.uid()));

-- =====================================================
-- SECTION 5: FIX RLS POLICIES - PAYMENTS TABLE
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage all payments" ON public.payments;
DROP POLICY IF EXISTS "Users can view payments for their bookings" ON public.payments;

-- Recreate with optimized auth calls
CREATE POLICY "Admins can manage all payments"
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

CREATE POLICY "Users can view payments for their bookings"
  ON public.payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = payments.booking_id
      AND bookings.client_id = (select auth.uid())
    )
  );

-- =====================================================
-- SECTION 6: FIX RLS POLICIES - THERAPIST_NOTES TABLE
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all notes" ON public.therapist_notes;
DROP POLICY IF EXISTS "Therapists can manage their notes" ON public.therapist_notes;

-- Recreate with optimized auth calls
CREATE POLICY "Admins can view all notes"
  ON public.therapist_notes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (select auth.uid())
      AND users.user_type = 'admin'
    )
  );

CREATE POLICY "Therapists can manage their notes"
  ON public.therapist_notes
  FOR ALL
  USING (therapist_id = (select auth.uid()))
  WITH CHECK (therapist_id = (select auth.uid()));

-- =====================================================
-- SECTION 7: FIX RLS POLICIES - BUSINESS_SETTINGS TABLE
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage business settings" ON public.business_settings;

-- Recreate with optimized auth calls
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
-- SECTION 8: FIX RLS POLICIES - COUPONS TABLE
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;

-- Recreate with optimized auth calls
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
-- SECTION 9: FIX RLS POLICIES - COUPON_USAGES TABLE
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all coupon usages" ON public.coupon_usages;
DROP POLICY IF EXISTS "Users can view their coupon usages" ON public.coupon_usages;

-- Recreate with optimized auth calls
CREATE POLICY "Admins can view all coupon usages"
  ON public.coupon_usages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (select auth.uid())
      AND users.user_type = 'admin'
    )
  );

CREATE POLICY "Users can view their coupon usages"
  ON public.coupon_usages
  FOR SELECT
  USING (user_id = (select auth.uid()));

-- =====================================================
-- SECTION 10: FIX RLS POLICIES - PASSWORD_RESET_TOKENS TABLE
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own tokens" ON public.password_reset_tokens;

-- Recreate with optimized auth calls
CREATE POLICY "Users can view their own tokens"
  ON public.password_reset_tokens
  FOR SELECT
  USING (user_id = (select auth.uid()));

-- =====================================================
-- SECTION 11: FIX RLS POLICIES - TWO_FACTOR_AUTH_SETTINGS TABLE
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their 2FA settings" ON public.two_factor_auth_settings;

-- Recreate with optimized auth calls
CREATE POLICY "Users can manage their 2FA settings"
  ON public.two_factor_auth_settings
  FOR ALL
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- =====================================================
-- SECTION 12: FIX RLS POLICIES - SECURITY_QUESTIONS TABLE
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their security questions" ON public.security_questions;

-- Recreate with optimized auth calls
CREATE POLICY "Users can manage their security questions"
  ON public.security_questions
  FOR ALL
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- =====================================================
-- SECTION 13: FIX FUNCTION SECURITY - SET SEARCH_PATH
-- =====================================================

-- Drop existing functions
DROP FUNCTION IF EXISTS public.authenticate_user(text, text);
DROP FUNCTION IF EXISTS public.verify_password(uuid, text);
DROP FUNCTION IF EXISTS public.hash_password(text);
DROP FUNCTION IF EXISTS public.create_user(text, text, text, text);
DROP FUNCTION IF EXISTS public.set_current_user(uuid);

-- Recreate authenticate_user function with secure search_path
CREATE FUNCTION public.authenticate_user(p_email text, p_password text)
RETURNS TABLE(user_id uuid, user_role text, user_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.user_type::text,
    u.username
  FROM public.users u
  WHERE u.email = p_email
    AND u.password_hash = crypt(p_password, u.password_hash)
    AND u.is_active = true;
END;
$$;

-- Recreate verify_password function with secure search_path
CREATE FUNCTION public.verify_password(p_user_id uuid, p_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Recreate hash_password function with secure search_path
CREATE FUNCTION public.hash_password(password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf', 10));
END;
$$;

-- Recreate create_user function with secure search_path
CREATE FUNCTION public.create_user(
  p_email text,
  p_password text,
  p_name text,
  p_role text DEFAULT 'client'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Recreate set_current_user function with secure search_path
CREATE FUNCTION public.set_current_user(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id::text, false);
END;
$$;

-- Fix update_updated_at_column trigger function with secure search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;