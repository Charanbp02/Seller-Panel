// Pages/Excel/Excel.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Wallet,
  Package,
  Box,
  Carrot,
  Factory,
  ShoppingBag,
  Truck,
  Users,
  BarChart3,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  DollarSign,
  Building2,
  CreditCard,
  Smartphone,
  Banknote,
  ArrowUpRight,
  ArrowDownRight,
  Printer,
  Filter,
  Search,
  X,
  Plus,
  ChevronDown,
  ChevronRight,
  HardDrive // Replaced Database with HardDrive (exists in lucide-react)
} from 'lucide-react';
import { db } from '../../firebase/firebaseConfig';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  onSnapshot
} from 'firebase/firestore';

const Excel = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [exportingId, setExportingId] = useState(null);
  const [exportSuccessId, setExportSuccessId] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [exportHistory, setExportHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataCounts, setDataCounts] = useState({
    sales: 0,
    expenses: 0,
    production: 0,
    ingredients: 0,
    packing: 0,
    investments: 0,
    customers: 0
  });

  // Fetch data counts for stats
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // Sales count
        const salesSnapshot = await getDocs(collection(db, 'daily_sales'));
        // Expenses count
        const expensesSnapshot = await getDocs(collection(db, 'expenses'));
        // Production count
        const productionSnapshot = await getDocs(collection(db, 'production'));
        // Ingredients count
        const ingredientsSnapshot = await getDocs(collection(db, 'ingredients'));
        // Packing count
        const packingSnapshot = await getDocs(collection(db, 'packingMaterials'));
        // Investments count
        const investmentsSnapshot = await getDocs(collection(db, 'investments'));
        // Customers count
        const customersSnapshot = await getDocs(collection(db, 'customers'));

        setDataCounts({
          sales: salesSnapshot.size,
          expenses: expensesSnapshot.size,
          production: productionSnapshot.size,
          ingredients: ingredientsSnapshot.size,
          packing: packingSnapshot.size,
          investments: investmentsSnapshot.size,
          customers: customersSnapshot.size
        });
      } catch (error) {
        console.error('Error fetching data counts:', error);
      }
    };

    fetchCounts();
  }, []);

  // Fetch export history from localStorage
  useEffect(() => {
    const history = localStorage.getItem('exportHistory');
    if (history) {
      setExportHistory(JSON.parse(history));
    } else {
      // Set default history
      const defaultHistory = [
        { id: 1, name: 'Today\'s Sales', date: new Date().toLocaleString(), type: 'sales', status: 'completed' },
        { id: 2, name: 'Monthly Sales', date: new Date(Date.now() - 86400000).toLocaleString(), type: 'sales', status: 'completed' },
        { id: 3, name: 'Expenses Report', date: new Date(Date.now() - 172800000).toLocaleString(), type: 'expenses', status: 'completed' }
      ];
      setExportHistory(defaultHistory);
      localStorage.setItem('exportHistory', JSON.stringify(defaultHistory));
    }
  }, []);

  // Export button configuration
  const exportButtons = [
    {
      id: 'today-sales',
      label: "Today's Sales",
      icon: TrendingUp,
      color: 'blue',
      bgColor: 'bg-blue-50',
      hoverColor: 'hover:bg-blue-100',
      textColor: 'text-blue-600',
      description: 'Export today\'s complete sales report',
      type: 'daily',
      dataCount: dataCounts.sales
    },
    {
      id: 'today-cashbook',
      label: "Today's Cashbook",
      icon: Wallet,
      color: 'emerald',
      bgColor: 'bg-emerald-50',
      hoverColor: 'hover:bg-emerald-100',
      textColor: 'text-emerald-600',
      description: 'Export today\'s cashbook entries',
      type: 'daily',
      dataCount: 0
    },
    {
      id: 'monthly-sales',
      label: 'Monthly Sales',
      icon: BarChart3,
      color: 'purple',
      bgColor: 'bg-purple-50',
      hoverColor: 'hover:bg-purple-100',
      textColor: 'text-purple-600',
      description: 'Export complete monthly sales report',
      type: 'monthly',
      dataCount: dataCounts.sales
    },
    {
      id: 'expenses',
      label: 'Expenses',
      icon: TrendingDown,
      color: 'red',
      bgColor: 'bg-red-50',
      hoverColor: 'hover:bg-red-100',
      textColor: 'text-red-600',
      description: 'Export all expense records',
      type: 'custom',
      dataCount: dataCounts.expenses
    },
    {
      id: 'production',
      label: 'Production',
      icon: Factory,
      color: 'cyan',
      bgColor: 'bg-cyan-50',
      hoverColor: 'hover:bg-cyan-100',
      textColor: 'text-cyan-600',
      description: 'Export production batch details',
      type: 'custom',
      dataCount: dataCounts.production
    },
    {
      id: 'ingredients',
      label: 'Ingredients',
      icon: Carrot,
      color: 'green',
      bgColor: 'bg-green-50',
      hoverColor: 'hover:bg-green-100',
      textColor: 'text-green-600',
      description: 'Export ingredient stock and usage',
      type: 'custom',
      dataCount: dataCounts.ingredients
    },
    {
      id: 'packing-materials',
      label: 'Packing Materials',
      icon: Box,
      color: 'indigo',
      bgColor: 'bg-indigo-50',
      hoverColor: 'hover:bg-indigo-100',
      textColor: 'text-indigo-600',
      description: 'Export packing materials stock',
      type: 'custom',
      dataCount: dataCounts.packing
    },
    {
      id: 'investments',
      label: 'Investments',
      icon: DollarSign,
      color: 'amber',
      bgColor: 'bg-amber-50',
      hoverColor: 'hover:bg-amber-100',
      textColor: 'text-amber-600',
      description: 'Export investment records',
      type: 'custom',
      dataCount: dataCounts.investments
    },
    {
      id: 'complete-report',
      label: 'Complete Business Report',
      icon: FileSpreadsheet,
      color: 'rose',
      bgColor: 'bg-rose-50',
      hoverColor: 'hover:bg-rose-100',
      textColor: 'text-rose-600',
      description: 'Export complete business report with all data',
      type: 'complete',
      dataCount: dataCounts.sales + dataCounts.expenses + dataCounts.production + dataCounts.ingredients + dataCounts.packing + dataCounts.investments + dataCounts.customers
    }
  ];

  // Actual export function
  const handleExport = async (buttonId) => {
    setExportingId(buttonId);
    setLoading(true);

    try {
      let data = [];
      let fileName = '';
      let headers = [];

      switch (buttonId) {
        case 'today-sales': {
          const today = new Date().toISOString().split('T')[0];
          const q = query(collection(db, 'daily_sales'), where('date', '==', today));
          const snapshot = await getDocs(q);
          data = snapshot.docs.map(doc => doc.data());
          fileName = `Sales_${today}.xlsx`;
          headers = ['Date', 'Invoice', 'Customer', 'Products', 'Subtotal', 'Discount', 'Grand Total', 'Received', 'Balance', 'Payment Mode', 'Status'];
          break;
        }
        case 'today-cashbook': {
          const today = new Date().toISOString().split('T')[0];
          const q = query(collection(db, 'cashbook'), where('date', '==', today));
          const snapshot = await getDocs(q);
          data = snapshot.docs.map(doc => doc.data());
          fileName = `Cashbook_${today}.xlsx`;
          headers = ['Date', 'Opening Balance', 'Sales', 'Expenses', 'Owner', 'Closing Balance'];
          break;
        }
        case 'monthly-sales': {
          const [year, month] = selectedMonth.split('-');
          const firstDay = `${year}-${month}-01`;
          const lastDay = `${year}-${month}-${new Date(year, parseInt(month), 0).getDate()}`;
          const q = query(
            collection(db, 'daily_sales'),
            where('date', '>=', firstDay),
            where('date', '<=', lastDay)
          );
          const snapshot = await getDocs(q);
          data = snapshot.docs.map(doc => doc.data());
          fileName = `Monthly_Sales_${selectedMonth}.xlsx`;
          headers = ['Date', 'Invoice', 'Customer', 'Products', 'Subtotal', 'Discount', 'Grand Total', 'Received', 'Balance', 'Payment Mode', 'Status'];
          break;
        }
        case 'expenses': {
          const snapshot = await getDocs(collection(db, 'expenses'));
          data = snapshot.docs.map(doc => doc.data());
          fileName = `Expenses_${new Date().toISOString().split('T')[0]}.xlsx`;
          headers = ['Date', 'Expense', 'Amount', 'Category', 'Payment Mode', 'Description', 'Notes'];
          break;
        }
        case 'production': {
          const snapshot = await getDocs(collection(db, 'production'));
          data = snapshot.docs.map(doc => doc.data());
          fileName = `Production_${new Date().toISOString().split('T')[0]}.xlsx`;
          headers = ['Date', 'Product', 'Produced', 'Unit', 'Cost', 'Remarks'];
          break;
        }
        case 'ingredients': {
          const snapshot = await getDocs(collection(db, 'ingredients'));
          data = snapshot.docs.map(doc => doc.data());
          fileName = `Ingredients_${new Date().toISOString().split('T')[0]}.xlsx`;
          headers = ['Name', 'Unit', 'Opening Stock', 'Total Purchased', 'Total Used', 'Current Stock', 'Stock Value', 'Supplier'];
          break;
        }
        case 'packing-materials': {
          const snapshot = await getDocs(collection(db, 'packingMaterials'));
          data = snapshot.docs.map(doc => doc.data());
          fileName = `Packing_Materials_${new Date().toISOString().split('T')[0]}.xlsx`;
          headers = ['Material', 'Size', 'Unit', 'Opening Quantity', 'Purchased', 'Used', 'Damaged', 'Current Stock', 'Total Value', 'Supplier'];
          break;
        }
        case 'investments': {
          const snapshot = await getDocs(collection(db, 'investments'));
          data = snapshot.docs.map(doc => doc.data());
          fileName = `Investments_${new Date().toISOString().split('T')[0]}.xlsx`;
          headers = ['Date', 'Assets', 'Packing', 'Ingredients', 'Expenses', 'Investment', 'Selling', 'Total Balance', 'Notes'];
          break;
        }
        case 'complete-report': {
          // Fetch all data
          const [salesSnapshot, expensesSnapshot, productionSnapshot, ingredientsSnapshot, packingSnapshot, investmentsSnapshot, customersSnapshot] = await Promise.all([
            getDocs(collection(db, 'daily_sales')),
            getDocs(collection(db, 'expenses')),
            getDocs(collection(db, 'production')),
            getDocs(collection(db, 'ingredients')),
            getDocs(collection(db, 'packingMaterials')),
            getDocs(collection(db, 'investments')),
            getDocs(collection(db, 'customers'))
          ]);

          const reportData = {
            sales: salesSnapshot.docs.map(doc => doc.data()),
            expenses: expensesSnapshot.docs.map(doc => doc.data()),
            production: productionSnapshot.docs.map(doc => doc.data()),
            ingredients: ingredientsSnapshot.docs.map(doc => doc.data()),
            packing: packingSnapshot.docs.map(doc => doc.data()),
            investments: investmentsSnapshot.docs.map(doc => doc.data()),
            customers: customersSnapshot.docs.map(doc => doc.data())
          };

          // Create a blob with the report data
          const reportContent = JSON.stringify(reportData, null, 2);
          const blob = new Blob([reportContent], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `Complete_Business_Report_${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          // Add to history
          const button = exportButtons.find(b => b.id === buttonId);
          if (button) {
            const newEntry = {
              id: exportHistory.length + 1,
              name: button.label,
              date: new Date().toLocaleString(),
              type: button.type,
              status: 'completed'
            };
            const updatedHistory = [newEntry, ...exportHistory];
            setExportHistory(updatedHistory);
            localStorage.setItem('exportHistory', JSON.stringify(updatedHistory));
          }

          setExportingId(null);
          setExportSuccessId(buttonId);
          setTimeout(() => setExportSuccessId(null), 3000);
          return;
        }
        default:
          break;
      }

      // Create CSV content
      if (data.length > 0) {
        let csvContent = headers.join(',') + '\n';
        data.forEach(row => {
          const values = headers.map(header => {
            let value = row[header.toLowerCase().replace(/ /g, '')] || row[header] || '';
            if (typeof value === 'string' && value.includes(',')) {
              value = `"${value}"`;
            }
            return value;
          });
          csvContent += values.join(',') + '\n';
        });

        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName.replace('.xlsx', '.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        // Add to history
        const button = exportButtons.find(b => b.id === buttonId);
        if (button) {
          const newEntry = {
            id: exportHistory.length + 1,
            name: button.label,
            date: new Date().toLocaleString(),
            type: button.type,
            status: 'completed'
          };
          const updatedHistory = [newEntry, ...exportHistory];
          setExportHistory(updatedHistory);
          localStorage.setItem('exportHistory', JSON.stringify(updatedHistory));
        }

        setExportingId(null);
        setExportSuccessId(buttonId);
        setTimeout(() => setExportSuccessId(null), 3000);
      } else {
        alert('No data found to export for this report.');
        setExportingId(null);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
      setExportingId(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    return status === 'completed' 
      ? <CheckCircle className="w-4 h-4 text-green-500" />
      : <AlertCircle className="w-4 h-4 text-yellow-500" />;
  };

  const getTypeBadge = (type) => {
    const configs = {
      daily: 'bg-blue-50 text-blue-700',
      monthly: 'bg-purple-50 text-purple-700',
      sales: 'bg-green-50 text-green-700',
      expenses: 'bg-red-50 text-red-700',
      production: 'bg-cyan-50 text-cyan-700',
      complete: 'bg-rose-50 text-rose-700',
      custom: 'bg-gray-50 text-gray-700'
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${configs[type] || configs.custom}`}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-lg p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 backdrop-blur rounded-xl">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">Excel Export</h1>
              <p className="text-green-100 text-sm">One-click export all your business data</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur px-3 py-2 rounded-xl border border-white/30">
              <Calendar className="w-4 h-4 text-white" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent outline-none text-sm text-white w-32 [color-scheme:dark]"
              />
            </div>
            <div className="hidden md:flex items-center gap-2 bg-white/20 backdrop-blur px-3 py-2 rounded-xl border border-white/30">
              <Calendar className="w-4 h-4 text-white" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent outline-none text-sm text-white w-32 [color-scheme:dark]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Exports</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1">{exportHistory.length}</p>
            </div>
            <div className="p-2 bg-green-50 rounded-lg">
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Data Records</p>
              <p className="text-xl md:text-2xl font-bold text-blue-600 mt-1">
                {dataCounts.sales + dataCounts.expenses + dataCounts.production + dataCounts.ingredients + dataCounts.packing + dataCounts.investments + dataCounts.customers}
              </p>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <HardDrive className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Most Exported</p>
              <p className="text-xl md:text-2xl font-bold text-purple-600 mt-1">Sales</p>
            </div>
            <div className="p-2 bg-purple-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Last Export</p>
              <p className="text-sm md:text-base font-medium text-gray-900 mt-1 truncate">
                {exportHistory[0]?.name || 'No exports'}
              </p>
            </div>
            <div className="p-2 bg-amber-50 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Export Buttons Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Export Reports</h2>
            <p className="text-sm text-gray-500">Click any button to download Excel file</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Printer className="w-4 h-4 text-gray-600" />
            </button>
            <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {exportButtons.map((button) => {
            const Icon = button.icon;
            const isExporting = exportingId === button.id;
            const isSuccess = exportSuccessId === button.id;
            
            return (
              <button
                key={button.id}
                onClick={() => handleExport(button.id)}
                disabled={isExporting || loading}
                className={`
                  relative p-5 rounded-xl border-2 transition-all duration-200
                  ${isSuccess 
                    ? 'border-green-400 bg-green-50' 
                    : isExporting
                    ? 'border-gray-300 bg-gray-50 cursor-wait'
                    : 'border-gray-200 hover:border-green-300 hover:shadow-md'
                  }
                  ${button.bgColor} ${button.hoverColor}
                  text-left group
                `}
              >
                <div className="flex items-start gap-4">
                  <div className={`
                    p-3 rounded-xl transition-all duration-200
                    ${button.bgColor} ${button.textColor}
                    group-hover:scale-105
                  `}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{button.label}</h3>
                      {isSuccess && (
                        <CheckCircle className="w-5 h-5 text-green-500 animate-in zoom-in" />
                      )}
                      {isExporting && (
                        <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{button.description}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-gray-400">Excel</span>
                      <span className="text-xs text-gray-300">•</span>
                      <span className="text-xs text-gray-400">One click</span>
                    </div>
                    {button.dataCount > 0 && (
                      <div className="mt-1">
                        <span className="text-xs text-gray-400">{button.dataCount} records</span>
                      </div>
                    )}
                  </div>
                  <Download className={`
                    w-5 h-5 transition-all duration-200
                    ${isSuccess ? 'text-green-500' : 'text-gray-400 group-hover:text-green-500'}
                    flex-shrink-0
                  `} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Complete Business Report Special Card */}
        <div className="mt-6 p-6 bg-gradient-to-r from-rose-50 to-orange-50 rounded-xl border-2 border-rose-200">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-100 rounded-xl">
                <FileSpreadsheet className="w-8 h-8 text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Complete Business Report</h3>
                <p className="text-sm text-gray-600">
                  Export everything - Sales, Production, Stock, Finance, Customers, Suppliers in one file
                </p>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className="text-xs bg-rose-200 text-rose-700 px-2 py-0.5 rounded-full">All Data</span>
                  <span className="text-xs bg-orange-200 text-orange-700 px-2 py-0.5 rounded-full">Master Report</span>
                  <span className="text-xs bg-green-200 text-green-700 px-2 py-0.5 rounded-full">Dashboard Ready</span>
                  <span className="text-xs bg-blue-200 text-blue-700 px-2 py-0.5 rounded-full">{dataCounts.sales + dataCounts.expenses + dataCounts.production + dataCounts.ingredients + dataCounts.packing + dataCounts.investments + dataCounts.customers} records</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => handleExport('complete-report')}
              disabled={loading}
              className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-medium transition-colors flex items-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              <FileSpreadsheet className="w-5 h-5" />
              Download Complete Report
            </button>
          </div>
        </div>
      </div>

      {/* Export History */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Export History</h2>
          <button 
            onClick={() => {
              setExportHistory([]);
              localStorage.removeItem('exportHistory');
            }}
            className="text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            Clear All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Report</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Date</th>
                <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Type</th>
                <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {exportHistory.map((item) => (
                <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-gray-900">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.date}</td>
                  <td className="px-4 py-3 text-center">{getTypeBadge(item.type)}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {getStatusIcon(item.status)}
                      <span className="text-sm capitalize text-gray-600">{item.status}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button 
                      onClick={() => {
                        const button = exportButtons.find(b => b.label === item.name);
                        if (button) handleExport(button.id);
                      }}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                    >
                      <Download className="w-4 h-4" /> Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {exportHistory.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileSpreadsheet className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No export history</p>
            <p className="text-sm text-gray-400 mt-1">Your exported reports will appear here</p>
          </div>
        )}
      </div>

      {/* Quick Export Tips */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-4 md:p-6">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Quick Export Tips</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>One click exports all data</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Excel format ready for sharing</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Daily reports for Rakshitha</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Excel;