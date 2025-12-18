import React, { useState } from 'react';
import { X, Shield, LogIn, AlertTriangle, Clock, Eye, EyeOff, User, Lock, Mail, ArrowLeft, CheckCircle, Smartphone } from 'lucide-react';
import { PasswordRecovery } from './PasswordRecovery';
import { validateCredentials, createUserData } from './AuthHelpers';
import { LoginFormData, AuthResult } from './AuthTypes';
import { supabase } from '../../lib/supabase';

interface StaffLoginProps {
  onLogin: (username: string, password: string) => Promise<AuthResult>;
  onClose: () => void;
}

export function StaffLogin({ onLogin, onClose }: StaffLoginProps) {
  const [showPasswordRecovery, setShowPasswordRecovery] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    email: '',
    password: '',
    fullName: '',
    confirmPassword: ''
  });
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [accountLocked, setAccountLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState<Date | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState(5);
  const [successMessage, setSuccessMessage] = useState('');

  // Real-time validation
  const validateField = (field: string, value: string) => {
    const errors: {[key: string]: string} = {};
    
    switch (field) {
      case 'username':
        if (!value.trim()) {
          errors.username = 'Email ou username é obrigatório';
        } else if (value.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.username = 'Formato de email inválido';
        }
        break;
      case 'password':
        if (!value.trim()) {
          errors.password = 'Password é obrigatória';
        }
        break;
    }
    
    setFormErrors(prev => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setAccountLocked(false);
    setSuccessMessage('');

    try {
      // Validate all fields
      const isValid = ['username', 'password'].every(field => {
        return validateField(field, formData[field as keyof LoginFormData]);
      });

      if (!isValid) {
        setLoading(false);
        return;
      }

      // Check account lockout
      const lockoutCheck = await checkAccountLockout(formData.username);
      if (lockoutCheck.isLocked) {
        setAccountLocked(true);
        setLockoutTime(lockoutCheck.lockoutUntil);
        setError(`Conta temporariamente bloqueada. Tente novamente em ${Math.ceil((lockoutCheck.lockoutUntil!.getTime() - Date.now()) / 60000)} minutos.`);
        setLoading(false);
        return;
      }

      // Validate for staff login
      const foundUser = validateCredentials(formData.username, formData.password);
      
      if (foundUser && foundUser.userType === 'client') {
        setError('Acesso restrito a terapeutas e administradores.');
        await logFailedAttempt(formData.username, 'wrong_user_type');
        setLoading(false);
        return;
      }
      
      const result = await onLogin(formData.username, formData.password);
      
      if (!result.success) {
        const failedAttempts = await handleFailedLogin(formData.username);
        setRemainingAttempts(Math.max(0, 5 - failedAttempts));
        
        if (failedAttempts >= 5) {
          setAccountLocked(true);
          setError('Conta bloqueada devido a muitas tentativas falhadas.');
        } else {
          setError(`${result.error || 'Credenciais incorretas'}. Restam ${5 - failedAttempts} tentativas.`);
        }
      } else {
        await resetFailedAttempts(formData.username);
        setSuccessMessage('Login realizado com sucesso!');
        
        // Remember me functionality
        if (rememberMe) {
          localStorage.setItem('desperto_remember_user', formData.username);
        }
        
        // Close modal immediately and reload
        onClose();
        window.location.reload();
      }
    } catch (error) {
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Load remembered username
  React.useEffect(() => {
    const rememberedUser = localStorage.getItem('desperto_remember_user');
    if (rememberedUser) {
      setFormData(prev => ({ ...prev, username: rememberedUser }));
      setRememberMe(true);
    }
  }, []);

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
        await logFailedAttempt(username, 'user_not_found');
        return 1;
      }

      const user = users[0];
      const newFailedAttempts = (user.failed_login_attempts || 0) + 1;
      
      let updateData: any = {
        failed_login_attempts: newFailedAttempts
      };

      if (newFailedAttempts >= 5) {
        const lockoutUntil = new Date(Date.now() + 30 * 60 * 1000);
        updateData.lockout_until = lockoutUntil.toISOString();
      }

      await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);

      await logFailedAttempt(username, 'invalid_credentials', user.id);
      
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

  const logFailedAttempt = async (username: string, status: string, userId?: string) => {
    try {
      const userAgent = navigator.userAgent;
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const { ip } = await ipResponse.json();

      await supabase
        .from('login_audit_logs')
        .insert({
          user_id: userId || null,
          ip_address: ip,
          user_agent: userAgent,
          status,
          details: { username, timestamp: new Date().toISOString() }
        });
    } catch (error) {
      console.error('Error logging failed attempt:', error);
    }
  };

  const fillTestCredentials = (type: 'admin' | 'therapist') => {
    const credentials = {
      admin: { username: 'euestoudesperto@gmail.com', password: 'Dhvif2m1' },
      therapist: { username: 'luisperes28@gmail.com', password: 'Dhvif2m0' }
    };
    
    setFormData(prev => ({
      ...prev,
      username: credentials[type].username,
      password: credentials[type].password
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-y-auto transform transition-all">
        {/* Modern Header with Gradient */}
        <div className="relative p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 text-white overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
                    {showPasswordRecovery ? 'Recuperar Acesso' : 'Área de Login'}
                  </h2>
                  <p className="text-white/90 text-xs sm:text-sm truncate">
                    {showPasswordRecovery ? 'Recupere o acesso à sua conta' : 'Acesso para todos os utilizadores'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white p-2 sm:p-3 rounded-full hover:bg-white/10 transition-all flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                style={{ touchAction: 'manipulation' }}
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {showPasswordRecovery ? (
            <div className="space-y-6">
              <button
                onClick={() => setShowPasswordRecovery(false)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors mb-4 min-h-[44px] p-2 -m-2"
                style={{ touchAction: 'manipulation' }}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar ao Login</span>
              </button>
              <PasswordRecovery
                onBack={() => setShowPasswordRecovery(false)}
                onSuccess={() => {
                  setShowPasswordRecovery(false);
                  setSuccessMessage('Password recuperada com sucesso!');
                }}
                isStaffLogin={true}
              />
            </div>
          ) : (
            <>
              {/* Success Message */}
              {successMessage && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-900">{successMessage}</span>
                  </div>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Username/Email Field */}
                <div className="space-y-2">
                  <label className="block text-sm sm:text-base font-semibold text-gray-700">
                    Email ou Username
                  </label>
                  <div className="relative group">
                    <User className="w-5 h-5 absolute left-3 sm:left-4 top-3 sm:top-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 border-2 rounded-xl transition-all focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 text-base min-h-[48px] ${
                        formErrors.username ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      placeholder="seu@email.com ou username"
                      required
                      style={{ touchAction: 'manipulation' }}
                    />
                  </div>
                  {formErrors.username && (
                    <p className="text-red-600 text-xs sm:text-sm flex items-center space-x-1 mt-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{formErrors.username}</span>
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label className="block text-sm sm:text-base font-semibold text-gray-700">
                    Password
                  </label>
                  <div className="relative group">
                    <Lock className="w-5 h-5 absolute left-3 sm:left-4 top-3 sm:top-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={`w-full pl-10 sm:pl-12 pr-12 sm:pr-14 py-3 sm:py-4 border-2 rounded-xl transition-all focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 text-base min-h-[48px] ${
                        formErrors.password ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      placeholder="Sua password"
                      required
                      style={{ touchAction: 'manipulation' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 sm:right-4 top-3 sm:top-4 text-gray-400 hover:text-gray-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                      style={{ touchAction: 'manipulation' }}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {formErrors.password && (
                    <p className="text-red-600 text-xs sm:text-sm flex items-center space-x-1 mt-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{formErrors.password}</span>
                    </p>
                  )}
                </div>

                {/* Remember Me */}
                <div className="flex items-center space-x-3 py-2">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2"
                    style={{ touchAction: 'manipulation' }}
                  />
                  <label htmlFor="rememberMe" className="text-sm sm:text-base text-gray-700 font-medium cursor-pointer">
                    Lembrar-me neste dispositivo
                  </label>
                </div>

                {/* Account Lockout Warning */}
                {accountLocked && lockoutTime && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 sm:p-6">
                    <div className="flex items-start space-x-2 mb-3">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <div className="flex-1">
                        <span className="font-semibold text-red-900 text-sm sm:text-base">Conta Temporariamente Bloqueada</span>
                      </div>
                    </div>
                    <p className="text-red-800 text-sm sm:text-base mb-3">
                      Muitas tentativas de login falhadas. A sua conta foi bloqueada por segurança.
                    </p>
                    <div className="flex items-center space-x-2 text-sm sm:text-base">
                      <Clock className="w-4 h-4 text-red-600" />
                      <span className="text-red-700">
                        Desbloqueio em: {lockoutTime.toLocaleTimeString('pt-PT')}
                      </span>
                    </div>
                  </div>
                )}

                {/* Remaining Attempts Warning */}
                {!accountLocked && remainingAttempts < 5 && remainingAttempts > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-6">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                      <span className="text-amber-800 text-sm sm:text-base font-medium">
                        Atenção: Restam {remainingAttempts} tentativas antes do bloqueio
                      </span>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 sm:p-6">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <span className="text-red-800 text-sm sm:text-base font-medium">{error}</span>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || accountLocked}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-semibold text-base sm:text-lg hover:from-indigo-700 hover:to-purple-700 focus:ring-4 focus:ring-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 sm:space-x-3 min-h-[48px]"
                  style={{ touchAction: 'manipulation' }}
                >
                  {loading ? (
                    <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-5 h-5 mr-2 sm:mr-3" />
                      <span>Entrar</span>
                    </>
                  )}
                </button>
              </form>

              {/* Forgot Password Link */}
              <div className="mt-4 sm:mt-6 text-center">
                <button
                  onClick={() => setShowPasswordRecovery(true)}
                  className="text-indigo-600 hover:text-indigo-800 font-medium text-sm sm:text-base transition-colors min-h-[44px] px-4 py-2"
                  style={{ touchAction: 'manipulation' }}
                >
                  Esqueceu a sua password?
                </button>
              </div>

              {/* Test Credentials */}
              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-xl sm:rounded-2xl">
                <h4 className="font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center text-sm sm:text-base">
                  <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-600" />
                  Contas de Demonstração
                </h4>
                <div className="space-y-2 sm:space-y-3">
                  <div className="bg-white border border-purple-200 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold text-purple-900 text-sm sm:text-base">Administrador</span>
                          <p className="text-xs sm:text-sm text-purple-700 truncate">Luís Guerreiro Peres</p>
                        </div>
                      </div>
                      <button
                        onClick={() => fillTestCredentials('admin')}
                        className="px-3 sm:px-4 py-2 sm:py-3 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm font-medium transition-all min-h-[44px] min-w-[60px] flex-shrink-0"
                        style={{ touchAction: 'manipulation' }}
                      >
                        Usar
                      </button>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                      <p><strong>Email:</strong> euestoudesperto@gmail.com</p>
                      <p><strong>Password:</strong> Dhvif2m1</p>
                    </div>
                  </div>
                  <div className="bg-white border border-blue-200 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold text-blue-900 text-sm sm:text-base">Terapeuta</span>
                          <p className="text-xs sm:text-sm text-blue-700 truncate">Luís Peres</p>
                        </div>
                      </div>
                      <button
                        onClick={() => fillTestCredentials('therapist')}
                        className="px-3 sm:px-4 py-2 sm:py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium transition-all min-h-[44px] min-w-[60px] flex-shrink-0"
                        style={{ touchAction: 'manipulation' }}
                      >
                        Usar
                      </button>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                      <p><strong>Email:</strong> luisperes28@gmail.com</p>
                      <p><strong>Password:</strong> Dhvif2m0</p>
                    </div>
                  </div>
                </div>
                <div className="text-xs sm:text-sm text-red-800 space-y-2">
                  <p>As contas de demonstração foram removidas por motivos de segurança.</p>
                  <p><strong>Para aceder como staff:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Contacte o administrador do sistema</li>
                    <li>Solicite credenciais oficiais</li>
                    <li>Use apenas contas autorizadas</li>
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}