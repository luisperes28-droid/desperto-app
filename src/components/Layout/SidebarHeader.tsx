import React from 'react';

interface SidebarHeaderProps {
  onMobileMenuClose: () => void;
}

export function SidebarHeader({ onMobileMenuClose }: SidebarHeaderProps) {
  return (
    <div className="p-4 lg:p-6 border-b border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img 
            src="/Desperto LOGO.jpg" 
            alt="Desperto Logo" 
            className="w-12 h-12 lg:w-32 lg:h-32 object-contain rounded-lg"
          />
          <div className="lg:block">
            <h1 className="text-base lg:text-lg font-bold text-gray-900">Desperto</h1>
            <p className="text-xs text-gray-500">Despertar ao Minuto</p>
          </div>
        </div>
        
        {/* Close button for mobile */}
        <button
          onClick={onMobileMenuClose}
          className="lg:hidden p-1 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}