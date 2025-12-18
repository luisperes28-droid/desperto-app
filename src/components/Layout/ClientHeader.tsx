import React from 'react';
import { LogIn } from 'lucide-react';

interface ClientHeaderProps {
  onStaffLogin: () => void;
  user?: any;
  onLogout?: () => void;
}

export function ClientHeader({ onStaffLogin, user, onLogout }: ClientHeaderProps) {
  return (
    <header className="bg-white shadow-lg border-b border-desperto-gray/20">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img 
              src="/Desperto LOGO.jpg" 
              alt="Desperto Logo" 
              className="w-60 h-60 object-contain rounded-lg shadow-sm"
            />
            <div>
              <h1 className="text-4xl font-bold text-desperto-gold">Desperto</h1>
              <p className="text-xl text-desperto-gray">Despertar ao Minuto</p>
            </div>
          </div>
          
          {/* Right side - Login/User info */}
          <div className="flex items-center space-x-3">
            {user ? (
              /* User is logged in - show user info and logout */
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    user.userType === 'admin' ? 'bg-purple-600' :
                    user.userType === 'therapist' ? 'bg-blue-600' :
                    'bg-green-600'
                  }`}>
                    {user.userType === 'admin' ? '👑' :
                     user.userType === 'therapist' ? '💙' :
                     '👤'}
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">{user.fullName}</p>
                    <p className="text-gray-600">
                      {user.userType === 'admin' ? 'Administrador' :
                       user.userType === 'therapist' ? 'Terapeuta' :
                       'Cliente'}
                    </p>
                  </div>
                </div>
                
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors shadow-md"
                  >
                    <LogIn className="w-4 h-4 rotate-180" />
                    <span>Sair</span>
                  </button>
                )}
              </div>
            ) : (
              /* No user logged in - show staff/admin login button */
              <button
                onClick={onStaffLogin}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-bold transition-all shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-blue-700 transform hover:scale-105"
              >
                <LogIn className="w-5 h-5" />
                <span>STAFF / ADMIN</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}