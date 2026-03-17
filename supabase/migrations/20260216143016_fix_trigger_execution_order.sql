/*
  # Corrigir ordem de execução dos triggers

  1. Problema
    - trigger_send_immediate_confirmation executa DEPOIS de trigger_create_booking_notifications
    - send_booking_confirmation deleta todas notificações pending e cria novas
    - Resultado: lembretes criados por schedule_booking_reminders são apagados!

  2. Solução
    - Renomear trigger de confirmação para executar PRIMEIRO (ordem alfabética)
    - Garantir que confirmação imediata é criada antes dos lembretes futuros

  3. Ordem correta de execução
    - a_trigger_send_immediate_confirmation (1º) → cria confirmação imediata
    - trigger_create_booking_notifications (2º) → adiciona lembretes futuros
*/

-- Remover trigger antigo
DROP TRIGGER IF EXISTS trigger_send_immediate_confirmation ON bookings;

-- Criar trigger com nome que executa primeiro (começa com 'a_')
CREATE TRIGGER a_trigger_send_immediate_confirmation
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_send_booking_confirmation();