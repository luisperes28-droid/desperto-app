import React from 'react';
import { User, Clock, Star, MapPin } from 'lucide-react';

interface MobileTherapistCardProps {
  therapist: any;
  isSelected: boolean;
  onSelect: () => void;
}

export function MobileTherapistCard({ therapist, isSelected, onSelect }: MobileTherapistCardProps) {
  return (
    <div
      onClick={onSelect}
      className={`w-72 flex-shrink-0 p-6 border-2 rounded-2xl cursor-pointer transition-all hover:shadow-lg ${
        isSelected
          ? 'border-desperto-gold bg-desperto-cream shadow-xl scale-105'
          : 'border-gray-200 hover:border-desperto-gold/50 bg-white'
      }`}
      style={{ touchAction: 'manipulation' }}
    >
      {/* Therapist Image and Basic Info */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="relative">
          <img
            src={therapist.image}
            alt={therapist.name}
            className="w-16 h-16 rounded-full object-cover shadow-md"
          />
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-desperto-gold truncate">{therapist.name}</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Star className="w-4 h-4 text-yellow-500" />
            <span>4.9 • 127 avaliações</span>
          </div>
        </div>
      </div>

      {/* Bio */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
        {therapist.bio}
      </p>

      {/* Specialties */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Especialidades</p>
        <div className="flex flex-wrap gap-2">
          {therapist.specialties.slice(0, 3).map((specialty: string, index: number) => (
            <span
              key={index}
              className="px-3 py-1 bg-desperto-yellow/20 text-desperto-gold text-xs rounded-full font-medium border border-desperto-gold/20"
            >
              {specialty}
            </span>
          ))}
          {therapist.specialties.length > 3 && (
            <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
              +{therapist.specialties.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 text-blue-600 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-bold">60min</span>
          </div>
          <p className="text-xs text-gray-500">Duração típica</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 text-green-600 mb-1">
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-bold">Presencial</span>
          </div>
          <p className="text-xs text-gray-500">Modalidade</p>
        </div>
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="mt-4 p-3 bg-desperto-gold/10 border border-desperto-gold/30 rounded-xl">
          <div className="flex items-center justify-center space-x-2 text-desperto-gold">
            <div className="w-2 h-2 bg-desperto-gold rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold">Selecionado</span>
          </div>
        </div>
      )}
    </div>
  );
}