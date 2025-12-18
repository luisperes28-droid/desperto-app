import React, { useState } from 'react';
import { Calendar, Clock, User, Mail, Phone, MapPin, CheckCircle, AlertCircle, X, RefreshCw, Plus, LogOut, Star, Award, TrendingUp, Heart } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ClientHistory } from './ClientHistory';

interface ClientDashboardProps {
  clientData: any;
  onLogout: () => void;
  onNewBooking: () => void;
}

export function ClientDashboard({ clientData, onLogout, onNewBooking }: ClientDashboardProps) {
  const { bookings, services, therapists, clients } = useApp();
  const [showAllBookings, setShowAllBookings] = useState(false);

  // Get display name safely
  const clientDisplayName = clientData?.fullName || clientData?.name || 'Cliente';

  // Guard clause to prevent null/undefined clientData errors
  if (!clientData || !clientData.email || !clientDisplayName) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-desperto-cream to-wellness-growth flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Erro de Autenticação</h2>
          <p className="text-gray-600 mb-4">Dados do cliente não encontrados.</p>
          <button
            onClick={onLogout}
            className="px-6 py-2 bg-desperto-gold text-white rounded-lg hover:bg-desperto-gold/90 font-medium transition-colors"
          >
            Voltar ao Login
          </button>
        </div>
      </div>
    );
  }

  // Find client in database
  const client = clients.find(c => c.email === clientData.email);
  const clientBookings = client ? bookings.filter(b => b.clientId === client.id) : [];
  
  // Separate upcoming and past bookings
  const now = new Date();
  const upcomingBookings = clientBookings
    .filter(b => new Date(b.date) >= now && b.status !== 'cancelled')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const completedBookings = clientBookings.filter(b => b.status === 'completed');
  const totalSpent = clientBookings.reduce((sum, booking) => {
    const service = services.find(s => s.id === booking.serviceId);
    return sum + (service?.price || 0);
  }, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'cancelled': return <X className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmado';
      case 'pending': return 'Pendente';
      case 'cancelled': return 'Cancelado';
      case 'completed': return 'Concluído';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-desperto-cream via-wellness-growth to-wellness-calm">
      {/* Header Section */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 lg:py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* User Info */}
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-desperto-gold to-desperto-yellow rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                <User className="w-8 h-8 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl lg:text-3xl font-bold text-desperto-gold truncate">
                  Olá, {clientDisplayName.split(' ')[0]}! 👋
                </h1>
                <p className="text-gray-600 text-sm lg:text-base">Bem-vindo de volta à Desperto</p>
                <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 sm:gap-4 mt-2 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{clientData.email}</span>
                  </div>
                  {clientData.phone && (
                    <div className="flex items-center space-x-1">
                      <Phone className="w-4 h-4" />
                      <span>{clientData.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <button
                onClick={() => {
                  console.log('🎯 Botão Nova Consulta clicado');
                  onNewBooking();
                }}
                className="flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-desperto-gold to-desperto-yellow text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all font-semibold min-h-[48px] text-base"
                style={{ touchAction: 'manipulation' }}
              >
                <Plus className="w-5 h-5" />
                <span>Nova Consulta</span>
              </button>
              
              <button
                onClick={() => {
                  console.log('🎯 Botão Ver Histórico clicado');
                  setShowAllBookings(true);
                }}
                className="flex items-center justify-center space-x-2 px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 hover:shadow-lg transform hover:scale-105 transition-all font-semibold min-h-[48px] text-base"
                style={{ touchAction: 'manipulation' }}
              >
                <Calendar className="w-5 h-5" />
                <span>Ver Histórico</span>
              </button>
              
              <button
                onClick={onLogout}
                className="flex items-center justify-center space-x-2 px-4 py-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all min-h-[48px]"
                style={{ touchAction: 'manipulation' }}
              >
                <LogOut className="w-4 h-4" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Próximas Consultas</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{upcomingBookings.length}</p>
                <p className="text-xs text-gray-500 mt-1">Agendadas</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Consultas Realizadas</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{completedBookings.length}</p>
                <p className="text-xs text-gray-500 mt-1">Concluídas</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upcoming Appointments */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-desperto-gold to-desperto-yellow p-6">
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Calendar className="w-6 h-6" />
                  <span>Próximas Consultas</span>
                </h2>
                <p className="text-desperto-cream text-sm mt-1">
                  {upcomingBookings.length > 0 ? 'As suas consultas agendadas' : 'Nenhuma consulta agendada'}
                </p>
              </div>

              <div className="p-6">
                {upcomingBookings.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Calendar className="w-10 h-10 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Agenda Livre</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      Não tem consultas marcadas. Que tal agendar uma sessão para continuar o seu crescimento pessoal?
                    </p>
                    <button
                      onClick={onNewBooking}
                      className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-desperto-gold to-desperto-yellow text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all font-semibold"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Marcar Primeira Consulta</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingBookings.map((booking) => {
                      const service = services.find(s => s.id === booking.serviceId);
                      const therapist = therapists.find(t => t.id === booking.therapistId);
                      const bookingDate = new Date(booking.date);
                      const isToday = bookingDate.toDateString() === new Date().toDateString();
                      const isTomorrow = bookingDate.toDateString() === new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString();
                      
                      return (
                        <div key={booking.id} className={`border-2 rounded-xl p-6 transition-all hover:shadow-md ${
                          isToday ? 'border-green-300 bg-green-50' : 
                          isTomorrow ? 'border-blue-300 bg-blue-50' : 
                          'border-gray-200 bg-white hover:border-desperto-gold/30'
                        }`}>
                          {isToday && (
                            <div className="flex items-center space-x-2 mb-4 text-green-700">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-sm font-semibold">HOJE</span>
                            </div>
                          )}
                          {isTomorrow && (
                            <div className="flex items-center space-x-2 mb-4 text-blue-700">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-sm font-semibold">AMANHÃ</span>
                            </div>
                          )}
                          
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4 flex-1">
                              {therapist && (
                                <div className="relative">
                                  <img
                                    src={therapist.image}
                                    alt={therapist.name}
                                    className="w-14 h-14 rounded-full object-cover shadow-md"
                                  />
                                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
                                </div>
                              )}
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900 mb-1">{service?.name}</h3>
                                <p className="text-desperto-gold font-semibold mb-2">{therapist?.name}</p>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                  <div className="flex items-center space-x-2 text-gray-600">
                                    <Calendar className="w-4 h-4 text-blue-500" />
                                    <span className="font-medium">
                                      {bookingDate.toLocaleDateString('pt-PT', { 
                                        weekday: 'short', 
                                        day: 'numeric', 
                                        month: 'short' 
                                      })}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2 text-gray-600">
                                    <Clock className="w-4 h-4 text-green-500" />
                                    <span className="font-medium">
                                      {bookingDate.toLocaleTimeString('pt-PT', { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                      })}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2 text-gray-600">
                                    <MapPin className="w-4 h-4 text-purple-500" />
                                    <span>Desperto</span>
                                  </div>
                                  <div className="flex items-center space-x-2 text-gray-600">
                                    <span className="text-lg font-bold text-desperto-gold">€{service?.price}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-end space-y-2">
                              <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(booking.status)}`}>
                                {getStatusIcon(booking.status)}
                                <span>{getStatusLabel(booking.status)}</span>
                              </div>
                            </div>
                          </div>

                          {booking.notes && (
                            <div className="mt-4 p-3 bg-gray-50 rounded-lg border-l-4 border-desperto-gold">
                              <p className="text-sm text-gray-700">{booking.notes}</p>
                            </div>
                          )}

                          {/* Reschedule Request Status */}
                          {booking.rescheduleRequest && (
                            <div className={`mt-4 p-4 rounded-lg border-l-4 ${
                              booking.rescheduleRequest.status === 'pending' ? 'bg-yellow-50 border-yellow-400' :
                              booking.rescheduleRequest.status === 'approved' ? 'bg-green-50 border-green-400' :
                              'bg-red-50 border-red-400'
                            }`}>
                              <div className="flex items-center space-x-2 mb-2">
                                <RefreshCw className={`w-5 h-5 ${
                                  booking.rescheduleRequest.status === 'pending' ? 'text-yellow-600' :
                                  booking.rescheduleRequest.status === 'approved' ? 'text-green-600' :
                                  'text-red-600'
                                }`} />
                                <span className={`font-semibold ${
                                  booking.rescheduleRequest.status === 'pending' ? 'text-yellow-800' :
                                  booking.rescheduleRequest.status === 'approved' ? 'text-green-800' :
                                  'text-red-800'
                                }`}>
                                  {booking.rescheduleRequest.status === 'pending' ? '⏳ Reagendamento Pendente' :
                                   booking.rescheduleRequest.status === 'approved' ? '✅ Reagendamento Aprovado' :
                                   '❌ Reagendamento Rejeitado'}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700">
                                <strong>Novo horário:</strong> {new Date(booking.rescheduleRequest.newDate).toLocaleDateString('pt-PT')} às {new Date(booking.rescheduleRequest.newDate).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              {booking.rescheduleRequest.therapistResponse && (
                                <p className="text-sm text-gray-600 mt-1">
                                  <strong>Resposta:</strong> {booking.rescheduleRequest.therapistResponse}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Client Stats */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Award className="w-5 h-5 text-purple-500" />
                <span>O Seu Progresso</span>
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Heart className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-purple-900">Consultas Realizadas</span>
                  </div>
                  <span className="text-lg font-bold text-purple-600">{completedBookings.length}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Cliente desde</span>
                  </div>
                  <span className="text-sm font-bold text-blue-600">
                    {client?.createdAt ? new Date(client.createdAt).toLocaleDateString('pt-PT', { month: 'short', year: 'numeric' }) : 'Recente'}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Therapists */}
            {completedBookings.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Agendamentos Recentes</h3>
                <div className="space-y-3">
                  {completedBookings
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 3)
                    .map((booking) => {
                      const therapist = therapists.find(t => t.id === booking.therapistId);
                      const service = services.find(s => s.id === booking.serviceId);
                      const bookingDate = new Date(booking.date);
                      
                      return therapist && service ? (
                        <div key={booking.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <img
                            src={therapist.image}
                            alt={therapist.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{service.name}</p>
                            <p className="text-xs text-gray-500">{therapist.name}</p>
                            <p className="text-xs text-gray-400">
                              {bookingDate.toLocaleDateString('pt-PT', { 
                                day: 'numeric', 
                                month: 'short' 
                              })}
                            </p>
                          </div>
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        </div>
                      ) : null;
                    })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* All Bookings Modal */}
        {showAllBookings && (
          <ClientHistory
            clientData={clientData}
            onClose={() => setShowAllBookings(false)}
          />
        )}
      </div>
    </div>
  );
}