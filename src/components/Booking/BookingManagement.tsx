import React, { useState } from 'react';
import { Calendar, Clock, X, RefreshCw, Mail, Phone, CheckCircle, AlertTriangle, Check, XCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { EmailService } from '../../services/emailService';
import { CalendarService } from '../../services/calendarService';

interface BookingManagementProps {
  bookingId: string;
  onClose: () => void;
}

export function BookingManagement({ bookingId, onClose }: BookingManagementProps) {
  const { bookings, setBookings, clients, services, therapists } = useApp();
  
  const booking = bookings.find(b => b.id === bookingId);
  const client = booking ? clients.find(c => c.id === booking.clientId) : null;
  const service = booking ? services.find(s => s.id === booking.serviceId) : null;
  const therapist = booking ? therapists.find(t => t.id === booking.therapistId) : null;

  const [isRescheduling, setIsRescheduling] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [newStatus, setNewStatus] = useState<string>(booking?.status || '');
  const [newTherapistId, setNewTherapistId] = useState<string>(booking?.therapistId || '');
  const [hasChanges, setHasChanges] = useState(false);
  const [rescheduleResponse, setRescheduleResponse] = useState('');
  const [showRescheduleApproval, setShowRescheduleApproval] = useState(false);

  if (!booking || !client || !service || !therapist) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <p className="text-center text-gray-600">Agendamento não encontrado.</p>
          <button
            onClick={onClose}
            className="mt-4 w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }


  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) return;

    const newDateTime = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(':').map(Number);
    newDateTime.setHours(hours, minutes, 0, 0);

    const updatedBooking = {
      ...booking,
      date: newDateTime,
      status: 'confirmed' as const
    };

    setBookings(prev => prev.map(b => b.id === bookingId ? updatedBooking : b));

    // Send confirmation email
    const emailTemplate = EmailService.generateConfirmationEmail(
      updatedBooking,
      client,
      service,
      therapist
    );
    
    await EmailService.sendEmail(client.email, emailTemplate);

    setIsRescheduling(false);
    onClose();
  };

  const handleCancel = async () => {
    const updatedBooking = {
      ...booking,
      status: 'cancelled' as const
    };

    setBookings(prev => prev.map(b => b.id === bookingId ? updatedBooking : b));

    // Send cancellation email
    const cancelTemplate = {
      subject: 'Agendamento Cancelado',
      body: `
Olá ${client.name},

O seu agendamento foi cancelado com sucesso.

Detalhes do agendamento cancelado:
- Serviço: ${service.name}
- Data: ${new Date(booking.date).toLocaleDateString('pt-PT')}
- Hora: ${new Date(booking.date).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}

Se desejar reagendar, pode fazê-lo através do nosso sistema de agendamento online.

Obrigado,
Equipa Desperto
      `
    };

    await EmailService.sendEmail(client.email, cancelTemplate);

    setIsCancelling(false);
    onClose();
  };

  const handleStatusChange = (status: string) => {
    setNewStatus(status);
    setHasChanges(status !== booking?.status);
  };

  const handleTherapistChange = (therapistId: string) => {
    setNewTherapistId(therapistId);
    setHasChanges(therapistId !== booking?.therapistId || newStatus !== booking?.status);
  };

  const handleConfirmChanges = async () => {
    if (!booking) return;

    const updatedBooking = {
      ...booking,
      status: newStatus as any,
      therapistId: newTherapistId
    };

    setBookings(prev => prev.map(b => b.id === bookingId ? updatedBooking : b));

    // Get the new therapist for email
    const newTherapist = therapists.find(t => t.id === newTherapistId) || therapist;

    // Send notification email based on status change
    if (newStatus === 'cancelled' && booking.status !== 'cancelled') {
      const cancelTemplate = {
        subject: 'Agendamento Cancelado',
        body: `
Olá ${client?.name},

O seu agendamento foi cancelado.

Detalhes:
- Serviço: ${service?.name}
- Data: ${new Date(booking.date).toLocaleDateString('pt-PT')}
- Hora: ${new Date(booking.date).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}

Se desejar reagendar, pode fazê-lo através do nosso sistema.

Obrigado,
Equipa Desperto
        `
      };
      await EmailService.sendEmail(client?.email || '', cancelTemplate);
    } else if (newStatus === 'confirmed' && booking.status !== 'confirmed') {
      const confirmTemplate = EmailService.generateConfirmationEmail(updatedBooking, client!, service!, newTherapist!);
      await EmailService.sendEmail(client?.email || '', confirmTemplate);
    } else if (newTherapistId !== booking.therapistId) {
      // Send email for therapist change
      const therapistChangeTemplate = {
        subject: 'Alteração de Terapeuta - ' + service?.name,
        body: `
Olá ${client?.name},

O seu agendamento foi atualizado com uma alteração de terapeuta.

Detalhes atualizados:
- Serviço: ${service?.name}
- Novo Terapeuta: ${newTherapist.name}
- Data: ${new Date(booking.date).toLocaleDateString('pt-PT')}
- Hora: ${new Date(booking.date).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}

Se tiver alguma questão, pode contactar-nos.

Obrigado,
Equipa Desperto
        `
      };
      await EmailService.sendEmail(client?.email || '', therapistChangeTemplate);
    }

    onClose();
  };

  const generateCalendarEvent = () => {
    const startDate = new Date(booking.date);
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + service.duration);

    return {
      title: `${service.name} - ${therapist.name}`,
      start: startDate,
      end: endDate,
      description: `Consulta com ${therapist.name}\nServiço: ${service.name}\nCliente: ${client.name}`,
      location: 'Desperto - Despertar ao Minuto'
    };
  };

  const bookingDate = new Date(booking.date);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Gerir Agendamento</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Booking Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Detalhes do Agendamento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Cliente</p>
                <p className="font-medium">{client.name}</p>
              </div>
              <div>
                <p className="text-gray-600">Email</p>
                <p className="font-medium">{client.email}</p>
              </div>
              <div>
                <p className="text-gray-600">Terapeuta</p>
                <p className="font-medium">{therapists.find(t => t.id === newTherapistId)?.name || therapist.name}</p>
              </div>
              <div>
                <p className="text-gray-600">Serviço</p>
                <p className="font-medium">{service.name}</p>
              </div>
              <div>
                <p className="text-gray-600">Data</p>
                <p className="font-medium">{bookingDate.toLocaleDateString('pt-PT')}</p>
              </div>
              <div>
                <p className="text-gray-600">Hora</p>
                <p className="font-medium">{bookingDate.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div>
                <p className="text-gray-600">Duração</p>
                <p className="font-medium">{service.duration} minutos</p>
              </div>
              <div>
                <p className="text-gray-600">Estado</p>
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                  booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {booking.status === 'confirmed' ? 'Confirmado' :
                   booking.status === 'pending' ? 'Pendente' :
                   booking.status === 'cancelled' ? 'Cancelado' :
                   booking.status === 'completed' ? 'Concluído' : booking.status}
                </span>
              </div>
            </div>
          </div>

          {/* Calendar Integration */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Adicionar ao Calendário</h3>
            <div className="flex flex-wrap gap-2">
              <a
                href={CalendarService.generateGoogleCalendarUrl(generateCalendarEvent())}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Google Calendar
              </a>
              <a
                href={CalendarService.generateOutlookCalendarUrl(generateCalendarEvent())}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Outlook
              </a>
              <button
                onClick={() => CalendarService.downloadICSFile(generateCalendarEvent(), `agendamento-${booking.id}.ics`)}
                className="inline-flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Descarregar .ics
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            {/* Status Change */}
            <div className="space-y-4">
              {/* Therapist Change */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Alterar Terapeuta</h3>
                <select
                  value={newTherapistId}
                  onChange={(e) => handleTherapistChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {therapists.map((therapist) => (
                    <option key={therapist.id} value={therapist.id}>
                      {therapist.name} {!therapist.available ? '(Indisponível)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Gerir Agendamento</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleStatusChange('confirmed')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      newStatus === 'confirmed' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}
                  >
                    Confirmar
                  </button>
                  <button
                    onClick={() => handleStatusChange('pending')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      newStatus === 'pending' 
                        ? 'bg-yellow-600 text-white' 
                        : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                    }`}
                  >
                    Pendente
                  </button>
                  <button
                    onClick={() => handleStatusChange('completed')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      newStatus === 'completed' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                    }`}
                  >
                    Concluído
                  </button>
                  <button
                    onClick={() => handleStatusChange('cancelled')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      newStatus === 'cancelled' 
                        ? 'bg-red-600 text-white' 
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                    }`}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {booking.status !== 'cancelled' && (
                  <button
                    onClick={() => setIsRescheduling(true)}
                    className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reagendar
                  </button>
                )}
                
                <button
                  onClick={handleConfirmChanges}
                  disabled={!hasChanges}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmar Alterações
                </button>
              </div>
            </div>
          </div>

          {/* Reschedule Modal */}
          {isRescheduling && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-4">Reagendar Consulta</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nova Data
                    </label>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setSelectedDate(new Date(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nova Hora
                    </label>
                    <select
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
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
                </div>
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => setIsRescheduling(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleReschedule}
                    disabled={!selectedDate || !selectedTime}
                    className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-300"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Reschedule Approval Modal */}
        {showRescheduleApproval && booking?.rescheduleRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Responder ao Pedido de Reagendamento</h3>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Detalhes do Pedido:</h4>
                <div className="text-sm text-gray-700 space-y-1">
                  <p><strong>Cliente:</strong> {client?.name}</p>
                  <p><strong>Data atual:</strong> {new Date(booking.date).toLocaleDateString('pt-PT')} às {new Date(booking.date).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</p>
                  <p><strong>Nova data solicitada:</strong> {new Date(booking.rescheduleRequest.newDate).toLocaleDateString('pt-PT')} às {new Date(booking.rescheduleRequest.newDate).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</p>
                  {booking.rescheduleRequest.reason && (
                    <p><strong>Motivo:</strong> {booking.rescheduleRequest.reason}</p>
                  )}
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensagem para o cliente (opcional)
                </label>
                <textarea
                  value={rescheduleResponse}
                  onChange={(e) => setRescheduleResponse(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Adicione uma mensagem explicativa..."
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowRescheduleApproval(false);
                    setRescheduleResponse('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleRescheduleApproval(false)}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Rejeitar</span>
                </button>
                <button
                  onClick={() => handleRescheduleApproval(true)}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Check className="w-4 h-4" />
                  <span>Aprovar</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}