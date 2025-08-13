// RevenueChart.jsx
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { ChevronDown } from "lucide-react";

const data = [
  { month: "Jan", thisYear: 50000, lastYear: 45000 },
  { month: "Feb", thisYear: 58000, lastYear: 40000 },
  { month: "Mar", thisYear: 53000, lastYear: 38000 },
  { month: "Apr", thisYear: 62000, lastYear: 42000 },
  { month: "May", thisYear: 49000, lastYear: 39000 },
  { month: "Jun", thisYear: 56000, lastYear: 43000 },
  { month: "Jul", thisYear: 63000, lastYear: 47000 },
  { month: "Aug", thisYear: 62742, lastYear: 47832 },
  { month: "Sep", thisYear: 54000, lastYear: 42000 },
  { month: "Oct", thisYear: 60000, lastYear: 43000 },
  { month: "Nov", thisYear: 57000, lastYear: 41000 },
  { month: "Dec", thisYear: 59000, lastYear: 44000 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
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
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function RevenueChart() {
  const totalThisYear = data.reduce((sum, item) => sum + item.thisYear, 0);
  const totalLastYear = data.reduce((sum, item) => sum + item.lastYear, 0);
  const percentageChange = ((totalThisYear - totalLastYear) / totalLastYear) * 100;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-full">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
            Revenue Overview
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Monthly revenue comparison (2023 vs 2022)
          </p>
        </div>
        <div className="relative">
          <select className="appearance-none bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg px-3 py-1.5 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
            <option>This Year</option>
            <option>Last Year</option>
            <option>Custom Range</option>
          </select>
          <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-300 pointer-events-none" />
        </div>
      </div>

      <div className="flex items-center mb-6">
        <div className="mr-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">
            ₹{totalThisYear.toLocaleString()}
          </p>
        </div>
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
      </div>

      <div className="flex-1">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={data}
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
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              name="This Year"
            />
            <Line
              type="monotone"
              dataKey="lastYear"
              stroke="#10b981"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              name="Last Year"
            />
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
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Last Year</p>
            <p className="font-medium text-gray-800 dark:text-white">
              ₹{totalLastYear.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}