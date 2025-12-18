import React, { useState } from 'react';
import { X, LogIn, Eye, EyeOff, Mail, Lock, CheckCircle, AlertTriangle, UserPlus, User, Phone } from 'lucide-react';
import { PasswordRecovery } from './PasswordRecovery';

interface UniversalAuthProps {
  onLogin: (email: string, password: string) => Promise<any>;
  onRegister?: (email: string, password: string, fullName: string, phone?: string) => Promise<any>;
  onClose: () => void;
  title?: string;
}

export function UniversalAuth({ onLogin, onRegister, onClose, title = "Entrar na Desperto" }: UniversalAuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordRecovery, setShowPasswordRecovery] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // LOGIN
        console.log('🔐 Tentando login com:', formData.email);

        const result = await onLogin(formData.email, formData.password);
        console.log('📡 Resultado do login:', result);

        if (result.success && result.user) {
          setSuccess('Login realizado com sucesso!');
          setTimeout(() => {
            onClose();
          }, 300);
        } else {
          setError(result.error || 'Credenciais incorretas');
        }
      } else {
        // REGISTO
        if (!formData.fullName) {
          setError('Nome completo é obrigatório');
          setLoading(false);
          return;
        }

        if (!onRegister) {
          setError('Funcionalidade de registo não disponível');
          setLoading(false);
          return;
        }

        console.log('📝 Tentando registo com:', formData.email);

        const result = await onRegister(formData.email, formData.password, formData.fullName, formData.phone);
        console.log('📡 Resultado do registo:', result);

        if (result.success && result.user) {
          setSuccess('Conta criada com sucesso!');
          setTimeout(() => {
            onClose();
          }, 300);
        } else {
          setError(result.error || 'Erro ao criar conta');
        }
      }
    } catch (error) {
      console.error('Erro:', error);
      setError('Erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  if (showPasswordRecovery) {
    return (
      <PasswordRecovery
        onBack={() => setShowPasswordRecovery(false)}
        onSuccess={() => {
          setShowPasswordRecovery(false);
          setSuccess('Password recuperada com sucesso!');
        }}
        isStaffLogin={false}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="relative p-8 bg-gradient-to-br from-desperto-gold via-primary-500 to-primary-700 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                {isLogin ? <LogIn className="w-7 h-7" /> : <UserPlus className="w-7 h-7" />}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{isLogin ? 'Entrar' : 'Criar Conta'}</h2>
                <p className="text-white/90 text-sm">{isLogin ? 'Aceda à sua conta Desperto' : 'Registe-se na Desperto'}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-900">{success}</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-900">{error}</span>
              </div>
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nome Completo (apenas registo) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nome Completo *
                </label>
                <div className="relative">
                  <User className="w-5 h-5 absolute left-4 top-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-amber-100 focus:border-amber-500 transition-all"
                    placeholder="Seu nome completo"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email *
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-4 top-4 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-amber-100 focus:border-amber-500 transition-all"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            {/* Telefone (apenas registo) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Telefone (opcional)
                </label>
                <div className="relative">
                  <Phone className="w-5 h-5 absolute left-4 top-4 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-amber-100 focus:border-amber-500 transition-all"
                    placeholder="+351 912 345 678"
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-4 top-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full pl-12 pr-14 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-amber-100 focus:border-amber-500 transition-all"
                  placeholder="Sua password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {!isLogin && (
                <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
              )}
            </div>

            {/* Forgot Password Link (apenas login) */}
            {isLogin && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowPasswordRecovery(true)}
                  className="text-sm text-desperto-gold hover:text-primary-600 font-medium"
                >
                  Esqueceu a password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-desperto-gold to-primary-600 text-white rounded-xl font-bold hover:from-primary-600 hover:to-primary-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {loading ? 'Processando...' : isLogin ? 'Entrar' : 'Criar Conta'}
            </button>
          </form>

          {/* Toggle Login/Register */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {isLogin ? 'Não tem conta?' : 'Já tem conta?'}
              {' '}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setSuccess('');
                }}
                className="text-desperto-gold hover:text-primary-600 font-semibold"
              >
                {isLogin ? 'Criar Conta' : 'Entrar'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
