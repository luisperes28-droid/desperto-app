import React, { useState } from 'react';
import { Plus, Mail, User, Shield, Clock, CheckCircle, X, Send, AlertCircle, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TherapistInvitation, Therapist } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { EmailService } from '../../services/emailService';

export function TherapistManagement() {
  const { 
    therapists, 
    setTherapists, 
    therapistInvitations, 
    setTherapistInvitations 
  } = useApp();
  
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteData, setInviteData] = useState({
    name: '',
    email: '',
    specialties: [''],
    message: ''
  });

  // Check if current user is admin
  const [currentUser, setCurrentUser] = useState<any>(null);

  React.useEffect(() => {
    const savedUser = localStorage.getItem('desperto_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setCurrentUser(userData);
        console.log('👤 Current user in therapist management:', userData);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  const isAdmin = currentUser?.userType === 'admin';
  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-red-600" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Acesso Restrito</h3>
          <p className="text-red-700">
            Apenas administradores podem gerir terapeutas. O seu tipo de utilizador atual é: {currentUser?.userType || 'não autenticado'}
          </p>
        </div>
      </div>
    );
  }

  const handleAddSpecialty = () => {
    setInviteData(prev => ({
      ...prev,
      specialties: [...prev.specialties, '']
    }));
  };

  const handleRemoveSpecialty = (index: number) => {
    setInviteData(prev => ({
      ...prev,
      specialties: prev.specialties.filter((_, i) => i !== index)
    }));
  };

  const handleSpecialtyChange = (index: number, value: string) => {
    setInviteData(prev => ({
      ...prev,
      specialties: prev.specialties.map((spec, i) => i === index ? value : spec)
    }));
  };

  const handleSendInvitation = async () => {
    if (!inviteData.name || !inviteData.email) {
      alert('Nome e email são obrigatórios');
      return;
    }

    // Check if email already exists
    const existingTherapist = therapists.find(t => t.email === inviteData.email);
    const existingInvitation = therapistInvitations.find(i => i.email === inviteData.email && i.status === 'pending');

    if (existingTherapist) {
      alert('Já existe um terapeuta com este email');
      return;
    }

    if (existingInvitation) {
      alert('Já existe um convite pendente para este email');
      return;
    }

    const invitation: TherapistInvitation = {
      id: uuidv4(),
      invitedBy: '1', // Luis Peres ID
      email: inviteData.email,
      name: inviteData.name,
      specialties: inviteData.specialties.filter(s => s.trim()),
      message: inviteData.message,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    };

    setTherapistInvitations(prev => [...prev, invitation]);

    // Send invitation email
    const invitationEmail = {
      subject: 'Convite para se juntar à equipa Desperto',
      body: `
Olá ${inviteData.name},

Foi convidado(a) por Luis Peres para se juntar à equipa de terapeutas da Desperto - Despertar ao Minuto.

👤 **Detalhes do Convite:**
- **Nome:** ${inviteData.name}
- **Especialidades:** ${inviteData.specialties.filter(s => s.trim()).join(', ')}
- **Convidado por:** Luis Peres (Administrador)

${inviteData.message ? `📝 **Mensagem pessoal:**\n${inviteData.message}\n\n` : ''}

🔗 **Para aceitar o convite:**
1. Clique no link: ${window.location.origin}/accept-invitation/${invitation.id}
2. Complete o seu perfil
3. Configure a sua disponibilidade

⏰ **Importante:** Este convite expira em 7 dias (${invitation.expiresAt.toLocaleDateString('pt-PT')}).

Bem-vindo(a) à família Desperto!

Com os melhores cumprimentos,
Luis Peres
Administrador - Desperto
euestoudesperto@gmail.com
      `
    };

    await EmailService.sendEmail(inviteData.email, invitationEmail);

    // Reset form
    setInviteData({
      name: '',
      email: '',
      specialties: [''],
      message: ''
    });
    setShowInviteModal(false);

    alert('Convite enviado com sucesso!');
  };

  const handleCancelInvitation = (invitationId: string) => {
    if (confirm('Tem certeza que deseja cancelar este convite?')) {
      setTherapistInvitations(prev => 
        prev.map(inv => 
          inv.id === invitationId 
            ? { ...inv, status: 'expired' as const }
            : inv
        )
      );
    }
  };

  const handleSuspendTherapist = (therapistId: string) => {
    const therapist = therapists.find(t => t.id === therapistId);
    if (!therapist) return;

    if (confirm(`Tem certeza que deseja suspender ${therapist.name}?`)) {
      setTherapists(prev => 
        prev.map(t => 
          t.id === therapistId 
            ? { ...t, status: 'suspended' as const, available: false }
            : t
        )
      );
    }
  };

  const handleActivateTherapist = (therapistId: string) => {
    setTherapists(prev => 
      prev.map(t => 
        t.id === therapistId 
          ? { ...t, status: 'active' as const, available: true }
          : t
      )
    );
  };

  const pendingInvitations = therapistInvitations.filter(inv => inv.status === 'pending');
  const activeTherapists = therapists.filter(t => t.status === 'active' || !t.status); // Include therapists without status
  const suspendedTherapists = therapists.filter(t => t.status === 'suspended');

  // Debug: Log all data
  console.log('🔍 THERAPIST MANAGEMENT DEBUG:', {
    allTherapists: therapists,
    activeTherapists,
    suspendedTherapists,
    currentUser,
    isAdmin
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Terapeutas</h1>
          <p className="text-gray-600">Gerir equipa e convites - Administrador: Luis Peres</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Convidar Terapeuta</span>
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total de Terapeutas</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{therapists.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Ativos</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{activeTherapists.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Convites Pendentes</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">{pendingInvitations.length}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Suspensos</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{suspendedTherapists.length}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Convites Pendentes</h3>
          <div className="space-y-4">
            {pendingInvitations.map((invitation) => (
              <div key={invitation.id} className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{invitation.name}</h4>
                    <p className="text-sm text-gray-600">{invitation.email}</p>
                    <p className="text-xs text-gray-500">
                      Enviado em {invitation.createdAt.toLocaleDateString('pt-PT')} • 
                      Expira em {invitation.expiresAt.toLocaleDateString('pt-PT')}
                    </p>
                    <p className="text-xs text-gray-500">
                      Enviado em {new Date(invitation.createdAt).toLocaleDateString('pt-PT')} • 
                      Expira em {new Date(invitation.expiresAt).toLocaleDateString('pt-PT')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                    Pendente
                  </span>
                  <button
                    onClick={() => handleCancelInvitation(invitation.id)}
                    className="text-red-600 hover:text-red-800"
                    title="Cancelar convite"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Therapists */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Terapeutas Ativos</h3>
        
        {activeTherapists.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Nenhum terapeuta ativo encontrado</p>
            <p className="text-sm">Convide terapeutas para começar</p>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeTherapists.map((therapist) => (
            <div key={therapist.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start space-x-4 mb-4">
                <img
                  src={therapist.image}
                  alt={therapist.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-semibold text-gray-900">{therapist.name}</h4>
                    {therapist.isAdmin && (
                      <Shield className="w-4 h-4 text-blue-600" title="Administrador" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{therapist.bio}</p>
                  <div className="flex flex-wrap gap-1">
                    {therapist.specialties.slice(0, 2).map((specialty, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {specialty}
                      </span>
                    ))}
                    {therapist.specialties.length > 2 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{therapist.specialties.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <span className={`w-2 h-2 rounded-full ${therapist.available ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm text-gray-600">
                    {therapist.available ? 'Disponível' : 'Indisponível'}
                  </span>
                </div>
                
                {!therapist.isAdmin && (
                  <button
                    onClick={() => handleSuspendTherapist(therapist.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Suspender
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        )}
      </div>

      {/* Suspended Therapists */}
      {suspendedTherapists.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Terapeutas Suspensos</h3>
          <div className="space-y-4">
            {suspendedTherapists.map((therapist) => (
              <div key={therapist.id} className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <img
                    src={therapist.image}
                    alt={therapist.name}
                    className="w-10 h-10 rounded-full object-cover opacity-50"
                  />
                  <div>
                    <h4 className="font-medium text-gray-900">{therapist.name}</h4>
                    <p className="text-sm text-gray-600">Suspenso</p>
                  </div>
                </div>
                <button
                  onClick={() => handleActivateTherapist(therapist.id)}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  Reativar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Convidar Novo Terapeuta</h3>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      value={inviteData.name}
                      onChange={(e) => setInviteData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Nome do terapeuta"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={inviteData.email}
                      onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="email@exemplo.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Especialidades
                  </label>
                  <div className="space-y-2">
                    {inviteData.specialties.map((specialty, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={specialty}
                          onChange={(e) => handleSpecialtyChange(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Ex: Psicoterapia, Coaching..."
                        />
                        {inviteData.specialties.length > 1 && (
                          <button
                            onClick={() => handleRemoveSpecialty(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={handleAddSpecialty}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      + Adicionar Especialidade
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensagem Pessoal (opcional)
                  </label>
                  <textarea
                    value={inviteData.message}
                    onChange={(e) => setInviteData(prev => ({ ...prev, message: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Adicione uma mensagem pessoal ao convite..."
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Informações do Convite</span>
                  </div>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• O convite será enviado por email</li>
                    <li>• Válido por 7 dias</li>
                    <li>• O terapeuta poderá configurar o seu perfil após aceitar</li>
                    <li>• Receberá notificação quando o convite for aceite</li>
                  </ul>
                </div>
              </div>

              <div className="flex space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSendInvitation}
                  disabled={!inviteData.name || !inviteData.email}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar Convite</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}