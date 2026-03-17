import React from 'react';
import { Shield, Heart, User, LogOut } from 'lucide-react';

interface UserInfoProps {
  user: any;
  onLogout: () => void;
}

export function UserInfo({ user, onLogout }: UserInfoProps) {
  const getUserIcon = () => {
    switch (user.userType) {
      case 'admin': return Shield;
      case 'therapist': return Heart;
      default: return User;
    }
  };

  const getUserColor = () => {
    switch (user.userType) {
      case 'admin': return 'bg-purple-600';
      case 'therapist': return 'bg-blue-600';
      default: return 'bg-green-600';
    }
  };

  const getUserTypeLabel = () => {
    switch (user.userType) {
      case 'admin': return 'Administrador';
      case 'therapist': return 'Terapeuta';
      case 'client': return 'Cliente';
      default: return 'Utilizador';
    }
  };

  const UserIcon = getUserIcon();

  return (
    <div className="flex items-center space-x-2">
      <div className="text-right hidden lg:block">
        <p className="text-sm font-medium text-gray-900 truncate max-w-32">{user.fullName}</p>
        <p className="text-xs text-gray-600">{getUserTypeLabel()}</p>
      </div>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getUserColor()} shadow-md`}>
        <UserIcon className="w-5 h-5 text-white" />
      </div>
      
      <button
        onClick={onLogout}
        className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg hover:bg-red-700 text-sm min-h-[44px]"
        title="Sair da Aplicação"
      >
        <LogOut className="w-4 h-4" />
        <span className="hidden md:inline">Sair</span>
      </button>
    </div>
  );
}