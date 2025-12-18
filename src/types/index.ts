export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  serviceHistory: Service[];
  paymentHistory: Payment[];
  createdAt: Date;
  therapistNotes: TherapistNote[];
}

export interface TherapistNote {
  id: string;
  therapistId: string;
  clientId: string;
  title: string;
  content: string;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
  sessionDate?: Date;
  tags: string[];
}

export interface Service {
  id: string;
  name: string;
  duration: number; // in minutes
  price: number;
  description: string;
  category: string;
  therapistId: string;
  stripePaymentLink?: string; // Optional external Stripe payment link
}

export interface Booking {
  id: string;
  clientId: string;
  serviceId: string;
  therapistId: string;
  date: Date;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  notes: string;
  paymentStatus: 'paid' | 'partial' | 'pending' | 'overdue';
  reminderSent: boolean;
  rescheduleRequest?: {
    id: string;
    newDate: Date;
    requestedAt: Date;
    reason?: string;
    status: 'pending' | 'approved' | 'rejected';
    therapistResponse?: string;
  };
}

export interface Therapist {
  id: string;
  name: string;
  email?: string;
  specialties: string[];
  bio: string;
  image: string;
  available: boolean;
  isAdmin: boolean;
  invitedBy?: string;
  invitedAt?: Date;
  status: 'active' | 'pending' | 'suspended';
  isAdmin: boolean;
  invitedBy?: string;
  invitedAt?: Date;
  status: 'active' | 'pending' | 'suspended';
  availability?: TherapistAvailability;
}

export interface TherapistAvailability {
  id: string;
  therapistId: string;
  workingDays: number[]; // 0 = Sunday, 1 = Monday, etc.
  workingHours: {
    start: string;
    end: string;
  };
  breaks: Array<{
    start: string;
    end: string;
  }>;
  blockedDates: Date[];
  customSchedule: Array<{
    date: Date;
    available: boolean;
    customHours?: {
      start: string;
      end: string;
    };
  }>;
  bufferTime: number; // minutes between appointments
  maxAdvanceBooking: number; // days
  minAdvanceNotice: number; // hours
}

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  method: 'card' | 'cash' | 'paypal' | 'square' | 'mbway';
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  date: Date;
  invoiceNumber: string;
}

export interface BusinessSettings {
  businessName: string;
  businessEmail: string;
  logo: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  workingHours: {
    start: string;
    end: string;
    breaks: Array<{ start: string; end: string }>;
  };
  bookingRules: {
    minAdvanceNotice: number; // in hours
    maxAdvanceBooking: number; // in days
    defaultDuration: number; // in minutes
    bufferTime: number; // in minutes
  };
  paymentSettings: {
    requireDeposit: boolean;
    depositAmount: number;
    acceptedMethods: string[];
  };
}

export interface CustomForm {
  id: string;
  name: string;
  fields: FormField[];
  serviceIds: string[];
}

export interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'checkbox' | 'textarea';
  label: string;
  required: boolean;
  options?: string[];
}

export interface TherapistInvitation {
  id: string;
  invitedBy: string; // Admin therapist ID
  email: string;
  name: string;
  specialties: string[];
  message?: string;
  status: 'pending' | 'accepted' | 'expired';
  createdAt: Date;
  expiresAt: Date;
  acceptedAt?: Date;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed_amount' | 'free_service';
  value: number;
  serviceId?: string;
  clientId?: string;
  createdBy: string;
  validFrom: Date;
  validUntil: Date;
  usageLimit: number;
  usedCount: number;
  status: 'active' | 'used' | 'expired' | 'cancelled';
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CouponUsage {
  id: string;
  couponId: string;
  bookingId: string;
  usedBy: string;
  usedAt: Date;
  discountApplied: number;
}