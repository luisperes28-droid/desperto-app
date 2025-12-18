import React from 'react';
import { AlertTriangle, UserPlus } from 'lucide-react';
import { LoginFormData } from './AuthTypes';

interface TestCredentialsProps {
  onFillCredentials: (type: 'admin' | 'client' | 'therapist') => void;
  isStaffLogin?: boolean;
}

export function TestCredentials({ onFillCredentials, isStaffLogin = false }: TestCredentialsProps) {
  return (
    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
      <div className="flex items-center space-x-2 mb-3">
        <AlertTriangle className="w-5 h-5 text-amber-600" />
        <h4 className="font-medium text-amber-900">Sistema de Produção</h4>
      </div>
      <div className="text-sm text-amber-800 space-y-2">
        <p>As contas de demonstração foram removidas para produção.</p>
        <p>Para aceder ao sistema:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Registe-se como novo utilizador</li>
          <li>Contacte o administrador para acesso de staff</li>
          <li>Use as credenciais fornecidas pelo administrador</li>
        </ul>
      </div>
      
      <div className="mt-4 p-3 bg-white border border-amber-200 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <UserPlus className="w-4 h-4 text-blue-600" />
          <span className="font-medium text-blue-900">Novo Utilizador?</span>
        </div>
        <p className="text-sm text-gray-700">
          Clique em "Registar" para criar uma nova conta de cliente.
        </p>
      </div>
    </div>
  );
}