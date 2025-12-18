import { Booking, Client, Service, Therapist } from '../types';
import { EmailService } from './emailService';

export class ReminderService {
  private static reminderIntervals = [
    { hours: 24, type: 'email' as const },
    { hours: 2, type: 'sms' as const },
    { hours: 1, type: 'email' as const }
  ];

  static async scheduleReminders(
    booking: Booking,
    client: Client,
    service: Service,
    therapist: Therapist
  ): Promise<void> {
    const bookingTime = new Date(booking.date);

    for (const reminder of this.reminderIntervals) {
      const reminderTime = new Date(bookingTime.getTime() - (reminder.hours * 60 * 60 * 1000));
      
      if (reminderTime > new Date()) {
        // In a real application, you would schedule these with a job queue like:
        // - Bull Queue (Redis)
        // - AWS SQS with Lambda
        // - Cron jobs
        // - Database-based scheduling
        
        console.log(`📅 Reminder scheduled: ${reminder.type} ${reminder.hours}h before appointment`);
        
        // Simulate scheduling
        window.setTimeout(async () => {
          await this.sendReminder(booking, client, service, therapist, reminder.hours, reminder.type);
        }, reminderTime.getTime() - Date.now());
      }
    }
  }

  private static async sendReminder(
    booking: Booking,
    client: Client,
    service: Service,
    therapist: Therapist,
    hoursUntil: number,
    type: 'email' | 'sms'
  ): Promise<void> {
    if (booking.status === 'cancelled') return;

    if (type === 'email') {
      const emailTemplate = EmailService.generateReminderEmail(
        booking,
        client,
        service,
        therapist,
        hoursUntil
      );
      
      const success = await EmailService.sendEmail(client.email, emailTemplate);
      console.log(`📧 Email reminder sent: ${success ? 'Success' : 'Failed'}`);
    } else if (type === 'sms' && client.phone) {
      const smsMessage = `Lembrete: Consulta ${service.name} em ${hoursUntil}h com ${therapist.name}. Desperto - ${new Date(booking.date).toLocaleString('pt-PT')}`;
      
      const success = await EmailService.sendSMS(client.phone, smsMessage);
      console.log(`📱 SMS reminder sent: ${success ? 'Success' : 'Failed'}`);
    }
  }

  static async sendImmediateReminder(
    booking: Booking,
    client: Client,
    service: Service,
    therapist: Therapist,
    type: 'confirmation' | 'cancellation' | 'reschedule'
  ): Promise<void> {
    let emailTemplate;
    
    switch (type) {
      case 'confirmation':
        emailTemplate = EmailService.generateConfirmationEmail(booking, client, service, therapist);
        break;
      case 'cancellation':
        emailTemplate = {
          subject: 'Agendamento Cancelado',
          body: `Olá ${client.name}, o seu agendamento de ${service.name} foi cancelado.`
        };
        break;
      case 'reschedule':
        emailTemplate = EmailService.generateConfirmationEmail(booking, client, service, therapist);
        emailTemplate.subject = 'Agendamento Reagendado - ' + service.name;
        break;
    }
    
    await EmailService.sendEmail(client.email, emailTemplate);
  }
}