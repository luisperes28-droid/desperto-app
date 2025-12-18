export interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  description: string;
  location?: string;
}

export class CalendarService {
  static generateGoogleCalendarUrl(event: CalendarEvent): string {
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${formatDate(event.start)}/${formatDate(event.end)}`,
      details: event.description,
      location: event.location || ''
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  static generateOutlookCalendarUrl(event: CalendarEvent): string {
    const params = new URLSearchParams({
      subject: event.title,
      startdt: event.start.toISOString(),
      enddt: event.end.toISOString(),
      body: event.description,
      location: event.location || ''
    });

    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
  }

  static generateICSFile(event: CalendarEvent): string {
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Desperto//Booking System//EN',
      'BEGIN:VEVENT',
      `UID:${Date.now()}@desperto.com`,
      `DTSTART:${formatDate(event.start)}`,
      `DTEND:${formatDate(event.end)}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
      event.location ? `LOCATION:${event.location}` : '',
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT1H',
      'ACTION:DISPLAY',
      'DESCRIPTION:Lembrete: Consulta em 1 hora',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(Boolean).join('\r\n');

    return icsContent;
  }

  static downloadICSFile(event: CalendarEvent, filename: string = 'appointment.ics'): void {
    const icsContent = this.generateICSFile(event);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}