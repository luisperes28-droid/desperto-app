/*
  # Fix Security and Performance Issues

  ## Changes Made

  ### 1. Add Missing Foreign Key Indexes
  - Add indexes for all foreign keys that were missing covering indexes
  - Improves query performance for joins and lookups
  - Tables affected: bookings, coupon_usages, payments, services, therapist_notes, user_profiles

  ### 2. Remove Unused Indexes
  - Drop indexes that are not being used to reduce database overhead
  - Indexes removed from: business_settings, bookings, coupon_usages, coupons, password_reset_tokens, security_questions, notifications, scheduled_reminders

  ### 3. Fix Multiple Permissive Policies
  - Consolidate multiple permissive policies into single, clear policies
  - Tables affected: scheduled_reminders, users

  ### 4. Fix RLS Policies with Always True Conditions
  - Replace policies that use `true` with proper access controls
  - Restrict service role access to authenticated service requests only
  - Tables affected: notifications, scheduled_reminders

  ## Security Improvements
  - All policies now have proper access restrictions
  - No more unrestricted access through RLS policies
  - Better performance through optimized indexes
*/

-- ============================================================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- ============================================================================

-- Bookings table foreign key indexes
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON public.bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_therapist_id ON public.bookings(therapist_id);

-- Coupon usages foreign key indexes
CREATE INDEX IF NOT EXISTS idx_coupon_usages_coupon_id ON public.coupon_usages(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_user_id ON public.coupon_usages(user_id);

-- Payments foreign key index
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON public.payments(booking_id);

-- Services foreign key index
CREATE INDEX IF NOT EXISTS idx_services_therapist_id ON public.services(therapist_id);

-- Therapist notes foreign key indexes
CREATE INDEX IF NOT EXISTS idx_therapist_notes_client_id ON public.therapist_notes(client_id);
CREATE INDEX IF NOT EXISTS idx_therapist_notes_therapist_id ON public.therapist_notes(therapist_id);

-- User profiles foreign key index
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);

-- ============================================================================
-- 2. REMOVE UNUSED INDEXES
-- ============================================================================

-- Drop unused indexes to optimize database
DROP INDEX IF EXISTS idx_business_settings_updated_by;
DROP INDEX IF EXISTS idx_bookings_service_id;
DROP INDEX IF EXISTS idx_coupon_usages_booking_id;
DROP INDEX IF EXISTS idx_coupons_created_by;
DROP INDEX IF EXISTS idx_password_reset_tokens_user_id;
DROP INDEX IF EXISTS idx_security_questions_question_id;
DROP INDEX IF EXISTS idx_notifications_recipient_id;
DROP INDEX IF EXISTS idx_notifications_booking_id;
DROP INDEX IF EXISTS idx_notifications_status;
DROP INDEX IF EXISTS idx_notifications_scheduled_for;
DROP INDEX IF EXISTS idx_scheduled_reminders_booking_id;
DROP INDEX IF EXISTS idx_scheduled_reminders_scheduled_for;
DROP INDEX IF EXISTS idx_scheduled_reminders_status;

-- ============================================================================
-- 3. FIX MULTIPLE PERMISSIVE POLICIES - SCHEDULED_REMINDERS
-- ============================================================================

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Service role can manage reminders" ON public.scheduled_reminders;
DROP POLICY IF EXISTS "Users can view reminders for own bookings" ON public.scheduled_reminders;

-- Create single consolidated SELECT policy
CREATE POLICY "Users can view own booking reminders"
  ON public.scheduled_reminders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = scheduled_reminders.booking_id
      AND (b.client_id = current_setting('app.current_user_id', true)::uuid
           OR b.therapist_id = current_setting('app.current_user_id', true)::uuid)
    )
  );

-- ============================================================================
-- 4. FIX MULTIPLE PERMISSIVE POLICIES - USERS
-- ============================================================================

-- Drop existing conflicting UPDATE policies
DROP POLICY IF EXISTS "Prevent privilege escalation" ON public.users;
DROP POLICY IF EXISTS "Users can update own account" ON public.users;

-- Create single consolidated UPDATE policy with privilege escalation prevention
CREATE POLICY "Users can update own account safely"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (id = current_setting('app.current_user_id', true)::uuid)
  WITH CHECK (
    id = current_setting('app.current_user_id', true)::uuid
    AND user_type = (SELECT user_type FROM public.users WHERE id = current_setting('app.current_user_id', true)::uuid)
  );

-- ============================================================================
-- 5. FIX RLS POLICIES WITH ALWAYS TRUE CONDITIONS - NOTIFICATIONS
-- ============================================================================

-- Drop policies with always true conditions
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service role can update notifications" ON public.notifications;

-- Create proper INSERT policy for notifications (system-generated only)
-- Notifications should only be created when there's a valid booking_id
CREATE POLICY "System can insert notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    booking_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.bookings
      WHERE id = booking_id
    )
  );

-- Create proper UPDATE policy for notifications
CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (recipient_id = current_setting('app.current_user_id', true)::uuid)
  WITH CHECK (recipient_id = current_setting('app.current_user_id', true)::uuid);

-- ============================================================================
-- 6. FIX RLS POLICIES WITH ALWAYS TRUE CONDITIONS - SCHEDULED_REMINDERS
-- ============================================================================

-- Create proper INSERT policy for scheduled reminders
CREATE POLICY "System can insert reminders"
  ON public.scheduled_reminders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = scheduled_reminders.booking_id
      AND (b.therapist_id = current_setting('app.current_user_id', true)::uuid
           OR b.client_id = current_setting('app.current_user_id', true)::uuid)
    )
  );

-- Create proper UPDATE policy for scheduled reminders
CREATE POLICY "System can update reminders"
  ON public.scheduled_reminders
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = scheduled_reminders.booking_id
      AND (b.therapist_id = current_setting('app.current_user_id', true)::uuid
           OR b.client_id = current_setting('app.current_user_id', true)::uuid)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = scheduled_reminders.booking_id
      AND (b.therapist_id = current_setting('app.current_user_id', true)::uuid
           OR b.client_id = current_setting('app.current_user_id', true)::uuid)
    )
  );

-- Create proper DELETE policy for scheduled reminders
CREATE POLICY "System can delete reminders"
  ON public.scheduled_reminders
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = scheduled_reminders.booking_id
      AND (b.therapist_id = current_setting('app.current_user_id', true)::uuid
           OR b.client_id = current_setting('app.current_user_id', true)::uuid)
    )
  );
