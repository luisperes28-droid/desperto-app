import { supabase } from '../lib/supabase';

export interface NotificationResult {
  success: boolean;
  message: string;
  emailSent?: boolean;
  smsSent?: boolean;
}

export class NotificationService {
  private static readonly ADMIN_EMAIL = 'euestoudesperto@gmail.com';

  static async createBookingNotifications(
    bookingId: string,
    clientId: string,
    clientEmail: string,
    clientPhone: string | undefined,
    _therapistId: string,
    bookingDate: Date,
    details?: { clientName?: string; serviceName?: string; therapistName?: string; duration?: number; price?: number; meetingLink?: string }
  ): Promise<NotificationResult> {
    try {
      const formattedDate = bookingDate.toLocaleDateString('pt-PT', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
      const formattedTime = bookingDate.toLocaleTimeString('pt-PT', {
        hour: '2-digit', minute: '2-digit'
      });

      const clientName = details?.clientName || clientEmail.split('@')[0];
      const serviceName = details?.serviceName || 'Consulta';
      const therapistName = details?.therapistName || '';

      const adminMessage = [
        'Nova marcacao recebida.',
        '',
        `Cliente: ${clientName} (${clientEmail})`,
        clientPhone ? `Telefone: ${clientPhone}` : '',
        `Servico: ${serviceName}`,
        therapistName ? `Terapeuta: ${therapistName}` : '',
        `Data: ${formattedDate} as ${formattedTime}`,
      ].filter(Boolean).join('\n');

      await supabase.from('notifications').insert({
        type: 'email',
        recipient_type: 'admin',
        recipient_email: this.ADMIN_EMAIL,
        subject: `Nova Marcacao - ${clientName} - ${serviceName}`,
        message: adminMessage,
        booking_id: bookingId,
        status: 'pending',
        scheduled_for: new Date().toISOString()
      });

      await this.triggerNotificationProcessing();

      return {
        success: true,
        message: 'Notificacoes criadas e enviadas com sucesso',
        emailSent: true,
        smsSent: !!clientPhone
      };
    } catch (error) {
      console.error('Notification service error:', error);
      return {
        success: false,
        message: 'Erro ao criar notificacoes',
        emailSent: false,
        smsSent: false
      };
    }
  }

  static async triggerNotificationProcessing(): Promise<void> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      await fetch(`${supabaseUrl}/functions/v1/process-notifications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });
    } catch {
      // Will be retried by cron
    }
  }

  static async sendRescheduleNotification(
    bookingId: string,
    clientId: string,
    clientEmail: string,
    oldDate: Date,
    newDate: Date,
    notes: string
  ): Promise<NotificationResult> {
    try {
      const { error } = await supabase.from('notifications').insert({
        type: 'email',
        recipient_type: 'client',
        recipient_id: clientId,
        recipient_email: clientEmail,
        subject: 'Consulta Reagendada',
        message: `A sua consulta foi reagendada.\n\nData anterior: ${oldDate.toLocaleString('pt-PT')}\nNova data: ${newDate.toLocaleString('pt-PT')}\n\nMotivo: ${notes || 'Nao especificado'}`,
        booking_id: bookingId,
        status: 'pending',
        scheduled_for: new Date().toISOString()
      });

      if (error) throw error;

      await supabase.from('notifications').insert({
        type: 'email',
        recipient_type: 'admin',
        recipient_email: this.ADMIN_EMAIL,
        subject: 'Consulta Reagendada',
        message: `Consulta reagendada.\n\nCliente: ${clientEmail}\nData anterior: ${oldDate.toLocaleString('pt-PT')}\nNova data: ${newDate.toLocaleString('pt-PT')}\n\nMotivo: ${notes || 'Nao especificado'}`,
        booking_id: bookingId,
        status: 'pending',
        scheduled_for: new Date().toISOString()
      });

      await this.triggerNotificationProcessing();

      return {
        success: true,
        message: 'Notificacao de reagendamento enviada',
        emailSent: true
      };
    } catch (error) {
      console.error('Error sending reschedule notification:', error);
      return {
        success: false,
        message: 'Erro ao enviar notificacao',
        emailSent: false
      };
    }
  }

  static async sendCancellationNotification(
    bookingId: string,
    clientId: string,
    clientEmail: string,
    bookingDate: Date,
    serviceName: string
  ): Promise<NotificationResult> {
    try {
      const { error } = await supabase.from('notifications').insert({
        type: 'email',
        recipient_type: 'client',
        recipient_id: clientId,
        recipient_email: clientEmail,
        subject: 'Consulta Cancelada',
        message: `A sua consulta foi cancelada.\n\nServico: ${serviceName}\nData: ${bookingDate.toLocaleString('pt-PT')}\n\nSe tiver alguma duvida, contacte-nos: euestoudesperto@gmail.com`,
        booking_id: bookingId,
        status: 'pending',
        scheduled_for: new Date().toISOString()
      });

      if (error) throw error;

      await supabase.from('notifications').insert({
        type: 'email',
        recipient_type: 'admin',
        recipient_email: this.ADMIN_EMAIL,
        subject: 'Consulta Cancelada',
        message: `Consulta cancelada.\n\nCliente: ${clientEmail}\nServico: ${serviceName}\nData: ${bookingDate.toLocaleString('pt-PT')}`,
        booking_id: bookingId,
        status: 'pending',
        scheduled_for: new Date().toISOString()
      });

      await supabase
        .from('scheduled_reminders')
        .update({ status: 'cancelled' })
        .eq('booking_id', bookingId)
        .eq('status', 'pending');

      await this.triggerNotificationProcessing();

      return {
        success: true,
        message: 'Notificacao de cancelamento enviada',
        emailSent: true
      };
    } catch (error) {
      console.error('Error sending cancellation notification:', error);
      return {
        success: false,
        message: 'Erro ao enviar notificacao',
        emailSent: false
      };
    }
  }

  static async getPendingNotifications(userId: string) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch {
      return [];
    }
  }

  static async getScheduledReminders(bookingId: string) {
    try {
      const { data, error } = await supabase
        .from('scheduled_reminders')
        .select('*')
        .eq('booking_id', bookingId)
        .order('scheduled_for', { ascending: true });

      if (error) throw error;
      return data;
    } catch {
      return [];
    }
  }
}
