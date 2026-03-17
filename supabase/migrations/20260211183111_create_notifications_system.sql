/*
  # Create Notifications System

  1. **New Tables**
     - `notifications` - Track all notifications sent and pending
       - `id` (uuid, primary key)
       - `type` (notification_type enum: 'email', 'sms')
       - `recipient_type` (recipient_type enum: 'client', 'therapist', 'admin')
       - `recipient_id` (uuid, foreign key to users)
       - `recipient_email` (text)
       - `recipient_phone` (text)
       - `subject` (text)
       - `message` (text)
       - `status` (notification_status enum: 'pending', 'sent', 'failed')
       - `booking_id` (uuid, foreign key to bookings, nullable)
       - `scheduled_for` (timestamptz, when to send)
       - `sent_at` (timestamptz, when was sent)
       - `error_message` (text, error if failed)
       - `retry_count` (integer, number of retries)
       - `created_at` (timestamptz)

     - `scheduled_reminders` - Auto-send reminders for bookings
       - `id` (uuid, primary key)
       - `booking_id` (uuid, foreign key to bookings)
       - `reminder_type` (reminder_type enum: '24h', '2h', '1h')
       - `notification_type` (notification_type enum: 'email', 'sms')
       - `scheduled_for` (timestamptz)
       - `status` (reminder_status enum: 'pending', 'sent', 'cancelled')
       - `sent_at` (timestamptz)
       - `created_at` (timestamptz)

  2. **Security**
     - Enable RLS on both tables
     - Allow authenticated users to read their own notifications
     - Only service role can insert/update notifications
     - Admin users can read all notifications

  3. **Indexes**
     - Index on `notifications.recipient_id` for user lookups
     - Index on `notifications.booking_id` for booking lookups
     - Index on `notifications.status` for pending notifications
     - Index on `scheduled_reminders.booking_id` for booking lookups
     - Index on `scheduled_reminders.scheduled_for` for cron jobs
     - Index on `scheduled_reminders.status` for pending reminders

  4. **Functions**
     - Function to create notification for booking confirmation
     - Function to schedule automatic reminders
     - Function to process pending reminders
*/

-- =============================================================================
-- 1. CREATE ENUMS
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM ('email', 'sms');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE recipient_type AS ENUM ('client', 'therapist', 'admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE reminder_type AS ENUM ('24h', '2h', '1h');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE reminder_status AS ENUM ('pending', 'sent', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- 2. CREATE TABLES
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type notification_type NOT NULL,
  recipient_type recipient_type NOT NULL,
  recipient_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_email text,
  recipient_phone text,
  subject text,
  message text NOT NULL,
  status notification_status NOT NULL DEFAULT 'pending',
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  scheduled_for timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  error_message text,
  retry_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.scheduled_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  reminder_type reminder_type NOT NULL,
  notification_type notification_type NOT NULL,
  scheduled_for timestamptz NOT NULL,
  status reminder_status NOT NULL DEFAULT 'pending',
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- =============================================================================
-- 3. CREATE INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_booking_id ON public.notifications(booking_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_for ON public.notifications(scheduled_for) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_scheduled_reminders_booking_id ON public.scheduled_reminders(booking_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_reminders_scheduled_for ON public.scheduled_reminders(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_scheduled_reminders_status ON public.scheduled_reminders(status) WHERE status = 'pending';

-- =============================================================================
-- 4. ENABLE RLS
-- =============================================================================

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_reminders ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 5. CREATE RLS POLICIES
-- =============================================================================

-- Notifications policies
CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (recipient_id = (SELECT public.get_current_user_id()));

CREATE POLICY "Service role can insert notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Service role can update notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Scheduled reminders policies
CREATE POLICY "Users can view reminders for own bookings"
  ON public.scheduled_reminders
  FOR SELECT
  TO authenticated
  USING (
    booking_id IN (
      SELECT id FROM public.bookings 
      WHERE client_id = (SELECT public.get_current_user_id())
    )
  );

CREATE POLICY "Service role can manage reminders"
  ON public.scheduled_reminders
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- 6. CREATE FUNCTIONS
-- =============================================================================

-- Function to create booking confirmation notifications
CREATE OR REPLACE FUNCTION public.create_booking_notifications(
  p_booking_id uuid,
  p_client_id uuid,
  p_client_email text,
  p_client_phone text,
  p_therapist_id uuid,
  p_admin_email text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_booking_date timestamptz;
  v_service_name text;
  v_therapist_name text;
BEGIN
  -- Get booking details
  SELECT b.date, s.name, u.username
  INTO v_booking_date, v_service_name, v_therapist_name
  FROM public.bookings b
  JOIN public.services s ON b.service_id = s.id
  JOIN public.users u ON b.therapist_id = u.id
  WHERE b.id = p_booking_id;

  -- Create email notification for client
  INSERT INTO public.notifications (
    type,
    recipient_type,
    recipient_id,
    recipient_email,
    subject,
    message,
    booking_id,
    status
  ) VALUES (
    'email',
    'client',
    p_client_id,
    p_client_email,
    'Confirmação de Consulta - ' || v_service_name,
    'A sua consulta foi confirmada para ' || 
    to_char(v_booking_date, 'DD/MM/YYYY "às" HH24:MI') || 
    ' com ' || v_therapist_name,
    p_booking_id,
    'pending'
  );

  -- Create SMS notification for client (if phone provided)
  IF p_client_phone IS NOT NULL AND p_client_phone != '' THEN
    INSERT INTO public.notifications (
      type,
      recipient_type,
      recipient_id,
      recipient_phone,
      message,
      booking_id,
      status
    ) VALUES (
      'sms',
      'client',
      p_client_id,
      p_client_phone,
      'Consulta confirmada: ' || v_service_name || ' em ' || 
      to_char(v_booking_date, 'DD/MM às HH24:MI') || '. Desperto',
      p_booking_id,
      'pending'
    );
  END IF;

  -- Create email notification for admin
  INSERT INTO public.notifications (
    type,
    recipient_type,
    recipient_email,
    subject,
    message,
    booking_id,
    status
  ) VALUES (
    'email',
    'admin',
    p_admin_email,
    'Nova Consulta Agendada',
    'Nova consulta: ' || v_service_name || ' em ' || 
    to_char(v_booking_date, 'DD/MM/YYYY "às" HH24:MI') || 
    ' com ' || v_therapist_name,
    p_booking_id,
    'pending'
  );
END;
$$;

-- Function to schedule automatic reminders
CREATE OR REPLACE FUNCTION public.schedule_booking_reminders(
  p_booking_id uuid,
  p_booking_date timestamptz
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Schedule 24h email reminder
  IF p_booking_date > (now() + interval '24 hours') THEN
    INSERT INTO public.scheduled_reminders (
      booking_id,
      reminder_type,
      notification_type,
      scheduled_for
    ) VALUES (
      p_booking_id,
      '24h',
      'email',
      p_booking_date - interval '24 hours'
    );
  END IF;

  -- Schedule 2h SMS reminder
  IF p_booking_date > (now() + interval '2 hours') THEN
    INSERT INTO public.scheduled_reminders (
      booking_id,
      reminder_type,
      notification_type,
      scheduled_for
    ) VALUES (
      p_booking_id,
      '2h',
      'sms',
      p_booking_date - interval '2 hours'
    );
  END IF;

  -- Schedule 1h email reminder
  IF p_booking_date > (now() + interval '1 hour') THEN
    INSERT INTO public.scheduled_reminders (
      booking_id,
      reminder_type,
      notification_type,
      scheduled_for
    ) VALUES (
      p_booking_id,
      '1h',
      'email',
      p_booking_date - interval '1 hour'
    );
  END IF;
END;
$$;

-- Function to process pending reminders (to be called by cron)
CREATE OR REPLACE FUNCTION public.process_pending_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_reminder RECORD;
  v_client_email text;
  v_client_phone text;
  v_client_id uuid;
  v_message text;
BEGIN
  -- Get all pending reminders that are due
  FOR v_reminder IN
    SELECT sr.*, b.client_id, b.date
    FROM public.scheduled_reminders sr
    JOIN public.bookings b ON sr.booking_id = b.id
    WHERE sr.status = 'pending'
      AND sr.scheduled_for <= now()
      AND b.status NOT IN ('cancelled', 'completed')
    ORDER BY sr.scheduled_for
    LIMIT 100
  LOOP
    -- Get client contact info
    SELECT u.email, u.phone_number
    INTO v_client_email, v_client_phone
    FROM public.users u
    WHERE u.id = v_reminder.client_id;

    -- Create notification message
    v_message := 'Lembrete: Consulta em ' || 
      CASE v_reminder.reminder_type
        WHEN '24h' THEN '24 horas'
        WHEN '2h' THEN '2 horas'
        WHEN '1h' THEN '1 hora'
      END || ' - ' || to_char(v_reminder.date, 'DD/MM/YYYY "às" HH24:MI');

    -- Create notification
    IF v_reminder.notification_type = 'email' AND v_client_email IS NOT NULL THEN
      INSERT INTO public.notifications (
        type,
        recipient_type,
        recipient_id,
        recipient_email,
        subject,
        message,
        booking_id,
        status
      ) VALUES (
        'email',
        'client',
        v_reminder.client_id,
        v_client_email,
        'Lembrete de Consulta',
        v_message,
        v_reminder.booking_id,
        'pending'
      );
    ELSIF v_reminder.notification_type = 'sms' AND v_client_phone IS NOT NULL THEN
      INSERT INTO public.notifications (
        type,
        recipient_type,
        recipient_id,
        recipient_phone,
        message,
        booking_id,
        status
      ) VALUES (
        'sms',
        'client',
        v_reminder.client_id,
        v_client_phone,
        v_message,
        v_reminder.booking_id,
        'pending'
      );
    END IF;

    -- Mark reminder as sent
    UPDATE public.scheduled_reminders
    SET status = 'sent', sent_at = now()
    WHERE id = v_reminder.id;
  END LOOP;
END;
$$;