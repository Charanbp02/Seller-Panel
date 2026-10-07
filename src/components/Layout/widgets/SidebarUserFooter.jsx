// src/components/Layout/widgets/SidebarUserFooter.jsx
import React from 'react';
import { LogOut } from 'lucide-react';

const SidebarUserFooter = ({ userData, userInitials, isMobile, onLogout }) => (
  <div className="border-t border-gray-200 bg-gray-50 p-4 md:p-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3 min-w-0">
        <div className={`
          ${isMobile ? 'w-8 h-8' : 'w-10 h-10'}
          bg-gradient-to-br from-orange-500 to-orange-600
          rounded-full flex items-center justify-center
          text-white font-semibold flex-shrink-0
          shadow-lg shadow-orange-200
        `}>
          {userInitials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {userData.name || 'Business Owner'}
          </p>
          <p className="text-xs text-gray-500 truncate">{userData.email}</p>
        </div>
      </div>
      <button
        onClick={onLogout}
        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
        aria-label="Logout"
      >
        <LogOut className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
      </button>
    </div>
  </div>
);

export default SidebarUserFooter;