import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CheckResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'loading';
  message: string;
  details?: string;
}

export function SystemCheck() {
  const [checks, setChecks] = useState<CheckResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const updateCheck = (name: string, status: CheckResult['status'], message: string, details?: string) => {
    setChecks(prev => {
      const filtered = prev.filter(c => c.name !== name);
      return [...filtered, { name, status, message, details }];
    });
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setChecks([]);

    updateCheck('supabase-connection', 'loading', 'Verificando conexão Supabase...');
    try {
      const { data, error } = await supabase.from('users').select('count');
      if (error) throw error;
      updateCheck('supabase-connection', 'success', 'Conexão Supabase OK', `Base de dados acessível`);
    } catch (error: any) {
      updateCheck('supabase-connection', 'error', 'Falha na conexão Supabase', error.message);
    }

    updateCheck('database-tables', 'loading', 'Verificando tabelas...');
    try {
      const tables = ['users', 'user_profiles', 'services', 'bookings', 'payments', 'coupons'];
      const results = await Promise.all(
        tables.map(async (table) => {
          const { error } = await supabase.from(table).select('count').limit(1);
          return { table, exists: !error };
        })
      );

      const missing = results.filter(r => !r.exists).map(r => r.table);
      if (missing.length === 0) {
        updateCheck('database-tables', 'success', 'Todas as tabelas existem', `${results.length} tabelas verificadas`);
      } else {
        updateCheck('database-tables', 'error', 'Tabelas em falta', `Faltam: ${missing.join(', ')}`);
      }
    } catch (error: any) {
      updateCheck('database-tables', 'error', 'Erro ao verificar tabelas', error.message);
    }

    updateCheck('test-users', 'loading', 'Verificando utilizadores de teste...');
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('username, email, user_type')
        .in('username', ['admin', 'luisperes', 'cliente']);

      if (error) throw error;

      if (users && users.length === 3) {
        updateCheck('test-users', 'success', 'Utilizadores de teste OK',
          `Admin, Terapeuta e Cliente encontrados`);
      } else {
        updateCheck('test-users', 'warning', 'Alguns utilizadores em falta',
          `Encontrados: ${users?.length || 0}/3`);
      }
    } catch (error: any) {
      updateCheck('test-users', 'error', 'Erro ao verificar utilizadores', error.message);
    }

    updateCheck('services', 'loading', 'Verificando serviços...');
    try {
      const { data: services, error } = await supabase
        .from('services')
        .select('count');

      if (error) throw error;

      const count = services.length;
      if (count > 0) {
        updateCheck('services', 'success', `${count} serviço(s) disponível(eis)`, 'Serviços criados com sucesso');
      } else {
        updateCheck('services', 'warning', 'Sem serviços cadastrados', 'Nenhum serviço encontrado');
      }
    } catch (error: any) {
      updateCheck('services', 'error', 'Erro ao verificar serviços', error.message);
    }

    updateCheck('emailjs', 'loading', 'Verificando EmailJS...');
    const emailjsServiceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const emailjsTemplateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const emailjsPublicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    if (emailjsServiceId && emailjsTemplateId && emailjsPublicKey) {
      updateCheck('emailjs', 'success', 'EmailJS configurado',
        'Variáveis de ambiente configuradas');
    } else {
      const missing = [];
      if (!emailjsServiceId) missing.push('VITE_EMAILJS_SERVICE_ID');
      if (!emailjsTemplateId) missing.push('VITE_EMAILJS_TEMPLATE_ID');
      if (!emailjsPublicKey) missing.push('VITE_EMAILJS_PUBLIC_KEY');

      updateCheck('emailjs', 'warning', 'EmailJS parcialmente configurado',
        `Em falta: ${missing.join(', ')}`);
    }

    updateCheck('stripe', 'loading', 'Verificando Stripe...');
    const stripeConfigured = false;
    if (stripeConfigured) {
      updateCheck('stripe', 'success', 'Stripe configurado', 'Chaves API encontradas');
    } else {
      updateCheck('stripe', 'warning', 'Stripe não configurado',
        'Apenas modo de demonstração disponível');
    }

    updateCheck('env-vars', 'loading', 'Verificando variáveis de ambiente...');
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      updateCheck('env-vars', 'success', 'Variáveis de ambiente OK',
        'VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY definidas');
    } else {
      updateCheck('env-vars', 'error', 'Variáveis de ambiente em falta',
        'Ficheiro .env não configurado');
    }

    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: CheckResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'loading':
        return <Loader className="w-5 h-5 text-blue-600 animate-spin" />;
    }
  };

  const getStatusColor = (status: CheckResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'loading':
        return 'bg-blue-50 border-blue-200';
    }
  };

  const sortedChecks = [...checks].sort((a, b) => {
    const order = { loading: 0, error: 1, warning: 2, success: 3 };
    return order[a.status] - order[b.status];
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Diagnóstico do Sistema</h2>
          <button
            onClick={runDiagnostics}
            disabled={isRunning}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isRunning ? 'A verificar...' : 'Executar Novamente'}
          </button>
        </div>

        <div className="space-y-3">
          {sortedChecks.map((check, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${getStatusColor(check.status)}`}
            >
              <div className="flex items-start space-x-3">
                {getStatusIcon(check.status)}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{check.name}</h3>
                  <p className="text-sm text-gray-700 mt-1">{check.message}</p>
                  {check.details && (
                    <p className="text-xs text-gray-600 mt-1">{check.details}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {sortedChecks.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            A executar diagnóstico...
          </div>
        )}

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Credenciais de Teste</h3>
          <div className="text-sm text-gray-700 space-y-1">
            <p><strong>Admin:</strong> admin / Dhvif2m1</p>
            <p><strong>Terapeuta:</strong> luisperes / Dhvif2m0</p>
            <p><strong>Cliente:</strong> cliente / 123456</p>
          </div>
        </div>
      </div>
    </div>
  );
}
