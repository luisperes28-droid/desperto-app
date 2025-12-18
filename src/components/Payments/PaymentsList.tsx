import React, { useState } from 'react';
import { Search, Filter, DollarSign, CreditCard, Calendar, CheckCircle, Clock, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export function PaymentsList() {
  const { payments, bookings, clients } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredPayments = payments.filter(payment => {
    const booking = bookings.find(b => b.id === payment.bookingId);
    const client = booking ? clients.find(c => c.id === booking.clientId) : null;
    
    const matchesSearch = client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed': return <X className="w-4 h-4 text-red-600" />;
      case 'refunded': return <X className="w-4 h-4 text-gray-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'refunded': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'card': return <CreditCard className="w-4 h-4" />;
      case 'paypal': return <DollarSign className="w-4 h-4" />;
      case 'square': return <CreditCard className="w-4 h-4" />;
      case 'mbway': return <DollarSign className="w-4 h-4" />;
      case 'cash': return <DollarSign className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  const totalRevenue = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar pagamentos..."
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
              <option value="completed">Concluído</option>
              <option value="pending">Pendente</option>
              <option value="failed">Falhado</option>
              <option value="refunded">Reembolsado</option>
            </select>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            Processar Pagamento
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Gerar Fatura
          </button>
        </div>
      </div>

      {/* Revenue Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Receita Total</p>
              <p className="text-3xl font-bold text-green-600 mt-1">${totalRevenue.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Pagamentos Pendentes</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">${pendingAmount.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Transações</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{payments.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Payments List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Fatura #</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Cliente</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Valor</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Método</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Data</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Estado</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Nenhum pagamento encontrado</p>
                    <p className="text-sm">Os pagamentos aparecerão aqui quando processados</p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => {
                  const booking = bookings.find(b => b.id === payment.bookingId);
                  const client = booking ? clients.find(c => c.id === booking.clientId) : null;
                  
                  return (
                    <tr key={payment.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-mono text-sm font-medium text-gray-900">
                          {payment.invoiceNumber}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-gray-900">{client?.name || 'Cliente Desconhecido'}</p>
                          <p className="text-sm text-gray-500">{client?.email}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-gray-900">
                          ${payment.amount.toLocaleString()}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          {getPaymentMethodIcon(payment.method)}
                          <span className="capitalize text-gray-700">
                            {payment.method === 'mbway' ? 'MB WAY' : payment.method}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="text-gray-900">
                            {new Date(payment.date).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(payment.date).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full border text-xs font-medium ${getStatusColor(payment.status)}`}>
                          {getStatusIcon(payment.status)}
                          <span className="capitalize">
                            {payment.status === 'completed' ? 'concluído' :
                             payment.status === 'pending' ? 'pendente' :
                             payment.status === 'failed' ? 'falhado' :
                             payment.status === 'refunded' ? 'reembolsado' : payment.status}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            Ver
                          </button>
                          {payment.status === 'pending' && (
                            <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                              Processar
                            </button>
                          )}
                          {payment.status === 'completed' && (
                            <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                              Reembolsar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}