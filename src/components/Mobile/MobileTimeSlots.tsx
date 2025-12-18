import React from 'react';
import { Clock, CheckCircle } from 'lucide-react';
import { TimeSlot } from '../../services/availabilityService';

interface MobileTimeSlotsProps {
  slots: TimeSlot[];
  selectedTime: string;
  onTimeSelect: (time: string) => void;
  therapistName?: string;
}

export function MobileTimeSlots({ slots, selectedTime, onTimeSelect, therapistName }: MobileTimeSlotsProps) {
  const availableSlots = slots.filter(slot => slot.available);
  const unavailableSlots = slots.filter(slot => !slot.available);

  if (slots.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-amber-600" />
        </div>
        <h4 className="text-lg font-semibold text-amber-800 mb-2">
          Sem horários disponíveis
        </h4>
        <p className="text-amber-700 text-sm">
          {therapistName} não tem horários disponíveis neste dia.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Available Slots */}
      {availableSlots.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-gray-900">Horários Disponíveis</h4>
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
              {availableSlots.length} opções
            </span>
          </div>
          
          <div className="overflow-x-auto pb-4">
            <div className="flex space-x-3 min-w-max px-1">
              {availableSlots.map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => onTimeSelect(slot.time)}
                  className={`flex-shrink-0 w-20 h-16 rounded-xl border-2 font-semibold transition-all ${
                    selectedTime === slot.time
                      ? 'bg-desperto-gold text-white border-desperto-gold shadow-lg scale-105'
                      : 'border-gray-200 hover:border-desperto-gold/50 hover:bg-desperto-cream bg-white'
                  }`}
                  style={{ touchAction: 'manipulation' }}
                >
                  <div className="text-center">
                    <div className="text-sm">{slot.time}</div>
                    {selectedTime === slot.time && (
                      <div className="text-xs mt-1 opacity-90">✓</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Unavailable Slots (for reference) */}
      {unavailableSlots.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Clock className="w-5 h-5 text-gray-400" />
            <h4 className="font-semibold text-gray-600">Horários Ocupados</h4>
          </div>
          
          <div className="overflow-x-auto pb-4">
            <div className="flex space-x-3 min-w-max px-1">
              {unavailableSlots.slice(0, 6).map((slot) => (
                <div
                  key={slot.time}
                  className="flex-shrink-0 w-20 h-16 rounded-xl border-2 border-gray-200 bg-gray-50 flex items-center justify-center opacity-60"
                >
                  <div className="text-center">
                    <div className="text-sm text-gray-500">{slot.time}</div>
                    <div className="text-xs text-gray-400 mt-1">Ocupado</div>
                  </div>
                </div>
              ))}
              {unavailableSlots.length > 6 && (
                <div className="flex-shrink-0 w-20 h-16 rounded-xl border-2 border-gray-200 bg-gray-50 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-xs text-gray-400">+{unavailableSlots.length - 6}</div>
                    <div className="text-xs text-gray-400">mais</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scroll Hint */}
      <div className="text-center">
        <p className="text-xs text-gray-500 flex items-center justify-center space-x-1">
          <span>←</span>
          <span>Deslize para ver mais horários</span>
          <span>→</span>
        </p>
      </div>
    </div>
  );
}