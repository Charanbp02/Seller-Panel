import React from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown, 
  LineChart
} from "lucide-react";

const quickMetrics = [
  {
    title: "Total Revenue",
    value: "₹25,400",
    trend: "up",
    icon: TrendingUp,
    iconColor: "text-emerald-500",
    iconBgColor: "bg-emerald-50 dark:bg-emerald-900/30",
    color: "#10b981",
  },
  {
    title: "Today's Orders",
    value: "342",
    trend: "down",
    icon: TrendingDown,
    iconColor: "text-rose-500",
    iconBgColor: "bg-rose-50 dark:bg-rose-900/30",
    color: "#f43f5e",
  },
  {
    title: "Total Products",
    value: "1,028",
    trend: "flat",
    icon: LineChart,
    iconColor: "text-blue-500",
    iconBgColor: "bg-blue-50 dark:bg-blue-900/30",
    color: "#3b82f6",
  },
  {
    title: "Today's Visitors",
    value: "15,800",
    trend: "up",
    icon: TrendingUp,
    iconColor: "text-indigo-500",
    iconBgColor: "bg-indigo-50 dark:bg-indigo-900/30",
    color: "#6366f1",
  },
];

const QuickMetricsSection = ({ isDarkMode = false }) => {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {quickMetrics.map((metric, index) => (
        <motion.div
          key={metric.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          whileHover={{ y: -2 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all p-6 flex flex-col border border-gray-100 dark:border-gray-700"
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 tracking-wide">
              {metric.title}
            </h3>
            <div className={`p-2 rounded-lg ${metric.iconBgColor}`}>
              <metric.icon className={`w-5 h-5 ${metric.iconColor}`} />
            </div>
          </div>

          <div className="mb-6">
            <p className="text-2xl font-semibold text-gray-800 dark:text-white">
              {metric.value}
            </p>
          </div>

          <div className="mt-auto h-16 w-full relative">
            <div className="absolute inset-0 flex items-end">
              {metric.trend === 'up' ? (
                <svg viewBox="0 0 100 40" className="w-full h-full" preserveAspectRatio="none">
                  <path 
                    d="M0,30 C15,10 25,15 40,20 S70,5 100,15 L100,40 L0,40 Z" 
                    fill={metric.color} 
                    fillOpacity={isDarkMode ? 0.2 : 0.1}
                  />
                  <path 
                    d="M0,30 C15,10 25,15 40,20 S70,5 100,15" 
                    stroke={metric.color} 
                    strokeWidth="2" 
                    fill="none" 
                    strokeLinecap="round"
                  />
                  <g transform="translate(85, 10)">
                    <path 
                      d="M5,0 L0,5 L2.5,5 L2.5,10 L7.5,10 L7.5,5 L10,5 Z" 
                      fill={metric.color}
                    />
                  </g>
                </svg>
              ) : metric.trend === 'down' ? (
                <svg viewBox="0 0 100 40" className="w-full h-full" preserveAspectRatio="none">
                  <path 
                    d="M0,15 C20,25 35,10 50,25 S75,35 100,10 L100,40 L0,40 Z" 
                    fill={metric.color} 
                    fillOpacity={isDarkMode ? 0.2 : 0.1}
                  />
                  <path 
                    d="M0,15 C20,25 35,10 50,25 S75,35 100,10" 
                    stroke={metric.color} 
                    strokeWidth="2" 
                    fill="none" 
                    strokeLinecap="round"
                  />
                  <g transform="translate(85, 25)">
                    <path 
                      d="M5,10 L0,5 L2.5,5 L2.5,0 L7.5,0 L7.5,5 L10,5 Z" 
                      fill={metric.color}
                    />
                  </g>
                </svg>
              ) : (
                <svg viewBox="0 0 100 40" className="w-full h-full" preserveAspectRatio="none">
                  <path 
                    d="M0,25 L30,25 C35,25 35,20 40,20 C45,20 45,25 50,25 C55,25 55,20 60,20 C65,20 65,25 70,25 L100,25 L100,40 L0,40 Z" 
                    fill={metric.color} 
                    fillOpacity={isDarkMode ? 0.2 : 0.1}
                  />
                  <path 
                    d="M0,25 L30,25 C35,25 35,20 40,20 C45,20 45,25 50,25 C55,25 55,20 60,20 C65,20 65,25 70,25 L100,25" 
                    stroke={metric.color} 
                    strokeWidth="2" 
                    fill="none" 
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </section>
  );
};

export default QuickMetricsSection;