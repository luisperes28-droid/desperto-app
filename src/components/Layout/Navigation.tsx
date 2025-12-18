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
  Mail,
  Ticket,
  Activity
} from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const navItems = [
  { id: 'client-booking', label: 'Agendamento Cliente', icon: UserPlus },
  { id: 'dashboard', label: 'Painel Principal', icon: BarChart3 },
  { id: 'calendar', label: 'Calendário', icon: Calendar },
  { id: 'bookings', label: 'Agendamentos', icon: Zap },
  { id: 'clients', label: 'Clientes', icon: Users },
  { id: 'payments', label: 'Pagamentos', icon: CreditCard },
  { id: 'coupons', label: 'Cupões', icon: Ticket },
  { id: 'therapist-notes', label: 'Notas', icon: FileText },
  { id: 'messages', label: 'Mensagens', icon: MessageSquare },
  { id: 'system-check', label: 'Diagnóstico Sistema', icon: Activity },
  { id: 'settings', label: 'Definições', icon: Settings },
  { id: 'email-setup', label: 'Configurar Email', icon: Mail },
  { id: 'therapist-management', label: 'Gerir Terapeutas', icon: Users },
];

export function Navigation({ activeTab, setActiveTab }: NavigationProps) {
  return (
    <nav className="flex-1 px-3 py-4 lg:py-6 space-y-2 lg:space-y-2 overflow-y-auto">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-4 rounded-xl transition-all duration-200 text-sm font-medium min-h-[48px] ${
              activeTab === item.id
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
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