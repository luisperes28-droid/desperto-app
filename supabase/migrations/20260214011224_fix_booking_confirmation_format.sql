/*
  # Corrigir formatação de preço na notificação

  1. Problema
    - format() do PostgreSQL não suporta %.2f
  
  2. Solução
    - Usar to_char() para formatar o preço antes de passar para format()
    - Escapar emojis que podem causar problemas
*/

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