/*
  # Fix Security and Performance Issues

  1. **Add Missing Foreign Key Indexes**
     - `bookings.service_id` - Add index for service lookups
     - `business_settings.updated_by` - Add index for audit queries
     - `coupon_usages.booking_id` - Add index for booking coupon lookups
     - `coupons.created_by` - Add index for creator lookups
     - `password_reset_tokens.user_id` - Add index for user token lookups
     - `security_questions.question_id` - Add index for question lookups

  2. **Optimize RLS Policies**
     - Fix `users` table policies to use `(select auth.uid())` instead of `auth.uid()`
     - Fix `user_profiles` table policy to use `(select auth.uid())`
     - This prevents re-evaluation of auth function for each row

  3. **Remove Unused Indexes**
     - Drop unused indexes that are not being used by queries
     - This improves write performance and reduces storage

  4. **Fix Function Security**
     - Set immutable search_path for `get_current_user_id` function
*/

-- =============================================================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- =============================================================================

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

-- =============================================================================
-- 2. OPTIMIZE RLS POLICIES
-- =============================================================================

-- Drop and recreate users table policies with optimized auth checks
DROP POLICY IF EXISTS "Prevent privilege escalation" ON public.users;
CREATE POLICY "Prevent privilege escalation"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    id = (SELECT public.get_current_user_id())
    AND user_type = (
      SELECT user_type FROM public.users WHERE id = (SELECT public.get_current_user_id())
    )
  );

DROP POLICY IF EXISTS "Users can update own account" ON public.users;
CREATE POLICY "Users can update own account"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (id = (SELECT public.get_current_user_id()))
  WITH CHECK (id = (SELECT public.get_current_user_id()));

-- Drop and recreate user_profiles policy with optimized auth check
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT public.get_current_user_id()))
  WITH CHECK (user_id = (SELECT public.get_current_user_id()));

-- =============================================================================
-- 3. REMOVE UNUSED INDEXES
-- =============================================================================

-- Drop unused indexes to improve write performance
DROP INDEX IF EXISTS public.idx_bookings_client_id_fk;
DROP INDEX IF EXISTS public.idx_bookings_therapist_id_fk;
DROP INDEX IF EXISTS public.idx_coupon_usages_coupon_id_fk;
DROP INDEX IF EXISTS public.idx_coupon_usages_user_id_fk;
DROP INDEX IF EXISTS public.idx_payments_booking_id_fk;
DROP INDEX IF EXISTS public.idx_services_therapist_id_fk;
DROP INDEX IF EXISTS public.idx_therapist_notes_client_id_fk;
DROP INDEX IF EXISTS public.idx_therapist_notes_therapist_id_fk;
DROP INDEX IF EXISTS public.idx_user_profiles_user_id_fk;

-- =============================================================================
-- 4. FIX FUNCTION SECURITY
-- =============================================================================

-- Recreate get_current_user_id with immutable search_path
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN COALESCE(
    current_setting('app.current_user_id', true)::uuid,
    NULL
  );
END;
$$;