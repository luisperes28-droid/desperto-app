import React, { useState } from 'react';
import { MobileMenuButton } from './MobileMenuButton';
import { SidebarHeader } from './SidebarHeader';
import { Navigation } from './Navigation';
import { SidebarFooter } from './SidebarFooter';
import { X } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentMode?: 'client' | 'therapist' | 'admin';
}

export function Sidebar({ activeTab, setActiveTab, currentMode = 'client' }: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button - Fixed Position */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-3 bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all"
          aria-label="Abrir menu"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out z-50
        w-80 sm:w-72 bg-white shadow-2xl border-r border-gray-200 h-screen flex flex-col
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Mobile Header with Close Button */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="flex items-center space-x-3">
            <img 
              src="/Desperto LOGO.jpg" 
              alt="Desperto Logo" 
              className="w-10 h-10 object-contain rounded-lg"
            />
            <div>
              <h1 className="text-lg font-bold text-white">Desperto</h1>
              <p className="text-xs text-blue-100">Menu Principal</p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Fechar menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Desktop Header */}
        <div className="hidden lg:block">
          <SidebarHeader onMobileMenuClose={() => setIsMobileMenuOpen(false)} />
        </div>
        
        <Navigation 
          activeTab={activeTab} 
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setIsMobileMenuOpen(false);
          }} 
        />
        <SidebarFooter />
      </div>
    </>
  );
}