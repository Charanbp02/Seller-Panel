import React, { useState, useEffect } from 'react';
import { FiChevronDown, FiChevronLeft, FiChevronRight, FiSearch, FiDownload, FiEye, FiEdit } from 'react-icons/fi';
import { CSVLink } from 'react-csv';
import { format } from 'date-fns';

const initialOrders = [
  { id: '#425482', date: '2020-09-05', name: 'Wade Warren', email: 'wadewarren@gmail.com', price: 523, status: 'Pending', items: [{ name: 'Product A', quantity: 2 }, { name: 'Product B', quantity: 1 }] },
  { id: '#425481', date: '2020-08-28', name: 'Jenny Wilson', email: 'jennyw7@gmail.com', price: 782, status: 'Delivered', items: [{ name: 'Product C', quantity: 3 }] },
  { id: '#425480', date: '2020-08-17', name: 'Kristin Watson', email: 'kristina@gmail.com', price: 325, status: 'Pending', items: [{ name: 'Product D', quantity: 1 }] },
  { id: '#425479', date: '2020-08-07', name: 'Kathryn Murphy', email: 'kathryn@gmail.com', price: 652, status: 'Delivered', items: [{ name: 'Product E', quantity: 4 }] },
  { id: '#425478', date: '2020-08-02', name: 'Albert Flores', email: 'albertflores@gmail.com', price: 854, status: 'Pending', items: [{ name: 'Product F', quantity: 2 }] },
  { id: '#425477', date: '2020-07-25', name: 'Ronald Richards', email: 'richards@gmail.com', price: 578, status: 'Delivered', items: [{ name: 'Product G', quantity: 1 }] },
  { id: '#425476', date: '2020-07-16', name: 'Floyd Miles', email: 'floydmiles@gmail.com', price: 365, status: 'Canceled', items: [{ name: 'Product H', quantity: 5 }] },
  { id: '#425475', date: '2020-07-13', name: 'Brooklyn Simmons', email: 'brooklyn@gmail.com', price: 896, status: 'Delivered', items: [{ name: 'Product I', quantity: 2 }] },
  { id: '#425474', date: '2020-07-12', name: 'Courtney Henry', email: 'courtney@gmail.com', price: 325, status: 'Delivered', items: [{ name: 'Product J', quantity: 3 }] },
  { id: '#425473', date: '2020-07-09', name: 'Jacob Jones', email: 'jacobjones@gmail.com', price: 474, status: 'Canceled', items: [{ name: 'Product K', quantity: 1 }] },
];

const statusConfig = {
  Pending: {
    color: 'bg-purple-100 text-purple-800',
    icon: '⏳',
    mobileColor: 'bg-purple-500'
  },
  Delivered: {
    color: 'bg-teal-100 text-teal-800',
    icon: '✓',
    mobileColor: 'bg-teal-500'
  },
  Canceled: {
    color: 'bg-rose-100 text-rose-800',
    icon: '✕',
    mobileColor: 'bg-rose-500'
  }
};

const OrdersTable = ({ isDarkMode }) => {
  const [orders, setOrders] = useState(initialOrders);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Simulate API fetch on mount
  useEffect(() => {
    setLoading(true);
    // Mock API call
    setTimeout(() => {
      setOrders(initialOrders);
      setLoading(false);
    }, 1000);
  }, []);

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Sort orders
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (sortConfig.key === 'date') {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
    } else if (sortConfig.key === 'price') {
      return sortConfig.direction === 'asc' ? a.price - b.price : b.price - a.price;
    }
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedOrders.length / rowsPerPage);
  const paginatedOrders = sortedOrders.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handlePrevious = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = window.innerWidth < 640 ? 3 : 5;
    
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    if (start > 1) pages.push(1);
    if (start > 2) pages.push('...');

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages - 1) pages.push('...');
    if (end < totalPages) pages.push(totalPages);

    return pages;
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const updateStatus = (id, newStatus) => {
    setOrders(orders.map(order => 
      order.id === id ? { ...order, status: newStatus } : order
    ));
  };

  const csvData = sortedOrders.map(order => ({
    'Order ID': order.id,
    Date: format(new Date(order.date), 'dd/MM/yyyy'),
    Customer: order.name,
    Email: order.email,
    Amount: `$${order.price}`,
    Status: order.status
  }));

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600 text-center py-4">{error}</div>;
  }

  return (
    <div className={`p-4 rounded-lg shadow-sm border border-gray-200 ${isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'}`}>
      {/* Header Section */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Order Management</h2>
        <p className="text-xs text-gray-500">{filteredOrders.length} orders found</p>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400 text-sm" />
          </div>
          <input
            type="text"
            placeholder="Search orders..."
            className={`pl-9 pr-3 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-800'}`}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <select
              className={`appearance-none pl-3 pr-8 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-800'}`}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Delivered">Delivered</option>
              <option value="Canceled">Canceled</option>
            </select>
            <FiChevronDown className="absolute right-2 top-2.5 text-gray-400 text-sm" />
          </div>
          
          <CSVLink
            data={csvData}
            filename="orders.csv"
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1 text-sm"
          >
            <FiDownload size={14} />
            <span>Export</span>
          </CSVLink>
        </div>
      </div>

      {/* Table - Desktop View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer" onClick={() => requestSort('id')}>Order ID</th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer" onClick={() => requestSort('date')}>Date {sortConfig.key === 'date' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">Customer</th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">Email</th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer" onClick={() => requestSort('price')}>Amount {sortConfig.key === 'price' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">Status</th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className={`divide-y divide-gray-200 dark:divide-gray-700 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            {paginatedOrders.map((order) => (
              <tr key={order.id} className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-blue-600">{order.id}</td>
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">{format(new Date(order.date), 'dd/MM/yyyy')}</td>
                <td className="px-3 py-3 whitespace-nowrap text-sm font-medium">{order.name}</td>
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">{order.email}</td>
                <td className="px-3 py-3 whitespace-nowrap text-sm font-medium">${order.price}</td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order.id, e.target.value)}
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${statusConfig[order.status].color} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Canceled">Canceled</option>
                  </select>
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm">
                  <button onClick={() => setSelectedOrder(order)} className="text-blue-600 hover:text-blue-800 mr-2">
                    <FiEye size={16} />
                  </button>
                  <button onClick={() => console.log('Edit order', order.id)} className="text-green-600 hover:text-green-800">
                    <FiEdit size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards View */}
      <div className="lg:hidden space-y-3">
        {paginatedOrders.map((order) => (
          <div key={order.id} className={`p-3 border rounded-lg shadow-xs ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-medium text-blue-600">{order.id}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{format(new Date(order.date), 'dd/MM/yyyy')}</p>
              </div>
              <select
                value={order.status}
                onChange={(e) => updateStatus(order.id, e.target.value)}
                className={`px-2 py-1 text-xs font-medium rounded-full text-white ${statusConfig[order.status].mobileColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <option value="Pending">Pending</option>
                <option value="Delivered">Delivered</option>
                <option value="Canceled">Canceled</option>
              </select>
            </div>
            
            <div className="mt-2">
              <p className="text-sm font-medium truncate">{order.name}</p>
              <p className="text-xs text-gray-500 truncate">{order.email}</p>
            </div>
            
            <div className="mt-2 flex justify-between items-center">
              <span className="text-sm font-medium">${order.price}</span>
              <button onClick={() => setSelectedOrder(order)} className="text-xs text-blue-600 hover:text-blue-800 touch-manipulation">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Order Details: {selectedOrder.id}</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100">
                <FiChevronRight size={20} className="rotate-180" />
              </button>
            </div>
            <p><strong>Date:</strong> {format(new Date(selectedOrder.date), 'dd/MM/yyyy')}</p>
            <p><strong>Customer:</strong> {selectedOrder.name}</p>
            <p><strong>Email:</strong> {selectedOrder.email}</p>
            <p><strong>Amount:</strong> ${selectedOrder.price}</p>
            <p><strong>Status:</strong> {selectedOrder.status}</p>
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Items:</h3>
              <ul className="space-y-1">
                {selectedOrder.items.map((item, index) => (
                  <li key={index} className="text-sm">{item.name} (Qty: {item.quantity})</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredOrders.length === 0 && (
        <div className="py-8 text-center">
          <FiSearch className="mx-auto text-2xl text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No orders found</h3>
          <p className="mt-1 text-xs text-gray-500">
            Try adjusting your search or filter criteria
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('All');
            }}
            className="mt-3 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg touch-manipulation"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Pagination */}
      {filteredOrders.length > 0 && (
        <div className="mt-4 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-700 dark:text-gray-300">Rows per page:</span>
            <select
              className={`border rounded px-2 py-1 text-xs focus:ring-blue-500 focus:border-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-800'}`}
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-700 dark:text-gray-300">
              {paginatedOrders.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}-
              {Math.min(currentPage * rowsPerPage, filteredOrders.length)} of {filteredOrders.length}
            </span>
            
            <nav className="flex gap-1">
              <button
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className={`p-2 rounded ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'} touch-manipulation`}
              >
                <FiChevronLeft size={16} />
              </button>
              
              {getPageNumbers().map((page, index) => (
                <button
                  key={index}
                  onClick={() => typeof page === 'number' && setCurrentPage(page)}
                  className={`w-8 h-8 rounded text-xs ${currentPage === page ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'} touch-manipulation`}
                  disabled={page === '...'}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className={`p-2 rounded ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'} touch-manipulation`}
              >
                <FiChevronRight size={16} />
              </button>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
};

const OrdersPage = ({ isDarkMode }) => {
  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-4">
          <h1 className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Orders Dashboard</h1>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Manage and track all customer orders</p>
        </div>
        <OrdersTable isDarkMode={isDarkMode} />
      </div>
    </div>
  );
};

export default OrdersPage;