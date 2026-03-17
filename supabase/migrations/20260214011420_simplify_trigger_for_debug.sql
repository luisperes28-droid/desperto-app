/*
  # Simplificar trigger para debug

  1. Problema
    - send_booking_confirmation não está sendo chamada
    - EXCEPTION pode estar escondendo o erro
  
  2. Solução
    - Remover blocos EXCEPTION temporariamente
    - Deixar erros aparecerem para debug
    - Chamar as funções diretamente
*/

CREATE OR REPLACE FUNCTION trigger_schedule_booking_reminders()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  -- Para bookings confirmadas
  IF NEW.status = 'confirmed' THEN
    -- 1. Enviar notificação de confirmação IMEDIATA
    PERFORM send_booking_confirmation(NEW.id, NEW.booking_date);
    
    -- 2. Criar lembretes futuros (24h, 2h, 1h antes)
    PERFORM schedule_booking_reminders(NEW.id, NEW.booking_date);
  END IF;
  
  RETURN NEW;
END;
$$;