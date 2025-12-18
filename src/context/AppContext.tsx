import React, { createContext, useContext, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { defaultBusinessSettings, defaultServices, defaultTherapists } from '../constants/businessData';
import { Client, Booking, Service, Payment, BusinessSettings, CustomForm, Therapist, TherapistNote, TherapistAvailability, TherapistInvitation, Coupon, CouponUsage } from '../types';

// Date reviver function to convert date strings back to Date objects
const dateReviver = (key: string, value: any) => {
  const dateFields = ['createdAt', 'updatedAt', 'expiresAt', 'date', 'booking_date', 'session_date', 'payment_date', 'validFrom', 'validUntil'];
  if (dateFields.includes(key) && typeof value === 'string') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? value : date;
  }
  return value;
};

interface AppContextType {
  clients: Client[];
  setClients: (clients: Client[] | ((prev: Client[]) => Client[])) => void;
  bookings: Booking[];
  setBookings: (bookings: Booking[] | ((prev: Booking[]) => Booking[])) => void;
  services: Service[];
  setServices: (services: Service[] | ((prev: Service[]) => Service[])) => void;
  payments: Payment[];
  setPayments: (payments: Payment[] | ((prev: Payment[]) => Payment[])) => void;
  businessSettings: BusinessSettings;
  setBusinessSettings: (settings: BusinessSettings | ((prev: BusinessSettings) => BusinessSettings)) => void;
  customForms: CustomForm[];
  setCustomForms: (forms: CustomForm[] | ((prev: CustomForm[]) => CustomForm[])) => void;
  therapists: Therapist[];
  setTherapists: (therapists: Therapist[] | ((prev: Therapist[]) => Therapist[])) => void;
  therapistNotes: TherapistNote[];
  setTherapistNotes: (notes: TherapistNote[] | ((prev: TherapistNote[]) => TherapistNote[])) => void;
  therapistAvailability: TherapistAvailability[];
  setTherapistAvailability: (availability: TherapistAvailability[] | ((prev: TherapistAvailability[]) => TherapistAvailability[])) => void;
  therapistInvitations: TherapistInvitation[];
  setTherapistInvitations: (invitations: TherapistInvitation[] | ((prev: TherapistInvitation[]) => TherapistInvitation[])) => void;
  coupons: Coupon[];
  setCoupons: (coupons: Coupon[] | ((prev: Coupon[]) => Coupon[])) => void;
  couponUsage: CouponUsage[];
  setCouponUsage: (usage: CouponUsage[] | ((prev: CouponUsage[]) => CouponUsage[])) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);


export function AppProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useLocalStorage<Client[]>('clients', []);
  const [bookings, setBookings] = useLocalStorage<Booking[]>('bookings', [], dateReviver);
  const [services, setServices] = useLocalStorage<Service[]>('services', defaultServices, dateReviver);
  const [payments, setPayments] = useLocalStorage<Payment[]>('payments', []);
  const [businessSettings, setBusinessSettings] = useLocalStorage<BusinessSettings>('businessSettings', defaultBusinessSettings);
  const [customForms, setCustomForms] = useLocalStorage<CustomForm[]>('customForms', []);
  const [therapists, setTherapists] = useLocalStorage<Therapist[]>('therapists', defaultTherapists, dateReviver);
  const [therapistNotes, setTherapistNotes] = useLocalStorage<TherapistNote[]>('therapistNotes', [], dateReviver);
  const [therapistAvailability, setTherapistAvailability] = useLocalStorage<TherapistAvailability[]>('therapistAvailability', [], dateReviver);
  const [therapistInvitations, setTherapistInvitations] = useLocalStorage<TherapistInvitation[]>('therapistInvitations', [], dateReviver);
  const [coupons, setCoupons] = useLocalStorage<Coupon[]>('coupons', [], dateReviver);
  const [couponUsage, setCouponUsage] = useLocalStorage<CouponUsage[]>('couponUsage', [], dateReviver);

  // Debug: Log current bookings
  React.useEffect(() => {
    console.log('📊 Current bookings in context:', bookings.map(b => ({
      id: b.id,
      therapistId: b.therapistId,
      date: new Date(b.date).toLocaleString('pt-PT'),
      status: b.status
    })));
  }, [bookings]);

  return (
    <AppContext.Provider
      value={{
        clients,
        setClients,
        bookings,
        setBookings,
        services,
        setServices,
        payments,
        setPayments,
        businessSettings,
        setBusinessSettings,
        customForms,
        setCustomForms,
        therapists,
        setTherapists,
        therapistNotes,
        setTherapistNotes,
        therapistAvailability,
        setTherapistAvailability,
        therapistInvitations,
        setTherapistInvitations,
        coupons,
        setCoupons,
        couponUsage,
        setCouponUsage
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}