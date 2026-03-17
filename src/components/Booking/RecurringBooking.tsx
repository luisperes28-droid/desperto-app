import React, { useState } from 'react';
import { Calendar, Repeat, Clock } from 'lucide-react';

interface RecurringBookingProps {
  onRecurrenceChange: (recurrence: RecurrencePattern | null) => void;
}

export interface RecurrencePattern {
  type: 'weekly' | 'biweekly' | 'monthly';
  interval: number;
  endDate?: Date;
  occurrences?: number;
  daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, etc.
}

export function RecurringBooking({ onRecurrenceChange }: RecurringBookingProps) {
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<'weekly' | 'biweekly' | 'monthly'>('weekly');
  const [endType, setEndType] = useState<'date' | 'occurrences'>('occurrences');
  const [endDate, setEndDate] = useState<string>('');
  const [occurrences, setOccurrences] = useState<number>(4);

  const handleRecurrenceToggle = (enabled: boolean) => {
    setIsRecurring(enabled);
    if (!enabled) {
      onRecurrenceChange(null);
    } else {
      updateRecurrence();
    }
  };

  const updateRecurrence = () => {
    if (!isRecurring) return;

    const pattern: RecurrencePattern = {
      type: recurrenceType,
      interval: 1,
      ...(endType === 'date' && endDate ? { endDate: new Date(endDate) } : {}),
      ...(endType === 'occurrences' ? { occurrences } : {})
    };

    onRecurrenceChange(pattern);
  };

  React.useEffect(() => {
    updateRecurrence();
  }, [recurrenceType, endType, endDate, occurrences, isRecurring]);

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          id="recurring"
          checked={isRecurring}
          onChange={(e) => handleRecurrenceToggle(e.target.checked)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="recurring" className="flex items-center space-x-2 font-medium text-gray-900">
          <Repeat className="w-4 h-4" />
          <span>Agendamento Recorrente</span>
        </label>
      </div>

      {isRecurring && (
        <div className="ml-7 space-y-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Frequência
            </label>
            <select
              value={recurrenceType}
              onChange={(e) => setRecurrenceType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="weekly">Semanal</option>
              <option value="biweekly">Quinzenal</option>
              <option value="monthly">Mensal</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Terminar
            </label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="endByOccurrences"
                  name="endType"
                  checked={endType === 'occurrences'}
                  onChange={() => setEndType('occurrences')}
                  className="w-4 h-4 text-blue-600"
                />
                <label htmlFor="endByOccurrences" className="text-sm text-gray-700">
                  Após
                </label>
                <input
                  type="number"
                  min="1"
                  max="52"
                  value={occurrences}
                  onChange={(e) => setOccurrences(parseInt(e.target.value))}
                  disabled={endType !== 'occurrences'}
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100"
                />
                <span className="text-sm text-gray-700">sessões</span>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="endByDate"
                  name="endType"
                  checked={endType === 'date'}
                  onChange={() => setEndType('date')}
                  className="w-4 h-4 text-blue-600"
                />
                <label htmlFor="endByDate" className="text-sm text-gray-700">
                  Em
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={endType !== 'date'}
                  min={new Date().toISOString().split('T')[0]}
                  className="px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Resumo</span>
            </div>
            <p className="text-sm text-blue-800">
              {recurrenceType === 'weekly' && 'Repetir todas as semanas'}
              {recurrenceType === 'biweekly' && 'Repetir de 2 em 2 semanas'}
              {recurrenceType === 'monthly' && 'Repetir todos os meses'}
              {endType === 'occurrences' 
                ? ` por ${occurrences} sessões`
                : endDate 
                ? ` até ${new Date(endDate).toLocaleDateString('pt-PT')}`
                : ''
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
}