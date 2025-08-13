import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const orderData = [
  { name: "Pending", value: 150, description: "Orders awaiting payment or processing" },
  { name: "Delivered", value: 300, description: "Orders successfully delivered to customers" },
  { name: "Canceled", value: 50, description: "Orders canceled by customer or admin" },
];

const COLORS = ["#f59e0b", "#10b981", "#ef4444"]; // Amber for Pending, Green for Delivered, Red for Canceled

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="font-medium text-gray-900 dark:text-white">{data.name}</p>
        <p className="text-sm text-gray-600 dark:text-gray-300">{data.description}</p>
        <p className="font-semibold text-gray-900 dark:text-white">
          {data.value} orders ({((data.value / orderData.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%)
        </p>
      </div>
    );
  }
  return null;
};

export default function ProductStatusChart() {
  const totalOrders = orderData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Order Status Overview</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Distribution of orders by status: Pending, Delivered, and Canceled
      </p>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={orderData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
              labelLine={false}
            >
              {orderData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value, entry) => (
                <span className="text-gray-800 dark:text-white">{value}</span>
              )}
              wrapperStyle={{ paddingTop: "20px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400">Total Orders</p>
        <p className="text-2xl font-bold text-gray-800 dark:text-white">{totalOrders}</p>
      </div>
    </div>
  );
}