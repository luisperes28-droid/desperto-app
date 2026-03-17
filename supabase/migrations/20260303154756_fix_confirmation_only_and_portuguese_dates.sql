/*
  # Fix: Only send confirmation email, Portuguese dates, branded template

  1. Modified Functions
    - `send_booking_confirmation` - Updated:
      - Date format now uses Portuguese day/month names (not English)
      - Cleaned up email message format
    - `schedule_booking_reminders` - Disabled:
      - No longer creates reminder notifications (24h, 2h, 1h)
      - Client only receives the confirmation email
    - `trigger_schedule_booking_reminders` - Updated:
      - Only calls send_booking_confirmation, no longer calls schedule_booking_reminders

  2. Notes
    - Client receives only ONE email: "Marcacao Confirmada"
    - Admin notification still sent via frontend
    - Portuguese locale for all date formatting
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
  v_day_name text;
  v_month_name text;
  v_formatted_date text;
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

  v_day_name := CASE EXTRACT(DOW FROM p_booking_date)
    WHEN 0 THEN 'Domingo'
    WHEN 1 THEN 'Segunda-feira'
    WHEN 2 THEN 'Terca-feira'
    WHEN 3 THEN 'Quarta-feira'
    WHEN 4 THEN 'Quinta-feira'
    WHEN 5 THEN 'Sexta-feira'
    WHEN 6 THEN 'Sabado'
  END;

  v_month_name := CASE EXTRACT(MONTH FROM p_booking_date)
    WHEN 1 THEN 'Janeiro'
    WHEN 2 THEN 'Fevereiro'
    WHEN 3 THEN 'Marco'
    WHEN 4 THEN 'Abril'
    WHEN 5 THEN 'Maio'
    WHEN 6 THEN 'Junho'
    WHEN 7 THEN 'Julho'
    WHEN 8 THEN 'Agosto'
    WHEN 9 THEN 'Setembro'
    WHEN 10 THEN 'Outubro'
    WHEN 11 THEN 'Novembro'
    WHEN 12 THEN 'Dezembro'
  END;

  v_formatted_date := format('%s, %s de %s de %s',
    v_day_name,
    EXTRACT(DAY FROM p_booking_date)::integer,
    v_month_name,
    EXTRACT(YEAR FROM p_booking_date)::integer
  );

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
      E'Ola %s!\n\nA tua marcacao foi confirmada com sucesso!\n\nDETALHES DA MARCACAO:\nData: %s\nHora: %s\nTerapeuta: %s\nServico: %s\nDuracao: %s minutos\nValor: %s EUR\nPagamento: %s\n\nCONSULTA 100%% ONLINE\nA tua sessao sera realizada por videochamada atraves do Google Meet.\n%s\n\nAntes da sessao:\n- Testa a tua camara e microfone\n- Escolhe um local calmo e com boa ligacao a internet\n- Entra na reuniao 2-3 minutos antes da hora marcada\n\nSe precisares de reagendar ou cancelar, contacta-nos com pelo menos 24h de antecedencia.\n\nContacto: euestoudesperto@gmail.com\n\nCom os melhores cumprimentos,\nEquipa Desperto',
      v_client_name,
      v_formatted_date,
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
        ELSE 'O link da sessao sera enviado antes da consulta.'
      END
    ),
    NOW(),
    'pending'
  );
END;
$$;

CREATE OR REPLACE FUNCTION trigger_schedule_booking_reminders()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'confirmed' THEN
    PERFORM send_booking_confirmation(NEW.id, NEW.booking_date);
  END IF;
  RETURN NEW;
END;
$$;
