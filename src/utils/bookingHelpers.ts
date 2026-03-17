import { Booking, Client, Service, Therapist } from '../types';

export function getClientBookings(clientId: string, bookings: Booking[]): Booking[] {
  return bookings.filter(b => b.clientId === clientId);
}

export function getTherapistBookings(therapistId: string, bookings: Booking[]): Booking[] {
  return bookings.filter(b => b.therapistId === therapistId);
}

export function getBookingsForDate(date: Date, bookings: Booking[]): Booking[] {
  return bookings.filter(booking => {
    const bookingDate = new Date(booking.date);
    return bookingDate.toDateString() === date.toDateString();
  });
}

export function getUpcomingBookings(bookings: Booking[]): Booking[] {
  const now = new Date();
  return bookings.filter(b => new Date(b.date) >= now && b.status !== 'cancelled');
}

export function getPastBookings(bookings: Booking[]): Booking[] {
  const now = new Date();
  return bookings.filter(b => new Date(b.date) < now || b.status === 'cancelled');
}

export function canCancelBooking(booking: Booking): boolean {
  const bookingDate = new Date(booking.date);
  const now = new Date();
  const hoursUntilBooking = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hoursUntilBooking > 24 && booking.status === 'confirmed';
}

export function getBookingStatusColor(status: string): string {
  switch (status) {
    case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
    case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
    case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export function getBookingStatusLabel(status: string): string {
  switch (status) {
    case 'confirmed': return 'Confirmado';
    case 'pending': return 'Pendente';
    case 'cancelled': return 'Cancelado';
    case 'completed': return 'Concluído';
    default: return status;
  }
}