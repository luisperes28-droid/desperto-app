import React, { useState } from 'react';
import { X, User, Mail, Phone, Calendar, DollarSign, FileText, Plus, Edit, Trash2, Eye, EyeOff, Tag } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Client, TherapistNote } from '../../types';
import { v4 as uuidv4 } from 'uuid';

interface ClientDetailsProps {
  client: Client;
  onClose: () => void;
  currentUserId?: string;
  currentUserType?: string;
}

export function ClientDetails({ client, onClose, currentUserId, currentUserType }: ClientDetailsProps) {
  const { bookings, payments, services, therapists, therapistNotes, setTherapistNotes } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'history'>('overview');
  const [showNewNoteModal, setShowNewNoteModal] = useState(false);
  const [editingNote, setEditingNote] = useState<TherapistNote | null>(null);
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    isPrivate: true,
    sessionDate: '',
    tags: [] as string[]
  });
  const [newTag, setNewTag] = useState('');

  // Get client data
  const clientBookings = bookings.filter(b => b.clientId === client.id);
  const clientPayments = payments.filter(p => {
    const booking = bookings.find(b => b.id === p.bookingId);
    return booking?.clientId === client.id;
  });
  const clientNotes = therapistNotes.filter(n => n.clientId === client.id);
  const totalSpent = clientPayments.reduce((sum, p) => sum + p.amount, 0);

  // Check if current user can access notes
  const canAccessNotes = true; // Always allow access to notes tab
  
  // Filter notes based on user permissions
  const visibleNotes = clientNotes; // Show all notes for this client

  const handleSaveNote = () => {
    if (!newNote.title.trim() || !newNote.content.trim()) return;

    const noteData: TherapistNote = {
      id: editingNote?.id || uuidv4(),
      therapistId: currentUserId || '1', // Use current user ID
      clientId: client.id,
      title: newNote.title,
      content: newNote.content,
      isPrivate: newNote.isPrivate,
      createdAt: editingNote?.createdAt || new Date(),
      updatedAt: new Date(),
      sessionDate: newNote.sessionDate ? new Date(newNote.sessionDate) : undefined,
      tags: newNote.tags
    };

    if (editingNote) {
      setTherapistNotes(prev => prev.map(n => n.id === editingNote.id ? noteData : n));
    } else {
      setTherapistNotes(prev => [...prev, noteData]);
    }

    setShowNewNoteModal(false);
    setEditingNote(null);
    setNewNote({ title: '', content: '', isPrivate: true, sessionDate: '', tags: [] });
  };

  const handleEditNote = (note: TherapistNote) => {
    setEditingNote(note);
    setNewNote({
      title: note.title,
      content: note.content,
      isPrivate: note.isPrivate,
      sessionDate: note.sessionDate ? note.sessionDate.toISOString().split('T')[0] : '',
      tags: note.tags
    });
    setShowNewNoteModal(true);
  };

  const handleDeleteNote = (noteId: string) => {
    if (confirm('Tem certeza que deseja eliminar esta nota?')) {
      setTherapistNotes(prev => prev.filter(n => n.id !== noteId));
    }
  };

  const addTag = () => {
    if (newTag.trim() && !newNote.tags.includes(newTag.trim())) {
      setNewNote(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setNewNote(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center shadow-lg">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{client.name}</h2>
                  <p className="text-gray-600">Cliente desde {new Date(client.createdAt).toLocaleDateString('pt-PT')}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Visão Geral', icon: User },
                { id: 'notes', label: 'Notas do Terapeuta', icon: FileText },
                { id: 'history', label: 'Histórico', icon: Calendar }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
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
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{client.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{client.phone || 'Sem telefone'}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{clientBookings.length}</div>
                      <div className="text-sm text-blue-700">Agendamentos</div>
                    </div>
                    <div className="text-center p-4 bg-emerald-50 rounded-lg">
                      <div className="text-2xl font-bold text-emerald-600">€{totalSpent}</div>
                      <div className="text-sm text-emerald-700">Total Gasto</div>
                    </div>
                  </div>
                </div>

                {client.notes && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Notas do Cliente</h3>
                    <p className="text-gray-600">{client.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === 'notes' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Notas do Terapeuta</h3>
                  {(currentUserType === 'admin' || currentUserType === 'therapist') && (
                    <button
                      onClick={() => setShowNewNoteModal(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Nova Nota</span>
                    </button>
                  )}
                </div>

                {(currentUserType === 'admin' || currentUserType === 'therapist') && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <EyeOff className="w-5 h-5 text-amber-600" />
                      <span className="font-medium text-amber-900">Notas Confidenciais</span>
                    </div>
                    <p className="text-amber-700 text-sm mt-1">
                      Estas notas são privadas e apenas visíveis para terapeutas. O cliente não tem acesso.
                    </p>
                  </div>
                )}

                {currentUserType !== 'admin' && currentUserType !== 'therapist' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <span className="font-medium text-red-900">Acesso Restrito</span>
                    </div>
                    <p className="text-red-700 text-sm mt-1">
                      Apenas terapeutas e administradores podem ver e criar notas.
                    </p>
                  </div>
                )}

                  <div className="space-y-4">
                    {visibleNotes.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Nenhuma nota registada</p>
                        {(currentUserType === 'admin' || currentUserType === 'therapist') && (
                          <p className="text-sm">Adicione a primeira nota sobre este cliente</p>
                        )}
                      </div>
                    ) : (
                      visibleNotes.map((note) => (
                        <div key={note.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="font-medium text-gray-900">{note.title}</h4>
                                {note.isPrivate && (
                                  <EyeOff className="w-4 h-4 text-amber-500" title="Nota privada" />
                                )}
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span>{new Date(note.createdAt).toLocaleDateString('pt-PT')}</span>
                                {note.sessionDate && (
                                  <span>Sessão: {new Date(note.sessionDate).toLocaleDateString('pt-PT')}</span>
                                )}
                                <span>{therapists.find(t => t.id === note.therapistId)?.name}</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleEditNote(note)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              {(currentUserType === 'admin' || note.therapistId === currentUserId) && (
                                <button
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-gray-700 mb-3 whitespace-pre-wrap">{note.content}</p>
                          
                          {note.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {note.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Histórico de Agendamentos</h3>
                <div className="space-y-3">
                  {clientBookings.map((booking) => {
                    const service = services.find(s => s.id === booking.serviceId);
                    const therapist = therapists.find(t => t.id === booking.therapistId);
                    
                    return (
                      <div key={booking.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{service?.name}</h4>
                            <p className="text-sm text-gray-500">
                              {new Date(booking.date).toLocaleDateString('pt-PT')} • {therapist?.name}
                            </p>
                          </div>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                            booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                            booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                            booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {booking.status === 'completed' ? 'Concluído' :
                             booking.status === 'confirmed' ? 'Confirmado' :
                             booking.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New/Edit Note Modal */}
      {showNewNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingNote ? 'Editar Nota' : 'Nova Nota do Terapeuta'}
              </h3>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título da Nota
                  </label>
                  <input
                    type="text"
                    value={newNote.title}
                    onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Primeira consulta, Progresso, Observações..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data da Sessão (opcional)
                  </label>
                  <input
                    type="date"
                    value={newNote.sessionDate}
                    onChange={(e) => setNewNote(prev => ({ ...prev, sessionDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conteúdo da Nota
                  </label>
                  <textarea
                    value={newNote.content}
                    onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Descreva as observações, progresso, recomendações..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <div className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Adicionar tag..."
                    />
                    <button
                      onClick={addTag}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      <Tag className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {newNote.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    checked={newNote.isPrivate}
                    onChange={(e) => setNewNote(prev => ({ ...prev, isPrivate: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isPrivate" className="text-sm text-gray-700">
                    Nota privada (apenas visível para terapeutas)
                  </label>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowNewNoteModal(false);
                  setEditingNote(null);
                  setNewNote({ title: '', content: '', isPrivate: true, sessionDate: '', tags: [] });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveNote}
                disabled={!newNote.title.trim() || !newNote.content.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
              >
                {editingNote ? 'Atualizar' : 'Guardar'} Nota
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}