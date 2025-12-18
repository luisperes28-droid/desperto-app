import React, { useState } from 'react';
import { Search, Plus, User, Mail, Phone, Calendar, DollarSign, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ClientDetails } from './ClientDetails';
import { AddClientModal } from './AddClientModal';

export function ClientsList() {
  const { clients, setClients, bookings, setBookings, payments, setPayments, therapists } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);

  React.useEffect(() => {
    const savedUser = localStorage.getItem('desperto_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setCurrentUser(userData);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getClientStats = (clientId: string) => {
    const clientBookings = bookings.filter(b => b.clientId === clientId);
    const clientPayments = payments.filter(p => {
      const booking = bookings.find(b => b.id === p.bookingId);
      return booking?.clientId === clientId;
    });
    const totalSpent = clientPayments.reduce((sum, p) => sum + p.amount, 0);
    
    return {
      totalBookings: clientBookings.length,
      completedBookings: clientBookings.filter(b => b.status === 'completed').length,
      totalSpent,
      lastBooking: clientBookings
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    };
  };

  const handleDeleteClient = (clientId: string) => {
    setShowDeleteModal(clientId);
  };

  const confirmDeleteClient = () => {
    if (!showDeleteModal) return;

    const clientToDelete = clients.find(c => c.id === showDeleteModal);
    if (!clientToDelete) return;

    // Check if client has active bookings
    const clientBookings = bookings.filter(b => b.clientId === showDeleteModal);
    const activeBookings = clientBookings.filter(b => 
      b.status !== 'cancelled' && new Date(b.date) >= new Date()
    );

    if (activeBookings.length > 0) {
      alert(`Não é possível eliminar ${clientToDelete.name}. O cliente tem ${activeBookings.length} agendamento(s) ativo(s).`);
      setShowDeleteModal(null);
      return;
    }

    // Confirm deletion
    const confirmed = confirm(
      `Tem certeza que deseja eliminar o cliente "${clientToDelete.name}"?\n\n` +
      `Esta ação irá:\n` +
      `• Eliminar o cliente permanentemente\n` +
      `• Eliminar ${clientBookings.length} agendamento(s) histórico(s)\n` +
      `• Eliminar pagamentos associados\n\n` +
      `Esta ação não pode ser desfeita.`
    );

    if (confirmed) {
      // Remove client
      setClients(prev => prev.filter(c => c.id !== showDeleteModal));
      
      // Remove client's bookings
      setBookings(prev => prev.filter(b => b.clientId !== showDeleteModal));
      
      // Remove client's payments
      const clientPaymentIds = payments
        .filter(p => {
          const booking = bookings.find(b => b.id === p.bookingId);
          return booking?.clientId === showDeleteModal;
        })
        .map(p => p.id);
      
      setPayments(prev => prev.filter(p => !clientPaymentIds.includes(p.id)));
      
      alert(`Cliente "${clientToDelete.name}" foi eliminado com sucesso.`);
    }

    setShowDeleteModal(null);
  };

  return (
    <>
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
        <div className="relative flex-1 sm:flex-none">
          <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-80 pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base min-h-[48px]"
            style={{ touchAction: 'manipulation' }}
          />
        </div>
        
        <button 
          onClick={() => setShowAddClientModal(true)}
          className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors min-h-[48px] w-full sm:w-auto text-base font-medium"
          style={{ touchAction: 'manipulation' }}
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Cliente</span>
        </button>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {filteredClients.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-base font-medium">Nenhum cliente encontrado</p>
            <p className="text-sm">
              {searchTerm ? 'Tente ajustar a sua pesquisa' : 'Adicione o seu primeiro cliente para começar'}
            </p>
          </div>
        ) : (
          filteredClients.map((client) => {
            const stats = getClientStats(client.id);
            
            return (
              <div key={client.id} className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                      <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{client.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-500">Cliente desde {new Date(client.createdAt).toLocaleDateString('pt-PT')}</p>
                    </div>
                  </div>
                  <button 
                    className="text-gray-400 hover:text-gray-600 text-sm p-2 min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
                    style={{ touchAction: 'manipulation' }}
                  >
                    •••
                  </button>
                </div>

                <div className="space-y-2 sm:space-y-3 mb-4">
                  <div className="flex items-center space-x-2 text-xs sm:text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 truncate">{client.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs sm:text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{client.phone || 'Sem telefone'}</span>
                  </div>
                </div>

                {client.notes && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs sm:text-sm text-gray-600 break-words">{client.notes}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 text-blue-600 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs sm:text-sm font-medium">{stats.totalBookings}</span>
                    </div>
                    <p className="text-xs text-gray-500">Agendamentos</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 text-emerald-600 mb-1">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-xs sm:text-sm font-medium">€{stats.totalSpent}</span>
                    </div>
                    <p className="text-xs text-gray-500">Gasto</p>
                  </div>
                </div>

                {stats.lastBooking && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Último Agendamento</p>
                    <div className="text-xs sm:text-sm text-gray-700">
                      <p className="font-medium">
                        {new Date(stats.lastBooking.date).toLocaleDateString('pt-PT')}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        às {new Date(stats.lastBooking.date).toLocaleTimeString('pt-PT', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })} • {(() => {
                          const therapist = therapists.find(t => t.id === stats.lastBooking.therapistId);
                          return therapist?.name || 'Terapeuta';
                        })()}
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => setSelectedClient(client)}
                      className="flex-1 px-3 py-3 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors min-h-[44px] flex items-center justify-center"
                      style={{ touchAction: 'manipulation' }}
                    >
                      Ver Detalhes
                    </button>
                    <button
                      onClick={() => handleDeleteClient(client.id)}
                      className="px-3 py-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                      title="Eliminar Cliente"
                      style={{ touchAction: 'manipulation' }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Client Details Modal */}
      {selectedClient && (
        <ClientDetails
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          currentUserId={currentUser?.id}
          currentUserType={currentUser?.userType}
        />
      )}

      {/* Add Client Modal */}
      {showAddClientModal && (
        <AddClientModal
          onClose={() => setShowAddClientModal(false)}
        />
      )}

      {/* Client Statistics */}
      <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Visão Geral dos Clientes</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="text-center">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600">{clients.length}</div>
            <div className="text-xs sm:text-sm text-gray-500">Total de Clientes</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">
              {clients.filter(client => {
                const clientBookings = bookings.filter(b => b.clientId === client.id);
                return clientBookings.some(b => {
                  const bookingDate = new Date(b.date);
                  const monthAgo = new Date();
                  monthAgo.setMonth(monthAgo.getMonth() - 1);
                  return bookingDate > monthAgo;
                });
              }).length}
            </div>
            <div className="text-xs sm:text-sm text-gray-500">Ativos Este Mês</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-700">
              {Math.round(payments.reduce((sum, p) => sum + p.amount, 0) / (clients.length || 1))}
            </div>
            <div className="text-xs sm:text-sm text-gray-500">Receita Média</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-amber-600">
              {Math.round(bookings.length / (clients.length || 1) * 10) / 10}
            </div>
            <div className="text-xs sm:text-sm text-gray-500">Agendamentos Médios</div>
          </div>
        </div>
      </div>
    </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg sm:rounded-xl w-full max-w-md p-4 sm:p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Eliminar Cliente</h3>
                <p className="text-xs sm:text-sm text-gray-600">Esta ação não pode ser desfeita</p>
              </div>
            </div>
            
            {(() => {
              const client = clients.find(c => c.id === showDeleteModal);
              const clientBookings = bookings.filter(b => b.clientId === showDeleteModal);
              const activeBookings = clientBookings.filter(b => 
                b.status !== 'cancelled' && new Date(b.date) >= new Date()
              );
              
              return (
                <div className="mb-6">
                  <p className="text-sm sm:text-base text-gray-700 mb-3">
                    Tem certeza que deseja eliminar <strong>{client?.name}</strong>?
                  </p>
                  
                  {activeBookings.length > 0 ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <span className="font-medium text-red-900 text-sm sm:text-base">Não é possível eliminar</span>
                      </div>
                      <p className="text-red-800 text-xs sm:text-sm">
                        Este cliente tem <strong>{activeBookings.length}</strong> agendamento(s) ativo(s). 
                        Cancele ou complete os agendamentos primeiro.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <span className="font-medium text-yellow-900 text-sm sm:text-base">Esta ação irá eliminar:</span>
                      </div>
                      <ul className="text-yellow-800 text-xs sm:text-sm space-y-1">
                        <li>• O cliente permanentemente</li>
                        <li>• {clientBookings.length} agendamento(s) histórico(s)</li>
                        <li>• Pagamentos associados</li>
                        <li>• Notas do terapeuta</li>
                      </ul>
                    </div>
                  )}
                </div>
              );
            })()}
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="w-full sm:flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700 transition-colors min-h-[48px] text-base"
                style={{ touchAction: 'manipulation' }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteClient}
                disabled={(() => {
                  const clientBookings = bookings.filter(b => b.clientId === showDeleteModal);
                  const activeBookings = clientBookings.filter(b => 
                    b.status !== 'cancelled' && new Date(b.date) >= new Date()
                  );
                  return activeBookings.length > 0;
                })()}
                className="w-full sm:flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors min-h-[48px] text-base"
                style={{ touchAction: 'manipulation' }}
              >
                Eliminar Cliente
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}