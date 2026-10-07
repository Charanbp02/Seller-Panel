// src/components/Layout/Layout.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/firebaseConfig';

import {
  getUserData, getUserInitials, getActivePageId, getCurrentPageLabel
} from './utils/layoutHelpers';

import Sidebar from './widgets/Sidebar';
import TopBar from './widgets/TopBar';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // ---------- Responsive ----------
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      if (width >= 1024) setSidebarOpen(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on route change (mobile only)
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile]);

  // Close user dropdown on route change
  useEffect(() => {
    setShowDropdown(false);
  }, [location.pathname]);

  // ---------- User ----------
  const userData = useMemo(() => getUserData(), []);
  const userInitials = useMemo(() => getUserInitials(userData), [userData]);

  // ---------- Derived ----------
  const activePageId = getActivePageId(location.pathname);
  const currentPageLabel = getCurrentPageLabel(location.pathname);

  // ---------- Actions ----------
  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) setSidebarOpen(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('businessUser');
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isMobile={isMobile}
        activePageId={activePageId}
        onNavigate={handleNavigation}
        userData={userData}
        userInitials={userInitials}
        onLogout={handleLogout}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <TopBar
          onOpenSidebar={() => setSidebarOpen(true)}
          currentPageLabel={currentPageLabel}
          isMobile={isMobile}
          userData={userData}
          userInitials={userInitials}
          showDropdown={showDropdown}
          setShowDropdown={setShowDropdown}
          onNavigate={handleNavigation}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto bg-gray-50 p-3 md:p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;