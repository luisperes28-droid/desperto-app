import React from 'react';
import { StatsCard } from './StatsCard';
import { Calendar, Users, DollarSign, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface DashboardProps {
  onNavigate?: (tab: string) => void;
  currentUser?: any;
}

export function Dashboard({ onNavigate, currentUser }: DashboardProps) {
  const { bookings, clients, payments, therapists } = useApp();

  // Calculate stats
  const todayBookings = bookings.filter(booking => {
    const today = new Date();
    const bookingDate = new Date(booking.date);
    return bookingDate.toDateString() === today.toDateString();
  });

  const completedBookings = bookings.filter(booking => booking.status === 'completed');
  const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const pendingBookings = bookings.filter(booking => booking.status === 'pending');

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <StatsCard
          title="Agendamentos Hoje"
          value={todayBookings.length}
          change="+12% vs ontem"
          changeType="positive"
          icon={Calendar}
          color="blue"
        />
        <StatsCard
          title="Total de Clientes"
          value={clients.length}
          change="+5 novos esta semana"
          changeType="positive"
          icon={Users}
          color="green"
        />
        <StatsCard
          title="Receita Mensal"
          value={`$${totalRevenue.toLocaleString()}`}
          change="+18% vs mês passado"
          changeType="positive"
          icon={DollarSign}
          color="purple"
        />
        <StatsCard
          title="Taxa de Conclusão"
          value={`${bookings.length ? Math.round((completedBookings.length / bookings.length) * 100) : 0}%`}
          change="+2% vs mês passado"
          changeType="positive"
          icon={TrendingUp}
          color="orange"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Agendamentos Recentes</h3>
          <div className="space-y-4">
            {bookings.slice(0, 5).map((booking) => {
              const client = clients.find(c => c.id === booking.clientId);
              return (
                <div key={booking.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg space-y-2 sm:space-y-0 min-w-0">
                  <div className="flex items-center space-x-3 min-w-0 flex-1 overflow-hidden">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <p className="font-medium text-gray-900 text-sm sm:text-base break-words">{client?.name || 'Cliente Desconhecido'}</p>
                      <p className="text-xs sm:text-sm text-gray-500 break-words">
                        {new Date(booking.date).toLocaleDateString()} • {(() => {
                          const therapist = therapists.find(t => t.id === booking.therapistId);
                          return therapist?.name || 'Terapeuta';
                        })()}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 sm:px-3 py-1 text-xs font-medium rounded-full flex-shrink-0 text-center min-w-0 ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {booking.status === 'confirmed' ? 'confirmado' :
                     booking.status === 'pending' ? 'pendente' :
                     booking.status === 'cancelled' ? 'cancelado' :
                     booking.status === 'completed' ? 'concluído' : booking.status}
                  </span>
                </div>
              );
            })}
            {bookings.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm sm:text-base">Nenhum agendamento recente</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            <button 
              onClick={() => onNavigate?.('client-booking')}
              className="flex items-center space-x-3 p-4 sm:p-5 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors shadow-sm min-h-[56px] text-left min-w-0"
              style={{ touchAction: 'manipulation' }}
            >
              <Calendar className="w-5 h-5 text-blue-700" />
              <span className="font-medium text-blue-900 text-sm sm:text-base break-words">Agendar Novo Compromisso</span>
            </button>
            <button 
              onClick={() => onNavigate?.('clients')}
              className="flex items-center space-x-3 p-4 sm:p-5 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors shadow-sm min-h-[56px] text-left min-w-0"
              style={{ touchAction: 'manipulation' }}
            >
              <Users className="w-5 h-5 text-emerald-700" />
              <span className="font-medium text-emerald-900 text-sm sm:text-base break-words">Gerir Clientes</span>
            </button>
            <button 
              onClick={() => onNavigate?.('payments')}
              className="flex items-center space-x-3 p-4 sm:p-5 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors shadow-sm min-h-[56px] text-left min-w-0"
              style={{ touchAction: 'manipulation' }}
            >
              <DollarSign className="w-5 h-5 text-amber-700" />
              <span className="font-medium text-amber-900 text-sm sm:text-base break-words">Processar Pagamento</span>
            </button>
          </div>
        </div>
      </div>

      {/* Upcoming Schedule */}
      <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Agenda de Hoje</h3>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-xs sm:text-sm text-gray-500 hidden sm:inline">Atualizado há 5 minutos</span>
          </div>
        </div>
        
        <div className="space-y-4">
          {todayBookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-base font-medium">Nenhum agendamento para hoje</p>
              <p className="text-sm">A sua agenda está livre!</p>
            </div>
          ) : (
            todayBookings.map((booking) => {
              const client = clients.find(c => c.id === booking.clientId);
              return (
                <div key={booking.id} className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 p-4 border border-gray-200 rounded-lg">
                  <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0 sm:self-start"></div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0 min-w-0">
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <p className="font-medium text-gray-900 text-sm sm:text-base break-words">{client?.name || 'Cliente Desconhecido'}</p>
                        <p className="text-xs sm:text-sm text-gray-500 break-words">
                          {new Date(booking.date).toLocaleTimeString()} • {(() => {
                            const therapist = therapists.find(t => t.id === booking.therapistId);
                            return therapist?.name || 'Terapeuta';
                          })()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0 mt-2 sm:mt-0">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-xs sm:text-sm font-medium text-green-700 break-words">Confirmado</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}