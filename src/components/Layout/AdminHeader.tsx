import React from 'react';
import { HeaderSearch } from './HeaderSearch';
import { UserInfo } from './UserInfo';

interface AdminHeaderProps {
  activeTab: string;
  user: any;
  onLogout: () => void;
}

export function AdminHeader({ activeTab, user, onLogout }: AdminHeaderProps) {
  const getTitle = () => {
    switch (activeTab) {
      case 'client-booking': return 'Agendamento Cliente';
      case 'dashboard': return 'Painel Principal';
      case 'calendar': return 'Calendário';
      case 'bookings': return 'Agendamentos';
      case 'clients': return 'Clientes';
      case 'payments': return 'Pagamentos';
      case 'messages': return 'Mensagens';
      case 'forms': return 'Formulários';
      case 'settings': return 'Definições';
      case 'email-setup': return 'Configurar Email';
      case 'therapist-management': return 'Gerir Terapeutas';
      default: return 'Painel Principal';
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900">{getTitle()}</h2>
        </div>
        
        <div className="flex items-center space-x-4">
          <HeaderSearch />
          <UserInfo user={user} onLogout={onLogout} />
        </div>
      </div>
    </header>
  );
}