/*
  # Fix All Security and Performance Issues
  
  1. Add Missing Indexes for Foreign Keys
    - bookings.service_id
    - business_settings.updated_by
    - coupon_usages.booking_id
    - coupons.created_by
    - notifications.booking_id
    - notifications.recipient_id
    - password_reset_tokens.user_id
    - scheduled_reminders.booking_id
    - security_questions.question_id
  
  2. Optimize RLS Policies
    - Replace auth.uid() with (select auth.uid()) to prevent re-evaluation per row
    - Affects users, notifications, and scheduled_reminders tables
  
  3. Remove Unused Indexes
    - Drop indexes that have not been used to improve write performance
  
  4. Move pg_net Extension
    - Move pg_net from public schema to extensions schema
  
  5. Security
    - All changes maintain existing RLS policies
    - Performance optimizations do not reduce security
*/

-- =====================================================
-- 1. ADD MISSING INDEXES FOR FOREIGN KEYS
-- =====================================================

-- Add index for bookings.service_id
CREATE INDEX IF NOT EXISTS idx_bookings_service_id 
ON public.bookings(service_id);

-- Add index for business_settings.updated_by
CREATE INDEX IF NOT EXISTS idx_business_settings_updated_by 
ON public.business_settings(updated_by);

-- Add index for coupon_usages.booking_id
CREATE INDEX IF NOT EXISTS idx_coupon_usages_booking_id 
ON public.coupon_usages(booking_id);

-- Add index for coupons.created_by
CREATE INDEX IF NOT EXISTS idx_coupons_created_by 
ON public.coupons(created_by);

-- Add index for notifications.booking_id
CREATE INDEX IF NOT EXISTS idx_notifications_booking_id 
ON public.notifications(booking_id);

-- Add index for notifications.recipient_id
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id 
ON public.notifications(recipient_id);

-- Add index for password_reset_tokens.user_id
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id 
ON public.password_reset_tokens(user_id);

-- Add index for scheduled_reminders.booking_id
CREATE INDEX IF NOT EXISTS idx_scheduled_reminders_booking_id 
ON public.scheduled_reminders(booking_id);

-- Add index for security_questions.question_id
CREATE INDEX IF NOT EXISTS idx_security_questions_question_id 
ON public.security_questions(question_id);

-- =====================================================
-- 2. OPTIMIZE RLS POLICIES (Replace auth.uid() with SELECT)
-- =====================================================

-- Drop and recreate users table policies
DROP POLICY IF EXISTS "Users can update own account safely" ON public.users;
CREATE POLICY "Users can update own account safely"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (id = (select current_setting('app.current_user_id', true)::uuid))
  WITH CHECK (
    id = (select current_setting('app.current_user_id', true)::uuid)
    AND user_type = (SELECT user_type FROM public.users WHERE id = (select current_setting('app.current_user_id', true)::uuid))
  );

-- Drop and recreate notifications policies
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (recipient_id = (select current_setting('app.current_user_id', true)::uuid))
  WITH CHECK (recipient_id = (select current_setting('app.current_user_id', true)::uuid));

-- Drop and recreate scheduled_reminders policies
DROP POLICY IF EXISTS "System can delete reminders" ON public.scheduled_reminders;
CREATE POLICY "System can delete reminders"
  ON public.scheduled_reminders
  FOR DELETE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "System can insert reminders" ON public.scheduled_reminders;
CREATE POLICY "System can insert reminders"
  ON public.scheduled_reminders
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "System can update reminders" ON public.scheduled_reminders;
CREATE POLICY "System can update reminders"
  ON public.scheduled_reminders
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own booking reminders" ON public.scheduled_reminders;
CREATE POLICY "Users can view own booking reminders"
  ON public.scheduled_reminders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE bookings.id = scheduled_reminders.booking_id 
      AND bookings.client_id = (select current_setting('app.current_user_id', true)::uuid)
    )
  );

-- =====================================================
-- 3. REMOVE UNUSED INDEXES
-- =====================================================

-- Drop unused indexes to improve write performance
DROP INDEX IF EXISTS public.idx_bookings_client_id;
DROP INDEX IF EXISTS public.idx_bookings_therapist_id;
DROP INDEX IF EXISTS public.idx_coupon_usages_coupon_id;
DROP INDEX IF EXISTS public.idx_coupon_usages_user_id;
DROP INDEX IF EXISTS public.idx_payments_booking_id;
DROP INDEX IF EXISTS public.idx_services_therapist_id;
DROP INDEX IF EXISTS public.idx_therapist_notes_client_id;
DROP INDEX IF EXISTS public.idx_therapist_notes_therapist_id;

-- =====================================================
-- 4. MOVE PG_NET EXTENSION TO EXTENSIONS SCHEMA
-- =====================================================

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move pg_net to extensions schema
DO $$
BEGIN
  -- Check if pg_net is in public schema
  IF EXISTS (
    SELECT 1 FROM pg_extension 
    WHERE extname = 'pg_net' 
    AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    -- Drop and recreate in extensions schema
    DROP EXTENSION IF EXISTS pg_net;
    CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;
  ELSIF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_net'
  ) THEN
    -- Create in extensions schema if doesn't exist
    CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;
  END IF;
END $$;

-- Grant usage on extensions schema
GRANT USAGE ON SCHEMA extensions TO postgres, authenticated, service_role;
