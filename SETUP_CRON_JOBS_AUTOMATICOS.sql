/*
  Setup de Cron Jobs para Notificações Automáticas

  Este script configura os cron jobs necessários para processar notificações
  e lembretes automaticamente.

  IMPORTANTE:
  1. Execute este script no Supabase SQL Editor
  2. Substitua 'your-project.supabase.co' pelo URL do seu projeto
  3. Substitua 'your-service-role-key' pela sua service role key
     (encontra-a em: Settings > API > service_role key)

  ATENÇÃO: A extensão pg_cron deve estar ativada!
  Para ativar: Database > Extensions > procure por "pg_cron" e ative
*/

-- ============================================================================
-- 1. REMOVER CRON JOBS ANTIGOS (se existirem)
-- ============================================================================

SELECT cron.unschedule('process-pending-notifications');
SELECT cron.unschedule('create-booking-reminders');
SELECT cron.unschedule('cleanup-old-notifications');

-- ============================================================================
-- 2. CRON JOB: PROCESSAR NOTIFICAÇÕES PENDENTES
-- ============================================================================
-- Executa a cada 5 minutos
-- Processa emails e SMS pendentes na tabela notifications

SELECT cron.schedule(
  'process-pending-notifications',
  '*/5 * * * *', -- A cada 5 minutos
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/process-notifications',
    headers := jsonb_build_object(
      'Authorization', 'Bearer your-service-role-key',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);

-- ============================================================================
-- 3. CRON JOB: CRIAR LEMBRETES AUTOMÁTICOS
-- ============================================================================
-- Executa de hora em hora
-- Cria lembretes 24h e 2h antes das consultas

SELECT cron.schedule(
  'create-booking-reminders',
  '0 * * * *', -- De hora em hora (minuto 0)
  $$
  DO $$
  DECLARE
    v_booking RECORD;
    v_client RECORD;
    v_service RECORD;
    v_therapist RECORD;
    v_reminder_24h_time TIMESTAMPTZ;
    v_reminder_2h_time TIMESTAMPTZ;
  BEGIN
    -- Processar consultas confirmadas nas próximas 25 horas (lembrete 24h)
    FOR v_booking IN
      SELECT b.*
      FROM bookings b
      WHERE b.status = 'confirmed'
        AND b.date > NOW()
        AND b.date <= NOW() + INTERVAL '25 hours'
        AND NOT EXISTS (
          SELECT 1 FROM scheduled_reminders sr
          WHERE sr.booking_id = b.id
          AND sr.reminder_type = '24h'
        )
    LOOP
      -- Obter dados do cliente
      SELECT * INTO v_client FROM users WHERE id = v_booking.client_id;

      -- Obter dados do serviço
      SELECT * INTO v_service FROM services WHERE id = v_booking.service_id;

      -- Obter dados do terapeuta
      SELECT * INTO v_therapist FROM users WHERE id = v_booking.therapist_id;

      -- Calcular hora do lembrete (24h antes)
      v_reminder_24h_time := v_booking.date - INTERVAL '24 hours';

      -- Criar notificação de email (lembrete 24h)
      IF v_client.email IS NOT NULL THEN
        INSERT INTO notifications (
          type,
          recipient_type,
          recipient_id,
          recipient_email,
          subject,
          message,
          booking_id,
          status,
          scheduled_for
        ) VALUES (
          'email',
          'client',
          v_client.id,
          v_client.email,
          'Lembrete: Consulta amanhã - ' || v_service.name,
          'Olá ' || v_client.name || E',\n\n' ||
          'Este é um lembrete da sua consulta marcada para amanhã.\n\n' ||
          '📅 Detalhes:\n' ||
          '- Serviço: ' || v_service.name || E'\n' ||
          '- Terapeuta: ' || v_therapist.name || E'\n' ||
          '- Data: ' || TO_CHAR(v_booking.date, 'DD/MM/YYYY') || E'\n' ||
          '- Hora: ' || TO_CHAR(v_booking.date, 'HH24:MI') || E'\n' ||
          '- Duração: ' || v_service.duration || E' minutos\n\n' ||
          '📍 Localização: Desperto - Coaching ao Minuto\n\n' ||
          'Aguardamos por si!\n\n' ||
          'Equipa Desperto\n' ||
          'euestoudesperto@gmail.com',
          v_booking.id,
          'pending',
          v_reminder_24h_time
        );
      END IF;

      -- Criar notificação de SMS se tiver telefone
      IF v_client.phone IS NOT NULL AND v_client.phone != '' THEN
        INSERT INTO notifications (
          type,
          recipient_type,
          recipient_id,
          recipient_phone,
          subject,
          message,
          booking_id,
          status,
          scheduled_for
        ) VALUES (
          'sms',
          'client',
          v_client.id,
          v_client.phone,
          'Lembrete Consulta',
          'Olá ' || v_client.name || '! Lembrete: consulta amanhã às ' ||
          TO_CHAR(v_booking.date, 'HH24:MI') || ' - ' || v_service.name ||
          '. Desperto - euestoudesperto@gmail.com',
          v_booking.id,
          'pending',
          v_reminder_24h_time
        );
      END IF;

      -- Registar lembrete criado
      INSERT INTO scheduled_reminders (
        booking_id,
        reminder_type,
        scheduled_for,
        status
      ) VALUES (
        v_booking.id,
        '24h',
        v_reminder_24h_time,
        'pending'
      );
    END LOOP;

    -- Processar consultas confirmadas nas próximas 3 horas (lembrete 2h)
    FOR v_booking IN
      SELECT b.*
      FROM bookings b
      WHERE b.status = 'confirmed'
        AND b.date > NOW()
        AND b.date <= NOW() + INTERVAL '3 hours'
        AND NOT EXISTS (
          SELECT 1 FROM scheduled_reminders sr
          WHERE sr.booking_id = b.id
          AND sr.reminder_type = '2h'
        )
    LOOP
      -- Obter dados do cliente
      SELECT * INTO v_client FROM users WHERE id = v_booking.client_id;

      -- Obter dados do serviço
      SELECT * INTO v_service FROM services WHERE id = v_booking.service_id;

      -- Obter dados do terapeuta
      SELECT * INTO v_therapist FROM users WHERE id = v_booking.therapist_id;

      -- Calcular hora do lembrete (2h antes)
      v_reminder_2h_time := v_booking.date - INTERVAL '2 hours';

      -- Criar notificação de email (lembrete 2h)
      IF v_client.email IS NOT NULL THEN
        INSERT INTO notifications (
          type,
          recipient_type,
          recipient_id,
          recipient_email,
          subject,
          message,
          booking_id,
          status,
          scheduled_for
        ) VALUES (
          'email',
          'client',
          v_client.id,
          v_client.email,
          'Lembrete: Consulta em 2 horas - ' || v_service.name,
          'Olá ' || v_client.name || E',\n\n' ||
          'Este é um lembrete da sua consulta marcada para daqui a 2 horas.\n\n' ||
          '📅 Detalhes:\n' ||
          '- Serviço: ' || v_service.name || E'\n' ||
          '- Terapeuta: ' || v_therapist.name || E'\n' ||
          '- Hora: ' || TO_CHAR(v_booking.date, 'HH24:MI') || E'\n' ||
          '- Duração: ' || v_service.duration || E' minutos\n\n' ||
          '📍 Localização: Desperto - Coaching ao Minuto\n\n' ||
          '⏰ Por favor, chegue 5 minutos antes.\n\n' ||
          'Aguardamos por si!\n\n' ||
          'Equipa Desperto\n' ||
          'euestoudesperto@gmail.com',
          v_booking.id,
          'pending',
          v_reminder_2h_time
        );
      END IF;

      -- Criar notificação de SMS se tiver telefone
      IF v_client.phone IS NOT NULL AND v_client.phone != '' THEN
        INSERT INTO notifications (
          type,
          recipient_type,
          recipient_id,
          recipient_phone,
          subject,
          message,
          booking_id,
          status,
          scheduled_for
        ) VALUES (
          'sms',
          'client',
          v_client.id,
          v_client.phone,
          'Lembrete Consulta',
          'Olá ' || v_client.name || '! Lembrete: consulta em 2h às ' ||
          TO_CHAR(v_booking.date, 'HH24:MI') || '. Chegue 5min antes. Desperto',
          v_booking.id,
          'pending',
          v_reminder_2h_time
        );
      END IF;

      -- Registar lembrete criado
      INSERT INTO scheduled_reminders (
        booking_id,
        reminder_type,
        scheduled_for,
        status
      ) VALUES (
        v_booking.id,
        '2h',
        v_reminder_2h_time,
        'pending'
      );
    END LOOP;

  END $$;
  $$
);

-- ============================================================================
-- 4. CRON JOB: LIMPAR NOTIFICAÇÕES ANTIGAS
-- ============================================================================
-- Executa diariamente às 3h da manhã
-- Remove notificações enviadas há mais de 90 dias

SELECT cron.schedule(
  'cleanup-old-notifications',
  '0 3 * * *', -- Todos os dias às 3h da manhã
  $$
  DO $$
  BEGIN
    -- Apagar notificações enviadas há mais de 90 dias
    DELETE FROM notifications
    WHERE status = 'sent'
      AND sent_at < NOW() - INTERVAL '90 days';

    -- Apagar lembretes processados há mais de 90 dias
    DELETE FROM scheduled_reminders
    WHERE status IN ('sent', 'cancelled')
      AND updated_at < NOW() - INTERVAL '90 days';

    -- Apagar notificações falhadas há mais de 30 dias
    DELETE FROM notifications
    WHERE status = 'failed'
      AND created_at < NOW() - INTERVAL '30 days';

    RAISE NOTICE 'Cleanup completed successfully';
  END $$;
  $$
);

-- ============================================================================
-- 5. VERIFICAR CRON JOBS CRIADOS
-- ============================================================================

-- Listar todos os cron jobs ativos
SELECT
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active,
  jobname
FROM cron.job
WHERE jobname IN (
  'process-pending-notifications',
  'create-booking-reminders',
  'cleanup-old-notifications'
)
ORDER BY jobname;

-- ============================================================================
-- 6. TESTAR MANUALMENTE (OPCIONAL)
-- ============================================================================

-- Testar processamento de notificações (descomente para testar)
-- SELECT net.http_post(
--   url := 'https://your-project.supabase.co/functions/v1/process-notifications',
--   headers := jsonb_build_object(
--     'Authorization', 'Bearer your-service-role-key',
--     'Content-Type', 'application/json'
--   ),
--   body := '{}'::jsonb
-- );

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
/*
  1. Os cron jobs são executados no timezone UTC
  2. Para Portugal, adicione +1h no inverno e +2h no verão
  3. Os lembretes são criados ANTES da hora marcada:
     - Lembrete 24h: criado 24h antes da consulta
     - Lembrete 2h: criado 2h antes da consulta

  4. Frequência recomendada:
     - process-pending-notifications: */5 (cada 5 min) - pode ajustar para */10 ou */15
     - create-booking-reminders: 0 * (de hora em hora)
     - cleanup-old-notifications: 0 3 (1x por dia às 3h)

  5. Monitorização:
     Para ver logs de execução dos cron jobs:

     SELECT * FROM cron.job_run_details
     WHERE jobid IN (
       SELECT jobid FROM cron.job
       WHERE jobname LIKE '%notification%'
       OR jobname LIKE '%reminder%'
     )
     ORDER BY start_time DESC
     LIMIT 20;

  6. Desativar temporariamente um cron job:
     UPDATE cron.job
     SET active = false
     WHERE jobname = 'nome-do-job';

  7. Reativar um cron job:
     UPDATE cron.job
     SET active = true
     WHERE jobname = 'nome-do-job';
*/
