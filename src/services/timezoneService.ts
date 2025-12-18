export class TimezoneService {
  static getUserTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  static getBusinessTimezone(): string {
    // Assuming business is in Portugal
    return 'Europe/Lisbon';
  }

  static convertToUserTimezone(date: Date, userTimezone?: string): Date {
    const timezone = userTimezone || this.getUserTimezone();
    
    // Create a new date in the user's timezone
    const userDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    return userDate;
  }

  static convertToBusinessTimezone(date: Date): Date {
    const businessTimezone = this.getBusinessTimezone();
    const businessDate = new Date(date.toLocaleString('en-US', { timeZone: businessTimezone }));
    return businessDate;
  }

  static formatDateInTimezone(date: Date, timezone: string, locale: string = 'pt-PT'): string {
    return date.toLocaleString(locale, {
      timeZone: timezone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  static getTimezoneOffset(timezone: string): number {
    const now = new Date();
    const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
    const targetTime = new Date(utc.toLocaleString('en-US', { timeZone: timezone }));
    return (targetTime.getTime() - utc.getTime()) / (1000 * 60 * 60);
  }

  static getCommonTimezones(): Array<{ value: string; label: string; offset: string }> {
    const timezones = [
      'Europe/Lisbon',
      'Europe/London',
      'Europe/Paris',
      'Europe/Madrid',
      'America/New_York',
      'America/Los_Angeles',
      'Asia/Tokyo',
      'Australia/Sydney'
    ];

    return timezones.map(tz => {
      const offset = this.getTimezoneOffset(tz);
      const offsetStr = offset >= 0 ? `+${offset}` : `${offset}`;
      return {
        value: tz,
        label: tz.replace('_', ' ').replace('/', ' / '),
        offset: `UTC${offsetStr}`
      };
    });
  }
}