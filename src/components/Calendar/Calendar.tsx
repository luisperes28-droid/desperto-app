import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, User, Settings } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TherapistAvailabilityManager } from './TherapistAvailability';
import { ClientBooking } from '../ClientBooking/ClientBooking';

export function Calendar() {
  const { bookings, clients, therapists } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [selectedTherapistForAvailability, setSelectedTherapistForAvailability] = useState<string | null>(null);
  const [showNewBookingModal, setShowNewBookingModal] = useState(false);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getBookingsForDate = (date: Date | null) => {
    if (!date) return [];
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.date);
      return bookingDate.toDateString() === date.toDateString();
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold text-gray-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {['month', 'week', 'day'].map((viewType) => (
              <button
                key={viewType}
                onClick={() => setView(viewType as any)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  view === viewType
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {viewType === 'month' ? 'Mês' : viewType === 'week' ? 'Semana' : 'Dia'}
              </button>
            ))}
          </div>
          
          <button 
            onClick={() => setShowNewBookingModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Agendamento</span>
          </button>
          
          <div className="relative">
            <select
              onChange={(e) => e.target.value && setSelectedTherapistForAvailability(e.target.value)}
              className="appearance-none bg-secondary-600 text-white px-4 py-2 rounded-lg hover:bg-secondary-700 transition-colors pr-8 shadow-md"
              defaultValue=""
            >
              <option value="" disabled>Gerir Disponibilidade</option>
              {therapists.map((therapist) => (
                <option key={therapist.id} value={therapist.id}>
                  {therapist.name}
                </option>
              ))}
            </select>
            <Settings className="w-4 h-4 absolute right-2 top-3 text-white pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
          {dayNames.map((day) => (
            <div key={day} className="p-4 text-center text-sm font-medium text-gray-700">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {days.map((date, index) => {
            const dayBookings = getBookingsForDate(date);
            const isToday = date && date.toDateString() === new Date().toDateString();
            
            return (
              <div
                key={index}
                className={`min-h-[120px] border-r border-b border-gray-200 p-2 ${
                  date ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'
                } transition-colors`}
              >
                {date && (
                  <>
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                      isToday
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-900 hover:bg-gray-100'
                    }`}>
                      {date.getDate()}
                    </div>
                    
                    <div className="mt-2 space-y-1">
                      {dayBookings.slice(0, 3).map((booking) => {
                        const client = clients.find(c => c.id === booking.clientId);
                        const bookingTime = new Date(booking.date);
                        
                        return (
                          <div
                            key={booking.id}
                            className={`p-1 rounded text-xs font-medium truncate ${
                              booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }`}
                          >
                            <div className="flex items-center space-x-1 mb-1">
                              {(() => {
                                const therapist = therapists.find(t => t.id === booking.therapistId);
                                return therapist ? (
                                  <img
                                    src={therapist.image}
                                    alt={therapist.name}
                                    className="w-4 h-4 rounded-full object-cover border border-white"
                                    title={therapist.name}
                                  />
                                ) : null;
                              })()}
                              <Clock className="w-3 h-3" />
                              <span>{bookingTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <User className="w-3 h-3" />
                              <span>{client?.name || 'Desconhecido'}</span>
                            </div>
                          </div>
                        );
                      })}
                      
                      {dayBookings.length > 3 && (
                        <div className="text-xs text-gray-500 font-medium">
                          +{dayBookings.length - 3} mais
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Availability Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Visão Geral da Disponibilidade</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="font-medium text-green-900">Disponível</p>
                <p className="text-sm text-green-700">25 horários esta semana</p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div>
                <p className="font-medium text-yellow-900">Parcialmente Reservado</p>
                <p className="text-sm text-yellow-700">8 horários esta semana</p>
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div>
                <p className="font-medium text-red-900">Totalmente Reservado</p>
                <p className="text-sm text-red-700">12 horários esta semana</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Therapist Availability Modal */}
      {selectedTherapistForAvailability && (
        <TherapistAvailabilityManager
          therapistId={selectedTherapistForAvailability}
          onClose={() => setSelectedTherapistForAvailability(null)}
        />
      )}

      {/* New Booking Modal */}
      {showNewBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-primary-800">Novo Agendamento</h2>
              <button
                onClick={() => setShowNewBookingModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto max-h-[85vh]">
              <ClientBooking />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}