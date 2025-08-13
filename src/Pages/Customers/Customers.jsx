import React, { useState, useEffect } from 'react';
import { 
  FiChevronDown, 
  FiChevronLeft, 
  FiChevronRight, 
  FiSearch, 
  FiPlus, 
  FiEye, 
  FiEdit, 
  FiMail, 
  FiPhone, 
  FiUser, 
  FiX, 
  FiSave 
} from 'react-icons/fi';
import { CSVLink } from 'react-csv';

const initialCustomers = [
  { 
    id: 1, 
    name: 'John Smith', 
    email: 'john.smith@example.com', 
    phone: '(555) 123-4567', 
    orders: 12, 
    spent: 2840, 
    joined: '2023-01-15',
    status: 'Active',
    location: 'New York, USA'
  },
  { 
    id: 2, 
    name: 'Sarah Johnson', 
    email: 'sarah.j@example.com', 
    phone: '(555) 987-6543', 
    orders: 8, 
    spent: 1750, 
    joined: '2023-03-22',
    status: 'Active',
    location: 'Los Angeles, USA'
  },
  { 
    id: 3, 
    name: 'Michael Brown', 
    email: 'michael.b@example.com', 
    phone: '(555) 456-7890', 
    orders: 5, 
    spent: 920, 
    joined: '2023-05-10',
    status: 'Active',
    location: 'Chicago, USA'
  },
  { 
    id: 4, 
    name: 'Emily Davis', 
    email: 'emily.d@example.com', 
    phone: '(555) 789-0123', 
    orders: 3, 
    spent: 450, 
    joined: '2023-07-18',
    status: 'Inactive',
    location: 'Houston, USA'
  },
  { 
    id: 5, 
    name: 'David Wilson', 
    email: 'david.w@example.com', 
    phone: '(555) 234-5678', 
    orders: 15, 
    spent: 3560, 
    joined: '2023-02-05',
    status: 'VIP',
    location: 'Phoenix, USA'
  }
];

const StatusBadge = ({ status }) => {
  const statusStyles = {
    Active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    Inactive: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    VIP: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}>
      {status}
    </span>
  );
};

const CustomersPage = ({ isDarkMode }) => {
  const [customers, setCustomers] = useState(initialCustomers);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    status: 'Active',
    location: ''
  });
  const [editCustomerId, setEditCustomerId] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const statusOptions = [...new Set(customers.map(customer => customer.status))];
  const locationOptions = [...new Set(customers.map(customer => customer.location.split(', ')[0]))];

  // Simulate API fetch
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setCustomers(initialCustomers);
      setLoading(false);
    }, 1000);
  }, []);

  // Utility functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Sorting
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedCustomers = [...customers].sort((a, b) => {
    if (sortConfig.key === 'name') {
      const valueA = a.name.toLowerCase();
      const valueB = b.name.toLowerCase();
      return sortConfig.direction === 'asc' 
        ? valueA.localeCompare(valueB) 
        : valueB.localeCompare(valueA);
    } else if (sortConfig.key === 'joined') {
      const valueA = new Date(a[sortConfig.key]);
      const valueB = new Date(b[sortConfig.key]);
      return sortConfig.direction === 'asc' 
        ? valueA - valueB 
        : valueB - valueA;
    } else {
      const valueA = a[sortConfig.key];
      const valueB = b[sortConfig.key];
      return sortConfig.direction === 'asc' 
        ? valueA - valueB 
        : valueB - valueA;
    }
  });

  // Filter and pagination
  const filteredCustomers = sortedCustomers.filter(customer => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || customer.status === statusFilter;
    const matchesLocation = locationFilter === 'All' || customer.location.includes(locationFilter);
    
    return matchesSearch && matchesStatus && matchesLocation;
  });

  const totalPages = Math.ceil(filteredCustomers.length / rowsPerPage);
  const paginatedCustomers = filteredCustomers.slice(
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

  // Form handling
  const validateForm = (data) => {
    const newErrors = {};
    
    if (!data.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!data.lastName.trim()) newErrors.lastName = 'Last name is required';
    
    if (!data.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!data.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(data.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validateForm(formData);
    
    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);
      
      setTimeout(() => {
        const newCustomer = {
          id: Math.max(...customers.map(c => c.id)) + 1,
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
          orders: 0,
          spent: 0,
          joined: new Date().toISOString().split('T')[0],
          status: formData.status,
          location: formData.location ? `${formData.location}, USA` : 'Unknown'
        };
        
        setCustomers([...customers, newCustomer]);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          status: 'Active',
          location: ''
        });
        setIsSubmitting(false);
        setShowAddForm(false);
        setNotification({ type: 'success', message: 'Customer added successfully!' });
      }, 1500);
    } else {
      setErrors(newErrors);
      setNotification({ type: 'error', message: 'Please fix the errors in the form' });
    }
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const newErrors = validateForm(formData);
    
    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);
      
      setTimeout(() => {
        const updatedCustomer = {
          id: editCustomerId,
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
          orders: customers.find(c => c.id === editCustomerId).orders,
          spent: customers.find(c => c.id === editCustomerId).spent,
          joined: customers.find(c => c.id === editCustomerId).joined,
          status: formData.status,
          location: formData.location ? `${formData.location}, USA` : 'Unknown'
        };
        
        setCustomers(customers.map(c => c.id === editCustomerId ? updatedCustomer : c));
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          status: 'Active',
          location: ''
        });
        setIsSubmitting(false);
        setShowEditForm(false);
        setEditCustomerId(null);
        setNotification({ type: 'success', message: 'Customer updated successfully!' });
      }, 1500);
    } else {
      setErrors(newErrors);
      setNotification({ type: 'error', message: 'Please fix the errors in the form' });
    }
  };

  const openEditForm = (customer) => {
    const [firstName, ...lastNameParts] = customer.name.split(' ');
    setFormData({
      firstName,
      lastName: lastNameParts.join(' '),
      email: customer.email,
      phone: customer.phone,
      status: customer.status,
      location: customer.location.split(', ')[0]
    });
    setEditCustomerId(customer.id);
    setShowEditForm(true);
  };

  // CSV export
  const csvData = filteredCustomers.map(customer => ({
    ID: customer.id,
    Name: customer.name,
    Email: customer.email,
    Phone: customer.phone,
    Status: customer.status,
    Location: customer.location,
    Orders: customer.orders,
    Spent: formatCurrency(customer.spent),
    Joined: formatDate(customer.joined)
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
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-4">
          <h1 className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Customers Dashboard</h1>
          <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Manage and track all customers</p>
        </div>

        {notification && (
          <div className={`mb-4 p-3 rounded-md text-sm ${notification.type === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}`}>
            {notification.message}
          </div>
        )}

        {/* Customer Management Table */}
        <div className={`rounded-lg shadow-sm border p-4 ${isDarkMode ? 'bg-gray-800 text-gray-200 border-gray-700' : 'bg-white text-gray-800 border-gray-200'}`}>
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Customer Management</h2>
            <p className="text-xs text-gray-500">{filteredCustomers.length} customers found</p>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-col gap-3 mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400 text-sm" />
              </div>
              <input
                type="text"
                placeholder="Search customers..."
                className={`pl-9 pr-3 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-800'}`}
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
                  className={`appearance-none pl-3 pr-8 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-800'}`}
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="All">All Statuses</option>
                  {statusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                <FiChevronDown className="absolute right-2 top-2.5 text-gray-400 text-sm" />
              </div>
              
              <div className="relative flex-1">
                <select
                  className={`appearance-none pl-3 pr-8 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-800'}`}
                  value={locationFilter}
                  onChange={(e) => {
                    setLocationFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="All">All Locations</option>
                  {locationOptions.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
                <FiChevronDown className="absolute right-2 top-2.5 text-gray-400 text-sm" />
              </div>
              
              <CSVLink
                data={csvData}
                filename="customers.csv"
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1 text-sm"
                onClick={() => setNotification({ type: 'success', message: 'Customers exported to CSV' })}
              >
                <FiPlus size={14} />
                <span>Export</span>
              </CSVLink>
              
              <button 
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1 text-sm"
                onClick={() => setShowAddForm(true)}
              >
                <FiPlus size={14} />
                <span>Add Customer</span>
              </button>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className={`min-w-full divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer" onClick={() => requestSort('name')}>
                    Customer {sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">Contact</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">Location</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer" onClick={() => requestSort('orders')}>
                    Orders {sortConfig.key === 'orders' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer" onClick={() => requestSort('spent')}>
                    Spent {sortConfig.key === 'spent' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer" onClick={() => requestSort('joined')}>
                    Joined {sortConfig.key === 'joined' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700 bg-gray-800' : 'divide-gray-200 bg-white'}`}>
                {paginatedCustomers.map((customer) => (
                  <tr key={customer.id} className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                          <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {customer.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium">{customer.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-300 flex items-center gap-1">
                        <FiMail size={12} />
                        {customer.email}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-300 flex items-center gap-1 mt-1">
                        <FiPhone size={12} />
                        {customer.phone}
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <StatusBadge status={customer.status} />
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{customer.location}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm font-medium">{customer.orders}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm font-medium">{formatCurrency(customer.spent)}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatDate(customer.joined)}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm">
                      <button 
                        onClick={() => setShowDetailsModal(customer)} 
                        className="text-blue-600 hover:text-blue-800 mr-2"
                        aria-label="View customer details"
                      >
                        <FiEye size={16} />
                      </button>
                      <button 
                        onClick={() => openEditForm(customer)} 
                        className="text-green-600 hover:text-green-800"
                        aria-label="Edit customer"
                      >
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
            {paginatedCustomers.map((customer) => (
              <div key={customer.id} className={`p-3 border rounded-lg shadow-xs ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="flex gap-3">
                  <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                    <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {customer.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-medium">{customer.name}</h3>
                        <StatusBadge status={customer.status} />
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setShowDetailsModal(customer)} 
                          className="text-blue-600 hover:text-blue-800"
                          aria-label="View customer details"
                        >
                          <FiEye size={14} />
                        </button>
                        <button 
                          onClick={() => openEditForm(customer)} 
                          className="text-green-600 hover:text-green-800"
                          aria-label="Edit customer"
                        >
                          <FiEdit size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">{customer.location}</p>
                  </div>
                </div>
                
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-300">Contact</p>
                    <div className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      <FiMail size={12} />
                      <span className="truncate">{customer.email}</span>
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1 mt-1">
                      <FiPhone size={12} />
                      <span>{customer.phone}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-300">Joined</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{formatDate(customer.joined)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-300">Orders</p>
                    <p className="text-sm font-medium">{customer.orders}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-300">Total Spent</p>
                    <p className="text-sm font-medium">{formatCurrency(customer.spent)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredCustomers.length === 0 && (
            <div className="py-8 text-center">
              <FiSearch className="mx-auto text-2xl text-gray-400" />
              <h3 className="mt-2 text-sm font-medium dark:text-gray-100">No customers found</h3>
              <p className="mt-1 text-xs text-gray-500">
                Try adjusting your search or filter criteria
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('All');
                  setLocationFilter('All');
                }}
                className="mt-3 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
              >
                Reset Filters
              </button>
            </div>
          )}

          {/* Pagination */}
          {filteredCustomers.length > 0 && (
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
                  {paginatedCustomers.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}-
                  {Math.min(currentPage * rowsPerPage, filteredCustomers.length)} of {filteredCustomers.length}
                </span>
                
                <nav className="flex gap-1">
                  <button
                    onClick={handlePrevious}
                    disabled={currentPage === 1}
                    className={`p-2 rounded ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
                  >
                    <FiChevronLeft size={16} />
                  </button>
                  
                  {getPageNumbers().map((page, index) => (
                    <button
                      key={index}
                      onClick={() => typeof page === 'number' && setCurrentPage(page)}
                      className={`w-8 h-8 rounded text-xs ${currentPage === page ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
                      disabled={page === '...'}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={handleNext}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
                  >
                    <FiChevronRight size={16} />
                  </button>
                </nav>
              </div>
            </div>
          )}
        </div>

        {/* Add Customer Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`rounded-lg shadow-sm border p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto ${isDarkMode ? 'bg-gray-800 text-gray-200 border-gray-700' : 'bg-white text-gray-800 border-gray-200'}`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Add New Customer</h2>
                <button 
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label="Close add customer modal"
                >
                  <FiX size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">First Name *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiUser className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className={`pl-9 block w-full rounded-md border text-sm ${errors.firstName ? 'border-red-300' : isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-300 bg-white text-gray-800'} focus:ring-blue-500 focus:border-blue-500`}
                      />
                    </div>
                    {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Last Name *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiUser className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className={`pl-9 block w-full rounded-md border text-sm ${errors.lastName ? 'border-red-300' : isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-300 bg-white text-gray-800'} focus:ring-blue-500 focus:border-blue-500`}
                      />
                    </div>
                    {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Email *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiMail className="text-gray-400" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`pl-9 block w-full rounded-md border text-sm ${errors.email ? 'border-red-300' : isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-300 bg-white text-gray-800'} focus:ring-blue-500 focus:border-blue-500`}
                      />
                    </div>
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Phone *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiPhone className="text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="(123) 456-7890"
                        className={`pl-9 block w-full rounded-md border text-sm ${errors.phone ? 'border-red-300' : isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-300 bg-white text-gray-800'} focus:ring-blue-500 focus:border-blue-500`}
                      />
                    </div>
                    {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className={`block w-full rounded-md border text-sm ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-300 bg-white text-gray-800'} focus:ring-blue-500 focus:border-blue-500`}
                    >
                      {statusOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Location</label>
                    <select
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className={`block w-full rounded-md border text-sm ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-300 bg-white text-gray-800'} focus:ring-blue-500 focus:border-blue-500`}
                    >
                      <option value="">Select location</option>
                      {locationOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className={`px-4 py-2 border rounded-md text-sm font-medium ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'}`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-75`}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <FiSave className="-ml-1 mr-2 h-4 w-4" />
                        Save Customer
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Customer Modal */}
        {showEditForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`rounded-lg shadow-sm border p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto ${isDarkMode ? 'bg-gray-800 text-gray-200 border-gray-700' : 'bg-white text-gray-800 border-gray-200'}`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Edit Customer</h2>
                <button 
                  onClick={() => setShowEditForm(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label="Close edit customer modal"
                >
                  <FiX size={20} />
                </button>
              </div>
              
              <form onSubmit={handleEditSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">First Name *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiUser className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className={`pl-9 block w-full rounded-md border text-sm ${errors.firstName ? 'border-red-300' : isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-300 bg-white text-gray-800'} focus:ring-blue-500 focus:border-blue-500`}
                      />
                    </div>
                    {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Last Name *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiUser className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className={`pl-9 block w-full rounded-md border text-sm ${errors.lastName ? 'border-red-300' : isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-300 bg-white text-gray-800'} focus:ring-blue-500 focus:border-blue-500`}
                      />
                    </div>
                    {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Email *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiMail className="text-gray-400" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`pl-9 block w-full rounded-md border text-sm ${errors.email ? 'border-red-300' : isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-300 bg-white text-gray-800'} focus:ring-blue-500 focus:border-blue-500`}
                      />
                    </div>
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Phone *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiPhone className="text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="(123) 456-7890"
                        className={`pl-9 block w-full rounded-md border text-sm ${errors.phone ? 'border-red-300' : isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-300 bg-white text-gray-800'} focus:ring-blue-500 focus:border-blue-500`}
                      />
                    </div>
                    {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className={`block w-full rounded-md border text-sm ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-300 bg-white text-gray-800'} focus:ring-blue-500 focus:border-blue-500`}
                    >
                      {statusOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Location</label>
                    <select
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className={`block w-full rounded-md border text-sm ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-300 bg-white text-gray-800'} focus:ring-blue-500 focus:border-blue-500`}
                    >
                      <option value="">Select location</option>
                      {locationOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEditForm(false)}
                    className={`px-4 py-2 border rounded-md text-sm font-medium ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'}`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-75`}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <FiSave className="-ml-1 mr-2 h-4 w-4" />
                        Update Customer
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Customer Details Modal */}
        {showDetailsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`rounded-lg shadow-lg p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto ${isDarkMode ? 'bg-gray-800 text-gray-200 border-gray-700' : 'bg-white text-gray-800 border-gray-200'}`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Customer Details</h2>
                <button 
                  onClick={() => setShowDetailsModal(null)} 
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label="Close details modal"
                >
                  <FiX size={20} />
                </button>
              </div>
              <div className="flex items-center mb-4">
                <div className={`flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                  <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {showDetailsModal.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium">{showDetailsModal.name}</h3>
                  <StatusBadge status={showDetailsModal.status} />
                </div>
              </div>
              <p><strong>Email:</strong> {showDetailsModal.email}</p>
              <p><strong>Phone:</strong> {showDetailsModal.phone}</p>
              <p><strong>Location:</strong> {showDetailsModal.location}</p>
              <p><strong>Orders:</strong> {showDetailsModal.orders}</p>
              <p><strong>Total Spent:</strong> {formatCurrency(showDetailsModal.spent)}</p>
              <p><strong>Joined:</strong> {formatDate(showDetailsModal.joined)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomersPage;
