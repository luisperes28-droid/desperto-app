import React from 'react';
import { User, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { LoginFormData } from './AuthTypes';

interface LoginFormFieldsProps {
  formData: LoginFormData;
  setFormData: (data: LoginFormData | ((prev: LoginFormData) => LoginFormData)) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  isLogin: boolean;
  isStaffLogin?: boolean;
}

export function LoginFormFields({ 
  formData, 
  setFormData, 
  showPassword, 
  setShowPassword, 
  isLogin,
  isStaffLogin = false 
}: LoginFormFieldsProps) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email ou Username
        </label>
        <div className="relative">
          <User className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-desperto-gold focus:border-transparent"
            placeholder={isStaffLogin ? "Email ou username de staff" : "luisperes28@gmail.com"}
            required
          />
        </div>
      </div>

      {!isLogin && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome Completo
            </label>
            <div className="relative">
              <User className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-desperto-gold focus:border-transparent"
                placeholder="O seu nome completo"
                required={!isLogin}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-desperto-gold focus:border-transparent"
                placeholder="seu@email.com"
                required={!isLogin}
              />
            </div>
          </div>
        </>
      )}

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
            className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-desperto-gold focus:border-transparent"
            placeholder="admin123"
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
    </>
  );
}