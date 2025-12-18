import { useState, useEffect } from 'react'

export interface User {
  id: string
  username: string
  email: string
  userType: 'client' | 'therapist' | 'admin'
  fullName: string
}

// Production user database - no default test accounts
const defaultUsers: any[] = []

export function useLocalAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar sessão existente
    const savedUser = localStorage.getItem('desperto_user')
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        console.log('✅ Sessão encontrada:', userData)
        setUser(userData)
      } catch (error) {
        console.error('Erro ao carregar sessão:', error)
        localStorage.removeItem('desperto_user')
      }
    }
    setLoading(false)
  }, [])

  const signIn = async (username: string, password: string) => {
    try {
      setLoading(true)
      
      console.log('🔐 Tentativa de login:', { username, password })
      
      // Carregar utilizadores guardados localmente
      const savedUsers = JSON.parse(localStorage.getItem('desperto_users') || '[]');
      const allUsers = [...defaultUsers, ...savedUsers];
      console.log('📋 Utilizadores disponíveis:', allUsers.map(u => ({ username: u.username, email: u.email })))
      
      // Simular delay de rede
      await new Promise(resolve => window.setTimeout(resolve, 500))
      
      // Procurar utilizador
      const foundUser = allUsers.find(u => 
        (u.username === username || u.email === username) && u.password === password
      )
      
      console.log('🔍 Utilizador encontrado:', foundUser)
      
      if (foundUser) {
        const userData: User = {
          id: foundUser.id,
          username: foundUser.username,
          email: foundUser.email,
          userType: foundUser.userType,
          fullName: foundUser.fullName
        }
        
        console.log('✅ Login bem-sucedido:', userData)
        setUser(userData)
        localStorage.setItem('desperto_user', JSON.stringify(userData))
        
        return { success: true, user: userData }
      } else {
        console.log('❌ Credenciais incorretas')
        return { success: false, error: 'Credenciais incorretas. Por favor, registe-se primeiro.' }
      }
    } catch (error: any) {
      console.error('Erro no login:', error)
      return { success: false, error: 'Erro inesperado' }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (username: string, email: string, password: string, fullName: string) => {
    try {
      setLoading(true)
      
      console.log('📝 Tentativa de registo:', { username, email, fullName })
      
      // Simular delay de rede
      await new Promise(resolve => window.setTimeout(resolve, 500))
      
      // Verificar se username ou email já existem
      const savedUsers = JSON.parse(localStorage.getItem('desperto_users') || '[]');
      const allUsers = [...defaultUsers, ...savedUsers];
      const existingUser = allUsers.find(u => 
        u.username === username || u.email === email
      )
      
      if (existingUser) {
        return { success: false, error: 'Username ou email já existem' }
      }
      
      // Criar novo utilizador
      const newUser: User = {
        id: Date.now().toString(),
        username,
        email,
        userType: 'client',
        fullName
      }
      
      console.log('✅ Registo bem-sucedido:', newUser)
      setUser(newUser)
      localStorage.setItem('desperto_user', JSON.stringify(newUser))
      
      // Guardar na lista de utilizadores (para futuras sessões)
      const newSavedUsers = JSON.parse(localStorage.getItem('desperto_users') || '[]')
      newSavedUsers.push({
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        password: password,
        userType: 'client',
        fullName: newUser.fullName
      })
      localStorage.setItem('desperto_users', JSON.stringify(newSavedUsers))
      
      return { success: true, user: newUser }
    } catch (error: any) {
      console.error('Erro no registo:', error)
      return { success: false, error: 'Erro inesperado' }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    console.log('🚪 Logout realizado')
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