import React, { useState, useEffect } from 'react';
import { Shield, Key, HelpCircle, Smartphone, Mail, Eye, AlertTriangle, CheckCircle } from 'lucide-react';
import { SecurityQuestionsSetup } from '../Auth/SecurityQuestionsSetup';
import { supabase } from '../../lib/supabase';

interface SecuritySettingsProps {
  userId: string;
}

export function SecuritySettings({ userId }: SecuritySettingsProps) {
  const [showSecurityQuestions, setShowSecurityQuestions] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [securityQuestionsCount, setSecurityQuestionsCount] = useState(0);
  const [recentLogins, setRecentLogins] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSecurityStatus();
    loadRecentLogins();
  }, [userId]);

  const loadSecurityStatus = async () => {
    try {
      // Verificar perguntas de segurança
      const { data: questions, error: questionsError } = await supabase
        .from('security_questions')
        .select('id')
        .eq('user_id', userId);

      if (!questionsError && questions) {
        setSecurityQuestionsCount(questions.length);
      }

      // Verificar 2FA
      const { data: twoFactor, error: twoFactorError } = await supabase
        .from('two_factor_auth_settings')
        .select('enabled')
        .eq('user_id', userId)
        .eq('enabled', true);

      if (!twoFactorError && twoFactor && twoFactor.length > 0) {
        setTwoFactorEnabled(true);
      }

    } catch (error) {
      console.error('Error loading security status:', error);
    }
  };

  const loadRecentLogins = async () => {
    try {
      const { data: logs, error } = await supabase
        .from('login_audit_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'success')
        .order('attempt_at', { ascending: false })
        .limit(5);

      if (!error && logs) {
        setRecentLogins(logs);
      }
    } catch (error) {
      console.error('Error loading recent logins:', error);
    }
  };

  const getSecurityScore = () => {
    let score = 0;
    if (securityQuestionsCount >= 3) score += 30;
    if (twoFactorEnabled) score += 40;
    score += 30; // Base score for having an account
    return Math.min(score, 100);
  };

  const getSecurityLevel = (score: number) => {
    if (score >= 90) return { level: 'Excelente', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 70) return { level: 'Boa', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (score >= 50) return { level: 'Média', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { level: 'Fraca', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const securityScore = getSecurityScore();
  const securityLevel = getSecurityLevel(securityScore);

  return (
    <div className="space-y-6">
      {/* Security Score */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Nível de Segurança da Conta</h3>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${securityLevel.bg} ${securityLevel.color}`}>
            {securityLevel.level}
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Pontuação de Segurança</span>
            <span>{securityScore}/100</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${
                securityScore >= 90 ? 'bg-green-500' :
                securityScore >= 70 ? 'bg-blue-500' :
                securityScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${securityScore}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              securityQuestionsCount >= 3 ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              <HelpCircle className={`w-4 h-4 ${
                securityQuestionsCount >= 3 ? 'text-green-600' : 'text-gray-400'
              }`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Perguntas de Segurança</p>
              <p className="text-xs text-gray-500">
                {securityQuestionsCount}/3 configuradas
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              twoFactorEnabled ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              <Smartphone className={`w-4 h-4 ${
                twoFactorEnabled ? 'text-green-600' : 'text-gray-400'
              }`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Verificação 2FA</p>
              <p className="text-xs text-gray-500">
                {twoFactorEnabled ? 'Ativada' : 'Desativada'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Key className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Password Forte</p>
              <p className="text-xs text-gray-500">Configurada</p>
            </div>
          </div>
        </div>
      </div>

      {/* Security Features */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Funcionalidades de Segurança</h3>
        
        <div className="space-y-4">
          {/* Security Questions */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <HelpCircle className="w-5 h-5 text-purple-600" />
              <div>
                <h4 className="font-medium text-gray-900">Perguntas de Segurança</h4>
                <p className="text-sm text-gray-600">
                  {securityQuestionsCount > 0 
                    ? `${securityQuestionsCount} perguntas configuradas`
                    : 'Configure perguntas para recuperação de password'
                  }
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowSecurityQuestions(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
            >
              {securityQuestionsCount > 0 ? 'Alterar' : 'Configurar'}
            </button>
          </div>

          {/* Two-Factor Authentication */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <Smartphone className="w-5 h-5 text-blue-600" />
              <div>
                <h4 className="font-medium text-gray-900">Verificação em Duas Etapas</h4>
                <p className="text-sm text-gray-600">
                  {twoFactorEnabled 
                    ? 'Proteção adicional ativada'
                    : 'Adicione uma camada extra de segurança'
                  }
                </p>
              </div>
            </div>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              disabled
            >
              {twoFactorEnabled ? 'Configurado' : 'Em Breve'}
            </button>
          </div>

          {/* Password Change */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <Key className="w-5 h-5 text-green-600" />
              <div>
                <h4 className="font-medium text-gray-900">Alterar Password</h4>
                <p className="text-sm text-gray-600">
                  Atualize a sua password regularmente
                </p>
              </div>
            </div>
            <button
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
              disabled
            >
              Em Breve
            </button>
          </div>
        </div>
      </div>

      {/* Recent Login Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Atividade Recente de Login</h3>
        
        {recentLogins.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhuma atividade de login registada</p>
        ) : (
          <div className="space-y-3">
            {recentLogins.map((log, index) => (
              <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Login bem-sucedido
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(log.attempt_at).toLocaleString('pt-PT')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">IP: {log.ip_address}</p>
                  <p className="text-xs text-gray-400 truncate max-w-32" title={log.user_agent}>
                    {log.user_agent?.split(' ')[0] || 'Desconhecido'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security Questions Modal */}
      {showSecurityQuestions && (
        <SecurityQuestionsSetup
          userId={userId}
          onClose={() => setShowSecurityQuestions(false)}
          onSuccess={() => {
            setShowSecurityQuestions(false);
            loadSecurityStatus();
          }}
        />
      )}
    </div>
  );
}