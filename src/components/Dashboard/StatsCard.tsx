import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

export function StatsCard({ title, value, change, changeType, icon: Icon, color }: StatsCardProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-desperto-gold to-primary-600'
  };

  const changeClasses = {
    positive: 'text-green-600 bg-green-50',
    negative: 'text-red-600 bg-red-50',
    neutral: 'text-gray-600 bg-gray-50'
  };

  return (
    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div className="min-w-0 flex-1">
          <p className="text-gray-600 text-xs sm:text-sm font-medium break-words">{title}</p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mt-1 sm:mt-2 break-all">{value}</p>
          <div className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 sm:mt-2 break-words ${changeClasses[changeType]}`}>
            {change}
          </div>
        </div>
        <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br ${colorClasses[color]} rounded-lg flex items-center justify-center flex-shrink-0 self-center sm:self-auto`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
        </div>
      </div>
    </div>
  );
}