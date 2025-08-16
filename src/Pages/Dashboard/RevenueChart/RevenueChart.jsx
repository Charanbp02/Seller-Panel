import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { ChevronDown, RefreshCw, Info, Filter } from "lucide-react";

const generateData = () => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const baseValues = [50000, 58000, 53000, 62000, 49000, 56000, 63000, 62742, 54000, 60000, 57000, 59000];
  
  return months.map((month, index) => ({
    month,
    thisYear: baseValues[index] + Math.floor(Math.random() * 5000) - 2000,
    lastYear: baseValues[index] * 0.8 + Math.floor(Math.random() * 4000) - 1500,
    target: baseValues[index] * 1.1,
  }));
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const isAboveTarget = payload[0]?.payload?.thisYear > payload[0]?.payload?.target;
    
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="font-medium text-gray-900 dark:text-white">{label}</p>
        <div className="space-y-1 mt-2">
          {payload.map((entry, index) => (
            <div key={`tooltip-${index}`} className="flex items-center">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600 dark:text-gray-300 mr-2">
                {entry.name}:
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                ₹{entry.value.toLocaleString()}
              </span>
              {entry.dataKey === "thisYear" && (
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                  isAboveTarget 
                    ? "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200" 
                    : "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200"
                }`}>
                  {isAboveTarget ? "↑ Above target" : "↓ Below target"}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function RevenueChart() {
  const [data, setData] = useState(generateData());
  const [timeRange, setTimeRange] = useState("This Year");
  const [isLoading, setIsLoading] = useState(false);
  const [showTarget, setShowTarget] = useState(true);
  const [showLastYear, setShowLastYear] = useState(true);
  const [activeFilter, setActiveFilter] = useState(null);

  const totalThisYear = data.reduce((sum, item) => sum + item.thisYear, 0);
  const totalLastYear = data.reduce((sum, item) => sum + item.lastYear, 0);
  const percentageChange = ((totalThisYear - totalLastYear) / totalLastYear) * 100;
  const targetAchievement = (totalThisYear / data.reduce((sum, item) => sum + item.target, 0)) * 100;

  const refreshData = () => {
    setIsLoading(true);
    setTimeout(() => {
      setData(generateData());
      setIsLoading(false);
    }, 800);
  };

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    // In a real app, you would fetch data based on the selected range
    refreshData();
  };

  const filteredData = timeRange === "Last Year" 
    ? data.map(({ month, lastYear }) => ({ month, thisYear: lastYear }))
    : timeRange === "This Year" 
      ? data.map(({ month, thisYear, target }) => ({ month, thisYear, ...(showTarget && { target }) }))
      : data.slice(0, 6); // For "Last 6 Months" option

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-full">
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
              Revenue Overview
            </h4>
            <button 
              className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              onClick={() => setActiveFilter(activeFilter === 'info' ? null : 'info')}
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Monthly revenue comparison (2023 vs 2022)
          </p>
          
          {activeFilter === 'info' && (
            <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm">
              This chart shows your revenue trends. Hover over data points for detailed values.
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={refreshData}
            disabled={isLoading}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          
          <div className="relative">
            <select 
              value={timeRange}
              onChange={(e) => handleTimeRangeChange(e.target.value)}
              className="appearance-none bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg px-3 py-1.5 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              <option value="This Year">This Year</option>
              <option value="Last Year">Last Year</option>
              <option value="Last 6 Months">Last 6 Months</option>
              <option value="Custom Range">Custom Range</option>
            </select>
            <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-300 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="mr-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">
            ₹{totalThisYear.toLocaleString()}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div
            className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              percentageChange >= 0
                ? "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                : "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
            }`}
          >
            {percentageChange >= 0 ? (
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 15l7-7 7 7"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            )}
            {Math.abs(percentageChange).toFixed(1)}%
          </div>
          
          <div
            className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              targetAchievement >= 100
                ? "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                : "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"
            }`}
          >
            <span>Target: {targetAchievement.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowLastYear(!showLastYear)}
            className={`flex items-center text-sm px-3 py-1 rounded-lg ${
              showLastYear
                ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            }`}
          >
            <div className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></div>
            Last Year
          </button>
          <button
            onClick={() => setShowTarget(!showTarget)}
            className={`flex items-center text-sm px-3 py-1 rounded-lg ${
              showTarget
                ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            }`}
          >
            <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
            Target
          </button>
        </div>
        
        <button 
          onClick={() => setActiveFilter(activeFilter === 'settings' ? null : 'settings')}
          className="flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <Filter className="w-4 h-4 mr-1" />
          Filters
        </button>
      </div>

      {activeFilter === 'settings' && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Chart Type
              </label>
              <select className="w-full bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-md px-3 py-2 text-sm">
                <option>Line Chart</option>
                <option>Area Chart</option>
                <option>Bar Chart</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data Granularity
              </label>
              <select className="w-full bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-md px-3 py-2 text-sm">
                <option>Monthly</option>
                <option>Quarterly</option>
                <option>Weekly</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={filteredData}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#eee"
              strokeOpacity={0.5}
            />
            <XAxis
              dataKey="month"
              tick={{ fill: "#6b7280", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickMargin={10}
            />
            <YAxis
              tick={{ fill: "#6b7280", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `₹${value / 1000}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{
                paddingTop: "20px",
                fontSize: "12px",
              }}
            />
            <Line
              type="monotone"
              dataKey="thisYear"
              stroke="#4f46e5"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="This Year"
            />
            {showLastYear && (
              <Line
                type="monotone"
                dataKey="lastYear"
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Last Year"
              />
            )}
            {showTarget && (
              <ReferenceLine
                y={data[0]?.target}
                stroke="#8b5cf6"
                strokeWidth={2}
                strokeDasharray="3 3"
                label={{
                  value: "Target",
                  position: "right",
                  fill: "#8b5cf6",
                  fontSize: 12,
                }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-between mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-indigo-600 mr-2"></div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">This Year</p>
            <p className="font-medium text-gray-800 dark:text-white">
              ₹{totalThisYear.toLocaleString()}
            </p>
          </div>
        </div>
        {showLastYear && (
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Last Year</p>
              <p className="font-medium text-gray-800 dark:text-white">
                ₹{totalLastYear.toLocaleString()}
              </p>
            </div>
          </div>
        )}
        {showTarget && (
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Target</p>
              <p className="font-medium text-gray-800 dark:text-white">
                ₹{data.reduce((sum, item) => sum + item.target, 0).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}