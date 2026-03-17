import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { SupabaseDataService } from '../services/supabaseDataService';
import { defaultBusinessSettings } from '../constants/businessData';
import { Client, Booking, Service, Payment, BusinessSettings, CustomForm, Therapist, TherapistNote, TherapistAvailability, TherapistInvitation, Coupon, CouponUsage } from '../types';

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
  refreshData: () => Promise<void>;
  dataLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>(defaultBusinessSettings);
  const [customForms, setCustomForms] = useState<CustomForm[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [therapistNotes, setTherapistNotes] = useState<TherapistNote[]>([]);
  const [therapistAvailability, setTherapistAvailability] = useState<TherapistAvailability[]>([]);
  const [therapistInvitations, setTherapistInvitations] = useState<TherapistInvitation[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponUsage, setCouponUsage] = useState<CouponUsage[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const refreshData = useCallback(async () => {
    try {
      const [
        servicesData,
        therapistsData,
        bookingsData,
        clientsData,
        paymentsData,
        notesData,
        savedSettings,
        couponsData,
        couponUsageData,
      ] = await Promise.all([
        SupabaseDataService.fetchServices(),
        SupabaseDataService.fetchTherapists(),
        SupabaseDataService.fetchBookings(),
        SupabaseDataService.fetchClients(),
        SupabaseDataService.fetchPayments(),
        SupabaseDataService.fetchTherapistNotes(),
        SupabaseDataService.loadBusinessSettings(),
        SupabaseDataService.fetchCoupons(),
        SupabaseDataService.fetchCouponUsage(),
      ]);

      setServices(servicesData);
      setTherapists(therapistsData);
      setBookings(bookingsData);
      setClients(clientsData);
      setPayments(paymentsData);
      setTherapistNotes(notesData);
      setCoupons(couponsData);
      setCouponUsage(couponUsageData);

      if (savedSettings && Object.keys(savedSettings).length > 0) {
        setBusinessSettings(prev => ({
          ...prev,
          businessName: savedSettings.businessName ?? prev.businessName,
          businessEmail: savedSettings.businessEmail ?? prev.businessEmail,
          logo: savedSettings.logo ?? prev.logo,
          colors: savedSettings.colors ?? prev.colors,
          workingHours: savedSettings.workingHours ?? prev.workingHours,
          bookingRules: savedSettings.bookingRules ?? prev.bookingRules,
          paymentSettings: savedSettings.paymentSettings ?? prev.paymentSettings,
        }));
      }

      const avail = therapistsData
        .filter(t => t.availability)
        .map(t => t.availability!);
      setTherapistAvailability(avail);
    } catch (error) {
      console.error('Error loading data from Supabase:', error);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

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
        setCouponUsage,
        refreshData,
        dataLoading,
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
