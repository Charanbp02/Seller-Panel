import React from "react";

const orders = [
  {
    orderNo: "ORD-001",
    date: "2025-08-10",
    customerName: "John Doe",
    price: 2500,
    status: "Delivered",
  },
  {
    orderNo: "ORD-002",
    date: "2025-08-09",
    customerName: "Jane Smith",
    price: 1800,
    status: "Pending",
  },
  {
    orderNo: "ORD-003",
    date: "2025-08-08",
    customerName: "Alice Johnson",
    price: 3200,
    status: "Delivered",
  },
  {
    orderNo: "ORD-004",
    date: "2025-08-07",
    customerName: "Bob Wilson",
    price: 1500,
    status: "Canceled",
  },
  {
    orderNo: "ORD-005",
    date: "2025-08-06",
    customerName: "Emma Brown",
    price: 4500,
    status: "Pending",
  },
];

export default function RecentOrders() {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Recent Orders</h2>
        <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
          View All
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-4 py-3">Order No</th>
              <th scope="col" className="px-4 py-3">Date</th>
              <th scope="col" className="px-4 py-3">Customer</th>
              <th scope="col" className="px-4 py-3">Price</th>
              <th scope="col" className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.orderNo} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{order.orderNo}</td>
                <td className="px-4 py-3">{order.date}</td>
                <td className="px-4 py-3">{order.customerName}</td>
                <td className="px-4 py-3">₹{order.price.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      order.status === "Delivered"
                        ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                        : order.status === "Pending"
                        ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
                        : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}