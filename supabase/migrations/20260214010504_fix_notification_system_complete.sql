/*
  # Corrigir sistema de notificações automáticas

  1. Correções
    - Corrige função `schedule_booking_reminders` para inserir na tabela `notifications`
    - Cria função wrapper para trigger que extrai dados da booking
    - Adiciona informações completas do cliente e terapeuta nas notificações

  2. Triggers
    - Trigger ao inserir booking → cria notificações automaticamente
    - Trigger ao atualizar booking → recria notificações se data/hora mudou

  3. Notificações criadas
    - 24h antes: Email de lembrete
    - 2h antes: SMS de lembrete  
    - 1h antes: Email de lembrete final

  4. Fluxo Completo
    - Booking criada → Triggers disparam → Notificações inseridas na tabela
    - Cron job (a cada minuto) → Verifica notificações pendentes → Envia emails/SMS
*/

-- Recria a função para inserir na tabela correta
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
    u.phone,
    u.full_name,
    t.name as therapist_name,
    s.name as service_name
  INTO 
    v_client_email,
    v_client_phone,
    v_client_name,
    v_therapist_name,
    v_service_name
  FROM bookings b
  JOIN users u ON b.client_id = u.id
  LEFT JOIN users t ON b.therapist_id = t.id
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

  -- Schedule 2h SMS reminder
  IF p_booking_date > (now() + interval '2 hours') AND v_client_phone IS NOT NULL THEN
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

-- Função wrapper para o trigger (extrai dados do NEW)
CREATE OR REPLACE FUNCTION trigger_schedule_booking_reminders()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  -- Só criar notificações para bookings confirmadas ou pendentes
  IF NEW.status IN ('confirmed', 'pending') THEN
    PERFORM schedule_booking_reminders(NEW.id, NEW.booking_date);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para INSERT
DROP TRIGGER IF EXISTS trigger_create_booking_notifications ON bookings;
CREATE TRIGGER trigger_create_booking_notifications
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_schedule_booking_reminders();

-- Criar trigger para UPDATE
DROP TRIGGER IF EXISTS trigger_update_booking_notifications ON bookings;
CREATE TRIGGER trigger_update_booking_notifications
  AFTER UPDATE ON bookings
  FOR EACH ROW
  WHEN (
    OLD.booking_date IS DISTINCT FROM NEW.booking_date OR
    OLD.status IS DISTINCT FROM NEW.status
  )
  EXECUTE FUNCTION trigger_schedule_booking_reminders();