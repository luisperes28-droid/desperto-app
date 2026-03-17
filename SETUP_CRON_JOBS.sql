-- ============================================
-- CONFIGURAÇÃO DE CRON JOBS PARA NOTIFICAÇÕES
-- ============================================
--
-- Execute este script no SQL Editor do Supabase Dashboard
-- para configurar notificações automáticas.
--
-- ANTES DE EXECUTAR:
-- 1. Habilite a extensão pg_cron em Database → Extensions
-- 2. Substitua os valores abaixo:
--    - SEU_PROJECT_URL: https://seu-projeto.supabase.co
--    - SUA_ANON_KEY: sua anon key do Supabase
-- ============================================

-- Habilitar extensão pg_cron (se ainda não estiver)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Habilitar extensão http (necessária para fazer requisições)
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA net;

-- ============================================
-- CRON JOB 1: Processar notificações a cada 15 minutos
-- ============================================
-- Este job verifica agendamentos que precisam de lembretes
-- e envia notificações via Edge Function
-- ============================================

SELECT cron.schedule(
  'process-notifications-15min',
  '*/15 * * * *', -- A cada 15 minutos
  $$
  SELECT net.http_post(
    url := 'https://SEU_PROJECT_URL/functions/v1/process-notifications',
    headers := jsonb_build_object(
      'Authorization', 'Bearer SUA_ANON_KEY',
      'Content-Type', 'application/json'
    )
  ) AS request_id;
  $$
);

-- ============================================
-- CRON JOB 2: Verificar agendamentos futuros diariamente
-- ============================================
-- Este job executa às 9h da manhã todos os dias
-- para verificar agendamentos das próximas 24h
-- ============================================

SELECT cron.schedule(
  'check-upcoming-bookings-daily',
  '0 9 * * *', -- Todo dia às 9h
  $$
  SELECT net.http_post(
    url := 'https://SEU_PROJECT_URL/functions/v1/notifications',
    headers := jsonb_build_object(
      'Authorization', 'Bearer SUA_ANON_KEY',
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object('action', 'check_upcoming')
  ) AS request_id;
  $$
);

-- ============================================
-- CRON JOB 3: Limpar notificações antigas (semanal)
-- ============================================
-- Remove notificações enviadas com mais de 30 dias
-- Executa todo domingo às 3h da manhã
-- ============================================

SELECT cron.schedule(
  'cleanup-old-notifications',
  '0 3 * * 0', -- Todo domingo às 3h
  $$
  DELETE FROM notifications
  WHERE status = 'sent'
  AND sent_at < NOW() - INTERVAL '30 days';
  $$
);

-- ============================================
-- CRON JOB 4: Atualizar status de agendamentos passados
-- ============================================
-- Marca agendamentos como 'concluído' se a data já passou
-- Executa a cada hora
-- ============================================

SELECT cron.schedule(
  'update-past-bookings',
  '0 * * * *', -- A cada hora
  $$
  UPDATE bookings
  SET status = 'completed'
  WHERE status = 'confirmed'
  AND booking_time < NOW() - INTERVAL '2 hours';
  $$
);

-- ============================================
-- VERIFICAR CRON JOBS ATIVOS
-- ============================================

-- Ver todos os cron jobs configurados
SELECT
  jobid,
  jobname,
  schedule,
  command,
  active
FROM cron.job
ORDER BY jobname;

-- Ver histórico de execuções (últimas 50)
SELECT
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 50;

-- ============================================
-- COMANDOS ÚTEIS
-- ============================================

-- Remover um cron job específico:
-- SELECT cron.unschedule('process-notifications-15min');

-- Desabilitar um cron job temporariamente:
-- UPDATE cron.job SET active = false WHERE jobname = 'process-notifications-15min';

-- Reabilitar um cron job:
-- UPDATE cron.job SET active = true WHERE jobname = 'process-notifications-15min';

-- Executar um job manualmente (para testar):
-- SELECT cron.run_job('process-notifications-15min');

-- Ver apenas jobs ativos:
-- SELECT * FROM cron.job WHERE active = true;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
--
-- 1. TIMEZONE: Os horários são em UTC por padrão
--    Para horário de Portugal (WET/WEST), considere:
--    - Inverno (WET): UTC +0
--    - Verão (WEST): UTC +1
--
-- 2. MONITORAMENTO: Verifique regularmente o histórico:
--    SELECT * FROM cron.job_run_details
--    WHERE status = 'failed'
--    ORDER BY start_time DESC;
--
-- 3. LOGS: Acesse os logs das Edge Functions em:
--    Supabase Dashboard → Edge Functions → Logs
--
-- 4. RATE LIMITS: Edge Functions têm limites de invocação
--    conforme o plano do Supabase. Verifique em:
--    https://supabase.com/pricing
--
-- 5. CUSTOS: Execuções frequentes de cron jobs consomem
--    recursos. Monitore o uso no dashboard.
--
-- ============================================
