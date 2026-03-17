import React from 'react';
import {
  Calendar,
  Users,
  CreditCard,
  Settings,
  BarChart3,
  MessageSquare,
  FileText,
  Zap,
  UserPlus,
  Ticket
} from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userType?: string;
}

type NavItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  roles: string[];
};

const navItems: NavItem[] = [
  { id: 'client-booking', label: 'Agendamento Cliente', icon: UserPlus, roles: ['admin', 'therapist'] },
  { id: 'dashboard', label: 'Painel Principal', icon: BarChart3, roles: ['admin', 'therapist'] },
  { id: 'calendar', label: 'Calendario', icon: Calendar, roles: ['admin', 'therapist'] },
  { id: 'bookings', label: 'Agendamentos', icon: Zap, roles: ['admin', 'therapist'] },
  { id: 'clients', label: 'Clientes', icon: Users, roles: ['admin', 'therapist'] },
  { id: 'payments', label: 'Pagamentos', icon: CreditCard, roles: ['admin', 'therapist'] },
  { id: 'coupons', label: 'Cupoes', icon: Ticket, roles: ['admin', 'therapist'] },
  { id: 'therapist-notes', label: 'Notas', icon: FileText, roles: ['admin', 'therapist'] },
  { id: 'messages', label: 'Mensagens', icon: MessageSquare, roles: ['admin'] },
  { id: 'settings', label: 'Definicoes', icon: Settings, roles: ['admin'] },
  { id: 'therapist-management', label: 'Gerir Terapeutas', icon: Users, roles: ['admin'] },
];

export function Navigation({ activeTab, setActiveTab, userType }: NavigationProps) {
  const visibleItems = navItems.filter(item => !userType || item.roles.includes(userType));

  return (
    <nav className="flex-1 px-3 py-4 lg:py-6 space-y-2 lg:space-y-2 overflow-y-auto">
      {visibleItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-4 rounded-xl transition-all duration-200 text-sm font-medium min-h-[48px] ${
              activeTab === item.id
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:shadow-md'
            }`}
            style={{ touchAction: 'manipulation' }}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="truncate text-left">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}