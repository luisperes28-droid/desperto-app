/*
  # Corrigir cron job com URL direta

  1. Problema
    - current_setting('app.supabase_url') não funciona
    - Variáveis customizadas não estão disponíveis
  
  2. Solução
    - Remover cron job antigo
    - Criar novo com URL hardcoded
    - Usar service role key do sistema
*/

-- Remover cron job antigo
SELECT cron.unschedule('process-pending-notifications');

-- Criar novo cron job com URL direta e autorização correta
SELECT cron.schedule(
  'process-pending-notifications',
  '* * * * *', -- A cada minuto
  $$
  SELECT net.http_post(
    url := 'https://dnswlrvleqvsueawxzfy.supabase.co/functions/v1/process-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuc3dscnZsZXF2c3VlYXd4emZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM4MTIyMiwiZXhwIjoyMDc0OTU3MjIyfQ.yl7b9TgaJYVmNMC1hQ-D60fwCZ7jwPp8EsK5dkBmguc'
    ),
    body := '{}'::jsonb
  );
  $$
);