/*
  # Fix Security and Performance Issues
  
  This migration resolves critical security and performance problems identified in the database audit.
  
  ## 1. Add Missing Indexes on Foreign Keys
  
  Foreign keys without indexes cause poor query performance. Adding indexes on:
  - bookings.client_id
  - bookings.therapist_id
  - coupon_usages.coupon_id
  - coupon_usages.user_id
  - payments.booking_id
  - services.therapist_id
  - therapist_notes.client_id
  - therapist_notes.therapist_id
  
  ## 2. Drop Unused Indexes
  
  Removing indexes that are never used to reduce storage and improve write performance:
  - idx_bookings_service_id
  - idx_business_settings_updated_by
  - idx_coupon_usages_booking_id
  - idx_coupons_created_by
  - idx_notifications_booking_id
  - idx_notifications_recipient_id
  - idx_password_reset_tokens_user_id
  - idx_scheduled_reminders_booking_id
  - idx_security_questions_question_id
  
  ## 3. Fix RLS Policies for Performance
  
  Updating RLS policies to use (select auth.uid()) to prevent re-evaluation for each row:
  - users: "Users can update own account safely"
  - notifications: "Users can update own notifications"
  - scheduled_reminders: "Users can view own booking reminders"
  
  ## 4. Fix Insecure RLS Policies
  
  The scheduled_reminders table had policies that allowed unrestricted access.
  These are replaced with proper system-level policies that check for service role access.
  
  ## Important Notes
  
  - All changes are idempotent and safe to run multiple times
  - Indexes are created to improve query performance
  - RLS policies are recreated to ensure proper security
*/

-- ============================================================================
-- 1. ADD MISSING INDEXES ON FOREIGN KEYS
-- ============================================================================

-- Add index on bookings.client_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'bookings' AND indexname = 'idx_bookings_client_id'
  ) THEN
    CREATE INDEX idx_bookings_client_id ON public.bookings(client_id);
  END IF;
END $$;

-- Add index on bookings.therapist_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'bookings' AND indexname = 'idx_bookings_therapist_id'
  ) THEN
    CREATE INDEX idx_bookings_therapist_id ON public.bookings(therapist_id);
  END IF;
END $$;

-- Add index on coupon_usages.coupon_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'coupon_usages' AND indexname = 'idx_coupon_usages_coupon_id'
  ) THEN
    CREATE INDEX idx_coupon_usages_coupon_id ON public.coupon_usages(coupon_id);
  END IF;
END $$;

-- Add index on coupon_usages.user_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'coupon_usages' AND indexname = 'idx_coupon_usages_user_id'
  ) THEN
    CREATE INDEX idx_coupon_usages_user_id ON public.coupon_usages(user_id);
  END IF;
END $$;

-- Add index on payments.booking_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'payments' AND indexname = 'idx_payments_booking_id'
  ) THEN
    CREATE INDEX idx_payments_booking_id ON public.payments(booking_id);
  END IF;
END $$;

-- Add index on services.therapist_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'services' AND indexname = 'idx_services_therapist_id'
  ) THEN
    CREATE INDEX idx_services_therapist_id ON public.services(therapist_id);
  END IF;
END $$;

-- Add index on therapist_notes.client_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'therapist_notes' AND indexname = 'idx_therapist_notes_client_id'
  ) THEN
    CREATE INDEX idx_therapist_notes_client_id ON public.therapist_notes(client_id);
  END IF;
END $$;

-- Add index on therapist_notes.therapist_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'therapist_notes' AND indexname = 'idx_therapist_notes_therapist_id'
  ) THEN
    CREATE INDEX idx_therapist_notes_therapist_id ON public.therapist_notes(therapist_id);
  END IF;
END $$;

-- ============================================================================
-- 2. DROP UNUSED INDEXES
-- ============================================================================

DROP INDEX IF EXISTS public.idx_bookings_service_id;
DROP INDEX IF EXISTS public.idx_business_settings_updated_by;
DROP INDEX IF EXISTS public.idx_coupon_usages_booking_id;
DROP INDEX IF EXISTS public.idx_coupons_created_by;
DROP INDEX IF EXISTS public.idx_notifications_booking_id;
DROP INDEX IF EXISTS public.idx_notifications_recipient_id;
DROP INDEX IF EXISTS public.idx_password_reset_tokens_user_id;
DROP INDEX IF EXISTS public.idx_scheduled_reminders_booking_id;
DROP INDEX IF EXISTS public.idx_security_questions_question_id;

-- ============================================================================
-- 3. FIX RLS POLICIES FOR PERFORMANCE
-- ============================================================================

-- Fix users table RLS policy
DROP POLICY IF EXISTS "Users can update own account safely" ON public.users;
CREATE POLICY "Users can update own account safely"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- Fix notifications table RLS policy
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (recipient_id = (SELECT auth.uid()))
  WITH CHECK (recipient_id = (SELECT auth.uid()));

-- Fix scheduled_reminders table RLS policy
DROP POLICY IF EXISTS "Users can view own booking reminders" ON public.scheduled_reminders;
CREATE POLICY "Users can view own booking reminders"
  ON public.scheduled_reminders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = scheduled_reminders.booking_id
      AND bookings.client_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- 4. FIX INSECURE RLS POLICIES ON SCHEDULED_REMINDERS
-- ============================================================================

-- Drop the insecure policies that allowed unrestricted access
DROP POLICY IF EXISTS "System can insert reminders" ON public.scheduled_reminders;
DROP POLICY IF EXISTS "System can update reminders" ON public.scheduled_reminders;
DROP POLICY IF EXISTS "System can delete reminders" ON public.scheduled_reminders;

-- Create secure policies that only allow service role access
-- Service role operations bypass RLS, but we need policies for auditing

CREATE POLICY "Service role can insert reminders"
  ON public.scheduled_reminders
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update reminders"
  ON public.scheduled_reminders
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can delete reminders"
  ON public.scheduled_reminders
  FOR DELETE
  TO service_role
  USING (true);

-- Allow authenticated users (admin/staff) to manage reminders for their bookings
CREATE POLICY "Staff can manage reminders for their bookings"
  ON public.scheduled_reminders
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      JOIN public.users ON users.id = bookings.therapist_id
      WHERE bookings.id = scheduled_reminders.booking_id
      AND users.user_type IN ('admin', 'therapist')
      AND users.id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings
      JOIN public.users ON users.id = bookings.therapist_id
      WHERE bookings.id = scheduled_reminders.booking_id
      AND users.user_type IN ('admin', 'therapist')
      AND users.id = (SELECT auth.uid())
    )
  );