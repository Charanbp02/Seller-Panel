// Register Chart.js components
import ChartJS from 'chart.js/auto';
import { ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
import { useState, useEffect } from 'react';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import QuickMetrics from './QuickMetrics/QuickMetrics';
import RevenueChart from './RevenueChart/RevenueChart';
import TopProducts from './TopProducts/TopProducts';
import ProductStatusChart from './ProductStatusChart/ProductStatusChart';
import RecentOrders from './RecentOrders/RecentOrders';

ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const Dashboard = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [dateRange, setDateRange] = useState("This Month");
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowSize.width < 768;
  const isTablet = windowSize.width >= 768 && windowSize.width < 1024;

  // Toggle dark mode
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  // Initialize tooltips
  useEffect(() => {
    tippy("[data-tippy-content]", {
      theme: isDarkMode ? "dark" : "light",
      placement: isMobile ? "bottom" : isTablet ? "top-start" : "top",
      touch: true,
      animation: "shift-away",
      hideOnClick: false,
      maxWidth: isMobile ? 200 : 300,
    });
  }, [isDarkMode, isMobile, isTablet]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">Dashboard</h1>
      <div className="container mx-auto sm:p-6 bg-gray-50 dark:bg-gray-900 font-sans transition-colors duration-300">
        <div className='grid grid-cols-1 lg:grid-cols-1 gap-6'>
          <QuickMetrics isDarkMode={isDarkMode} />
          <RevenueChart isDarkMode={isDarkMode} />
          <TopProducts isDarkMode={isDarkMode} />
          <ProductStatusChart isDarkMode={isDarkMode} />
          <RecentOrders isDarkMode={isDarkMode} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;