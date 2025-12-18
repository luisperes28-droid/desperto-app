import React, { useState } from 'react';
import { LogIn, Shield, AlertTriangle, Clock } from 'lucide-react';
import { LoginFormFields } from './LoginFormFields';
import { TestCredentials } from './TestCredentials';
import { validateCredentials, isStaffUser, createUserData } from './AuthHelpers';
import { LoginFormData, AuthResult } from './AuthTypes';
import { supabase } from '../../lib/supabase';

interface SimpleLoginFormProps {
  onLogin: (username: string, password: string) => Promise<AuthResult>;
  isStaffLogin?: boolean;
}

export function SimpleLoginForm({ onLogin, isStaffLogin = false }: SimpleLoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    email: '',
    password: '',
    fullName: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [accountLocked, setAccountLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState<Date | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState(5);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setAccountLocked(false);

    try {
      // Verificar se a conta está bloqueada
      const lockoutCheck = await checkAccountLockout(formData.username);
      if (lockoutCheck.isLocked) {
        setAccountLocked(true);
        setLockoutTime(lockoutCheck.lockoutUntil);
        setError(`Conta temporariamente bloqueada. Tente novamente em ${Math.ceil((lockoutCheck.lockoutUntil!.getTime() - Date.now()) / 60000)} minutos.`);
        setLoading(false);
        return;
      }

      // Validate for staff login
      if (isStaffLogin) {
        const foundUser = validateCredentials(formData.username, formData.password);
        
        if (foundUser && foundUser.userType === 'client') {
          setError('Acesso restrito a terapeutas e administradores. Clientes não podem aceder a esta área.');
          await logFailedAttempt(formData.username, 'wrong_user_type');
          setLoading(false);
          return;
        }
      }
      
      const result = await onLogin(formData.username, formData.password);
      
      if (!result.success) {
        const failedAttempts = await handleFailedLogin(formData.username);
        setRemainingAttempts(Math.max(0, 5 - failedAttempts));
        
        if (failedAttempts >= 5) {
          setAccountLocked(true);
          setError('Conta bloqueada devido a muitas tentativas falhadas. Use a recuperação de password ou tente novamente em 30 minutos.');
        } else {
          setError(`${result.error || 'Credenciais incorretas'}. Restam ${5 - failedAttempts} tentativas.`);
        }
      } else {
        // Reset failed attempts on successful login
        await resetFailedAttempts(formData.username);
      }
    } catch (error) {
      setError('Erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  const checkAccountLockout = async (username: string) => {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('lockout_until, failed_login_attempts')
        .or(`email.eq.${username},username.eq.${username}`)
        .limit(1);

      if (error || !users || users.length === 0) {
        return { isLocked: false };
      }

      const user = users[0];
      if (user.lockout_until) {
        const lockoutUntil = new Date(user.lockout_until);
        if (lockoutUntil > new Date()) {
          return { isLocked: true, lockoutUntil };
        }
      }

      return { isLocked: false };
    } catch (error) {
      console.error('Error checking lockout:', error);
      return { isLocked: false };
    }
  };

  const handleFailedLogin = async (username: string): Promise<number> => {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('id, failed_login_attempts')
        .or(`email.eq.${username},username.eq.${username}`)
        .limit(1);

      if (error || !users || users.length === 0) {
        return 1;
      }

      const user = users[0];
      const newFailedAttempts = (user.failed_login_attempts || 0) + 1;
      
      let updateData: any = {
        failed_login_attempts: newFailedAttempts
      };

      // Bloquear conta após 5 tentativas
      if (newFailedAttempts >= 5) {
        const lockoutUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos
        updateData.lockout_until = lockoutUntil.toISOString();
      }

      await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);

      
      return newFailedAttempts;
    } catch (error) {
      console.error('Error handling failed login:', error);
      return 1;
    }
  };

  const resetFailedAttempts = async (username: string) => {
    try {
      await supabase
        .from('users')
        .update({ 
          failed_login_attempts: 0, 
          lockout_until: null,
          last_login_at: new Date().toISOString()
        })
        .or(`email.eq.${username},username.eq.${username}`);
    } catch (error) {
      console.error('Error resetting failed attempts:', error);
    }
  };


  const fillTestCredentials = (type: 'admin' | 'client' | 'therapist') => {
    if (isStaffLogin && type === 'client') return;
    
    const credentials = {
      admin: { username: 'euestoudesperto@gmail.com', password: 'Dhvif2m1' },
      client: { username: 'cliente@teste.com', password: '123456' },
      therapist: { username: 'luisperes28@gmail.com', password: 'Dhvif2m0' }
    };
    
    setFormData(prev => ({
      ...prev,
      username: credentials[type].username,
      password: credentials[type].password
    }));
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <LoginFormFields
          formData={formData}
          setFormData={setFormData}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          isLogin={true}
          isStaffLogin={isStaffLogin}
        />

        {/* Account Lockout Warning */}
        {accountLocked && lockoutTime && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="font-medium text-red-900">Conta Temporariamente Bloqueada</span>
            </div>
            <p className="text-red-800 text-sm mt-1">
              Muitas tentativas de login falhadas. A sua conta foi bloqueada por segurança.
            </p>
            <div className="mt-3 flex items-center space-x-2 text-sm">
              <Clock className="w-4 h-4 text-red-600" />
              <span className="text-red-700">
                Desbloqueio em: {lockoutTime.toLocaleTimeString('pt-PT')}
              </span>
            </div>
          </div>
        )}

        {/* Remaining Attempts Warning */}
        {!accountLocked && remainingAttempts < 5 && remainingAttempts > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="text-yellow-800 text-sm">
                Atenção: Restam {remainingAttempts} tentativas antes do bloqueio da conta
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || accountLocked}
          className="w-full px-4 py-3 bg-desperto-gold text-white rounded-lg font-semibold hover:bg-desperto-gold/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 shadow-md"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              <span>Entrar</span>
            </>
          )}
        </button>
      </form>

      {isStaffLogin && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-amber-600" />
            <span className="font-medium text-amber-900">Área Restrita</span>
          </div>
          <p className="text-amber-700 text-sm mt-1">
            Apenas terapeutas e administradores podem aceder a esta área.
          </p>
        </div>
      )}

      <TestCredentials 
        onFillCredentials={fillTestCredentials}
        isStaffLogin={isStaffLogin}
      />
    </div>
  );
}