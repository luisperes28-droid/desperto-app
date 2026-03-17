import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, CheckCircle, XCircle, RefreshCw, ArrowLeft, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SupabaseDataService } from '../../services/supabaseDataService';

interface BookingActionPageProps {
  bookingId: string;
  action: 'cancel' | 'reschedule' | 'view';
  onBack: () => void;
}

export function BookingActionPage({ bookingId, action, onBack }: BookingActionPageProps) {
  const { bookings, services, therapists, clients, refreshData, dataLoading } = useApp();
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');

  const booking = bookings.find(b => b.id === bookingId);
  const service = booking ? services.find(s => s.id === booking.serviceId) : null;
  const therapist = booking ? therapists.find(t => t.id === booking.therapistId) : null;
  const client = booking ? clients.find(c => c.id === booking.clientId) : null;

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">A carregar dados...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Reserva nao encontrada</h2>
          <p className="text-gray-600 mb-6">Esta reserva pode ter sido removida ou o link esta incorreto.</p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 font-medium transition-colors"
          >
            Voltar ao Inicio
          </button>
        </div>
      </div>
    );
  }

  const bookingDate = new Date(booking.date);
  const isPast = bookingDate < new Date();
  const isCancelled = booking.status === 'cancelled';

  const handleCancel = async () => {
    setProcessing(true);
    setError('');
    const success = await SupabaseDataService.updateBooking(bookingId, { status: 'cancelled' });
    if (success) {
      await refreshData();
      setDone(true);
    } else {
      setError('Erro ao cancelar a reserva. Tente novamente.');
    }
    setProcessing(false);
  };

  const handleReschedule = async () => {
    if (!rescheduleDate || !rescheduleTime) return;
    setProcessing(true);
    setError('');

    const newDateTime = new Date(rescheduleDate);
    const [hours, minutes] = rescheduleTime.split(':').map(Number);
    newDateTime.setHours(hours, minutes, 0, 0);

    const success = await SupabaseDataService.updateBooking(bookingId, {
      rescheduleRequest: {
        id: Date.now().toString(),
        newDate: newDateTime,
        requestedAt: new Date(),
        reason: rescheduleReason,
        status: 'pending',
      },
    });

    if (success) {
      await refreshData();
      setDone(true);
    } else {
      setError('Erro ao enviar pedido de reagendamento.');
    }
    setProcessing(false);
  };

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {action === 'cancel' ? 'Reserva Cancelada' : 'Pedido de Reagendamento Enviado'}
          </h2>
          <p className="text-gray-600 mb-6">
            {action === 'cancel'
              ? 'A sua reserva foi cancelada com sucesso. Receberao uma confirmacao por email.'
              : 'O seu pedido de reagendamento foi enviado. O terapeuta ira responder em breve.'}
          </p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 font-medium transition-colors"
          >
            Voltar ao Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 max-w-lg w-full overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-6">
          <button
            onClick={onBack}
            className="flex items-center space-x-1 text-white/80 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Voltar</span>
          </button>
          <h1 className="text-xl font-bold text-white">
            {action === 'cancel' ? 'Cancelar Reserva' : action === 'reschedule' ? 'Reagendar Reserva' : 'Detalhes da Reserva'}
          </h1>
        </div>

        <div className="p-6">
          <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-sm text-gray-500">Data e Hora</p>
                <p className="font-semibold text-gray-900">
                  {bookingDate.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  {' as '}
                  {bookingDate.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            {service && (
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="text-sm text-gray-500">Servico</p>
                  <p className="font-semibold text-gray-900">{service.name} ({service.duration} min)</p>
                </div>
              </div>
            )}
            {therapist && (
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="text-sm text-gray-500">Terapeuta</p>
                  <p className="font-semibold text-gray-900">{therapist.name}</p>
                </div>
              </div>
            )}
            <div className="flex items-center space-x-3">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {booking.status === 'confirmed' ? 'Confirmado' :
                 booking.status === 'pending' ? 'Pendente' :
                 booking.status === 'cancelled' ? 'Cancelado' :
                 booking.status === 'completed' ? 'Concluido' : booking.status}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {action === 'cancel' && !isCancelled && !isPast && (
            <div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                <div className="flex items-start space-x-3">
                  <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-900">Tem a certeza?</p>
                    <p className="text-sm text-red-700 mt-1">Esta acao nao pode ser desfeita. A sua reserva sera cancelada permanentemente.</p>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={onBack}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium text-gray-700 transition-colors"
                >
                  Manter Reserva
                </button>
                <button
                  onClick={handleCancel}
                  disabled={processing}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:bg-gray-300 font-medium transition-colors"
                >
                  {processing ? 'A cancelar...' : 'Cancelar Reserva'}
                </button>
              </div>
            </div>
          )}

          {action === 'cancel' && (isCancelled || isPast) && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-gray-600">
                {isCancelled ? 'Esta reserva ja foi cancelada.' : 'Esta reserva ja passou e nao pode ser cancelada.'}
              </p>
            </div>
          )}

          {action === 'reschedule' && !isCancelled && !isPast && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nova Data</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nova Hora</label>
                <select
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="">Selecionar hora</option>
                  {Array.from({ length: 16 }, (_, i) => {
                    const hour = Math.floor(9 + i / 2);
                    const minute = i % 2 === 0 ? '00' : '30';
                    const time = `${hour.toString().padStart(2, '0')}:${minute}`;
                    return <option key={time} value={time}>{time}</option>;
                  })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Motivo (opcional)</label>
                <textarea
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                  placeholder="Explique o motivo..."
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={onBack}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium text-gray-700 transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={handleReschedule}
                  disabled={processing || !rescheduleDate || !rescheduleTime}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 disabled:bg-gray-300 font-medium transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{processing ? 'A enviar...' : 'Enviar Pedido'}</span>
                </button>
              </div>
            </div>
          )}

          {action === 'view' && (
            <button
              onClick={onBack}
              className="w-full px-4 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 font-medium transition-colors"
            >
              Voltar ao Inicio
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
