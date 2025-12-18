import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ CRITICAL: Missing Supabase environment variables!')
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'Present' : 'MISSING')
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Present' : 'MISSING')
  throw new Error('Missing required Supabase environment variables. Please check your .env file.')
}

console.log('✅ Supabase Configuration Loaded:', {
  url: supabaseUrl.substring(0, 30) + '...',
  keyLength: supabaseAnonKey.length,
  fromEnv: true
})

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
})

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          email: string
          password_hash: string
          user_type: 'client' | 'therapist' | 'admin'
          is_active: boolean
          created_at: string
          updated_at: string
          failed_login_attempts: number | null
          lockout_until: string | null
          last_login_ip: string | null
          last_login_at: string | null
          phone_number: string | null
        }
        Insert: {
          id?: string
          username: string
          email: string
          password_hash: string
          user_type?: 'client' | 'therapist' | 'admin'
          is_active?: boolean
          created_at?: string
          updated_at?: string
          failed_login_attempts?: number | null
          lockout_until?: string | null
          last_login_ip?: string | null
          last_login_at?: string | null
          phone_number?: string | null
        }
        Update: {
          id?: string
          username?: string
          email?: string
          password_hash?: string
          user_type?: 'client' | 'therapist' | 'admin'
          is_active?: boolean
          created_at?: string
          updated_at?: string
          failed_login_attempts?: number | null
          lockout_until?: string | null
          last_login_ip?: string | null
          last_login_at?: string | null
          phone_number?: string | null
        }
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string
          phone: string | null
          bio: string | null
          avatar_url: string | null
          specialties: string[]
          availability_config: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name: string
          phone?: string | null
          bio?: string | null
          avatar_url?: string | null
          specialties?: string[]
          availability_config?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string
          phone?: string | null
          bio?: string | null
          avatar_url?: string | null
          specialties?: string[]
          availability_config?: any
          created_at?: string
          updated_at?: string
        }
      }
      services: {
        Row: {
          id: string
          name: string
          description: string | null
          duration: number
          price: number
          category: string
          therapist_id: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          duration?: number
          price: number
          category?: string
          therapist_id: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          duration?: number
          price?: number
          category?: string
          therapist_id?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          client_id: string
          therapist_id: string
          service_id: string
          booking_date: string
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          payment_status: 'pending' | 'paid' | 'partial' | 'overdue' | 'refunded'
          notes: string | null
          reminder_sent: boolean
          reschedule_request: any | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          therapist_id: string
          service_id: string
          booking_date: string
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          payment_status?: 'pending' | 'paid' | 'partial' | 'overdue' | 'refunded'
          notes?: string | null
          reminder_sent?: boolean
          reschedule_request?: any | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          therapist_id?: string
          service_id?: string
          booking_date?: string
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          payment_status?: 'pending' | 'paid' | 'partial' | 'overdue' | 'refunded'
          notes?: string | null
          reminder_sent?: boolean
          reschedule_request?: any | null
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          booking_id: string
          amount: number
          method: 'card' | 'cash' | 'paypal' | 'mbway' | 'multibanco' | 'coupon'
          status: 'pending' | 'paid' | 'partial' | 'overdue' | 'refunded'
          transaction_id: string | null
          invoice_number: string | null
          payment_date: string
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          amount: number
          method: 'card' | 'cash' | 'paypal' | 'mbway' | 'multibanco' | 'coupon'
          status?: 'pending' | 'paid' | 'partial' | 'overdue' | 'refunded'
          transaction_id?: string | null
          invoice_number?: string | null
          payment_date?: string
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          amount?: number
          method?: 'card' | 'cash' | 'paypal' | 'mbway' | 'multibanco' | 'coupon'
          status?: 'pending' | 'paid' | 'partial' | 'overdue' | 'refunded'
          transaction_id?: string | null
          invoice_number?: string | null
          payment_date?: string
          created_at?: string
        }
      }
      therapist_notes: {
        Row: {
          id: string
          therapist_id: string
          client_id: string
          title: string
          content: string
          is_private: boolean
          session_date: string | null
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          therapist_id: string
          client_id: string
          title: string
          content: string
          is_private?: boolean
          session_date?: string | null
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          therapist_id?: string
          client_id?: string
          title?: string
          content?: string
          is_private?: boolean
          session_date?: string | null
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      business_settings: {
        Row: {
          id: string
          key: string
          value: any
          updated_by: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: any
          updated_by?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: any
          updated_by?: string | null
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      authenticate_user: {
        Args: {
          p_identifier: string
          p_password: string
        }
        Returns: {
          user_id: string
          username: string
          email: string
          user_type: 'client' | 'therapist' | 'admin'
          full_name: string
        }[]
      }
      create_user: {
        Args: {
          username_input: string
          email_input: string
          password_input: string
          full_name_input: string
          user_type_input?: 'client' | 'therapist' | 'admin'
        }
        Returns: string
      }
      set_current_user: {
        Args: {
          user_id_input: string
        }
        Returns: void
      }
    }
    Enums: {
      user_type: 'client' | 'therapist' | 'admin'
      booking_status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
      payment_status: 'pending' | 'paid' | 'partial' | 'overdue' | 'refunded'
      payment_method: 'card' | 'cash' | 'paypal' | 'mbway' | 'multibanco' | 'coupon'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}