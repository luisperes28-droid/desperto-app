import { Booking, BusinessSettings, TherapistAvailability } from '../types';

export interface TimeSlot {
  time: string;
  available: boolean;
  reason?: string;
  isPremium?: boolean;
  premiumPrice?: number;
  occupiedBy?: string;
}

export class AvailabilityService {
  static generateTimeSlots(
    date: Date,
    businessSettings: BusinessSettings,
    bookings: Booking[],
    selectedTherapistId: string,
    serviceDuration: number = 60,
    therapists: any[] = [],
    therapistAvailability?: TherapistAvailability,
    clientEmail?: string,
    clients: any[] = [],
    allServices: any[] = []
  ): TimeSlot[] {
    const therapist = therapists.find(t => t.id === selectedTherapistId);
    const availability = therapist?.availability;

    if (!availability) {
      return [];
    }

    const dayOfWeek = date.getDay();

    const isBlockedDate = availability.blockedDates?.some(bd => {
      const blocked = new Date(bd);
      return blocked.toDateString() === date.toDateString();
    });

    if (isBlockedDate) {
      return [];
    }

    const customSchedule = availability.customSchedule?.find(cs => {
      const csDate = new Date(cs.date);
      return csDate.toDateString() === date.toDateString();
    });

    if (customSchedule && customSchedule.available === false) {
      return [];
    }

    if (!customSchedule && !availability.workingDays.includes(dayOfWeek)) {
      return [];
    }

    let workingHours;
    if (customSchedule && customSchedule.customHours) {
      workingHours = customSchedule.customHours;
    } else {
      workingHours = availability.workingHours;
    }

    const [startHour, startMinute] = workingHours.start.split(':').map(Number);
    const [endHour, endMinute] = workingHours.end.split(':').map(Number);
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    const breaks = availability.breaks || businessSettings.workingHours.breaks;
    const bufferTime = availability.bufferTime || 0;
    const minAdvanceNotice = availability.minAdvanceNotice || 0;

    const now = new Date();
    const minAllowedTime = new Date(now.getTime() + minAdvanceNotice * 60 * 60 * 1000);

    const slots: TimeSlot[] = [];

    for (let time = startTime; time + serviceDuration <= endTime; time += 30) {
      const hour = Math.floor(time / 60);
      const minute = time % 60;
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

      const slotDateTime = new Date(date);
      slotDateTime.setHours(hour, minute, 0, 0);

      if (slotDateTime < minAllowedTime) {
        slots.push({
          time: timeString,
          available: false,
          reason: 'Horario passado',
          isPremium: false
        });
        continue;
      }

      let isDuringBreak = false;
      for (const breakTime of breaks) {
        const breakStart = this.parseTime(breakTime.start);
        const breakEnd = this.parseTime(breakTime.end);
        const slotEnd = time + serviceDuration;

        if ((time >= breakStart && time < breakEnd) ||
            (slotEnd > breakStart && time < breakEnd)) {
          isDuringBreak = true;
          break;
        }
      }

      if (isDuringBreak) {
        slots.push({
          time: timeString,
          available: false,
          reason: 'Pausa',
          isPremium: false
        });
        continue;
      }

      slots.push({
        time: timeString,
        available: true,
        isPremium: false
      });
    }

    const dateString = date.toDateString();
    const bookingsForDate = bookings.filter(booking => {
      const bookingDate = new Date(booking.date);
      return bookingDate.toDateString() === dateString &&
             booking.therapistId === selectedTherapistId &&
             booking.status !== 'cancelled';
    });

    const clientBookingsForDate = clientEmail ? bookings.filter(booking => {
      const bookingDate = new Date(booking.date);
      const client = clients?.find(c => c.email === clientEmail);
      return bookingDate.toDateString() === dateString &&
             booking.clientId === client?.id &&
             booking.status !== 'cancelled';
    }) : [];

    slots.forEach(slot => {
      if (!slot.available) return;

      const slotDateTime = new Date(date);
      const [slotHour, slotMinute] = slot.time.split(':').map(Number);
      slotDateTime.setHours(slotHour, slotMinute, 0, 0);

      const slotEnd = new Date(slotDateTime);
      slotEnd.setMinutes(slotEnd.getMinutes() + serviceDuration);

      for (const booking of bookingsForDate) {
        const bookingStart = new Date(booking.date);
        const bookingEnd = new Date(bookingStart);
        const service = allServices.find((s: any) => s.id === booking.serviceId);
        const bookingDuration = service ? service.duration : 60;
        bookingEnd.setMinutes(bookingEnd.getMinutes() + bookingDuration);

        const bufferedBookingStart = new Date(bookingStart);
        bufferedBookingStart.setMinutes(bufferedBookingStart.getMinutes() - bufferTime);

        const bufferedBookingEnd = new Date(bookingEnd);
        bufferedBookingEnd.setMinutes(bufferedBookingEnd.getMinutes() + bufferTime);

        if (slotDateTime < bufferedBookingEnd && slotEnd > bufferedBookingStart) {
          slot.available = false;
          slot.reason = 'Ja reservado';
          slot.occupiedBy = booking.therapistId;
          break;
        }
      }

      if (slot.available && clientEmail && clientBookingsForDate.length > 0) {
        for (const clientBooking of clientBookingsForDate) {
          const bookingStart = new Date(clientBooking.date);
          const bookingEnd = new Date(bookingStart);
          const clientService = allServices.find((s: any) => s.id === clientBooking.serviceId);
          const bookingDuration = clientService ? clientService.duration : 60;
          bookingEnd.setMinutes(bookingEnd.getMinutes() + bookingDuration);

          if (slotDateTime < bookingEnd && slotEnd > bookingStart) {
            slot.available = false;
            slot.reason = 'Ja tem consulta marcada neste horario';
            break;
          }
        }
      }
    });

    return slots;
  }

  private static parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }
}
