/*
  # Corrigir trigger para executar confirmação imediata

  1. Problema
    - Trigger não está a executar send_booking_confirmation automaticamente
    - PERFORM pode estar a falhar silenciosamente

  2. Solução
    - Usar bloco BEGIN/EXCEPTION para capturar erros
    - Garantir que ambas as funções executam
    - Adicionar RAISE NOTICE para debug (opcional)
*/

CREATE OR REPLACE FUNCTION trigger_schedule_booking_reminders()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_confirmation_sent boolean := false;
  v_reminders_created boolean := false;
BEGIN
  -- Para bookings confirmadas
  IF NEW.status = 'confirmed' THEN
    -- 1. Enviar notificação de confirmação IMEDIATA
    BEGIN
      PERFORM send_booking_confirmation(NEW.id, NEW.booking_date);
      v_confirmation_sent := true;
    EXCEPTION WHEN OTHERS THEN
      -- Log error mas não falha o trigger
      RAISE WARNING 'Erro ao enviar confirmação: %', SQLERRM;
    END;
    
    -- 2. Criar lembretes futuros (24h, 2h, 1h antes)
    BEGIN
      PERFORM schedule_booking_reminders(NEW.id, NEW.booking_date);
      v_reminders_created := true;
    EXCEPTION WHEN OTHERS THEN
      -- Log error mas não falha o trigger
      RAISE WARNING 'Erro ao criar lembretes: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;