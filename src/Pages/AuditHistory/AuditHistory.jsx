// Pages/AuditHistory/AuditHistory.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History,
  Search,
  Filter,
  Download,
  Printer,
  Calendar,
  User,
  Edit,
  Trash2,
  Plus,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Package,
  Box,
  Carrot,
  ShoppingBag,
  Users,
  Truck,
  DollarSign,
  Wallet,
  Factory,
  Building2,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  ChevronRight,
  X,
  Settings,
  Bell,
  BarChart3,
  FileSpreadsheet,
  Hammer,
  BookOpen,
  TrendingUp,
  TrendingDown,
  UserCheck,
  UserX
} from 'lucide-react';
import { db } from '../../firebase/firebaseConfig';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  where,
  getDocs
} from 'firebase/firestore';

const AuditHistory = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('all');
  const [selectedModule, setSelectedModule] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [auditData, setAuditData] = useState([]);

  // Get current user info
  const getCurrentUser = () => {
    try {
      const saved = localStorage.getItem('businessUser');
      if (saved) {
        const user = JSON.parse(saved);
        return { name: user.name || 'Unknown User', role: user.role || 'Staff' };
      }
    } catch {
      return { name: 'Unknown User', role: 'Staff' };
    }
    return { name: 'Unknown User', role: 'Staff' };
  };

  // Log an audit entry
  const logAudit = async (action, module, description, details = {}, status = 'success') => {
    const user = getCurrentUser();
    try {
      await addDoc(collection(db, 'auditLogs'), {
        user: user.name,
        userRole: user.role,
        action: action,
        module: module,
        description: description,
        details: details,
        timestamp: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
        ip: '127.0.0.1', // In production, get from request
        status: status,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error logging audit:', error);
    }
  };

  // Fetch audit logs from Firebase
  useEffect(() => {
    const q = query(
      collection(db, 'auditLogs'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = [];
      snapshot.forEach((doc) => {
        logs.push({ id: doc.id, ...doc.data() });
      });
      setAuditData(logs);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching audit logs:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Get unique users, modules, actions for filters
  const users = [...new Set(auditData.map(item => item.user))];
  const modules = [...new Set(auditData.map(item => item.module))];
  const actions = ['all', 'create', 'update', 'delete'];

  const getActionBadge = (action) => {
    const configs = {
      create: { bg: 'bg-green-50', text: 'text-green-700', icon: Plus, label: 'Created' },
      update: { bg: 'bg-blue-50', text: 'text-blue-700', icon: Edit, label: 'Updated' },
      delete: { bg: 'bg-red-50', text: 'text-red-700', icon: Trash2, label: 'Deleted' }
    };
    const config = configs[action] || configs.create;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const getModuleIcon = (module) => {
    const icons = {
      ingredients: Carrot,
      packing: Box,
      inventory: Package,
      sales: ShoppingBag,
      customers: Users,
      suppliers: Truck,
      expenses: DollarSign,
      production: Factory,
      cashbook: BookOpen,
      investments: TrendingUp,
      assets: Hammer,
      reports: BarChart3,
      excel: FileSpreadsheet,
      settings: Settings,
      alerts: Bell,
      audit: History
    };
    const Icon = icons[module] || FileText;
    return <Icon className="w-4 h-4" />;
  };

  const getModuleLabel = (module) => {
    const labels = {
      ingredients: 'Ingredients',
      packing: 'Packing Materials',
      inventory: 'Inventory',
      sales: 'Daily Sales',
      customers: 'Customers',
      suppliers: 'Suppliers',
      expenses: 'Expenses',
      production: 'Production',
      cashbook: 'Cashbook',
      investments: 'Investments',
      assets: 'Assets Purchase',
      reports: 'Reports',
      excel: 'Excel',
      settings: 'Settings',
      alerts: 'Alerts',
      audit: 'Audit History'
    };
    return labels[module] || module;
  };

  const getStatusBadge = (status) => {
    const configs = {
      success: { bg: 'bg-green-50', text: 'text-green-700', icon: CheckCircle, label: 'Success' },
      warning: { bg: 'bg-yellow-50', text: 'text-yellow-700', icon: AlertCircle, label: 'Warning' },
      error: { bg: 'bg-red-50', text: 'text-red-700', icon: AlertCircle, label: 'Error' }
    };
    const config = configs[status] || configs.success;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const filteredData = auditData.filter(item => {
    const matchesSearch = 
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.user && item.user.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.moduleLabel && item.moduleLabel.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesAction = selectedAction === 'all' || item.action === selectedAction;
    const matchesModule = selectedModule === 'all' || item.module === selectedModule;
    const matchesUser = selectedUser === 'all' || item.user === selectedUser;
    const matchesDate = !selectedDate || item.date === selectedDate;

    return matchesSearch && matchesAction && matchesModule && matchesUser && matchesDate;
  });

  // Summary Stats
  const totalEntries = auditData.length;
  const todayEntries = auditData.filter(item => item.date === new Date().toISOString().split('T')[0]).length;
  const createCount = auditData.filter(item => item.action === 'create').length;
  const updateCount = auditData.filter(item => item.action === 'update').length;
  const deleteCount = auditData.filter(item => item.action === 'delete').length;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Function to export audit logs
  const exportAuditLogs = () => {
    const dataToExport = filteredData.map(item => ({
      User: item.user,
      Role: item.userRole,
      Action: item.action,
      Module: item.moduleLabel,
      Description: item.description,
      Timestamp: item.timestamp,
      Date: item.date,
      Status: item.status,
      IP: item.ip
    }));

    if (dataToExport.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = Object.keys(dataToExport[0]);
    let csvContent = headers.join(',') + '\n';
    dataToExport.forEach(row => {
      const values = headers.map(header => {
        let value = row[header] || '';
        if (typeof value === 'string' && value.includes(',')) {
          value = `"${value}"`;
        }
        return value;
      });
      csvContent += values.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading audit history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl shadow-lg p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 backdrop-blur rounded-xl">
              <History className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">Audit History</h1>
              <p className="text-gray-400 text-sm">Track all user actions across the system</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-3 py-2 rounded-xl border border-white/20">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent outline-none text-sm text-white w-32 [color-scheme:dark]"
              />
            </div>
            <button 
              onClick={exportAuditLogs}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 border border-white/20"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Entries</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1">{totalEntries}</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <History className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Today</p>
              <p className="text-xl md:text-2xl font-bold text-orange-600 mt-1">{todayEntries}</p>
            </div>
            <div className="p-2 bg-orange-50 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Created</p>
              <p className="text-xl md:text-2xl font-bold text-green-600 mt-1">{createCount}</p>
            </div>
            <div className="p-2 bg-green-50 rounded-lg">
              <Plus className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Updated / Deleted</p>
              <p className="text-xl md:text-2xl font-bold text-blue-600 mt-1">{updateCount + deleteCount}</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <Edit className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by user, action, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              {actions.map(action => (
                <option key={action} value={action}>
                  {action === 'all' ? 'All Actions' : action.charAt(0).toUpperCase() + action.slice(1)}
                </option>
              ))}
            </select>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              <option value="all">All Modules</option>
              {modules.map(module => (
                <option key={module} value={module}>
                  {getModuleLabel(module)}
                </option>
              ))}
            </select>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              <option value="all">All Users</option>
              {users.map(user => (
                <option key={user} value={user}>{user}</option>
              ))}
            </select>
            <button 
              onClick={() => {
                setSearchTerm('');
                setSelectedAction('all');
                setSelectedModule('all');
                setSelectedUser('all');
                setSelectedDate('');
              }}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              Reset
            </button>
            <button className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-sm font-medium transition-colors">
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">User</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Action</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Module</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Description</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Time</th>
                <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.user || 'Unknown'}</p>
                        <p className="text-xs text-gray-400">{item.userRole || 'Staff'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{getActionBadge(item.action)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getModuleIcon(item.module)}
                      <span className="text-sm text-gray-600">{item.moduleLabel || getModuleLabel(item.module)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="max-w-xs">
                      <p className="text-sm text-gray-700 truncate">{item.description || '-'}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm text-gray-600">{item.timestamp || '-'}</p>
                      <p className="text-xs text-gray-400">{formatDate(item.date)}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">{getStatusBadge(item.status || 'success')}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => {
                        setSelectedEntry(item);
                        setShowDetailsModal(true);
                      }}
                      className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <History className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No audit records found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
          </div>
        )}
      </div>

      {/* Audit Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Activity by Module</h3>
          <div className="space-y-3">
            {modules.slice(0, 8).map(module => {
              const count = auditData.filter(item => item.module === module).length;
              const total = auditData.length || 1;
              const percentage = Math.round((count / total) * 100);
              return (
                <div key={module} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 w-32 text-sm text-gray-600 truncate">
                    {getModuleIcon(module)}
                    <span>{getModuleLabel(module)}</span>
                  </div>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gray-700 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">User Activity</h3>
          <div className="space-y-3">
            {users.slice(0, 8).map(user => {
              const count = auditData.filter(item => item.user === user).length;
              const total = auditData.length || 1;
              const percentage = Math.round((count / total) * 100);
              return (
                <div key={user} className="flex items-center gap-3">
                  <div className="w-24 text-sm text-gray-600 truncate">{user}</div>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedEntry && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <History className="w-5 h-5 text-gray-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Audit Details</h3>
                  <p className="text-sm text-gray-500">{selectedEntry.timestamp || 'N/A'}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">User</p>
                  <p className="font-medium text-gray-900">{selectedEntry.user || 'Unknown'}</p>
                  <p className="text-sm text-gray-500">{selectedEntry.userRole || 'Staff'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Action</p>
                  {getActionBadge(selectedEntry.action)}
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Module</p>
                  <div className="flex items-center gap-2">
                    {getModuleIcon(selectedEntry.module)}
                    <span className="font-medium text-gray-900">{selectedEntry.moduleLabel || getModuleLabel(selectedEntry.module)}</span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Status</p>
                  {getStatusBadge(selectedEntry.status || 'success')}
                </div>
                <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                  <p className="text-xs text-gray-500">Description</p>
                  <p className="text-gray-900">{selectedEntry.description || '-'}</p>
                </div>
              </div>

              {selectedEntry.details && Object.keys(selectedEntry.details).length > 0 && (
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Details</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    {Object.entries(selectedEntry.details).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span className="font-medium text-gray-900">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>IP: {selectedEntry.ip || 'N/A'}</span>
                  <span>•</span>
                  <span>ID: #{selectedEntry.id}</span>
                  {selectedEntry.date && (
                    <>
                      <span>•</span>
                      <span>Date: {selectedEntry.date}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    navigate('/settings');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Settings className="w-4 h-4" /> View Audit Settings
                </button>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditHistory;