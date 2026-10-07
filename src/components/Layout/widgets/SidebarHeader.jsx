// src/components/Layout/widgets/SidebarHeader.jsx
import React from 'react';
import { X } from 'lucide-react';

const SidebarHeader = ({ onClose }) => (
  <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
    <div className="flex items-center space-x-3">
      <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
        <span className="text-white font-bold text-xl md:text-2xl">R</span>
      </div>
      <div>
        <h1 className="text-lg md:text-xl font-bold text-gray-900">Racha Ruchi</h1>
        <p className="text-xs text-orange-600 font-medium">Business Admin</p>
      </div>
    </div>
    <button
      onClick={onClose}
      className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
      aria-label="Close menu"
    >
      <X className="w-6 h-6 text-gray-600" />
    </button>
  </div>
);

export default SidebarHeader;