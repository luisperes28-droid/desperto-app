import React, { useState } from 'react';
import { Calendar, Clock, User, MapPin, Phone, Mail, X, RefreshCw, Trash2, CheckCircle, AlertCircle, Send } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { EmailService } from '../../services/emailService';

interface ClientHistoryProps {
  clientData: any;
  onClose: () => void;
}

export function ClientHistory({ clientData, onClose }: ClientHistoryProps) {
  const { bookings, setBookings, services, therapists, clients } = useApp();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [showCancelModal, setShowCancelModal] = useState<string | null>(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState<string | null>(null);
  const [rescheduleData, setRescheduleData] = useState({
    newDate: '',
    newTime: '',
    reason: ''
  });

  // Get client's bookings
  const client = clients.find(c => c.email === clientData.email);
  const clientBookings = client ? bookings.filter(b => b.clientId === client.id) : [];

  const now = new Date();
  const upcomingBookings = clientBookings.filter(b => new Date(b.date) >= now && b.status !== 'cancelled');
  const pastBookings = clientBookings.filter(b => new Date(b.date) < now || b.status === 'cancelled');

  const handleCancelBooking = async (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking || !client) return;

    // Update booking status
    setBookings(prev => prev.map(b => 
      b.id === bookingId ? { ...b, status: 'cancelled' as const } : b
    ));

    // Send cancellation email
    const service = services.find(s => s.id === booking.serviceId);
    const therapist = therapists.find(t => t.id === booking.therapistId);
    
    if (service && therapist) {
      const cancelTemplate = {
        subject: 'Agendamento Cancelado - ' + service.name,
        body: `
Olá ${client.name},

O seu agendamento foi cancelado com sucesso.

Detalhes do agendamento cancelado:
- Serviço: ${service.name}
- Terapeuta: ${therapist.name}
- Data: ${new Date(booking.date).toLocaleDateString('pt-PT')}
- Hora: ${new Date(booking.date).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}

Se desejar reagendar, pode fazê-lo através do nosso sistema de agendamento online.

Obrigado pela compreensão,
Equipa Desperto
euestoudesperto@gmail.com
        `
      };
      
      await EmailService.sendEmail(client.email, cancelTemplate);
    }

    setShowCancelModal(null);
    alert('Agendamento cancelado com sucesso! Receberá um email de confirmação.');
  };

  const handleRescheduleRequest = async (bookingId: string) => {
    if (!rescheduleData.newDate || !rescheduleData.newTime) {
      alert('Por favor, selecione uma nova data e hora.');
      return;
    }

    const booking = bookings.find(b => b.id === bookingId);
    if (!booking || !client) return;

    // Create new date
    const newDateTime = new Date(rescheduleData.newDate);
    const [hours, minutes] = rescheduleData.newTime.split(':').map(Number);
    newDateTime.setHours(hours, minutes, 0, 0);

    // Update booking with reschedule request
    const updatedBooking = {
      ...booking,
      rescheduleRequest: {
        id: Date.now().toString(),
        newDate: newDateTime,
        requestedAt: new Date(),
        reason: rescheduleData.reason,
        status: 'pending' as const
      }
    };

    setBookings(prev => prev.map(b => 
      b.id === bookingId ? updatedBooking : b
    ));

    // Send notification email to admin
    const service = services.find(s => s.id === booking.serviceId);
    const therapist = therapists.find(t => t.id === booking.therapistId);

    if (service && therapist) {
      await EmailService.sendRescheduleNotification(
        client.name,
        client.email,
        new Date(booking.date),
        newDateTime,
        rescheduleData.reason,
        service.name
      );
    }

    // Send confirmation to client
    const clientConfirmation = {
      subject: 'Pedido de Reagendamento Enviado',
      body: `
Olá ${client.name},

O seu pedido de reagendamento foi enviado com sucesso!

📅 **Detalhes do Pedido:**
- Consulta atual: ${new Date(booking.date).toLocaleDateString('pt-PT')} às ${new Date(booking.date).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
- Novo horário solicitado: ${newDateTime.toLocaleDateString('pt-PT')} às ${newDateTime.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
- Terapeuta: ${therapist?.name}

⏳ **Status:** Aguardando aprovação do terapeuta

Receberá uma notificação assim que o terapeuta responder ao seu pedido.

Obrigado,
Equipa Desperto
      `
    };
    
    await EmailService.sendEmail(client.email, clientConfirmation);

    setShowRescheduleModal(null);
    setRescheduleData({ newDate: '', newTime: '', reason: '' });
    alert('Pedido de reagendamento enviado! O terapeuta irá analisar e responder em breve.');
  };

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

  const canCancelBooking = (booking: any) => {
    const bookingDate = new Date(booking.date);
    const hoursUntilBooking = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilBooking > 24 && booking.status === 'confirmed'; // Can cancel if more than 24h away
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-primary-800">Meus Agendamentos</h2>
                <p className="text-primary-600">{clientData.name} • {clientData.email}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'upcoming', label: `Próximos (${upcomingBookings.length})`, icon: Calendar },
              { id: 'past', label: `Histórico (${pastBookings.length})`, icon: Clock }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {/* Upcoming Bookings */}
          {activeTab === 'upcoming' && (
            <div className="space-y-4">
              {upcomingBookings.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum agendamento próximo</h3>
                  <p className="text-gray-600 mb-4">Não tem consultas marcadas para os próximos dias.</p>
                  <button
                    onClick={onClose}
                    className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
                  >
                    Marcar Nova Consulta
                  </button>
                </div>
              ) : (
                upcomingBookings
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((booking) => {
                    const service = services.find(s => s.id === booking.serviceId);
                    const therapist = therapists.find(t => t.id === booking.therapistId);
                    const bookingDate = new Date(booking.date);
                    
                    return (
                      <div key={booking.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start space-x-4">
                            {therapist && (
                              <img
                                src={therapist.image}
                                alt={therapist.name}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            )}
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{service?.name}</h3>
                              <p className="text-gray-600">{therapist?.name}</p>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>{bookingDate.toLocaleDateString('pt-PT', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  })}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{bookingDate.toLocaleTimeString('pt-PT', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(booking.status)}`}>
                              {getStatusIcon(booking.status)}
                              <span>
                                {booking.status === 'confirmed' ? 'Confirmado' :
                                 booking.status === 'pending' ? 'Pendente' :
                                 booking.status === 'cancelled' ? 'Cancelado' :
                                 booking.status === 'completed' ? 'Concluído' : booking.status}
                              </span>
                            </div>
                            <div className="text-lg font-bold text-primary-600 mt-2">
                              €{service?.price}
                            </div>
                          </div>
                        </div>

                        {booking.notes && (
                          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600">{booking.notes}</p>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span>Desperto - Despertar ao Minuto</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Mail className="w-4 h-4" />
                              <span>euestoudesperto@gmail.com</span>
                            </div>
                          </div>
                          
                          {booking.status === 'confirmed' && (
                            <div className="flex space-x-2">
                              {canCancelBooking(booking) && (
                                <button
                                  onClick={() => setShowCancelModal(booking.id)}
                                  className="px-3 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 text-sm font-medium transition-colors"
                                >
                                  Cancelar
                                </button>
                              )}
                              <button
                                onClick={() => setShowRescheduleModal(booking.id)}
                                className={`px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                                  booking.rescheduleRequest?.status === 'pending'
                                    ? 'text-yellow-600 border-yellow-300 bg-yellow-50'
                                    : 'text-blue-600 border-blue-300 hover:bg-blue-50'
                                }`}
                              >
                                {booking.rescheduleRequest?.status === 'pending' ? 'Reagendamento Pendente' : 'Reagendar'}
                              </button>
                            </div>
                          )}
                          
                          {/* Reschedule Status */}
                          {booking.rescheduleRequest && (
                            <div className={`mt-3 p-3 rounded-lg border text-sm ${
                              booking.rescheduleRequest.status === 'pending' ? 'bg-yellow-50 border-yellow-200' :
                              booking.rescheduleRequest.status === 'approved' ? 'bg-green-50 border-green-200' :
                              'bg-red-50 border-red-200'
                            }`}>
                              <div className="flex items-center space-x-2 mb-2">
                                <RefreshCw className={`w-4 h-4 ${
                                  booking.rescheduleRequest.status === 'pending' ? 'text-yellow-600' :
                                  booking.rescheduleRequest.status === 'approved' ? 'text-green-600' :
                                  'text-red-600'
                                }`} />
                                <span className={`font-medium ${
                                  booking.rescheduleRequest.status === 'pending' ? 'text-yellow-800' :
                                  booking.rescheduleRequest.status === 'approved' ? 'text-green-800' :
                                  'text-red-800'
                                }`}>
                                  {booking.rescheduleRequest.status === 'pending' ? 'Reagendamento Pendente' :
                                   booking.rescheduleRequest.status === 'approved' ? 'Reagendamento Aprovado' :
                                   'Reagendamento Rejeitado'}
                                </span>
                              </div>
                              <p className={`text-xs ${
                                booking.rescheduleRequest.status === 'pending' ? 'text-yellow-700' :
                                booking.rescheduleRequest.status === 'approved' ? 'text-green-700' :
                                'text-red-700'
                              }`}>
                                Novo horário solicitado: {new Date(booking.rescheduleRequest.newDate).toLocaleDateString('pt-PT')} às {new Date(booking.rescheduleRequest.newDate).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              {booking.rescheduleRequest.reason && (
                                <p className={`text-xs mt-1 ${
                                  booking.rescheduleRequest.status === 'pending' ? 'text-yellow-600' :
                                  booking.rescheduleRequest.status === 'approved' ? 'text-green-600' :
                                  'text-red-600'
                                }`}>
                                  Motivo: {booking.rescheduleRequest.reason}
                                </p>
                              )}
                              {booking.rescheduleRequest.therapistResponse && (
                                <p className={`text-xs mt-1 font-medium ${
                                  booking.rescheduleRequest.status === 'approved' ? 'text-green-700' : 'text-red-700'
                                }`}>
                                  Resposta do terapeuta: {booking.rescheduleRequest.therapistResponse}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          )}

          {/* Past Bookings */}
          {activeTab === 'past' && (
            <div className="space-y-4">
              {pastBookings.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum histórico</h3>
                  <p className="text-gray-600">Ainda não tem consultas anteriores.</p>
                </div>
              ) : (
                pastBookings
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((booking) => {
                    const service = services.find(s => s.id === booking.serviceId);
                    const therapist = therapists.find(t => t.id === booking.therapistId);
                    const bookingDate = new Date(booking.date);
                    
                    return (
                      <div key={booking.id} className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            {therapist && (
                              <img
                                src={therapist.image}
                                alt={therapist.name}
                                className="w-12 h-12 rounded-full object-cover opacity-75"
                              />
                            )}
                            <div>
                              <h3 className="text-lg font-semibold text-gray-700">{service?.name}</h3>
                              <p className="text-gray-500">{therapist?.name}</p>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>{bookingDate.toLocaleDateString('pt-PT')}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{bookingDate.toLocaleTimeString('pt-PT', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(booking.status)}`}>
                              {getStatusIcon(booking.status)}
                              <span>
                                {booking.status === 'confirmed' ? 'Confirmado' :
                                 booking.status === 'pending' ? 'Pendente' :
                                 booking.status === 'cancelled' ? 'Cancelado' :
                                 booking.status === 'completed' ? 'Concluído' : booking.status}
                              </span>
                            </div>
                            <div className="text-lg font-bold text-gray-500 mt-2">
                              €{service?.price}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          )}
        </div>

        {/* Cancel Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Cancelar Agendamento</h3>
              <p className="text-gray-600 mb-6">
                Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCancelModal(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Manter Agendamento
                </button>
                <button
                  onClick={() => handleCancelBooking(showCancelModal)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Sim, Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reschedule Modal */}
        {showRescheduleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Solicitar Reagendamento</h3>
                <button
                  onClick={() => {
                    setShowRescheduleModal(null);
                    setRescheduleData({ newDate: '', newTime: '', reason: '' });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nova Data
                  </label>
                  <input
                    type="date"
                    value={rescheduleData.newDate}
                    onChange={(e) => setRescheduleData(prev => ({ ...prev, newDate: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nova Hora
                  </label>
                  <select
                    value={rescheduleData.newTime}
                    onChange={(e) => setRescheduleData(prev => ({ ...prev, newTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecionar hora</option>
                    {Array.from({ length: 16 }, (_, i) => {
                      const hour = Math.floor(9 + i / 2);
                      const minute = i % 2 === 0 ? '00' : '30';
                      const time = `${hour.toString().padStart(2, '0')}:${minute}`;
                      return (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      );
                    })}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo (opcional)
                  </label>
                  <textarea
                    value={rescheduleData.reason}
                    onChange={(e) => setRescheduleData(prev => ({ ...prev, reason: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Explique o motivo do reagendamento..."
                  />
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Importante</span>
                </div>
                <p className="text-sm text-blue-800 mt-1">
                  O seu pedido será enviado ao terapeuta para aprovação. Receberá uma notificação com a resposta.
                </p>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowRescheduleModal(null);
                    setRescheduleData({ newDate: '', newTime: '', reason: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleRescheduleRequest(showRescheduleModal!)}
                  disabled={!rescheduleData.newDate || !rescheduleData.newTime}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar Pedido</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}