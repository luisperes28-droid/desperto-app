import React from 'react';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';

export function EmailSetup() {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
  const isConfigured = !!(serviceId && templateId && publicKey);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Mail className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Configuração de Email</h2>
        </div>

        {!isConfigured ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <p className="text-yellow-800 font-medium">EmailJS Não Configurado</p>
            </div>
            <p className="text-yellow-700 text-sm mt-2">
              As variáveis de ambiente VITE_EMAILJS_* não estão configuradas no ficheiro .env
            </p>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-800 font-medium">EmailJS Configurado com Sucesso!</p>
            </div>
            <p className="text-green-700 text-sm mt-2">
              Emails serão enviados através do EmailJS
            </p>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuração Atual:</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service ID
                </label>
                <p className="text-sm text-gray-900 font-mono">
                  {serviceId || 'Não configurado'}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template ID
                </label>
                <p className="text-sm text-gray-900 font-mono">
                  {templateId || 'Não configurado'}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Public Key
                </label>
                <p className="text-sm text-gray-900 font-mono">
                  {publicKey ? `${publicKey.substring(0, 10)}...` : 'Não configurado'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Como Alterar as Configurações:</h4>
            <p className="text-sm text-blue-800">
              Para alterar as configurações do EmailJS, edite o ficheiro <code className="bg-blue-100 px-1 rounded">.env</code> e atualize as seguintes variáveis:
            </p>
            <ul className="text-sm text-blue-700 mt-2 space-y-1">
              <li><code className="bg-blue-100 px-1 rounded">VITE_EMAILJS_SERVICE_ID</code></li>
              <li><code className="bg-blue-100 px-1 rounded">VITE_EMAILJS_TEMPLATE_ID</code></li>
              <li><code className="bg-blue-100 px-1 rounded">VITE_EMAILJS_PUBLIC_KEY</code></li>
            </ul>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Template de Email Sugerido:</h4>
          <pre className="text-xs text-gray-600 whitespace-pre-wrap">
{`Assunto: {{subject}}

Olá,

{{message}}

Cumprimentos,
Equipa Desperto
{{from_email}}`}
          </pre>
        </div>
      </div>
    </div>
  );
}