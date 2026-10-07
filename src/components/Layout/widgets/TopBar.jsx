// src/components/Layout/widgets/TopBar.jsx
import React from 'react';
import { Menu, Bell, ChevronDown } from 'lucide-react';
import UserDropdown from './UserDropdown';

const TopBar = ({
  onOpenSidebar,
  currentPageLabel,
  isMobile,
  userData, userInitials,
  showDropdown, setShowDropdown,
  onNavigate, onLogout
}) => (
  <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
    <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4">
      {/* Left Section */}
      <div className="flex items-center min-w-0 flex-1">
        <button
          onClick={onOpenSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 lg:hidden transition-colors flex-shrink-0"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
        </button>

        <div className="ml-3 md:ml-4 flex items-center min-w-0">
          <span className="hidden sm:inline text-sm text-gray-500">Pages</span>
          <span className="hidden sm:inline mx-2 text-gray-300">/</span>
          <h2 className="text-base md:text-xl font-semibold text-gray-800 truncate">
            {currentPageLabel}
          </h2>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
        <button
          onClick={() => onNavigate('/alerts')}
          className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center space-x-2 md:space-x-3 p-1.5 md:p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="User menu"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">
                {userData.name || 'Business Owner'}
              </p>
              <p className="text-xs text-gray-500">Admin</p>
            </div>
            <div className={`
              ${isMobile ? 'w-8 h-8' : 'w-9 h-9'}
              bg-gradient-to-br from-orange-500 to-orange-600
              rounded-full flex items-center justify-center
              text-white font-semibold flex-shrink-0
              shadow-md shadow-orange-200
            `}>
              {userInitials}
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500 hidden sm:block" />
          </button>

          <UserDropdown
            open={showDropdown}
            onClose={() => setShowDropdown(false)}
            userData={userData}
            onSettings={() => { onNavigate('/settings'); setShowDropdown(false); }}
            onLogout={onLogout}
          />
        </div>
      </div>
    </div>
  </header>
);

export default TopBar;