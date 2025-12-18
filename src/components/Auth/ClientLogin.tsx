import React, { useState } from 'react';
import { X, User, LogIn, UserPlus, Lock, ArrowLeft, Mail, Eye, EyeOff, Phone, MessageSquare } from 'lucide-react';
import { PasswordRecovery } from './PasswordRecovery';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';

interface ClientLoginProps {
  onLogin: (clientData: any) => void;
  onClose: () => void;
}

export function ClientLogin({ onLogin, onClose }: ClientLoginProps) {
  const { signIn, signUp } = useSupabaseAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPasswordRecovery, setShowPasswordRecovery] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // LOGIN
        const result = await signIn(formData.username, formData.password);
        
        if (result.success && result.user) {
          // RESTRIÇÃO: Só clientes podem fazer login aqui
          if (result.user.userType !== 'client') {
            setError('Esta área é apenas para clientes. Use o botão Staff/Admin para aceder como terapeuta ou administrador.');
            setLoading(false);
            return;
          }
          
          onLogin({
            name: result.user.fullName,
            email: result.user.email,
            phone: formData.phone
          });
        } else {
          setError(result.error || 'Login failed');
        }
      } else {
        // REGISTO
        if (!formData.email || !formData.fullName) {
          setError('Email e nome completo são obrigatórios para registo');
          setLoading(false);
          return;
        }

        const result = await signUp(formData.username, formData.email, formData.password, formData.fullName, formData.phone);
        
        if (result.success && result.user) {
          onLogin({
            name: result.user.fullName,
            email: result.user.email,
            phone: formData.phone
          });
        } else {
          setError(result.error || 'Registration failed');
        }
      }
    } catch (error) {
      setError('Erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  const fillTestCredentials = () => {
    setFormData({
      username: 'cliente@teste.com',
      email: 'cliente@teste.com',
      password: '123456',
      fullName: 'Cliente Teste',
      phone: ''
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Área do Cliente</h2>
                <p className="text-green-100 text-sm">
                  {showPasswordRecovery ? 'Recuperar Password' : isLogin ? 'Entre na sua conta' : 'Crie a sua conta'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {showPasswordRecovery ? (
            <div className="space-y-4">
              <button
                onClick={() => setShowPasswordRecovery(false)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar ao Login</span>
              </button>
              <PasswordRecovery
                onBack={() => setShowPasswordRecovery(false)}
                onSuccess={() => {
                  setShowPasswordRecovery(false);
                  setIsLogin(true);
                }}
                isStaffLogin={false}
              />
            </div>
          ) : (
            <>
              {/* Toggle Login/Register */}
              <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    isLogin
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Entrar
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    !isLogin
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Registar
                </button>
              </div>

              {/* Registration Info */}
              {!isLogin && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">📝 Criar Nova Conta de Cliente</h4>
                  <p className="text-sm text-green-800 mb-3">
                    Preencha todos os campos para criar a sua conta gratuita na Desperto.
                  </p>
                  <div className="bg-white border border-green-200 rounded-lg p-3 mb-3">
                    <h5 className="font-medium text-green-900 mb-2">✨ Benefícios da sua conta:</h5>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>✅ Agendamento rápido e fácil</li>
                      <li>✅ Histórico completo de consultas</li>
                      <li>✅ Reagendamento online</li>
                      <li>✅ Lembretes automáticos por email</li>
                      <li>✅ Dados preenchidos automaticamente</li>
                    </ul>
                  </div>
                  <div className="text-xs text-green-600">
                    <p>💡 <strong>Dica:</strong> Use um email válido para receber confirmações de agendamento</p>
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username/Email Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isLogin ? 'Email ou Username' : 'Username'}
                  </label>
                  <div className="relative">
                    <User className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder={isLogin ? "seu@email.com ou username" : "username"}
                      required
                    />
                  </div>
                </div>

                {/* Registration Fields */}
                {!isLogin && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome Completo *
                      </label>
                      <div className="relative">
                        <User className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                        <input
                          type="text"
                          value={formData.fullName}
                          onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="O seu nome completo"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <div className="relative">
                        <Mail className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="seu@email.com"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Telefone (opcional)
                      </label>
                      <div className="relative">
                        <Phone className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="+351 xxx xxx xxx"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="123456"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                      <span>{isLogin ? 'Entrar' : 'Registar'}</span>
                    </>
                  )}
                </button>
              </form>

              {/* Password Recovery - Always Visible */}
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowPasswordRecovery(true)}
                  className="text-green-600 hover:text-green-800 text-sm font-medium"
                >
                  Esqueci a minha password
                </button>
              </div>

              {/* Test Credentials */}
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <UserPlus className="w-4 h-4 text-green-600" />
                  <h4 className="font-medium text-green-900">Novo Cliente?</h4>
                </div>
                <div className="text-sm text-green-800">
                  <p>Clique em "Registar" acima para criar a sua conta gratuita.</p>
                  <p className="text-xs text-green-600 mt-1">
                    ✅ Registo rápido e seguro • ✅ Dados protegidos • ✅ Acesso imediato
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}