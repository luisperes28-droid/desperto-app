import React from 'react';
import { HeaderSearch } from './HeaderSearch';
import { UserInfo } from './UserInfo';
import { Shield, LogIn, Calendar, User, LogOut } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  user?: any;
  onStaffLogin: () => void;
  onLogout: () => void;
  isStaffUser: boolean;
  authenticatedClient?: any;
  onClientLogin?: () => void;
  onClientLogout?: () => void;
  onShowHistory?: () => void;
}

export function Header({ 
  activeTab, 
  user, 
  onStaffLogin, 
  onLogout, 
  isStaffUser,
  authenticatedClient,
  onClientLogin,
  onClientLogout,
  onShowHistory
}: HeaderProps) {
  // Don't show header for logged in clients - they have their own dashboard
  if (user?.userType === 'client' || (authenticatedClient && !isStaffUser)) {
    return null;
  }

  return (
    <header className="bg-white shadow-lg border-b border-gray-200 relative z-30">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3 lg:py-4">
        <div className="flex items-center justify-between min-h-[60px]">
          {/* Logo and Title */}
          <div className="flex items-center space-x-2 lg:space-x-4 flex-1 lg:flex-none">
            <img 
              src="/Desperto LOGO.jpg" 
              alt="Desperto Logo" 
              className="w-12 h-12 lg:w-64 lg:h-64 object-contain rounded-lg shadow-sm"
            />
            <div className="min-w-0">
              <h1 className="text-lg lg:text-4xl font-bold text-desperto-gold truncate">Desperto</h1>
              <p className="text-xs lg:text-lg text-desperto-gray hidden sm:block">Despertar ao Minuto</p>
              {isStaffUser && (
                <p className="text-xs text-gray-600 mt-1 hidden lg:block">Painel Administrativo</p>
              )}
            </div>
          </div>
          
          {/* Right side */}
          <div className="flex items-center space-x-2 lg:space-x-4 flex-shrink-0">
            {isStaffUser && (
              <div className="hidden md:block">
                <HeaderSearch />
              </div>
            )}
            
            {isStaffUser ? (
              <UserInfo user={user} onLogout={onLogout} />
            ) : (
              <div className="flex items-center">
                <button
                  onClick={onStaffLogin}
                  className="flex items-center space-x-1 lg:space-x-2 px-3 lg:px-12 py-2 lg:py-6 bg-desperto-gold text-white rounded-lg font-bold hover:bg-desperto-gold/90 transition-colors shadow-md text-sm lg:text-lg whitespace-nowrap"
                >
                  <span className="hidden sm:inline">ENTRAR</span>
                  <span className="sm:hidden">LOGIN</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}