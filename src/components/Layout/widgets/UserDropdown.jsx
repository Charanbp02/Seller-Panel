// src/components/Layout/widgets/UserDropdown.jsx
import React from 'react';
import { Settings, LogOut } from 'lucide-react';

const UserDropdown = ({ open, onClose, userData, onSettings, onLogout }) => {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} aria-hidden="true" />
      <div className="
        absolute right-0 mt-2
        w-56 md:w-64
        bg-white rounded-xl shadow-2xl
        border border-gray-200
        py-2 z-20
        transform transition-all duration-200
        scale-100 opacity-100
      ">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-900">
            {userData.name || 'Business Owner'}
          </p>
          <p className="text-xs text-gray-500 truncate">{userData.email}</p>
        </div>

        <button
          onClick={onSettings}
          className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Settings className="w-4 h-4 mr-3" /> Settings
        </button>

        <div className="border-t border-gray-200 my-1"></div>

        <button
          onClick={onLogout}
          className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-medium transition-colors"
        >
          <LogOut className="w-4 h-4 mr-3" /> Logout
        </button>
      </div>
    </>
  );
};

export default UserDropdown;