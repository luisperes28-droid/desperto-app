import React, { useState } from 'react';
import { Search, Filter, Plus, Calendar, User, DollarSign, Clock, CheckCircle, X, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BookingManagement } from '../Booking/BookingManagement';
import { ClientBooking } from '../ClientBooking/ClientBooking';

export function BookingsList() {
  const { bookings, clients, services, therapists } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showNewBookingModal, setShowNewBookingModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const filteredBookings = bookings.filter(booking => {
    const client = clients.find(c => c.id === booking.clientId);
    const matchesSearch = client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client?.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || booking.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

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

  return (
    <>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
             placeholder="Pesquisar agendamentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos os Estados</option>
              <option value="confirmed">Confirmado</option>
              <option value="pending">Pendente</option>
              <option value="completed">Concluído</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
        </div>
        
        <button 
          onClick={() => setShowNewBookingModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Agendamento</span>
        </button>
      </div>

      {/* Bookings List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
               <th className="text-left py-3 px-6 font-medium text-gray-700">Cliente</th>
               <th className="text-left py-3 px-6 font-medium text-gray-700">Serviço</th>
               <th className="text-left py-3 px-6 font-medium text-gray-700">Data e Hora</th>
               <th className="text-left py-3 px-6 font-medium text-gray-700">Estado</th>
               <th className="text-left py-3 px-6 font-medium text-gray-700">Pagamento</th>
               <th className="text-left py-3 px-6 font-medium text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Nenhum agendamento encontrado</p>
                    <p className="text-sm">Tente ajustar a sua pesquisa ou filtros</p>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => {
                  const client = clients.find(c => c.id === booking.clientId);
                  const service = services.find(s => s.id === booking.serviceId);
                  
                  return (
                    <tr key={booking.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          {(() => {
                            const therapist = therapists.find(t => t.id === booking.therapistId);
                            return (
                              <div className="flex items-center space-x-2">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                  <User className="w-5 h-5 text-white" />
                                </div>
                                {therapist && (
                                  <img
                                    src={therapist.image}
                                    alt={therapist.name}
                                    className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
                                    title={`Terapeuta: ${therapist.name}`}
                                  />
                                )}
                              </div>
                            );
                          })()}
                          <div>
                            <p className="font-medium text-gray-900">{client?.name || 'Cliente Desconhecido'}</p>
                            <p className="text-sm text-gray-500">{client?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-gray-900">{service?.name || 'Serviço Desconhecido'}</p>
                          <p className="text-sm text-gray-500">{service?.duration} minutos • {(() => {
                            const therapist = therapists.find(t => t.id === booking.therapistId);
                            return therapist?.name || 'Terapeuta Desconhecido';
                          })()}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-gray-900">
                            {new Date(booking.date).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(booking.date).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full border text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {getStatusIcon(booking.status)}
                          <span className="capitalize">
                            {booking.status === 'confirmed' ? 'confirmado' :
                             booking.status === 'pending' ? 'pendente' :
                             booking.status === 'cancelled' ? 'cancelado' :
                             booking.status === 'completed' ? 'concluído' : booking.status}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full border text-xs font-medium ${
                          booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-800 border-green-200' :
                          booking.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                          booking.paymentStatus === 'overdue' ? 'bg-red-100 text-red-800 border-red-200' :
                          'bg-gray-100 text-gray-800 border-gray-200'
                        }`}>
                          <DollarSign className="w-3 h-3" />
                          <span className="capitalize">
                            {booking.paymentStatus === 'paid' ? 'pago' :
                             booking.paymentStatus === 'partial' ? 'parcial' :
                             booking.paymentStatus === 'pending' ? 'pendente' :
                             booking.paymentStatus === 'overdue' ? 'em atraso' : booking.paymentStatus}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <button 
                          onClick={() => setSelectedBookingId(booking.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Gerir
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total de Agendamentos', value: bookings.length, color: 'blue' },
          { label: 'Confirmados', value: bookings.filter(b => b.status === 'confirmed').length, color: 'green' },
          { label: 'Pendentes', value: bookings.filter(b => b.status === 'pending').length, color: 'yellow' },
          { label: 'Concluídos', value: bookings.filter(b => b.status === 'completed').length, color: 'purple' }
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>
      </div>

      {/* Booking Management Modal */}
      {selectedBookingId && (
        <BookingManagement
          bookingId={selectedBookingId}
          onClose={() => setSelectedBookingId(null)}
        />
      )}

      {/* New Booking Modal */}
      {showNewBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Novo Agendamento</h2>
                <button
                  onClick={() => setShowNewBookingModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-0">
              <ClientBooking />
            </div>
          </div>
        </div>
      )}
    </>
  );
}