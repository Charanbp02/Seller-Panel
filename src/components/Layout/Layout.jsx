import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingCart,
  PackageCheck,
  LayoutGrid,
  Users,
  Settings,
  ChevronDown,
  ChevronRight,
  Search,
  Bell,
  Menu,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import OrdersPage from '../../Pages/Orders/Orders';
import Dashboard from '../../Pages/Dashboard/Dashboard';
import ProductsTable from '../../Pages/Products/Products';
import AddProductPage from '../../Pages/AddProductPage/AddProductPage';
import CustomersPage from '../../Pages/Customers/Customers';
import SellerSettingsPage from '../../Pages/Settings/Settings';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Theme persistence
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        setIsDarkMode(savedTheme === 'dark');
      } else {
        localStorage.setItem('theme', 'light');
      }
    } catch (e) {
      console.warn('localStorage is not available:', e);
      setIsDarkMode(false);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    try {
      localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    } catch (e) {
      console.warn('Could not save theme to localStorage:', e);
    }
  }, [isDarkMode]);

  // Sidebar state persistence
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        const savedSidebarState = localStorage.getItem('sidebarOpen');
        setIsSidebarOpen(savedSidebarState ? JSON.parse(savedSidebarState) : true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (window.innerWidth >= 1024) {
      try {
        localStorage.setItem('sidebarOpen', JSON.stringify(isSidebarOpen));
      } catch (e) {
        console.warn('Could not save sidebar state to localStorage:', e);
      }
    }
  }, [isSidebarOpen]);

  // Sync active menu with current route
  useEffect(() => {
    const pathToMenu = {
      '/': 'Dashboard',
      '/orders': 'Orders',
      '/products': 'Products',
      '/add-product': 'Products',
      '/customers': 'Customers',
      '/settings': 'Settings',
    };
    const currentMenu = pathToMenu[location.pathname] || 'Dashboard';
    setActiveMenu(currentMenu);
  }, [location.pathname]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  const toggleProfileMenu = () => setShowProfileMenu(!showProfileMenu);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Mock search logic
    const searchResults = {
      products: ['Mens T-Shirt', 'Womens Jacket'].filter(item => item.toLowerCase().includes(searchQuery.toLowerCase())),
      orders: ['Order #1234', 'Order #5678'].filter(item => item.toLowerCase().includes(searchQuery.toLowerCase())),
      customers: ['John Doe', 'Jane Smith'].filter(item => item.toLowerCase().includes(searchQuery.toLowerCase())),
    };

    // Navigate based on the first match
    if (searchResults.products.length > 0) {
      navigate('/products');
    } else if (searchResults.orders.length > 0) {
      navigate('/orders');
    } else if (searchResults.customers.length > 0) {
      navigate('/customers');
    }
    setSearchQuery('');
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const menuItems = [
    { icon: <LayoutGrid size={18} />, label: 'Dashboard', path: '/' },
    { icon: <ShoppingCart size={18} />, label: 'Orders', path: '/orders', badge: 5 },
    { icon: <PackageCheck size={18} />, label: 'Products', path: '/products' },
    { icon: <Users size={18} />, label: 'Customers', path: '/customers' },
    { icon: <Settings size={18} />, label: 'Settings', path: '/settings' },
  ];

  const handleMenuItemClick = (path, label) => {
    navigate(path);
    setActiveMenu(label);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const SidebarItem = ({ icon, label, badge, active, path }) => {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`relative flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
          active
            ? 'bg-blue-100/80 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
            : 'text-gray-600 dark:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-gray-700/80'
        }`}
        onClick={() => handleMenuItemClick(path, label)}
        role="button"
        aria-label={`Navigate to ${label}`}
      >
        <div className="flex items-center space-x-3">
          <span className={active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-300'}>{icon}</span>
          <motion.span
            animate={{ opacity: isSidebarOpen ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            className="font-semibold text-sm"
          >
            {label}
          </motion.span>
        </div>
        {badge && isSidebarOpen && (
          <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
            {badge}
          </span>
        )}
      </motion.div>
    );
  };

  return (
    <div className={`flex h-screen ${isDarkMode ? 'dark bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-gray-50 to-gray-100'} font-sans transition-colors duration-500 overflow-hidden`}>
      {/* Sidebar */}
      <motion.aside
        initial={{ x: isSidebarOpen ? 0 : -280 }}
        animate={{ x: isSidebarOpen ? 0 : -280 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={`fixed lg:static top-0 left-0 h-full w-64 lg:w-72 bg-white dark:bg-gray-800/90 backdrop-blur-md shadow-xl p-4 lg:p-6 flex flex-col z-50 ${isSidebarOpen ? 'shadow-lg' : ''}`}
      >
        <div className="flex items-center justify-between mb-6">
          <motion.h1
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="text-2xl lg:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 px-2"
          >
            Big Bazzar
          </motion.h1>
          <button
            onClick={toggleSidebar}
            className="text-gray-500 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors lg:hidden"
            aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <ChevronRight size={24} className={`${isSidebarOpen ? 'rotate-180' : ''} transition-transform`} />
          </button>
        </div>
        <nav className="space-y-1 flex-1">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              badge={item.badge}
              active={activeMenu === item.label}
              path={item.path}
            />
          ))}
        </nav>
        <motion.div
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700"
        >
          <button
            onClick={toggleProfileMenu}
            className="flex items-center w-full space-x-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/80 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            aria-label="Toggle profile menu"
          >
            <img
              src="https://i.pravatar.cc/40"
              alt="User avatar"
              className="w-10 h-10 rounded-full border-2 border-blue-300 dark:border-blue-500"
            />
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Ismail Hossain</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Admin</p>
            </div>
            <ChevronDown size={18} className="text-gray-400 dark:text-gray-300" />
          </button>
          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="mt-2 bg-gray-50 dark:bg-gray-700/80 rounded-xl shadow-lg p-2"
              >
                <button
                  onClick={() => navigate('/settings')}
                  className="flex items-center w-full p-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg"
                  aria-label="Go to settings"
                >
                  <Settings size={16} className="mr-2" /> Settings
                </button>
                <button
                  onClick={() => {
                    console.log('Logging out...');
                    navigate('/login');
                  }}
                  className="flex items-center w-full p-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg"
                  aria-label="Log out"
                >
                  <LogOut size={16} className="mr-2" /> Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-sm p-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleSidebar}
              className="lg:hidden text-gray-500 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
              aria-label="Toggle sidebar"
            >
              <Menu size={24} />
            </button>
            <form onSubmit={handleSearch} className="relative w-full max-w-xs sm:max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300" />
              <input
                type="text"
                placeholder="Search products, orders, customers..."
                className="border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-100 transition-shadow placeholder-gray-400 dark:placeholder-gray-300 text-sm sm:text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search"
              />
            </form>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={toggleDarkMode}
              className="relative p-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </motion.button>
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.1 }}
                className="relative p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                aria-label="Notifications"
              >
                <Bell size={18} />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center">
                  2
                </span>
              </motion.button>
            </div>
            <div className="hidden sm:flex items-center space-x-2">
              <img
                src="https://i.pravatar.cc/40"
                alt="User avatar"
                className="w-8 sm:w-10 h-8 sm:h-10 rounded-full border-2 border-blue-300 dark:border-blue-500"
              />
              <div className="text-right">
                <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Ismail Hossain</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-2 sm:p-6 lg:p-10 overflow-auto bg-gray-50/50 dark:bg-gray-900/50">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-7xl mx-auto"
          >
            <Routes>
              <Route path="/" element={<Dashboard isDarkMode={isDarkMode} />} />
              <Route path="/orders" element={<OrdersPage isDarkMode={isDarkMode} />} />
              <Route path="/products" element={<ProductsTable isDarkMode={isDarkMode} />} />
              <Route path="/add-product" element={<AddProductPage isDarkMode={isDarkMode} />} />
              <Route path="/customers" element={<CustomersPage isDarkMode={isDarkMode} />} />
              <Route path="/settings" element={<SellerSettingsPage isDarkMode={isDarkMode} />} />
            </Routes>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Layout;