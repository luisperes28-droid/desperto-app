import React, { useState } from 'react';
import { Plus, Search, Filter, FileText, Calendar, User, Edit, Trash2, Eye, EyeOff, Tag, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TherapistNote } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export function TherapistNotes() {
  const { 
    therapistNotes, 
    setTherapistNotes, 
    clients, 
    therapists 
  } = useApp();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingNote, setEditingNote] = useState<TherapistNote | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [noteData, setNoteData] = useState({
    clientId: '',
    title: '',
    content: '',
    isPrivate: true,
    sessionDate: '',
    tags: [] as string[]
  });
  const [newTag, setNewTag] = useState('');

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
  const canManageNotes = currentUser?.userType === 'admin' || currentUser?.userType === 'therapist';

  if (!canManageNotes) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-red-600" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Acesso Restrito</h3>
          <p className="text-red-700">
            Apenas administradores e terapeutas podem gerir notas.
          </p>
        </div>
      </div>
    );
  }

  // Filter notes based on user type
  const visibleNotes = currentUser?.userType === 'admin' 
    ? therapistNotes 
    : therapistNotes.filter(note => note.therapistId === currentUser?.id);

  const filteredNotes = visibleNotes.filter(note => {
    const client = clients.find(c => c.id === note.clientId);
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClient = filterClient === 'all' || note.clientId === filterClient;
    return matchesSearch && matchesClient;
  });

  const handleCreateNote = () => {
    if (!noteData.clientId || !noteData.title.trim() || !noteData.content.trim()) {
      alert('Cliente, título e conteúdo são obrigatórios');
      return;
    }

    const newNote: TherapistNote = {
      id: editingNote?.id || uuidv4(),
      therapistId: currentUser.id,
      clientId: noteData.clientId,
      title: noteData.title,
      content: noteData.content,
      isPrivate: noteData.isPrivate,
      createdAt: editingNote?.createdAt || new Date(),
      updatedAt: new Date(),
      sessionDate: noteData.sessionDate ? new Date(noteData.sessionDate) : undefined,
      tags: noteData.tags
    };

    if (editingNote) {
      setTherapistNotes(prev => prev.map(n => n.id === editingNote.id ? newNote : n));
    } else {
      setTherapistNotes(prev => [...prev, newNote]);
    }

    // Reset form
    setNoteData({
      clientId: '',
      title: '',
      content: '',
      isPrivate: true,
      sessionDate: '',
      tags: []
    });
    setEditingNote(null);
    setShowCreateModal(false);

    alert(editingNote ? 'Nota atualizada com sucesso!' : 'Nota criada com sucesso!');
  };

  const handleEditNote = (note: TherapistNote) => {
    // Check if user can edit this note
    if (currentUser?.userType !== 'admin' && note.therapistId !== currentUser?.id) {
      alert('Só pode editar as suas próprias notas');
      return;
    }

    setEditingNote(note);
    setNoteData({
      clientId: note.clientId,
      title: note.title,
      content: note.content,
      isPrivate: note.isPrivate,
      sessionDate: note.sessionDate ? note.sessionDate.toISOString().split('T')[0] : '',
      tags: note.tags
    });
    setShowCreateModal(true);
  };

  const handleDeleteNote = (noteId: string) => {
    const note = therapistNotes.find(n => n.id === noteId);
    if (!note) return;

    // Check if user can delete this note
    if (currentUser?.userType !== 'admin' && note.therapistId !== currentUser?.id) {
      alert('Só pode eliminar as suas próprias notas');
      return;
    }

    if (confirm('Tem certeza que deseja eliminar esta nota?')) {
      setTherapistNotes(prev => prev.filter(n => n.id !== noteId));
      alert('Nota eliminada com sucesso!');
    }
  };

  const addTag = () => {
    if (newTag.trim() && !noteData.tags.includes(newTag.trim())) {
      setNoteData(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setNoteData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Notas do Terapeuta</h1>
          <p className="text-sm sm:text-base text-gray-600">Gerir notas confidenciais dos clientes</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors min-h-[48px] w-full sm:w-auto text-base font-medium"
          style={{ touchAction: 'manipulation' }}
        >
          <Plus className="w-4 h-4" />
          <span>Nova Nota</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1 sm:flex-none">
          <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar notas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-80 pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base min-h-[48px]"
            style={{ touchAction: 'manipulation' }}
          />
        </div>
        
        <div className="flex items-center space-x-2 flex-shrink-0">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base min-h-[48px] min-w-[140px]"
            style={{ touchAction: 'manipulation' }}
          >
            <option value="all">Todos os Clientes</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs sm:text-sm font-medium">Total de Notas</p>
              <p className="text-xl sm:text-3xl font-bold text-blue-600 mt-1">{visibleNotes.length}</p>
            </div>
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs sm:text-sm font-medium">Este Mês</p>
              <p className="text-xl sm:text-3xl font-bold text-green-600 mt-1">
                {visibleNotes.filter(note => {
                  const noteDate = new Date(note.createdAt);
                  const thisMonth = new Date();
                  return noteDate.getMonth() === thisMonth.getMonth() && 
                         noteDate.getFullYear() === thisMonth.getFullYear();
                }).length}
              </p>
            </div>
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs sm:text-sm font-medium">Clientes com Notas</p>
              <p className="text-xl sm:text-3xl font-bold text-purple-600 mt-1">
                {new Set(visibleNotes.map(note => note.clientId)).size}
              </p>
            </div>
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs sm:text-sm font-medium">Notas Privadas</p>
              <p className="text-xl sm:text-3xl font-bold text-desperto-gold mt-1">
                {visibleNotes.filter(note => note.isPrivate).length}
              </p>
            </div>
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <EyeOff className="w-4 h-4 sm:w-6 sm:h-6 text-desperto-gold" />
            </div>
          </div>
        </div>
      </div>

      {/* Notes List */}
      <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="space-y-4">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-base font-medium">Nenhuma nota encontrada</p>
              <p className="text-sm">Crie a primeira nota sobre um cliente</p>
            </div>
          ) : (
            filteredNotes
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((note) => {
                const client = clients.find(c => c.id === note.clientId);
                const therapist = therapists.find(t => t.id === note.therapistId);
                
                return (
                  <div key={note.id} className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 space-y-3 sm:space-y-0">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 break-words">{note.title}</h3>
                          {note.isPrivate && (
                            <EyeOff className="w-4 h-4 text-amber-500" title="Nota privada" />
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 mb-3">
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span className="truncate">{client?.name || 'Cliente Desconhecido'}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(note.createdAt).toLocaleDateString('pt-PT')}</span>
                          </div>
                          {note.sessionDate && (
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>Sessão: {new Date(note.sessionDate).toLocaleDateString('pt-PT')}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <FileText className="w-4 h-4" />
                            <span>{therapist?.name || 'Terapeuta'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                        <button
                          onClick={() => handleEditNote(note)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                          title="Editar nota"
                          style={{ touchAction: 'manipulation' }}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {(currentUser?.userType === 'admin' || note.therapistId === currentUser?.id) && (
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                            title="Eliminar nota"
                            style={{ touchAction: 'manipulation' }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap break-words">{note.content}</p>
                    </div>
                    
                    {note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {note.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs sm:text-sm rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* Create/Edit Note Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg sm:rounded-xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 truncate pr-4">
                  {editingNote ? 'Editar Nota' : 'Nova Nota do Terapeuta'}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingNote(null);
                    setNoteData({
                      clientId: '',
                      title: '',
                      content: '',
                      isPrivate: true,
                      sessionDate: '',
                      tags: []
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
                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                    Cliente *
                  </label>
                  <select
                    value={noteData.clientId}
                    onChange={(e) => setNoteData(prev => ({ ...prev, clientId: e.target.value }))}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base min-h-[48px]"
                    required
                    style={{ touchAction: 'manipulation' }}
                  >
                    <option value="">Selecionar cliente...</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name} ({client.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                      Título da Nota *
                    </label>
                    <input
                      type="text"
                      value={noteData.title}
                      onChange={(e) => setNoteData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base min-h-[48px]"
                      placeholder="Ex: Primeira consulta, Progresso, Observações..."
                      required
                      style={{ touchAction: 'manipulation' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                      Data da Sessão (opcional)
                    </label>
                    <input
                      type="date"
                      value={noteData.sessionDate}
                      onChange={(e) => setNoteData(prev => ({ ...prev, sessionDate: e.target.value }))}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base min-h-[48px]"
                      style={{ touchAction: 'manipulation' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                    Conteúdo da Nota *
                  </label>
                  <textarea
                    value={noteData.content}
                    onChange={(e) => setNoteData(prev => ({ ...prev, content: e.target.value }))}
                    rows={6}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base resize-none"
                    placeholder="Descreva as observações, progresso, recomendações..."
                    required
                    style={{ touchAction: 'manipulation' }}
                  />
                </div>

                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <div className="flex items-center space-x-2 mb-3">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      className="flex-1 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base min-h-[48px]"
                      placeholder="Adicionar tag..."
                      style={{ touchAction: 'manipulation' }}
                    />
                    <button
                      onClick={addTag}
                      className="px-3 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 min-h-[48px] min-w-[48px] flex items-center justify-center"
                      style={{ touchAction: 'manipulation' }}
                    >
                      <Tag className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {noteData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs sm:text-sm rounded-full"
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-1 text-blue-600 hover:text-blue-800 p-1 min-h-[24px] min-w-[24px] flex items-center justify-center"
                          style={{ touchAction: 'manipulation' }}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-3 py-2">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    checked={noteData.isPrivate}
                    onChange={(e) => setNoteData(prev => ({ ...prev, isPrivate: e.target.checked }))}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    style={{ touchAction: 'manipulation' }}
                  />
                  <label htmlFor="isPrivate" className="text-sm sm:text-base text-gray-700 cursor-pointer">
                    Nota privada (apenas visível para terapeutas)
                  </label>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <EyeOff className="w-5 h-5 text-amber-600" />
                    <span className="font-medium text-amber-900 text-sm sm:text-base">Confidencialidade</span>
                  </div>
                  <p className="text-amber-700 text-xs sm:text-sm">
                    Todas as notas são confidenciais e apenas visíveis para terapeutas. 
                    Os clientes nunca têm acesso a estas informações.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingNote(null);
                  }}
                  className="w-full sm:flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium min-h-[48px] text-base"
                  style={{ touchAction: 'manipulation' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateNote}
                  disabled={!noteData.clientId || !noteData.title.trim() || !noteData.content.trim()}
                  className="w-full sm:flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium min-h-[48px] text-base"
                  style={{ touchAction: 'manipulation' }}
                >
                  {editingNote ? 'Atualizar' : 'Criar'} Nota
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}