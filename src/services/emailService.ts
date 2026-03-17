import { Booking, Client, Service, Therapist } from '../types';

export interface EmailTemplate {
  subject: string;
  body: string;
}

export class EmailService {
  private static getEdgeFunctionHeaders() {
    return {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };
  }

  private static getEdgeFunctionUrl(fn: string) {
    return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${fn}`;
  }

  static generateConfirmationEmail(
    booking: Booking,
    client: Client,
    service: Service,
    therapist: Therapist,
    couponPassword?: string
  ): EmailTemplate {
    const bookingDate = new Date(booking.date);
    const formattedDate = bookingDate.toLocaleDateString('pt-PT', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const formattedTime = bookingDate.toLocaleTimeString('pt-PT', {
      hour: '2-digit', minute: '2-digit'
    });

    const couponSection = couponPassword
      ? `\nCupao gratuito utilizado - Password validada: ${couponPassword}\nConsulta gratuita confirmada para ${formattedDate} as ${formattedTime}\n`
      : '';

    const meetingSection = booking.meetingLink
      ? `\nLink da sessao (Google Meet): ${booking.meetingLink}`
      : '\nO link da sessao (Google Meet) sera enviado antes da consulta.';

    return {
      subject: `Confirmacao de Agendamento - ${service.name}`,
      body: [
        `Ola ${client.name},`,
        '',
        'O seu agendamento foi confirmado com sucesso!',
        '',
        'Detalhes do Agendamento:',
        `- Servico: ${service.name}`,
        `- Terapeuta: ${therapist.name}`,
        `- Data: ${formattedDate}`,
        `- Hora: ${formattedTime}`,
        `- Duracao: ${service.duration} minutos`,
        `- Preco: ${service.price}EUR`,
        couponSection,
        '--- Consulta 100% Online ---',
        'A sua sessao sera realizada por videochamada atraves do Google Meet.',
        meetingSection,
        '',
        'Antes da sessao, por favor:',
        '- Teste a sua camara e microfone',
        '- Escolha um local calmo e com boa ligacao a internet',
        '- Entre na reuniao 2-3 minutos antes da hora marcada',
        '',
        `Contacto: euestoudesperto@gmail.com`,
        '',
        'Obrigado por escolher a Desperto!',
        '',
        'Cumprimentos,',
        'Equipa Desperto'
      ].filter(line => line !== undefined).join('\n')
    };
  }

  static generateReminderEmail(
    booking: Booking,
    client: Client,
    service: Service,
    therapist: Therapist,
    hoursUntil: number
  ): EmailTemplate {
    const bookingDate = new Date(booking.date);
    const formattedDate = bookingDate.toLocaleDateString('pt-PT');
    const formattedTime = bookingDate.toLocaleTimeString('pt-PT', {
      hour: '2-digit', minute: '2-digit'
    });

    const meetingSection = booking.meetingLink
      ? `\nLink da sessao (Google Meet): ${booking.meetingLink}`
      : '\nO link da sessao sera enviado em breve.';

    return {
      subject: `Lembrete: Consulta em ${hoursUntil} horas - ${service.name}`,
      body: [
        `Ola ${client.name},`,
        '',
        'Este e um lembrete da sua consulta marcada para hoje.',
        '',
        'Detalhes:',
        `- Servico: ${service.name}`,
        `- Terapeuta: ${therapist.name}`,
        `- Data: ${formattedDate}`,
        `- Hora: ${formattedTime}`,
        `- Duracao: ${service.duration} minutos`,
        '',
        '--- Consulta Online (Google Meet) ---',
        meetingSection,
        '',
        'Antes da sessao, por favor:',
        '- Teste a sua camara e microfone',
        '- Escolha um local calmo e com boa ligacao a internet',
        '- Entre na reuniao 2-3 minutos antes da hora marcada',
        '',
        `Contacto: euestoudesperto@gmail.com`,
        '',
        'Aguardamos por si!',
        '',
        'Equipa Desperto'
      ].join('\n')
    };
  }

  static async sendClientConfirmationEmail(
    clientEmail: string,
    clientName: string,
    bookingDate: Date,
    bookingTime: string,
    location: string
  ): Promise<boolean> {
    try {
      const dateDay = String(bookingDate.getDate()).padStart(2, '0');
      const dateMonth = String(bookingDate.getMonth() + 1).padStart(2, '0');
      const dateYear = String(bookingDate.getFullYear());
      const formattedDate = `${dateDay}/${dateMonth}/${dateYear}`;

      const response = await fetch(this.getEdgeFunctionUrl('send-email'), {
        method: 'POST',
        headers: this.getEdgeFunctionHeaders(),
        body: JSON.stringify({
          to_email: clientEmail,
          to_name: clientName,
          subject: 'Confirmacao de Agendamento - Desperto',
          message: `Ola ${clientName},\n\nA sua marcacao foi confirmada para ${formattedDate} as ${bookingTime}.\n\nA sessao sera realizada online via Google Meet. O link sera enviado antes da consulta.\n\nAntes da sessao, teste a sua camara e microfone.\n\nContacto: euestoudesperto@gmail.com\n\nCumprimentos,\nEquipa Desperto`
        })
      });

      const result = await response.json();
      return result.success === true;
    } catch {
      return true;
    }
  }

  static async sendEmail(to: string, template: EmailTemplate): Promise<boolean> {
    try {
      const response = await fetch(this.getEdgeFunctionUrl('send-email'), {
        method: 'POST',
        headers: this.getEdgeFunctionHeaders(),
        body: JSON.stringify({
          to_email: to,
          subject: template.subject,
          message: template.body
        })
      });

      const result = await response.json();
      return result.success === true;
    } catch {
      return false;
    }
  }

  static async sendRescheduleNotification(
    clientName: string,
    clientEmail: string,
    oldDate: Date,
    newDate: Date,
    notes: string,
    serviceName: string
  ): Promise<boolean> {
    try {
      const formattedOldDate = oldDate.toLocaleDateString('pt-PT', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });

      const formattedNewDate = newDate.toLocaleDateString('pt-PT', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });

      const adminResponse = await fetch(this.getEdgeFunctionUrl('send-email'), {
        method: 'POST',
        headers: this.getEdgeFunctionHeaders(),
        body: JSON.stringify({
          to_email: 'euestoudesperto@gmail.com',
          subject: `Consulta Reagendada - ${clientName}`,
          message: `Consulta reagendada.\n\nCliente: ${clientName} (${clientEmail})\nServico: ${serviceName}\nData anterior: ${formattedOldDate}\nNova data: ${formattedNewDate}\nMotivo: ${notes || 'Nao especificado'}`
        })
      });

      const adminResult = await adminResponse.json();

      await fetch(this.getEdgeFunctionUrl('send-email'), {
        method: 'POST',
        headers: this.getEdgeFunctionHeaders(),
        body: JSON.stringify({
          to_email: clientEmail,
          subject: `Agendamento Reagendado - ${serviceName}`,
          message: `Ola ${clientName},\n\nO seu agendamento foi reagendado.\n\nData anterior: ${formattedOldDate}\nNova data: ${formattedNewDate}\n\nA sessao sera realizada online via Google Meet. O novo link sera enviado antes da consulta.\n\nSe tiver alguma duvida, contacte-nos: euestoudesperto@gmail.com\n\nCumprimentos,\nEquipa Desperto`
        })
      });

      return adminResult.success === true;
    } catch {
      return false;
    }
  }

  static async sendSMS(to: string, message: string): Promise<boolean> {
    try {
      const response = await fetch(this.getEdgeFunctionUrl('send-sms'), {
        method: 'POST',
        headers: this.getEdgeFunctionHeaders(),
        body: JSON.stringify({ to, message })
      });

      const result = await response.json();
      return result.success === true;
    } catch {
      return false;
    }
  }
}
