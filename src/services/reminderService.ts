import { Booking, Client, Service, Therapist } from '../types';
import { supabase } from '../lib/supabase';

export class ReminderService {
  static async scheduleReminders(
    booking: Booking,
    client: Client,
    _service: Service,
    _therapist: Therapist
  ): Promise<void> {
    const bookingTime = new Date(booking.date);
    const reminderIntervals = [
      { hours: 24, type: 'email' as const, reminderType: '24h' as const },
      { hours: 2, type: 'sms' as const, reminderType: '2h' as const },
      { hours: 1, type: 'email' as const, reminderType: '1h' as const }
    ];

    for (const reminder of reminderIntervals) {
      const reminderTime = new Date(bookingTime.getTime() - (reminder.hours * 60 * 60 * 1000));

      if (reminderTime > new Date()) {
        await supabase.from('scheduled_reminders').insert({
          booking_id: booking.id,
          reminder_type: reminder.reminderType,
          notification_type: reminder.type,
          scheduled_for: reminderTime.toISOString(),
          status: 'pending'
        });
      }
    }
  }

  static async sendImmediateReminder(
    booking: Booking,
    client: Client,
    service: Service,
    _therapist: Therapist,
    type: 'confirmation' | 'cancellation' | 'reschedule'
  ): Promise<void> {
    const bookingDate = new Date(booking.date);
    const formattedDate = bookingDate.toLocaleDateString('pt-PT', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const formattedTime = bookingDate.toLocaleTimeString('pt-PT', {
      hour: '2-digit', minute: '2-digit'
    });

    let subject = '';
    let message = '';

    switch (type) {
      case 'confirmation':
        subject = `Confirmacao de Agendamento - ${service.name}`;
        message = `Ola ${client.name},\n\nO seu agendamento foi confirmado.\n\nServico: ${service.name}\nData: ${formattedDate}\nHora: ${formattedTime}\nDuracao: ${service.duration} minutos`;
        break;
      case 'cancellation':
        subject = 'Agendamento Cancelado';
        message = `Ola ${client.name},\n\nO seu agendamento de ${service.name} marcado para ${formattedDate} as ${formattedTime} foi cancelado.`;
        break;
      case 'reschedule':
        subject = `Agendamento Reagendado - ${service.name}`;
        message = `Ola ${client.name},\n\nO seu agendamento foi reagendado.\n\nServico: ${service.name}\nNova data: ${formattedDate}\nHora: ${formattedTime}`;
        break;
    }

    await supabase.from('notifications').insert({
      type: 'email',
      recipient_type: 'client',
      recipient_id: client.id,
      recipient_email: client.email,
      subject,
      message,
      booking_id: booking.id,
      status: 'pending',
      scheduled_for: new Date().toISOString()
    });

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    try {
      await fetch(`${supabaseUrl}/functions/v1/process-notifications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });
    } catch (_error) {
      // Notification processing will be retried by cron
    }
  }
}
