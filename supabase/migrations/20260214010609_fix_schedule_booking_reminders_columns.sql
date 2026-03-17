/*
  # Corrigir colunas na função schedule_booking_reminders

  1. Problema
    - A função estava tentando buscar `full_name` e `phone` da tabela `users`
    - Mas essas colunas não existem em `users` (estão em `user_profiles`)
    - Colunas corretas: `phone_number` em users, `full_name` em user_profiles

  2. Solução
    - Corrige JOIN para buscar dados de `user_profiles`
    - Usa fallback para username se full_name não existir
    - Trata casos onde phone_number pode ser null ou vazio
*/

CREATE OR REPLACE FUNCTION schedule_booking_reminders(p_booking_id uuid, p_booking_date timestamp with time zone)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_client_email text;
  v_client_phone text;
  v_client_name text;
  v_therapist_name text;
  v_service_name text;
BEGIN
  -- Buscar dados do cliente, terapeuta e serviço
  SELECT 
    u.email,
    u.phone_number,
    COALESCE(up.full_name, u.username),
    COALESCE(tp.full_name, t.username),
    s.name
  INTO 
    v_client_email,
    v_client_phone,
    v_client_name,
    v_therapist_name,
    v_service_name
  FROM bookings b
  JOIN users u ON b.client_id = u.id
  LEFT JOIN user_profiles up ON u.id = up.user_id
  LEFT JOIN users t ON b.therapist_id = t.id
  LEFT JOIN user_profiles tp ON t.id = tp.user_id
  LEFT JOIN services s ON b.service_id = s.id
  WHERE b.id = p_booking_id;

  -- Remover notificações antigas desta booking (se existirem)
  DELETE FROM notifications WHERE booking_id = p_booking_id AND status = 'pending';

  -- Schedule 24h email reminder
  IF p_booking_date > (now() + interval '24 hours') THEN
    INSERT INTO notifications (
      booking_id,
      type,
      recipient_email,
      subject,
      message,
      scheduled_for,
      status
    ) VALUES (
      p_booking_id,
      'email',
      v_client_email,
      'Lembrete: Sessão amanhã',
      format('Olá %s! Lembrete de que tens uma sessão de %s com %s amanhã às %s. Até lá!', 
        v_client_name, v_service_name, v_therapist_name, 
        to_char(p_booking_date, 'HH24:MI')),
      p_booking_date - interval '24 hours',
      'pending'
    );
  END IF;

  -- Schedule 2h SMS reminder (só se tiver telefone)
  IF p_booking_date > (now() + interval '2 hours') 
     AND v_client_phone IS NOT NULL 
     AND v_client_phone != '' THEN
    INSERT INTO notifications (
      booking_id,
      type,
      recipient_phone,
      message,
      scheduled_for,
      status
    ) VALUES (
      p_booking_id,
      'sms',
      v_client_phone,
      format('Lembrete: Sessão de %s com %s em 2 horas (%s). Desperto - Coaching ao Minuto', 
        v_service_name, v_therapist_name, 
        to_char(p_booking_date, 'HH24:MI')),
      p_booking_date - interval '2 hours',
      'pending'
    );
  END IF;

  -- Schedule 1h email reminder
  IF p_booking_date > (now() + interval '1 hour') THEN
    INSERT INTO notifications (
      booking_id,
      type,
      recipient_email,
      subject,
      message,
      scheduled_for,
      status
    ) VALUES (
      p_booking_id,
      'email',
      v_client_email,
      'Lembrete: Sessão em 1 hora',
      format('Olá %s! A tua sessão de %s com %s começa em 1 hora (%s). Prepara-te!', 
        v_client_name, v_service_name, v_therapist_name, 
        to_char(p_booking_date, 'HH24:MI')),
      p_booking_date - interval '1 hour',
      'pending'
    );
  END IF;
END;
$$;