import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { AuthService } from '../services/authService'

export interface User {
  id: string
  username: string
  email: string
  userType: 'client' | 'therapist' | 'admin'
  fullName: string
}

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('desperto_user')
      if (savedUser) {
        const userData = JSON.parse(savedUser)
        setUser(userData)

        if (supabase) {
          supabase.rpc('set_current_user', { user_id: userData.id }).catch(() => {})
        }
      }
    } catch (error) {
      localStorage.removeItem('desperto_user')
    } finally {
      setLoading(false)
    }
  }, [])

  const signIn = async (username: string, password: string) => {
    try {
      setLoading(true)

      const result = await AuthService.login(username, password)

      if (result.success) {
        const userData = result.user
        setUser(userData)
        localStorage.setItem('desperto_user', JSON.stringify(userData))

        if (supabase) {
          supabase.rpc('set_current_user', { user_id: userData.id }).catch(() => {})
        }

        return { success: true, user: userData }
      } else if (result.requiresTwoFactor) {
        return { success: false, error: result.error, requiresTwoFactor: true }
      } else if (result.isLocked) {
        return { success: false, error: result.error, isLocked: true, lockoutUntil: result.lockoutUntil }
      } else {
        return { success: false, error: result.error || 'Login failed' }
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Network error' }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, fullName: string, phone?: string) => {
    try {
      setLoading(true)

      const result = await AuthService.signUp(email, password, fullName, phone)

      if (result.success) {
        const userData = result.user
        setUser(userData)
        localStorage.setItem('desperto_user', JSON.stringify(userData))

        if (supabase) {
          supabase.rpc('set_current_user', { user_id: userData.id }).catch(() => {})
        }

        return { success: true, user: userData }
      } else {
        return { success: false, error: result.error || 'Registration failed' }
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Network error' }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setUser(null)
    localStorage.removeItem('desperto_user')
  }

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user
  }
}