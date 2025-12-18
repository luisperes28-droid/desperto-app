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
    clients: any[] = []
  ): TimeSlot[] {
    console.log('🚀 STARTING SLOT GENERATION');
    console.log('📅 Date:', date.toDateString());
    console.log('👨‍⚕️ Therapist ID:', selectedTherapistId);
    
    const therapist = therapists.find(t => t.id === selectedTherapistId);
    console.log('👨‍⚕️ Therapist found:', therapist?.name);
    
    const availability = therapist?.availability;
    console.log('⚙️ Has availability config:', !!availability);
    
    if (!availability) {
      console.log('❌ No availability config found');
      return [];
    }
    
    const slots: TimeSlot[] = [];
    const dayOfWeek = date.getDay();
    
    console.log('📊 Day of week:', dayOfWeek, ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek]);
    console.log('📊 Working days:', availability.workingDays);
    
    // Check if therapist works on this day
    if (!availability.workingDays.includes(dayOfWeek)) {
      console.log('❌ Therapist does not work on this day');
      return [];
    }
    
    // Check for custom schedule
    const customSchedule = availability.customSchedule?.find(cs => {
      const csDate = new Date(cs.date);
      const targetDate = new Date(date);
      const match = csDate.toDateString() === targetDate.toDateString();
      console.log('🔍 Comparing dates:', {
        customDate: csDate.toDateString(),
        targetDate: targetDate.toDateString(),
        match
      });
      return match;
    });
    
    console.log('🎯 Custom schedule found:', !!customSchedule);
    if (customSchedule) {
      console.log('🎯 Custom schedule details:', customSchedule);
    }
    
    // Determine working hours
    let workingHours;
    if (customSchedule && customSchedule.available !== false) {
      if (customSchedule.customHours) {
        workingHours = customSchedule.customHours;
        console.log('⏰ Using custom hours:', workingHours);
      } else {
        workingHours = availability.workingHours;
        console.log('⏰ Using default hours (custom schedule without custom hours):', workingHours);
      }
    } else if (customSchedule && customSchedule.available === false) {
      console.log('❌ Custom schedule blocks this day');
      return [];
    } else {
      workingHours = availability.workingHours;
      console.log('⏰ Using normal working hours (no custom schedule):', workingHours);
    }
    
    // Parse hours
    const [startHour, startMinute] = workingHours.start.split(':').map(Number);
    const [endHour, endMinute] = workingHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;
    
    console.log('⏰ Time range:', {
      start: `${startHour}:${startMinute.toString().padStart(2, '0')}`,
      end: `${endHour}:${endMinute.toString().padStart(2, '0')}`,
      startMinutes: startTime,
      endMinutes: endTime
    });
    
    // Get breaks (lunch time)
    const breaks = availability.breaks || businessSettings.workingHours.breaks;
    console.log('🍽️ Breaks configured:', breaks);
    
    // Generate slots every 30 minutes
    console.log('🔄 Generating slots...');
    for (let time = startTime; time < endTime; time += 30) {
      const hour = Math.floor(time / 60);
      const minute = time % 60;
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      console.log(`⏰ Creating slot: ${timeString}`);
      
      // Check if this slot conflicts with lunch break
      let isDuringBreak = false;
      let breakReason = '';
      
      for (const breakTime of breaks) {
        const breakStart = this.parseTime(breakTime.start);
        const breakEnd = this.parseTime(breakTime.end);
        
        console.log(`🍽️ Checking break: ${breakTime.start}-${breakTime.end} (${breakStart}-${breakEnd} minutes)`);
        console.log(`⏰ Slot time: ${timeString} (${time} minutes)`);
        
        // Check if slot starts during break or if service would overlap with break
        const slotEnd = time + serviceDuration;
        
        if ((time >= breakStart && time < breakEnd) || 
            (slotEnd > breakStart && time < breakEnd)) {
          isDuringBreak = true;
          breakReason = 'Pausa para almoço';
          console.log(`❌ Slot ${timeString} conflicts with break ${breakTime.start}-${breakTime.end}`);
          break;
        }
      }
      
      slots.push({
        time: timeString,
        available: !isDuringBreak,
        reason: isDuringBreak ? breakReason : undefined,
        isPremium: false
      });
    }
    
    // Filter bookings for this date and therapist
    const dateString = date.toDateString();
    const bookingsForDate = bookings.filter(booking => {
      const bookingDate = new Date(booking.date);
      return bookingDate.toDateString() === dateString && 
             booking.therapistId === selectedTherapistId &&
             booking.status !== 'cancelled';
    });
    
    // Also filter bookings for the same client on this date (any therapist)
    const clientBookingsForDate = clientEmail ? bookings.filter(booking => {
      const bookingDate = new Date(booking.date);
      // Find client by email and check their bookings
      const client = clients?.find(c => c.email === clientEmail);
      // This would need to be passed from the component
      return bookingDate.toDateString() === dateString && 
             booking.clientId === client?.id &&
             booking.status !== 'cancelled';
    }) : [];
    
    console.log('📅 Bookings for this date and therapist:', {
      date: dateString,
      therapistId: selectedTherapistId,
      bookings: bookingsForDate.map(b => ({
        id: b.id,
        date: new Date(b.date).toLocaleString('pt-PT'),
        serviceId: b.serviceId,
        status: b.status
      }))
    });
    
    // Check each slot against existing bookings
    slots.forEach(slot => {
      if (!slot.available) return; // Already blocked by break
      
      const slotDateTime = new Date(date);
      const [slotHour, slotMinute] = slot.time.split(':').map(Number);
      slotDateTime.setHours(slotHour, slotMinute, 0, 0);
      
      const slotEnd = new Date(slotDateTime);
      slotEnd.setMinutes(slotEnd.getMinutes() + serviceDuration);
      
      for (const booking of bookingsForDate) {
        const bookingStart = new Date(booking.date);
        const bookingEnd = new Date(bookingStart);
        
        // Get service duration for this booking
        const services = [
          { id: '1', duration: 60 },
          { id: '2', duration: 60 },
          { id: '3', duration: 60 },
          { id: '4', duration: 60 },
          { id: '5', duration: 90 },
          { id: '6', duration: 120 }
        ];
        const service = services.find(s => s.id === booking.serviceId);
        const bookingDuration = service ? service.duration : 60;
        bookingEnd.setMinutes(bookingEnd.getMinutes() + bookingDuration);
        
        console.log(`🔍 Checking slot ${slot.time} against booking:`, {
          bookingStart: bookingStart.toLocaleString('pt-PT'),
          bookingEnd: bookingEnd.toLocaleString('pt-PT'),
          slotStart: slotDateTime.toLocaleString('pt-PT'),
          slotEnd: slotEnd.toLocaleString('pt-PT'),
          serviceId: booking.serviceId,
          duration: bookingDuration
        });
        
        // Check for overlap
        if (slotDateTime < bookingEnd && slotEnd > bookingStart) {
          console.log(`❌ OVERLAP DETECTED for slot ${slot.time}`);
          slot.available = false;
          slot.reason = 'Já reservado';
          slot.occupiedBy = booking.therapistId;
          break;
        } else {
          console.log(`✅ No overlap for slot ${slot.time}`);
        }
      }
      
      // Check if client already has booking at this time with any therapist
      if (slot.available && clientEmail && clientBookingsForDate.length > 0) {
        for (const clientBooking of clientBookingsForDate) {
          const bookingStart = new Date(clientBooking.date);
          const bookingEnd = new Date(bookingStart);
          
          // Get service duration for this booking
          const services = [
            { id: '1', duration: 60 },
            { id: '2', duration: 60 },
            { id: '3', duration: 60 },
            { id: '4', duration: 60 },
            { id: '5', duration: 90 },
            { id: '6', duration: 120 }
          ];
          const service = services.find(s => s.id === clientBooking.serviceId);
          const bookingDuration = service ? service.duration : 60;
          bookingEnd.setMinutes(bookingEnd.getMinutes() + bookingDuration);
          
          // Check for overlap with client's existing booking
          if (slotDateTime < bookingEnd && slotEnd > bookingStart) {
            console.log(`❌ CLIENT DOUBLE BOOKING DETECTED for slot ${slot.time}`);
            slot.available = false;
            slot.reason = 'Já tem consulta marcada neste horário';
            break;
          }
        }
      }
    });
    
    console.log('✅ SLOTS GENERATED:', slots.length);
    console.log('✅ Available slots:', slots.filter(s => s.available).map(s => s.time));
    console.log('❌ Blocked slots:', slots.filter(s => !s.available).map(s => `${s.time} (${s.reason})`));
    
    return slots;
  }


  private static isSlotAvailable(
    slotStart: Date,
    slotEnd: Date,
    bookingsForDate: Booking[],
    businessSettings: BusinessSettings,
    therapists: any[] = [],
    serviceDuration: number = 60,
    availability?: TherapistAvailability
  ): { available: boolean; reason?: string; occupiedBy?: string } {
    const now = new Date();
    const minAdvanceHours = availability?.minAdvanceNotice || 2;
    const minAdvanceTime = new Date(now.getTime() + minAdvanceHours * 60 * 60 * 1000);
    
    if (slotStart < minAdvanceTime) {
      return { available: false, reason: `Aviso prévio mínimo: ${minAdvanceHours}h` };
    }
    
    // Check max advance booking
    if (availability?.maxAdvanceBooking) {
      const maxAdvanceTime = new Date(now.getTime() + availability.maxAdvanceBooking * 24 * 60 * 60 * 1000);
      if (slotStart > maxAdvanceTime) {
        return { available: false, reason: `Máximo ${availability.maxAdvanceBooking} dias antecipados` };
      }
    }

    const breaks = availability?.breaks || businessSettings.workingHours.breaks;
    for (const breakTime of breaks) {
      const breakStart = this.parseTime(breakTime.start);
      const breakEnd = this.parseTime(breakTime.end);
      const slotStartTime = slotStart.getHours() * 60 + slotStart.getMinutes();

      if (slotStartTime >= breakStart && slotStartTime < breakEnd) {
        return { available: false, reason: 'Lunch break' };
      }
    }
    
    // Apply buffer time
    const bufferTime = availability?.bufferTime || 15;

    for (const booking of bookingsForDate) {
      if (booking.status === 'cancelled') continue;

      const bookingStart = new Date(booking.date);
      const bookingEnd = new Date(bookingStart);
      // Get the actual service duration for this booking
      const services = [
        { id: '1', duration: 60 },
        { id: '2', duration: 60 },
        { id: '3', duration: 60 },
        { id: '4', duration: 60 },
        { id: '5', duration: 90 },
        { id: '6', duration: 120 }
      ];
      const service = services.find(s => s.id === booking.serviceId);
      const bookingDuration = service ? service.duration : 60;
      bookingEnd.setMinutes(bookingEnd.getMinutes() + bookingDuration);

      if (slotStart < bookingEnd && slotEnd > bookingStart) {
        return { available: false, reason: 'Already booked', occupiedBy: booking.therapistId };
      }
    }

    return { available: true };
  }

  private static parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }
}