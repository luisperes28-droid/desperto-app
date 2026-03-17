import { supabase } from '../lib/supabase';
import type { Service, Booking, Therapist, TherapistAvailability, Payment, Client, TherapistNote, Coupon, CouponUsage } from '../types';

export class SupabaseDataService {
  static async fetchServices(): Promise<Service[]> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching services:', error);
      return [];
    }

    return (data || []).map(s => ({
      id: s.id,
      name: s.name,
      duration: s.duration,
      price: Number(s.price),
      description: s.description || '',
      category: s.category || '',
      therapistId: s.therapist_id,
    }));
  }

  static async fetchTherapists(): Promise<Therapist[]> {
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, user_type')
      .eq('user_type', 'therapist')
      .eq('is_active', true);

    if (usersError || !users) {
      console.error('Error fetching therapist users:', usersError);
      return [];
    }

    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .in('user_id', users.map(u => u.id));

    if (profilesError) {
      console.error('Error fetching therapist profiles:', profilesError);
      return [];
    }

    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

    return users.map(u => {
        const profile = profileMap.get(u.id);
        const availConfig = profile?.availability_config || {};
        const availability: TherapistAvailability = {
            id: u.id,
            therapistId: u.id,
            workingDays: availConfig.workingDays || [1, 2, 3, 4, 5],
            workingHours: availConfig.workingHours || { start: '09:00', end: '17:00' },
            breaks: availConfig.breaks || [],
            blockedDates: (availConfig.blockedDates || []).map((d: string) => new Date(d)),
            customSchedule: (availConfig.customSchedule || []).map((cs: any) => ({
              ...cs,
              date: new Date(cs.date),
            })),
            bufferTime: availConfig.bufferTime || 15,
            maxAdvanceBooking: availConfig.maxAdvanceBooking || 30,
            minAdvanceNotice: availConfig.minAdvanceNotice || 2,
          };

        return {
          id: u.id,
          name: profile?.full_name || u.email,
          email: u.email,
          specialties: profile?.specialties || [],
          bio: profile?.bio || '',
          image: profile?.avatar_url || '',
          available: true,
          isAdmin: u.user_type === 'admin',
          status: 'active' as const,
          availability,
        };
      });
  }

  static async fetchServicesByTherapist(therapistId: string): Promise<Service[]> {
    const { data, error } = await supabase
      .from('therapist_services')
      .select('service_id, services(*)')
      .eq('therapist_id', therapistId);

    if (error) {
      console.error('Error fetching therapist services:', error);
      return [];
    }

    return (data || [])
      .filter((ts: any) => ts.services && ts.services.is_active)
      .map((ts: any) => ({
        id: ts.services.id,
        name: ts.services.name,
        duration: ts.services.duration,
        price: Number(ts.services.price),
        description: ts.services.description || '',
        category: ts.services.category || '',
        therapistId: therapistId,
      }));
  }

  static async fetchBookings(): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('booking_date', { ascending: false });

    if (error) {
      console.error('Error fetching bookings:', error);
      return [];
    }

    return (data || []).map(b => ({
      id: b.id,
      clientId: b.client_id,
      serviceId: b.service_id,
      therapistId: b.therapist_id,
      date: new Date(b.booking_date),
      status: b.status || 'pending',
      notes: b.notes || '',
      paymentStatus: b.payment_status || 'pending',
      reminderSent: b.reminder_sent || false,
      meetingLink: b.meeting_link || undefined,
      rescheduleRequest: b.reschedule_request || undefined,
    }));
  }

  static async fetchClients(): Promise<Client[]> {
    const { data: clientUsers, error: usersError } = await supabase
      .from('users')
      .select('id, email, phone_number')
      .eq('user_type', 'client')
      .eq('is_active', true);

    if (usersError || !clientUsers) {
      console.error('Error fetching client users:', usersError);
      return [];
    }

    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .in('user_id', clientUsers.map(u => u.id));

    if (profilesError) {
      console.error('Error fetching client profiles:', profilesError);
    }

    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

    return clientUsers.map(u => {
      const profile = profileMap.get(u.id);
      return {
        id: u.id,
        name: profile?.full_name || u.email.split('@')[0],
        email: u.email,
        phone: profile?.phone || u.phone_number || '',
        notes: '',
        serviceHistory: [],
        paymentHistory: [],
        createdAt: new Date(profile?.created_at || Date.now()),
        therapistNotes: [],
      };
    });
  }

  static async fetchPayments(): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('payment_date', { ascending: false });

    if (error) {
      console.error('Error fetching payments:', error);
      return [];
    }

    return (data || []).map(p => ({
      id: p.id,
      bookingId: p.booking_id,
      amount: Number(p.amount),
      method: p.method as Payment['method'],
      status: p.status === 'paid' ? 'completed' : p.status as Payment['status'],
      date: new Date(p.payment_date),
      invoiceNumber: p.invoice_number || '',
    }));
  }

  static async fetchTherapistNotes(): Promise<TherapistNote[]> {
    const { data, error } = await supabase
      .from('therapist_notes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching therapist notes:', error);
      return [];
    }

    return (data || []).map(n => ({
      id: n.id,
      therapistId: n.therapist_id,
      clientId: n.client_id,
      title: n.title,
      content: n.content,
      isPrivate: n.is_private,
      createdAt: new Date(n.created_at),
      updatedAt: new Date(n.updated_at),
      sessionDate: n.session_date ? new Date(n.session_date) : undefined,
      tags: n.tags || [],
    }));
  }

  static async createBooking(booking: {
    clientId: string;
    therapistId: string;
    serviceId: string;
    bookingDate: Date;
    status?: string;
    paymentStatus?: string;
    notes?: string;
    meetingLink?: string;
  }): Promise<Booking | null> {
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        client_id: booking.clientId,
        therapist_id: booking.therapistId,
        service_id: booking.serviceId,
        booking_date: booking.bookingDate.toISOString(),
        status: (booking.status || 'confirmed') as any,
        payment_status: (booking.paymentStatus || 'pending') as any,
        notes: booking.notes || null,
        meeting_link: booking.meetingLink || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating booking:', error);
      return null;
    }

    return {
      id: data.id,
      clientId: data.client_id,
      serviceId: data.service_id,
      therapistId: data.therapist_id,
      date: new Date(data.booking_date),
      status: data.status || 'pending',
      notes: data.notes || '',
      paymentStatus: data.payment_status || 'pending',
      reminderSent: data.reminder_sent || false,
    };
  }

  static async updateBooking(id: string, updates: Partial<{
    status: string;
    paymentStatus: string;
    notes: string;
    bookingDate: Date;
    meetingLink: string;
    rescheduleRequest: any;
  }>): Promise<boolean> {
    const dbUpdates: any = {};
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.paymentStatus) dbUpdates.payment_status = updates.paymentStatus;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.bookingDate) dbUpdates.booking_date = updates.bookingDate.toISOString();
    if (updates.meetingLink !== undefined) dbUpdates.meeting_link = updates.meetingLink;
    if (updates.rescheduleRequest !== undefined) dbUpdates.reschedule_request = updates.rescheduleRequest;
    dbUpdates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('bookings')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating booking:', error);
      return false;
    }
    return true;
  }

  static async findOrCreateClient(info: {
    name: string;
    email: string;
    phone: string;
  }): Promise<string | null> {
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', info.email)
      .maybeSingle();

    if (existing) return existing.id;

    const username = info.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 6);

    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        username: `${username}_${randomSuffix}`,
        email: info.email,
        password_hash: 'pending_registration',
        user_type: 'client',
        phone_number: info.phone || null,
        is_active: true,
      })
      .select('id')
      .single();

    if (userError || !newUser) {
      console.error('Error creating client user:', userError);
      return null;
    }

    await supabase
      .from('user_profiles')
      .insert({
        user_id: newUser.id,
        full_name: info.name,
        phone: info.phone || null,
      });

    return newUser.id;
  }

  static async createPayment(payment: {
    bookingId: string;
    amount: number;
    method: string;
    status?: string;
    transactionId?: string;
  }): Promise<Payment | null> {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        booking_id: payment.bookingId,
        amount: payment.amount,
        method: payment.method as any,
        status: (payment.status || 'pending') as any,
        transaction_id: payment.transactionId || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating payment:', error);
      return null;
    }

    return {
      id: data.id,
      bookingId: data.booking_id,
      amount: Number(data.amount),
      method: data.method as Payment['method'],
      status: data.status === 'paid' ? 'completed' : data.status as Payment['status'],
      date: new Date(data.payment_date),
      invoiceNumber: data.invoice_number || '',
    };
  }

  static async createTherapistNote(note: {
    therapistId: string;
    clientId: string;
    title: string;
    content: string;
    isPrivate?: boolean;
    sessionDate?: Date;
    tags?: string[];
  }): Promise<TherapistNote | null> {
    const { data, error } = await supabase
      .from('therapist_notes')
      .insert({
        therapist_id: note.therapistId,
        client_id: note.clientId,
        title: note.title,
        content: note.content,
        is_private: note.isPrivate ?? true,
        session_date: note.sessionDate?.toISOString() || null,
        tags: note.tags || [],
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating therapist note:', error);
      return null;
    }

    return {
      id: data.id,
      therapistId: data.therapist_id,
      clientId: data.client_id,
      title: data.title,
      content: data.content,
      isPrivate: data.is_private,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      sessionDate: data.session_date ? new Date(data.session_date) : undefined,
      tags: data.tags || [],
    };
  }

  static async updateTherapistNote(id: string, updates: Partial<{
    title: string;
    content: string;
    isPrivate: boolean;
    tags: string[];
  }>): Promise<boolean> {
    const dbUpdates: any = { updated_at: new Date().toISOString() };
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.content !== undefined) dbUpdates.content = updates.content;
    if (updates.isPrivate !== undefined) dbUpdates.is_private = updates.isPrivate;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;

    const { error } = await supabase
      .from('therapist_notes')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating therapist note:', error);
      return false;
    }
    return true;
  }

  static async deleteTherapistNote(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('therapist_notes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting therapist note:', error);
      return false;
    }
    return true;
  }

  static async saveTherapistAvailability(
    userId: string,
    therapistId: string,
    availability: TherapistAvailability
  ): Promise<boolean> {
    const config = {
      workingDays: availability.workingDays,
      workingHours: availability.workingHours,
      breaks: availability.breaks,
      blockedDates: availability.blockedDates.map((d: Date) =>
        d instanceof Date ? d.toISOString() : d
      ),
      customSchedule: availability.customSchedule.map((cs: any) => ({
        ...cs,
        date: cs.date instanceof Date ? cs.date.toISOString() : cs.date,
      })),
      bufferTime: availability.bufferTime,
      maxAdvanceBooking: availability.maxAdvanceBooking,
      minAdvanceNotice: availability.minAdvanceNotice,
    };

    try {
      const { data, error } = await supabase.rpc('save_therapist_availability', {
        p_user_id: userId,
        p_therapist_id: therapistId,
        p_availability_config: config,
      });

      if (!error && data?.success === true) {
        return true;
      }

      console.error('RPC save_therapist_availability failed, trying direct update:', error || data);
    } catch (rpcError) {
      console.error('RPC call exception:', rpcError);
    }

    const { error: directError } = await supabase
      .from('user_profiles')
      .update({ availability_config: config, updated_at: new Date().toISOString() })
      .eq('user_id', therapistId);

    if (directError) {
      console.error('Direct update also failed:', directError);
      return false;
    }

    return true;
  }

  static async saveBusinessSettings(
    userId: string,
    settings: Record<string, any>
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('save_business_settings', {
        p_user_id: userId,
        p_settings: settings,
      });

      if (!error && data?.success === true) {
        return true;
      }

      console.error('RPC save_business_settings failed, trying direct upsert:', error || data);
    } catch (rpcError) {
      console.error('RPC call exception:', rpcError);
    }

    let allSuccess = true;
    for (const [key, value] of Object.entries(settings)) {
      const { error: upsertError } = await supabase
        .from('business_settings')
        .upsert(
          { key, value, updated_by: userId, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        );

      if (upsertError) {
        console.error(`Direct upsert failed for key "${key}":`, upsertError);
        allSuccess = false;
      }
    }

    return allSuccess;
  }

  static async loadBusinessSettings(): Promise<Record<string, any> | null> {
    try {
      const { data, error } = await supabase.rpc('load_business_settings');

      if (!error && data && typeof data === 'object') {
        return data;
      }

      console.error('RPC load_business_settings failed, trying direct query:', error);
    } catch (rpcError) {
      console.error('RPC call exception:', rpcError);
    }

    const { data: rows, error: queryError } = await supabase
      .from('business_settings')
      .select('key, value');

    if (queryError || !rows) {
      console.error('Direct query also failed:', queryError);
      return null;
    }

    const result: Record<string, any> = {};
    for (const row of rows) {
      result[row.key] = row.value;
    }
    return result;
  }

  static async fetchBookingsForAvailability(therapistId: string, date: Date): Promise<Booking[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('therapist_id', therapistId)
      .neq('status', 'cancelled')
      .gte('booking_date', startOfDay.toISOString())
      .lte('booking_date', endOfDay.toISOString());

    if (error) {
      console.error('Error fetching bookings for availability:', error);
      return [];
    }

    return (data || []).map(b => ({
      id: b.id,
      clientId: b.client_id,
      serviceId: b.service_id,
      therapistId: b.therapist_id,
      date: new Date(b.booking_date),
      status: b.status || 'pending',
      notes: b.notes || '',
      paymentStatus: b.payment_status || 'pending',
      reminderSent: b.reminder_sent || false,
      meetingLink: b.meeting_link || undefined,
    }));
  }

  static async fetchClientBookingsForDate(clientEmail: string, date: Date): Promise<Booking[]> {
    const { data: clientUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', clientEmail)
      .maybeSingle();

    if (!clientUser) return [];

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('client_id', clientUser.id)
      .neq('status', 'cancelled')
      .gte('booking_date', startOfDay.toISOString())
      .lte('booking_date', endOfDay.toISOString());

    if (error) return [];

    return (data || []).map(b => ({
      id: b.id,
      clientId: b.client_id,
      serviceId: b.service_id,
      therapistId: b.therapist_id,
      date: new Date(b.booking_date),
      status: b.status || 'pending',
      notes: b.notes || '',
      paymentStatus: b.payment_status || 'pending',
      reminderSent: b.reminder_sent || false,
      meetingLink: b.meeting_link || undefined,
    }));
  }

  static async fetchCoupons(): Promise<Coupon[]> {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching coupons:', error);
      return [];
    }

    return (data || []).map(c => ({
      id: c.id,
      code: c.code,
      type: (c.discount_type || 'percentage') as Coupon['type'],
      value: Number(c.discount_value),
      serviceId: c.service_id || undefined,
      clientId: c.client_id || undefined,
      createdBy: c.created_by || '',
      validFrom: new Date(c.valid_from || c.created_at),
      validUntil: new Date(c.valid_until),
      usageLimit: c.max_uses || 1,
      usedCount: c.used_count || 0,
      status: (c.status || (c.is_active ? 'active' : 'cancelled')) as Coupon['status'],
      description: c.description || '',
      createdAt: new Date(c.created_at),
      updatedAt: new Date(c.updated_at),
    }));
  }

  static async fetchCouponUsage(): Promise<CouponUsage[]> {
    const { data, error } = await supabase
      .from('coupon_usages')
      .select('*')
      .order('used_at', { ascending: false });

    if (error) {
      console.error('Error fetching coupon usage:', error);
      return [];
    }

    return (data || []).map(u => ({
      id: u.id,
      couponId: u.coupon_id,
      bookingId: u.booking_id,
      usedBy: u.user_id,
      usedAt: new Date(u.used_at),
      discountApplied: 0,
    }));
  }

  static async createCoupon(coupon: {
    code: string;
    type: string;
    value: number;
    serviceId?: string;
    clientId?: string;
    createdBy: string;
    validUntil: Date;
    usageLimit: number;
    description?: string;
  }): Promise<Coupon | null> {
    const { data, error } = await supabase.rpc('create_coupon_rpc', {
      p_user_id: coupon.createdBy,
      p_code: coupon.code,
      p_password: coupon.code,
      p_discount_type: coupon.type,
      p_discount_value: coupon.value,
      p_service_id: coupon.serviceId || null,
      p_client_id: coupon.clientId || null,
      p_valid_until: coupon.validUntil.toISOString(),
      p_max_uses: coupon.usageLimit,
      p_description: coupon.description || '',
    });

    if (error) {
      console.error('Error creating coupon:', error);
      return null;
    }

    const d = data as Record<string, unknown>;
    return {
      id: d.id as string,
      code: d.code as string,
      type: ((d.discount_type as string) || 'percentage') as Coupon['type'],
      value: Number(d.discount_value),
      serviceId: (d.service_id as string) || undefined,
      clientId: (d.client_id as string) || undefined,
      createdBy: (d.created_by as string) || '',
      validFrom: new Date((d.valid_from as string) || (d.created_at as string)),
      validUntil: new Date(d.valid_until as string),
      usageLimit: (d.max_uses as number) || 1,
      usedCount: (d.used_count as number) || 0,
      status: ((d.status as string) || 'active') as Coupon['status'],
      description: (d.description as string) || '',
      createdAt: new Date(d.created_at as string),
      updatedAt: new Date(d.updated_at as string),
    };
  }

  static async updateCoupon(id: string, updates: Partial<{
    type: string;
    value: number;
    serviceId: string | null;
    clientId: string | null;
    validUntil: Date;
    usageLimit: number;
    description: string;
    status: string;
    usedCount: number;
  }>, userId?: string): Promise<boolean> {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.type !== undefined) dbUpdates.discount_type = updates.type;
    if (updates.value !== undefined) dbUpdates.discount_value = String(updates.value);
    if (updates.serviceId !== undefined) dbUpdates.service_id = updates.serviceId;
    if (updates.clientId !== undefined) dbUpdates.client_id = updates.clientId;
    if (updates.validUntil) dbUpdates.valid_until = updates.validUntil.toISOString();
    if (updates.usageLimit !== undefined) dbUpdates.max_uses = String(updates.usageLimit);
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.usedCount !== undefined) dbUpdates.used_count = String(updates.usedCount);
    if (updates.status !== undefined) dbUpdates.status = updates.status;

    const callerId = userId || this.getCurrentUserId();
    if (!callerId) {
      console.error('Error updating coupon: no user id available');
      return false;
    }

    const { error } = await supabase.rpc('update_coupon_rpc', {
      p_user_id: callerId,
      p_coupon_id: id,
      p_updates: dbUpdates,
    });

    if (error) {
      console.error('Error updating coupon:', error);
      return false;
    }
    return true;
  }

  private static getCurrentUserId(): string | null {
    try {
      const saved = localStorage.getItem('desperto_user');
      if (saved) {
        const user = JSON.parse(saved);
        return user.id || null;
      }
    } catch { /* ignore */ }
    return null;
  }

  static async deleteCoupon(id: string, userId?: string): Promise<boolean> {
    const callerId = userId || this.getCurrentUserId();
    if (!callerId) {
      console.error('Error deleting coupon: no user id available');
      return false;
    }

    const { error } = await supabase.rpc('delete_coupon_rpc', {
      p_user_id: callerId,
      p_coupon_id: id,
    });

    if (error) {
      console.error('Error deleting coupon:', error);
      return false;
    }
    return true;
  }

  static async recordCouponUsage(usage: {
    couponId: string;
    bookingId: string;
    userId: string;
  }): Promise<boolean> {
    const { error } = await supabase
      .from('coupon_usages')
      .insert({
        coupon_id: usage.couponId,
        booking_id: usage.bookingId,
        user_id: usage.userId,
      });

    if (error) {
      console.error('Error recording coupon usage:', error);
      return false;
    }
    return true;
  }
}
