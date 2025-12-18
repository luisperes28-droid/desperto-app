import React, { useState } from 'react';
import { Plus, Search, Filter, Ticket, Calendar, User, DollarSign, CheckCircle, X, AlertTriangle, CreditCard as Edit, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CouponService } from '../../services/couponService';
import { Coupon, CouponUsage } from '../../types';

export function CouponManagement() {
  const { 
    coupons, 
    setCoupons, 
    couponUsage, 
    setCouponUsage, 
    clients, 
    services, 
    therapists 
  } = useApp();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [couponData, setCouponData] = useState({
    type: 'fixed_amount' as const,
    value: 0,
    serviceId: '',
    clientId: '',
    validUntil: '',
    usageLimit: 1,
    description: ''
  });

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

  // Check permissions
  const canManageCoupons = currentUser?.userType === 'admin' || currentUser?.userType === 'therapist';

  if (!canManageCoupons) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-600" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Acesso Restrito</h3>
          <p className="text-red-700">
            Apenas administradores e terapeutas podem gerir cupões.
          </p>
        </div>
      </div>
    );
  }

  const generateCouponCode = (): string => {
    return CouponService.generateCouponPassword();
  };

  const handleCreateCoupon = async () => {
    const result = await CouponService.createCoupon(
      {
        type: couponData.type,
        value: couponData.value,
        serviceId: couponData.serviceId || undefined,
        clientId: couponData.clientId || undefined,
        validUntil: new Date(couponData.validUntil),
        usageLimit: couponData.usageLimit,
        description: couponData.description,
        createdBy: currentUser.id
      },
      currentUser,
      coupons
    );

    if (!result.success) {
      alert(result.error || 'Erro ao criar cupão');
      return;
    }

    if (editingCoupon) {
      // Para edição, manter o código existente
      const updatedCoupon = {
        ...result.coupon,
        id: editingCoupon.id,
        code: editingCoupon.code,
        createdAt: editingCoupon.createdAt,
        usedCount: editingCoupon.usedCount
      };
      setCoupons(prev => prev.map(c => c.id === editingCoupon.id ? updatedCoupon : c));
    } else {
      setCoupons(prev => [...prev, result.coupon]);
    }

    // Reset form
    setCouponData({
      type: 'fixed_amount',
      value: 0,
      serviceId: '',
      clientId: '',
      validUntil: '',
      usageLimit: 1,
      description: ''
    });
    setEditingCoupon(null);
    setShowCreateModal(false);

    // Mostrar a password do cupão criado
    if (!editingCoupon && result.coupon) {
      alert(`Cupão criado com sucesso!\n\nPassword: ${result.coupon.code}\n\nPartilhe esta password com o cliente.`);
    } else {
      alert('Cupão atualizado com sucesso!');
    }
  };

  const handleEditCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setCouponData({
      type: coupon.type,
      value: coupon.value,
      serviceId: coupon.serviceId || '',
      clientId: coupon.clientId || '',
      validUntil: coupon.validUntil.toISOString().split('T')[0],
      usageLimit: coupon.usageLimit,
      description: coupon.description || ''
    });
    setShowCreateModal(true);
  };

  const handleDeleteCoupon = (couponId: string) => {
    const coupon = coupons.find(c => c.id === couponId);
    if (!coupon) return;

    if (confirm(`Tem certeza que deseja eliminar o cupão ${coupon.code}?`)) {
      setCoupons(prev => prev.filter(c => c.id !== couponId));
      setCouponUsage(prev => prev.filter(u => u.couponId !== couponId));
      alert('Cupão eliminado com sucesso!');
    }
  };

  const handleCancelCoupon = (couponId: string) => {
    setCoupons(prev => prev.map(c => 
      c.id === couponId ? { ...c, status: 'cancelled' as const } : c
    ));
  };

  const filteredCoupons = coupons.filter(coupon => {
    const matchesSearch = coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         coupon.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || coupon.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'used': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'expired': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'used': return <CheckCircle className="w-4 h-4" />;
      case 'expired': return <X className="w-4 h-4" />;
      case 'cancelled': return <X className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const formatCouponValue = (coupon: Coupon) => {
    switch (coupon.type) {
      case 'percentage':
        return `${coupon.value}% desconto`;
      case 'fixed_amount':
        return `€${coupon.value} desconto`;
      case 'free_service':
        return 'Serviço gratuito';
      default:
        return `€${coupon.value}`;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Gestão de Cupões</h1>
          <p className="text-sm sm:text-base text-gray-600">Criar e gerir cupões de desconto para clientes</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors min-h-[48px] w-full sm:w-auto text-base font-medium"
          style={{ touchAction: 'manipulation' }}
        >
          <Plus className="w-4 h-4" />
          <span>Criar Cupão</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1 sm:flex-none">
          <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar cupões..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-80 pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base min-h-[48px]"
            style={{ touchAction: 'manipulation' }}
          />
        </div>
        
        <div className="flex items-center space-x-2 flex-shrink-0">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base min-h-[48px] min-w-[120px]"
            style={{ touchAction: 'manipulation' }}
          >
            <option value="all">Todos os Estados</option>
            <option value="active">Ativo</option>
            <option value="used">Usado</option>
            <option value="expired">Expirado</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs sm:text-sm font-medium">Total de Cupões</p>
              <p className="text-xl sm:text-3xl font-bold text-blue-600 mt-1">{coupons.length}</p>
            </div>
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Ticket className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs sm:text-sm font-medium">Ativos</p>
              <p className="text-xl sm:text-3xl font-bold text-green-600 mt-1">
                {coupons.filter(c => c.status === 'active').length}
              </p>
            </div>
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs sm:text-sm font-medium">Utilizados</p>
              <p className="text-xl sm:text-3xl font-bold text-purple-600 mt-1">
                {couponUsage.length}
              </p>
            </div>
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs sm:text-sm font-medium">Desconto Total</p>
              <p className="text-xl sm:text-3xl font-bold text-desperto-gold mt-1">
                €{couponUsage.reduce((sum, usage) => sum + usage.discountApplied, 0)}
              </p>
            </div>
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-4 h-4 sm:w-6 sm:h-6 text-desperto-gold" />
            </div>
          </div>
        </div>
      </div>

      {/* Coupons List */}
      <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Mobile Card View */}
        <div className="block sm:hidden">
          <div className="p-4 space-y-4">
            {filteredCoupons.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Ticket className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-base font-medium">Nenhum cupão encontrado</p>
                <p className="text-sm">Crie o primeiro cupão para começar</p>
              </div>
            ) : (
              filteredCoupons.map((coupon) => {
                const client = coupon.clientId ? clients.find(c => c.id === coupon.clientId) : null;
                const service = coupon.serviceId ? services.find(s => s.id === coupon.serviceId) : null;
                const creator = therapists.find(t => t.id === coupon.createdBy);
                
                return (
                  <div key={coupon.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="font-mono text-lg font-bold text-blue-600">
                        {coupon.code}
                      </div>
                      <div className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full border text-xs font-medium ${getStatusColor(coupon.status)}`}>
                        {getStatusIcon(coupon.status)}
                        <span className="capitalize">
                          {coupon.status === 'active' ? 'Ativo' :
                           coupon.status === 'used' ? 'Usado' :
                           coupon.status === 'expired' ? 'Expirado' :
                           'Cancelado'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tipo:</span>
                        <span className="font-medium">
                          {coupon.type === 'percentage' ? 'Percentagem' :
                           coupon.type === 'fixed_amount' ? 'Valor Fixo' :
                           'Serviço Gratuito'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Valor:</span>
                        <span className="font-medium">{formatCouponValue(coupon)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cliente:</span>
                        <span className="font-medium truncate ml-2">
                          {client ? client.name : 'Qualquer cliente'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Validade:</span>
                        <span className="font-medium">
                          {new Date(coupon.validUntil).toLocaleDateString('pt-PT')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Uso:</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{coupon.usedCount}/{coupon.usageLimit}</span>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${(coupon.usedCount / coupon.usageLimit) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Criado por:</span>
                        <span className="font-medium">{creator?.name || 'Desconhecido'}</span>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => handleEditCoupon(coupon)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="Editar cupão"
                        style={{ touchAction: 'manipulation' }}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {coupon.status === 'active' && (
                        <button
                          onClick={() => handleCancelCoupon(coupon.id)}
                          className="p-2 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                          title="Cancelar cupão"
                          style={{ touchAction: 'manipulation' }}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteCoupon(coupon.id)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="Eliminar cupão"
                        style={{ touchAction: 'manipulation' }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Código</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Tipo</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Valor</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Cliente</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Validade</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Uso</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Estado</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-500">
                    <Ticket className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Nenhum cupão encontrado</p>
                    <p className="text-sm">Crie o primeiro cupão para começar</p>
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((coupon) => {
                  const client = coupon.clientId ? clients.find(c => c.id === coupon.clientId) : null;
                  const service = coupon.serviceId ? services.find(s => s.id === coupon.serviceId) : null;
                  const creator = therapists.find(t => t.id === coupon.createdBy);
                  
                  return (
                    <tr key={coupon.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-mono text-lg font-bold text-blue-600">
                          {coupon.code}
                        </div>
                        <div className="text-xs text-gray-500">
                          por {creator?.name || 'Desconhecido'}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="capitalize text-gray-700">
                          {coupon.type === 'percentage' ? 'Percentagem' :
                           coupon.type === 'fixed_amount' ? 'Valor Fixo' :
                           'Serviço Gratuito'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-gray-900">
                          {formatCouponValue(coupon)}
                        </div>
                        {service && (
                          <div className="text-xs text-gray-500">
                            Para: {service.name}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {client ? (
                          <div>
                            <div className="font-medium text-gray-900">{client.name}</div>
                            <div className="text-xs text-gray-500">{client.email}</div>
                          </div>
                        ) : (
                          <span className="text-gray-500">Qualquer cliente</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-gray-900">
                          {new Date(coupon.validUntil).toLocaleDateString('pt-PT')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(coupon.validUntil) < new Date() ? 'Expirado' :
                           Math.ceil((new Date(coupon.validUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) + ' dias'}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-gray-900">
                          {coupon.usedCount}/{coupon.usageLimit}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(coupon.usedCount / coupon.usageLimit) * 100}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full border text-xs font-medium ${getStatusColor(coupon.status)}`}>
                          {getStatusIcon(coupon.status)}
                          <span className="capitalize">
                            {coupon.status === 'active' ? 'Ativo' :
                             coupon.status === 'used' ? 'Usado' :
                             coupon.status === 'expired' ? 'Expirado' :
                             'Cancelado'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditCoupon(coupon)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Editar cupão"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {coupon.status === 'active' && (
                            <button
                              onClick={() => handleCancelCoupon(coupon.id)}
                              className="text-yellow-600 hover:text-yellow-800"
                              title="Cancelar cupão"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteCoupon(coupon.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Eliminar cupão"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Create/Edit Coupon Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg sm:rounded-xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 truncate pr-4">
                  {editingCoupon ? 'Editar Cupão' : 'Criar Novo Cupão'}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingCoupon(null);
                    setCouponData({
                      type: 'fixed_amount',
                      value: 0,
                      serviceId: '',
                      clientId: '',
                      validUntil: '',
                      usageLimit: 1,
                      description: ''
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
                  style={{ touchAction: 'manipulation' }}
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <div className="space-y-4 sm:space-y-6">
                {editingCoupon && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center space-x-2">
                      <Ticket className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-900 text-sm sm:text-base">Código: {editingCoupon.code}</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                      Tipo de Cupão *
                    </label>
                    <select
                      value={couponData.type}
                      onChange={(e) => setCouponData(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base min-h-[48px]"
                      style={{ touchAction: 'manipulation' }}
                    >
                      <option value="fixed_amount">Valor Fixo (€)</option>
                      <option value="percentage">Percentagem (%)</option>
                      <option value="free_service">Serviço Gratuito</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                      Valor *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step={couponData.type === 'percentage' ? '1' : '0.01'}
                      max={couponData.type === 'percentage' ? '100' : undefined}
                      value={couponData.value}
                      onChange={(e) => setCouponData(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base min-h-[48px]"
                      placeholder={couponData.type === 'percentage' ? '10' : '25.00'}
                      style={{ touchAction: 'manipulation' }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                      Cliente Específico (opcional)
                    </label>
                    <select
                      value={couponData.clientId}
                      onChange={(e) => setCouponData(prev => ({ ...prev, clientId: e.target.value }))}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base min-h-[48px]"
                      style={{ touchAction: 'manipulation' }}
                    >
                      <option value="">Qualquer cliente</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name} ({client.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                      Serviço Específico (opcional)
                    </label>
                    <select
                      value={couponData.serviceId}
                      onChange={(e) => setCouponData(prev => ({ ...prev, serviceId: e.target.value }))}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base min-h-[48px]"
                      style={{ touchAction: 'manipulation' }}
                    >
                      <option value="">Qualquer serviço</option>
                      {services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name} (€{service.price})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                      Data de Expiração *
                    </label>
                    <input
                      type="date"
                      value={couponData.validUntil}
                      onChange={(e) => setCouponData(prev => ({ ...prev, validUntil: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base min-h-[48px]"
                      style={{ touchAction: 'manipulation' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                      Limite de Utilizações
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={couponData.usageLimit}
                      onChange={(e) => setCouponData(prev => ({ ...prev, usageLimit: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base min-h-[48px]"
                      style={{ touchAction: 'manipulation' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                    Descrição (opcional)
                  </label>
                  <textarea
                    value={couponData.description}
                    onChange={(e) => setCouponData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base resize-none"
                    placeholder="Descrição do cupão..."
                    style={{ touchAction: 'manipulation' }}
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <span className="font-medium text-yellow-900 text-sm sm:text-base">Pré-visualização</span>
                  </div>
                  <div className="text-xs sm:text-sm text-yellow-800 space-y-1">
                    <p><strong>Código:</strong> {editingCoupon?.code || '[Será gerado automaticamente]'}</p>
                    <p><strong>Desconto:</strong> {
                      couponData.type === 'percentage' ? `${couponData.value}% desconto` :
                      couponData.type === 'fixed_amount' ? `€${couponData.value} desconto` :
                      'Serviço gratuito'
                    }</p>
                    <p><strong>Válido até:</strong> {couponData.validUntil ? new Date(couponData.validUntil).toLocaleDateString('pt-PT') : '[Selecione data]'}</p>
                    <p><strong>Cliente:</strong> {couponData.clientId ? clients.find(c => c.id === couponData.clientId)?.name : 'Qualquer cliente'}</p>
                    <p><strong>Serviço:</strong> {couponData.serviceId ? services.find(s => s.id === couponData.serviceId)?.name : 'Qualquer serviço'}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingCoupon(null);
                  }}
                  className="w-full sm:flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium min-h-[48px] text-base"
                  style={{ touchAction: 'manipulation' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateCoupon}
                  disabled={!couponData.validUntil || couponData.value <= 0}
                  className="w-full sm:flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium min-h-[48px] text-base"
                  style={{ touchAction: 'manipulation' }}
                >
                  {editingCoupon ? 'Atualizar' : 'Criar'} Cupão
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}