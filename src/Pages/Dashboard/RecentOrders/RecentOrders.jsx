import React, { useState, useEffect } from "react";
import { Search, ChevronDown, MoreVertical, Filter, RefreshCw, ArrowUpDown } from "lucide-react";

const initialOrders = [
  {
    id: 1,
    orderNo: "ORD-001",
    date: "2025-08-10",
    customerName: "John Doe",
    customerEmail: "john@example.com",
    items: 3,
    price: 2500,
    status: "Delivered",
    paymentMethod: "Credit Card",
    shippingAddress: "123 Main St, Bangalore, KA 560001",
  },
  {
    id: 2,
    orderNo: "ORD-002",
    date: "2025-08-09",
    customerName: "Jane Smith",
    customerEmail: "jane@example.com",
    items: 2,
    price: 1800,
    status: "Pending",
    paymentMethod: "UPI",
    shippingAddress: "456 Oak Ave, Mumbai, MH 400001",
  },
  {
    id: 3,
    orderNo: "ORD-003",
    date: "2025-08-08",
    customerName: "Alice Johnson",
    customerEmail: "alice@example.com",
    items: 5,
    price: 3200,
    status: "Delivered",
    paymentMethod: "Debit Card",
    shippingAddress: "789 Pine Rd, Delhi, DL 110001",
  },
  {
    id: 4,
    orderNo: "ORD-004",
    date: "2025-08-07",
    customerName: "Bob Wilson",
    customerEmail: "bob@example.com",
    items: 1,
    price: 1500,
    status: "Canceled",
    paymentMethod: "Net Banking",
    shippingAddress: "321 Elm Blvd, Hyderabad, TS 500001",
  },
  {
    id: 5,
    orderNo: "ORD-005",
    date: "2025-08-06",
    customerName: "Emma Brown",
    customerEmail: "emma@example.com",
    items: 4,
    price: 4500,
    status: "Pending",
    paymentMethod: "Wallet",
    shippingAddress: "654 Maple Ln, Chennai, TN 600001",
  },
];

const statusOptions = ["All", "Delivered", "Pending", "Canceled", "Shipped"];
const paymentOptions = ["All", "Credit Card", "Debit Card", "UPI", "Net Banking", "Wallet"];

const OrderRow = ({ order, expandedRow, toggleExpand }) => {
  return (
    <>
      <tr 
        key={order.id} 
        className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600/30 cursor-pointer"
        onClick={() => toggleExpand(order.id)}
      >
        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{order.orderNo}</td>
        <td className="px-4 py-3">{order.date}</td>
        <td className="px-4 py-3">
          <div className="flex flex-col">
            <span>{order.customerName}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{order.customerEmail}</span>
          </div>
        </td>
        <td className="px-4 py-3">₹{order.price.toLocaleString("en-IN")}</td>
        <td className="px-4 py-3">
          <span
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              order.status === "Delivered"
                ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                : order.status === "Pending"
                ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
                : order.status === "Shipped"
                ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
            }`}
          >
            {order.status}
          </span>
        </td>
        <td className="px-4 py-3 text-right">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand(order.id);
            }}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </td>
      </tr>
      
      {expandedRow === order.id && (
        <tr className="bg-gray-50 dark:bg-gray-700/30">
          <td colSpan="6" className="px-4 py-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Payment Method</p>
                <p className="text-gray-800 dark:text-white">{order.paymentMethod}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Items</p>
                <p className="text-gray-800 dark:text-white">{order.items}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Shipping Address</p>
                <p className="text-gray-800 dark:text-white">{order.shippingAddress}</p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default function RecentOrders() {
  const [orders, setOrders] = useState(initialOrders);
  const [expandedRow, setExpandedRow] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedPayment, setSelectedPayment] = useState("All");
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" });
  const [isLoading, setIsLoading] = useState(false);

  const toggleExpand = (orderId) => {
    setExpandedRow(expandedRow === orderId ? null : orderId);
  };

  const requestSort = (key) => {
    let direction = "desc";
    if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = "asc";
    }
    setSortConfig({ key, direction });
  };

  const refreshOrders = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const sortedOrders = React.useMemo(() => {
    let sortableOrders = [...orders];
    if (sortConfig.key) {
      sortableOrders.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableOrders;
  }, [orders, sortConfig]);

  const filteredOrders = React.useMemo(() => {
    return sortedOrders.filter((order) => {
      const matchesSearch =
        order.orderNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = selectedStatus === "All" || order.status === selectedStatus;
      const matchesPayment = selectedPayment === "All" || order.paymentMethod === selectedPayment;
      
      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [sortedOrders, searchTerm, selectedStatus, selectedPayment]);

  const getSortIndicator = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === "asc" ? "↑" : "↓";
    }
    return <ArrowUpDown className="w-3 h-3 ml-1 inline-block opacity-50" />;
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Recent Orders</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {filteredOrders.length} orders found
          </p>
        </div>
        
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              className="pl-10 pr-4 py-2 w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button 
            onClick={refreshOrders}
            disabled={isLoading}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700"
            title="Refresh orders"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="appearance-none bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={selectedPayment}
            onChange={(e) => setSelectedPayment(e.target.value)}
            className="appearance-none bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {paymentOptions.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th 
                scope="col" 
                className="px-4 py-3 cursor-pointer"
                onClick={() => requestSort("orderNo")}
              >
                <div className="flex items-center">
                  Order No
                  {getSortIndicator("orderNo")}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-4 py-3 cursor-pointer"
                onClick={() => requestSort("date")}
              >
                <div className="flex items-center">
                  Date
                  {getSortIndicator("date")}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-4 py-3 cursor-pointer"
                onClick={() => requestSort("customerName")}
              >
                <div className="flex items-center">
                  Customer
                  {getSortIndicator("customerName")}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-4 py-3 cursor-pointer"
                onClick={() => requestSort("price")}
              >
                <div className="flex items-center">
                  Price
                  {getSortIndicator("price")}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-4 py-3 cursor-pointer"
                onClick={() => requestSort("status")}
              >
                <div className="flex items-center">
                  Status
                  {getSortIndicator("status")}
                </div>
              </th>
              <th scope="col" className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <OrderRow
                  key={order.id}
                  order={order}
                  expandedRow={expandedRow}
                  toggleExpand={toggleExpand}
                />
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  No orders found matching your criteria
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Showing {filteredOrders.length} of {orders.length} orders
        </p>
        <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium">
          View All Orders
        </button>
      </div>
    </div>
  );
}