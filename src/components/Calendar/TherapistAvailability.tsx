import React, { useState } from 'react';
import { Calendar, Clock, Plus, X, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TherapistAvailability } from '../../types';
import { v4 as uuidv4 } from 'uuid';

interface TherapistAvailabilityProps {
  therapistId: string;
  onClose: () => void;
}

export function TherapistAvailabilityManager({ therapistId, onClose }: TherapistAvailabilityProps) {
  const { therapists, setTherapists, therapistAvailability, setTherapistAvailability } = useApp();
  
  const therapist = therapists.find(t => t.id === therapistId);
  const existingAvailability = therapist?.availability || {
    id: uuidv4(),
    therapistId,
    workingDays: [1, 2, 3, 4, 5], // Monday to Friday
    workingHours: { start: '09:00', end: '17:00' },
    breaks: [{ start: '12:00', end: '13:00' }],
    blockedDates: [],
    customSchedule: [],
    bufferTime: 15,
    maxAdvanceBooking: 30,
    minAdvanceNotice: 2
  };

  const [availability, setAvailability] = useState<TherapistAvailability>(existingAvailability);
  const [activeTab, setActiveTab] = useState<'schedule' | 'blocked' | 'settings'>('schedule');
  const [newBlockedDate, setNewBlockedDate] = useState('');
  const [customDate, setCustomDate] = useState('');
  const [customHours, setCustomHours] = useState({ start: '09:00', end: '17:00' });

  const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  const handleWorkingDayToggle = (dayIndex: number) => {
    setAvailability(prev => ({
      ...prev,
      workingDays: prev.workingDays.includes(dayIndex)
        ? prev.workingDays.filter(d => d !== dayIndex)
        : [...prev.workingDays, dayIndex].sort()
    }));
  };

  const handleAddBreak = () => {
    setAvailability(prev => ({
      ...prev,
      breaks: [...prev.breaks, { start: '12:00', end: '13:00' }]
    }));
  };

  const handleRemoveBreak = (index: number) => {
    setAvailability(prev => ({
      ...prev,
      breaks: prev.breaks.filter((_, i) => i !== index)
    }));
  };

  const handleBreakChange = (index: number, field: 'start' | 'end', value: string) => {
    setAvailability(prev => ({
      ...prev,
      breaks: prev.breaks.map((break_, i) => 
        i === index ? { ...break_, [field]: value } : break_
      )
    }));
  };

  const handleAddBlockedDate = () => {
    if (!newBlockedDate) return;
    
    setAvailability(prev => ({
      ...prev,
      blockedDates: [...prev.blockedDates, new Date(newBlockedDate)]
    }));
    setNewBlockedDate('');
  };

  const handleRemoveBlockedDate = (index: number) => {
    setAvailability(prev => ({
      ...prev,
      blockedDates: prev.blockedDates.filter((_, i) => i !== index)
    }));
  };

  const handleAddCustomSchedule = () => {
    if (!customDate) return;

    setAvailability(prev => ({
      ...prev,
      customSchedule: [...prev.customSchedule, {
        date: new Date(customDate),
        available: true,
        customHours: customHours.start !== '09:00' || customHours.end !== '17:00' ? customHours : undefined
      }]
    }));
    setCustomDate('');
  };

  const handleRemoveCustomSchedule = (index: number) => {
    setAvailability(prev => ({
      ...prev,
      customSchedule: prev.customSchedule.filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    // Update therapist with new availability
    setTherapists(prev => prev.map(t => 
      t.id === therapistId 
        ? { ...t, availability }
        : t
    ));

    // Update or add to therapist availability array
    const existingIndex = therapistAvailability.findIndex(a => a.therapistId === therapistId);
    if (existingIndex >= 0) {
      setTherapistAvailability(prev => prev.map((a, i) => 
        i === existingIndex ? availability : a
      ));
    } else {
      setTherapistAvailability(prev => [...prev, availability]);
    }

    alert('Disponibilidade guardada com sucesso!');
    onClose();
  };

  if (!therapist) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img
                src={therapist.image}
                alt={therapist.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <h2 className="text-xl font-bold text-gray-900">Disponibilidade - {therapist.name}</h2>
                <p className="text-gray-600">Configure os seus horários disponíveis</p>
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
        <div className="border-b border-gray-200 flex-shrink-0">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'schedule', label: 'Horário Semanal', icon: Clock },
              { id: 'blocked', label: 'Datas Bloqueadas', icon: X },
              { id: 'settings', label: 'Configurações', icon: Calendar }
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

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <div className="space-y-6">
              {/* Working Days */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Dias de Trabalho</h3>
                <div className="grid grid-cols-7 gap-2">
                  {dayNames.map((day, index) => (
                    <button
                      key={index}
                      onClick={() => handleWorkingDayToggle(index)}
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                        availability.workingDays.includes(index)
                          ? 'border-primary-400 bg-primary-50 text-primary-800'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Working Hours */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Horário de Trabalho</h3>
                <div className="grid grid-cols-2 gap-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Início
                    </label>
                    <input
                      type="time"
                      value={availability.workingHours.start}
                      onChange={(e) => setAvailability(prev => ({
                        ...prev,
                        workingHours: { ...prev.workingHours, start: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fim
                    </label>
                    <input
                      type="time"
                      value={availability.workingHours.end}
                      onChange={(e) => setAvailability(prev => ({
                        ...prev,
                        workingHours: { ...prev.workingHours, end: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* Breaks */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Pausas</h3>
                  <button
                    onClick={handleAddBreak}
                    className="flex items-center space-x-2 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar Pausa</span>
                  </button>
                </div>
                <div className="space-y-3">
                  {availability.breaks.map((break_, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <input
                        type="time"
                        value={break_.start}
                        onChange={(e) => handleBreakChange(index, 'start', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                      <span className="text-gray-500">até</span>
                      <input
                        type="time"
                        value={break_.end}
                        onChange={(e) => handleBreakChange(index, 'end', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                      <button
                        onClick={() => handleRemoveBreak(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Blocked Dates Tab */}
          {activeTab === 'blocked' && (
            <div className="space-y-6">
              {/* Add Blocked Date */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Bloquear Datas</h3>
                <div className="flex items-center space-x-3 mb-4">
                  <input
                    type="date"
                    value={newBlockedDate}
                    onChange={(e) => setNewBlockedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    onClick={handleAddBlockedDate}
                    disabled={!newBlockedDate}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300"
                  >
                    Bloquear Data
                  </button>
                </div>
              </div>

              {/* Blocked Dates List */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Datas Bloqueadas</h4>
                <div className="space-y-2">
                  {availability.blockedDates.length === 0 ? (
                    <p className="text-gray-500 text-sm">Nenhuma data bloqueada</p>
                  ) : (
                    availability.blockedDates.map((date, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                        <span className="text-red-800">
                          {new Date(date).toLocaleDateString('pt-PT', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                        <button
                          onClick={() => handleRemoveBlockedDate(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Custom Schedule */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Horários Especiais Disponíveis</h3>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="time"
                      value={customHours.start}
                      onChange={(e) => setCustomHours(prev => ({ ...prev, start: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    <span className="text-gray-500">até</span>
                    <input
                      type="time"
                      value={customHours.end}
                      onChange={(e) => setCustomHours(prev => ({ ...prev, end: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      onClick={handleAddCustomSchedule}
                      disabled={!customDate}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {availability.customSchedule.map((schedule, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-primary-50 border border-primary-200 rounded-lg">
                      <div>
                        <span className="text-primary-800 font-medium">
                          {new Date(schedule.date).toLocaleDateString('pt-PT')}
                        </span>
                        {schedule.customHours && (
                          <span className="text-primary-600 ml-2">
                            {schedule.customHours.start} - {schedule.customHours.end}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveCustomSchedule(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tempo de Intervalo (minutos)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={availability.bufferTime}
                    onChange={(e) => setAvailability(prev => ({
                      ...prev,
                      bufferTime: parseInt(e.target.value) || 0
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Tempo entre consultas</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agendamento Antecipado Máximo (dias)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={availability.maxAdvanceBooking}
                    onChange={(e) => setAvailability(prev => ({
                      ...prev,
                      maxAdvanceBooking: parseInt(e.target.value) || 30
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aviso Prévio Mínimo (horas)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={availability.minAdvanceNotice}
                    onChange={(e) => setAvailability(prev => ({
                      ...prev,
                      minAdvanceNotice: parseInt(e.target.value) || 2
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="bg-wellness-calm border border-primary-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-primary-600" />
                  <span className="font-medium text-primary-900">Resumo da Configuração</span>
                </div>
                <div className="text-sm text-primary-800 space-y-1">
                  <p>• Dias de trabalho: {availability.workingDays.map(d => dayNames[d]).join(', ')}</p>
                  <p>• Horário: {availability.workingHours.start} - {availability.workingHours.end}</p>
                  <p>• Pausas: {availability.breaks.length} configuradas</p>
                  <p>• Datas bloqueadas: {availability.blockedDates.length}</p>
                  <p>• Horários especiais: {availability.customSchedule.length}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="p-6 border-t border-gray-200 flex-shrink-0 bg-gray-50">
          <div className="flex justify-between items-center">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium shadow-md"
            >
              <Save className="w-5 h-5" />
              <span>Guardar Disponibilidade</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}