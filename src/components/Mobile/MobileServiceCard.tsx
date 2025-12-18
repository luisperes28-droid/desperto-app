import React from 'react';
import { Clock, DollarSign, Tag, Zap } from 'lucide-react';

interface MobileServiceCardProps {
  service: any;
  isSelected: boolean;
  onSelect: () => void;
}

export function MobileServiceCard({ service, isSelected, onSelect }: MobileServiceCardProps) {
  return (
    <div
      onClick={onSelect}
      className={`w-80 flex-shrink-0 p-6 border-2 rounded-2xl cursor-pointer transition-all hover:shadow-lg ${
        isSelected
          ? 'border-desperto-gold bg-desperto-cream shadow-xl scale-105'
          : 'border-gray-200 hover:border-desperto-gold/50 bg-white'
      }`}
      style={{ touchAction: 'manipulation' }}
    >
      {/* Header with Price */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0 pr-4">
          <h3 className="text-xl font-bold text-desperto-gold mb-1 leading-tight">
            {service.name}
          </h3>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Tag className="w-4 h-4" />
            <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium">
              {service.category}
            </span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-2xl font-bold text-desperto-gold">€{service.price}</div>
          <div className="text-xs text-gray-500">por sessão</div>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">
        {service.description}
      </p>

      {/* Service Details */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{service.duration} min</p>
            <p className="text-xs text-gray-500">Duração</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Disponível</p>
            <p className="text-xs text-gray-500">Estado</p>
          </div>
        </div>
      </div>

      {/* Value Proposition */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-3 mb-4">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-sm font-semibold text-blue-900">Benefícios</span>
        </div>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Sessão personalizada às suas necessidades</li>
          <li>• Ambiente seguro e confidencial</li>
          <li>• Técnicas comprovadas cientificamente</li>
        </ul>
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="p-3 bg-desperto-gold/10 border border-desperto-gold/30 rounded-xl">
          <div className="flex items-center justify-center space-x-2 text-desperto-gold">
            <div className="w-2 h-2 bg-desperto-gold rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold">Serviço Selecionado</span>
          </div>
        </div>
      )}
    </div>
  );
}