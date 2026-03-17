import React from 'react';
import { Search } from 'lucide-react';

export function HeaderSearch() {
  return (
    <div className="relative hidden md:block">
      <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
      <input
        type="text"
        placeholder="Pesquisar..."
        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48"
      />
    </div>
  );
}