// src/components/Layout/widgets/Sidebar.jsx
import React from 'react';
import SidebarHeader from './SidebarHeader';
import SidebarNav from './SidebarNav';
import SidebarUserFooter from './SidebarUserFooter';

const Sidebar = ({
  open, onClose, isMobile,
  activePageId, onNavigate,
  userData, userInitials, onLogout
}) => {
  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50
        w-72 md:w-80
        bg-white shadow-2xl
        transform transition-all duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto lg:shadow-xl
        flex flex-col
      `}
    >
      <SidebarHeader onClose={onClose} />
      <SidebarNav
        activePageId={activePageId}
        isMobile={isMobile}
        onNavigate={onNavigate}
      />
      <SidebarUserFooter
        userData={userData}
        userInitials={userInitials}
        isMobile={isMobile}
        onLogout={onLogout}
      />
    </aside>
  );
};

export default Sidebar;