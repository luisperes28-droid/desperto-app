/*
  # Corrigir conflito de DELETE entre funções

  1. Problema Identificado
    - send_booking_confirmation cria notificação de confirmação imediata
    - schedule_booking_reminders executa logo depois e DELETA todas notificações pending
    - Resultado: notificação de confirmação é deletada antes de ser enviada

  2. Solução
    - Remover DELETE de schedule_booking_reminders
    - Adicionar DELETE apenas em send_booking_confirmation
    - send_booking_confirmation limpa TUDO e recria tudo do zero
    - schedule_booking_reminders só adiciona se não existir

  3. Nova Lógica
    - send_booking_confirmation: deleta TUDO e cria confirmação imediata
    - schedule_booking_reminders: adiciona lembretes futuros SEM deletar
*/

-- Função de confirmação: limpa TUDO e cria notificação imediata
CREATE OR REPLACE FUNCTION send_booking_confirmation(p_booking_id uuid, p_booking_date timestamp with time zone)
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
  v_service_duration integer;
  v_service_price text;
  v_payment_status text;
BEGIN
  -- Buscar todos os dados necessários
  SELECT 
    u.email,
    u.phone_number,
    COALESCE(up.full_name, u.username),
    COALESCE(tp.full_name, t.username),
    s.name,
    s.duration,
    to_char(s.price, 'FM999990.00'),
    b.payment_status
  INTO 
    v_client_email,
    v_client_phone,
    v_client_name,
    v_therapist_name,
    v_service_name,
    v_service_duration,
    v_service_price,
    v_payment_status
  FROM bookings b
  JOIN users u ON b.client_id = u.id
  LEFT JOIN user_profiles up ON u.id = up.user_id
  LEFT JOIN users t ON b.therapist_id = t.id
  LEFT JOIN user_profiles tp ON t.id = tp.user_id
  LEFT JOIN services s ON b.service_id = s.id
  WHERE b.id = p_booking_id;

  -- LIMPAR TODAS as notificações antigas desta booking
  DELETE FROM notifications WHERE booking_id = p_booking_id AND status = 'pending';

  -- EMAIL de confirmação (imediato)
  INSERT INTO notifications (
    booking_id,
    type,
    recipient_type,
    recipient_email,
    subject,
    message,
    scheduled_for,
    status
  ) VALUES (
    p_booking_id,
    'email',
    'client',
    v_client_email,
    'Marcação Confirmada - Desperto Coaching',
    format(E'Olá %s!\n\nA tua marcação foi confirmada com sucesso!\n\nDETALHES DA MARCAÇÃO:\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nData: %s\nHora: %s\nTerapeuta: %s\nServiço: %s\nDuração: %s minutos\nValor: %s EUR\nPagamento: %s\n\nLOCAL:\nDesperto - Coaching ao Minuto\nRua do Sossego, nº 4\n2560-280 Torres Vedras\n\nContacto: +351 261 329 140\n\nSe precisares de reagendar ou cancelar, por favor contacta-nos com pelo menos 24h de antecedência.\n\nEstamos ansiosos por te receber!\n\nCom os melhores cumprimentos,\nEquipa Desperto', 
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
      END
    ),
    NOW(),
    'pending'
  );

  -- SMS de confirmação (imediato, só se tiver telefone)
  IF v_client_phone IS NOT NULL AND v_client_phone != '' THEN
    INSERT INTO notifications (
      booking_id,
      type,
      recipient_type,
      recipient_phone,
      message,
      scheduled_for,
      status
    ) VALUES (
      p_booking_id,
      'sms',
      'client',
      v_client_phone,
      format('Marcação confirmada! %s com %s. Desperto - Coaching ao Minuto. Info: 261 329 140', 
        to_char(p_booking_date, 'DD/MM às HH24:MI'),
        v_therapist_name
      ),
      NOW(),
      'pending'
    );
  END IF;
END;
$$;

-- Função de lembretes: SEM deletar, só adiciona
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

  -- NÃO deletar nada! Apenas adicionar os lembretes futuros

  -- Schedule 24h email reminder
  IF p_booking_date > (now() + interval '24 hours') THEN
    INSERT INTO notifications (
      booking_id,
      type,
      recipient_type,
      recipient_email,
      subject,
      message,
      scheduled_for,
      status
    ) VALUES (
      p_booking_id,
      'email',
      'client',
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
      recipient_type,
      recipient_phone,
      message,
      scheduled_for,
      status
    ) VALUES (
      p_booking_id,
      'sms',
      'client',
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
      recipient_type,
      recipient_email,
      subject,
      message,
      scheduled_for,
      status
    ) VALUES (
      p_booking_id,
      'email',
      'client',
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