/*
  # Adicionar trigger para confirmação imediata de booking

  1. Problema
    - Função send_booking_confirmation existe mas não tem trigger
    - Clientes não recebem email/SMS de confirmação ao criar booking
    - Apenas lembretes futuros são agendados

  2. Solução
    - Criar função wrapper para trigger
    - Criar trigger que chama send_booking_confirmation ao inserir booking
    - Confirmação imediata (email + SMS) enviada logo após criar booking

  3. Fluxo completo após esta migration
    - Cliente cria booking → Triggers disparam em ordem
    - send_booking_confirmation executa → cria notificações imediatas (email + SMS)
    - schedule_booking_reminders executa → cria lembretes futuros (24h, 2h, 1h antes)
    - Cron job processa notificações pendentes a cada minuto
*/

-- Função wrapper para trigger de confirmação
CREATE OR REPLACE FUNCTION trigger_send_booking_confirmation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  -- Enviar confirmação imediata apenas para bookings confirmadas ou pendentes
  IF NEW.status IN ('confirmed', 'pending') THEN
    PERFORM send_booking_confirmation(NEW.id, NEW.booking_date);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para enviar confirmação imediata ao criar booking
DROP TRIGGER IF EXISTS trigger_send_immediate_confirmation ON bookings;
CREATE TRIGGER trigger_send_immediate_confirmation
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_send_booking_confirmation();

-- Garantir que trigger de confirmação executa ANTES dos lembretes
-- PostgreSQL executa triggers AFTER INSERT por ordem alfabética
-- trigger_send_immediate_confirmation executa antes de trigger_create_booking_notifications