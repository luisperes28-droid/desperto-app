/*
  # Ativar extensão pg_cron para notificações automáticas

  1. Extensões
    - Ativa `pg_cron` para permitir tarefas agendadas (cron jobs)
  
  2. Configuração
    - Cria job que executa a cada minuto para processar notificações pendentes
    - Chama a edge function `process-notifications` automaticamente
  
  3. Notas Importantes
    - O pg_cron permite automatizar o envio de notificações
    - Não requer intervenção manual
    - Executa verificações a cada minuto
*/

-- Ativar extensão pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Agendar job para processar notificações a cada minuto
SELECT cron.schedule(
  'process-pending-notifications',
  '* * * * *',  -- A cada minuto
  $$
  SELECT
    net.http_post(
      url:=current_setting('app.supabase_url') || '/functions/v1/process-notifications',
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
      ),
      body:=jsonb_build_object()
    );
  $$
);