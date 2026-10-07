// src/components/Layout/widgets/SidebarNav.jsx
import React from 'react';
import { ChevronRight } from 'lucide-react';
import { MENU_SECTIONS } from '../utils/layoutHelpers';

const SidebarNav = ({ activePageId, isMobile, onNavigate }) => (
  <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 md:px-4 py-4">
    {MENU_SECTIONS.map(section => (
      <div key={section.id} className="mb-4">
        {section.label && (
          <div className="px-3 py-1.5">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {section.label}
            </span>
          </div>
        )}
        <div className="space-y-1">
          {section.items.map(item => {
            const Icon = item.icon;
            const isActive = activePageId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.path)}
                className={`
                  w-full flex items-center px-3 md:px-4 py-2.5 md:py-3
                  rounded-lg transition-all duration-200
                  ${isActive
                    ? 'bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 font-medium shadow-sm border border-orange-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                  ${isMobile ? 'text-sm' : 'text-base'}
                `}
              >
                <Icon className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} mr-3 flex-shrink-0`} />
                <span className="truncate flex-1 text-left">{item.label}</span>

                {/* ⭐ Highlight badge for new/featured items */}
                {item.highlight && (
                  <span className="ml-2 text-yellow-500 text-sm" aria-label="Featured">⭐</span>
                )}

                {isActive && !item.highlight && (
                  <ChevronRight className="w-4 h-4 ml-auto text-orange-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    ))}
  </nav>
);

export default SidebarNav;