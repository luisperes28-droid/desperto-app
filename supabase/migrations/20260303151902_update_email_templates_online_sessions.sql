/*
  # Update email templates for 100% online sessions

  1. Modified Functions
    - `send_booking_confirmation` - Updated confirmation email template:
      - Removed physical address (Rua do Sossego)
      - Removed phone number
      - Added email contact (euestoudesperto@gmail.com)
      - Added "Consulta 100% Online via Google Meet" section
      - Added meeting link placeholder (reads from bookings.meeting_link)
      - Added instructions to test camera/microphone
    - `schedule_booking_reminders` - Updated reminder templates:
      - Added Google Meet info and meeting link to reminders
      - Added contact email instead of phone

  2. Notes
    - All sessions are now online via Google Meet
    - Meeting link is read from bookings.meeting_link column
*/

CREATE OR REPLACE FUNCTION send_booking_confirmation(p_booking_id uuid, p_booking_date timestamptz)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_client_email text;
  v_client_phone text;
  v_client_name text;
  v_therapist_name text;
  v_service_name text;
  v_service_duration integer;
  v_service_price text;
  v_payment_status text;
  v_meeting_link text;
BEGIN
  SELECT
    u.email,
    u.phone_number,
    COALESCE(up.full_name, u.username),
    COALESCE(tp.full_name, t.username),
    s.name,
    s.duration,
    to_char(s.price, 'FM999990.00'),
    b.payment_status,
    b.meeting_link
  INTO
    v_client_email,
    v_client_phone,
    v_client_name,
    v_therapist_name,
    v_service_name,
    v_service_duration,
    v_service_price,
    v_payment_status,
    v_meeting_link
  FROM bookings b
  JOIN users u ON b.client_id = u.id
  LEFT JOIN user_profiles up ON u.id = up.user_id
  LEFT JOIN users t ON b.therapist_id = t.id
  LEFT JOIN user_profiles tp ON t.id = tp.user_id
  LEFT JOIN services s ON b.service_id = s.id
  WHERE b.id = p_booking_id;

  DELETE FROM notifications WHERE booking_id = p_booking_id AND status = 'pending';

  INSERT INTO notifications (
    booking_id, type, recipient_type, recipient_email,
    subject, message, scheduled_for, status
  ) VALUES (
    p_booking_id,
    'email',
    'client',
    v_client_email,
    'Marcacao Confirmada - Desperto',
    format(
      E'Ola %s!\n\nA tua marcacao foi confirmada com sucesso!\n\nDETALHES DA MARCACAO:\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nData: %s\nHora: %s\nTerapeuta: %s\nServico: %s\nDuracao: %s minutos\nValor: %s EUR\nPagamento: %s\n\n--- CONSULTA 100%% ONLINE ---\nA tua sessao sera realizada por videochamada atraves do Google Meet.\n%s\n\nAntes da sessao, por favor:\n- Testa a tua camara e microfone\n- Escolhe um local calmo e com boa ligacao a internet\n- Entra na reuniao 2-3 minutos antes da hora marcada\n\nContacto: euestoudesperto@gmail.com\n\nSe precisares de reagendar ou cancelar, por favor contacta-nos com pelo menos 24h de antecedencia.\n\nEstamos ansiosos por te receber!\n\nCom os melhores cumprimentos,\nEquipa Desperto',
      v_client_name,
      to_char(p_booking_date, 'DD/MM/YYYY (Day)'),
      to_char(p_booking_date, 'HH24:MI'),
      v_therapist_name,
      v_service_name,
      v_service_duration,
      v_service_price,
      CASE
        WHEN v_payment_status = 'paid' THEN 'Pago'
        WHEN v_payment_status = 'pending' THEN 'Pendente'
        WHEN v_payment_status = 'failed' THEN 'Falhado'
        ELSE 'N/A'
      END,
      CASE
        WHEN v_meeting_link IS NOT NULL AND v_meeting_link != ''
        THEN format('Link da sessao (Google Meet): %s', v_meeting_link)
        ELSE 'O link da sessao (Google Meet) sera enviado antes da consulta.'
      END
    ),
    NOW(),
    'pending'
  );

  IF v_client_phone IS NOT NULL AND v_client_phone != '' THEN
    INSERT INTO notifications (
      booking_id, type, recipient_type, recipient_phone,
      message, scheduled_for, status
    ) VALUES (
      p_booking_id,
      'sms',
      'client',
      v_client_phone,
      format('Marcacao confirmada! %s com %s. Sessao online via Google Meet. Info: euestoudesperto@gmail.com',
        to_char(p_booking_date, 'DD/MM as HH24:MI'),
        v_therapist_name
      ),
      NOW(),
      'pending'
    );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION schedule_booking_reminders(p_booking_id uuid, p_booking_date timestamptz)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_client_email text;
  v_client_phone text;
  v_client_name text;
  v_therapist_name text;
  v_service_name text;
  v_meeting_link text;
BEGIN
  SELECT
    u.email,
    u.phone_number,
    COALESCE(up.full_name, u.username),
    COALESCE(tp.full_name, t.username),
    s.name,
    b.meeting_link
  INTO
    v_client_email,
    v_client_phone,
    v_client_name,
    v_therapist_name,
    v_service_name,
    v_meeting_link
  FROM bookings b
  JOIN users u ON b.client_id = u.id
  LEFT JOIN user_profiles up ON u.id = up.user_id
  LEFT JOIN users t ON b.therapist_id = t.id
  LEFT JOIN user_profiles tp ON t.id = tp.user_id
  LEFT JOIN services s ON b.service_id = s.id
  WHERE b.id = p_booking_id;

  IF p_booking_date > (now() + interval '24 hours') THEN
    INSERT INTO notifications (
      booking_id, type, recipient_type, recipient_email,
      subject, message, scheduled_for, status
    ) VALUES (
      p_booking_id,
      'email',
      'client',
      v_client_email,
      'Lembrete: Sessao amanha',
      format(
        E'Ola %s!\n\nLembrete de que tens uma sessao de %s com %s amanha as %s.\n\nA sessao e online via Google Meet.\n%s\n\nAntes da sessao, testa a tua camara e microfone.\n\nContacto: euestoudesperto@gmail.com\n\nAte la!',
        v_client_name, v_service_name, v_therapist_name,
        to_char(p_booking_date, 'HH24:MI'),
        CASE
          WHEN v_meeting_link IS NOT NULL AND v_meeting_link != ''
          THEN format('Link: %s', v_meeting_link)
          ELSE 'O link sera enviado em breve.'
        END
      ),
      p_booking_date - interval '24 hours',
      'pending'
    );
  END IF;

  IF p_booking_date > (now() + interval '2 hours')
    AND v_client_phone IS NOT NULL
    AND v_client_phone != '' THEN
    INSERT INTO notifications (
      booking_id, type, recipient_type, recipient_phone,
      message, scheduled_for, status
    ) VALUES (
      p_booking_id,
      'sms',
      'client',
      v_client_phone,
      format('Lembrete: Sessao de %s com %s em 2 horas (%s). Sessao online via Google Meet.',
        v_service_name, v_therapist_name,
        to_char(p_booking_date, 'HH24:MI')),
      p_booking_date - interval '2 hours',
      'pending'
    );
  END IF;

  IF p_booking_date > (now() + interval '1 hour') THEN
    INSERT INTO notifications (
      booking_id, type, recipient_type, recipient_email,
      subject, message, scheduled_for, status
    ) VALUES (
      p_booking_id,
      'email',
      'client',
      v_client_email,
      'Lembrete: Sessao em 1 hora',
      format(
        E'Ola %s!\n\nA tua sessao de %s com %s comeca em 1 hora (%s).\n\nA sessao e online via Google Meet.\n%s\n\nPrepara-te! Testa a camara e microfone.\n\nContacto: euestoudesperto@gmail.com',
        v_client_name, v_service_name, v_therapist_name,
        to_char(p_booking_date, 'HH24:MI'),
        CASE
          WHEN v_meeting_link IS NOT NULL AND v_meeting_link != ''
          THEN format('Link: %s', v_meeting_link)
          ELSE 'O link sera enviado em breve.'
        END
      ),
      p_booking_date - interval '1 hour',
      'pending'
    );
  END IF;
END;
$$;
