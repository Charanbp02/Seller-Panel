// Pages/Alerts/Alerts.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, AlertTriangle, AlertCircle, CheckCircle, XCircle, Package, Box,
  Carrot, ShoppingBag, Users, Truck, DollarSign, Calendar, Clock,
  TrendingUp, TrendingDown, Eye, Check, X, Filter, Search, Download,
  Printer, Settings, Zap, Info, Plus, ChevronDown, ChevronRight,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { db } from '../../firebase/firebaseConfig';
import {
  collection, addDoc, updateDoc, deleteDoc, doc, query, where,
  orderBy, onSnapshot, getDocs, serverTimestamp, writeBatch
} from 'firebase/firestore';

// ============================================================
// HELPERS
// ============================================================
const localDate = (d = new Date()) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};

const daysBetween = (dateStr) => {
  if (!dateStr) return 0;
  const then = new Date(dateStr + (dateStr.length === 10 ? 'T12:00:00' : ''));
  if (isNaN(then.getTime())) return 0;
  const now = new Date();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
};

// Derive ingredient stock from purchases/usage (source of truth)
const deriveIngredientStock = (ing) => {
  const opening = Number(ing.openingStock) || 0;
  const purchased = (ing.purchases || []).reduce((s, p) => s + (Number(p.quantity) || 0), 0);
  const used = (ing.usage || []).reduce(
    (s, u) => s + (Number(u.productionUsage) || 0) + (Number(u.wastage) || 0),
    0
  );
  return Math.max(0, opening + purchased - used);
};

// Derive packing stock
const derivePackingStock = (pk) => {
  const opening = Number(pk.openingQuantity) || 0;
  const purchased = (pk.purchases || []).reduce((s, p) => s + (Number(p.quantity) || 0), 0);
  const used = (pk.usage || []).reduce(
    (s, u) => s + (Number(u.used) || 0) + (Number(u.damaged) || 0),
    0
  );
  // Prefer explicit currentStock if present (Production updates it)
  if (typeof pk.currentStock === 'number') return Number(pk.currentStock);
  return Math.max(0, opening + purchased - used);
};

// Derive customer outstanding from transactions
const deriveCustomerOutstanding = (c) => {
  let purchases = 0, paid = 0;
  (c.transactions || []).forEach(t => {
    const amt = Number(t.amount) || 0;
    if (t.type === 'sale' || t.type === 'credit') purchases += amt;
    else if (t.type === 'payment') paid += amt;
  });
  const opening = Number(c.openingBalance) || 0;
  return Math.max(0, purchases - paid + opening);
};

const isRealSale = (x) => !x.isPaymentOnly;

// ============================================================
// ALERT GENERATORS (pure — no side effects)
// ============================================================
const generateStockAlertsFrom = ({ ingredients, packing, stock }) => {
  const alerts = [];

  // Ingredients
  ingredients.forEach(ing => {
    const stockQty = deriveIngredientStock(ing);
    const rl = Number(ing.reorderLevel) || 5;
    if (stockQty <= rl) {
      alerts.push({
        type: 'ingredient-stock',
        typeId: `ing-${ing.id}`,
        title: 'Low Ingredient Stock',
        description: `${ing.ingredientName || ing.name || 'Unknown'} stock is below reorder level`,
        details: `Current: ${stockQty.toFixed(2)} ${ing.unit || 'kg'} | Reorder: ${rl} ${ing.unit || 'kg'}`,
        severity: stockQty <= 2 ? 'critical' : 'warning',
        category: 'low-stock',
        icon: 'Carrot',
        color: stockQty <= 2 ? 'red' : 'yellow',
        link: '/ingredients',
        action: 'Purchase Now'
      });
    }
  });

  // Packing
  packing.forEach(pk => {
    const stockQty = derivePackingStock(pk);
    const rl = Number(pk.reorderLevel) || 100;
    if (stockQty <= rl) {
      alerts.push({
        type: 'packing-stock',
        typeId: `pack-${pk.id}`,
        title: 'Low Packing Material Stock',
        description: `${pk.materialName || pk.name || 'Unknown'} stock is below reorder level`,
        details: `Current: ${stockQty.toFixed(2)} ${pk.unit || 'pcs'} | Reorder: ${rl} ${pk.unit || 'pcs'}`,
        severity: stockQty <= 50 ? 'critical' : 'warning',
        category: 'low-stock',
        icon: 'Box',
        color: stockQty <= 50 ? 'red' : 'yellow',
        link: '/packing-materials',
        action: 'Purchase Now'
      });
    }
  });

  // Finished stock from stock collection (produced − sold)
  stock.forEach(s => {
    const produced = Number(s.produced) || 0;
    const sold = Number(s.sold) || 0;
    const stockQty = Math.max(0, produced - sold);
    const rl = 30; // minimum finished stock threshold
    if (stockQty < rl) {
      alerts.push({
        type: 'finished-stock',
        typeId: `prod-${s.id}`,
        title: 'Low Finished Product Stock',
        description: `${s.productName || 'Unknown'} stock is below minimum`,
        details: `Current: ${stockQty.toFixed(2)} ${s.unit || 'kg'} | Minimum: ${rl} ${s.unit || 'kg'}`,
        severity: stockQty < 15 ? 'critical' : 'warning',
        category: 'low-stock',
        icon: 'Package',
        color: stockQty < 15 ? 'red' : 'yellow',
        link: '/production',
        action: 'Produce More'
      });
    }
  });

  return alerts;
};

const generatePaymentAlertsFrom = ({ customers }) => {
  const alerts = [];
  customers.forEach(c => {
    const outstanding = deriveCustomerOutstanding(c);
    if (outstanding <= 0) return;

    // Find the latest transaction date (purchase or payment)
    const txs = c.transactions || [];
    const lastTx = txs.length > 0
      ? txs.reduce((latest, t) => {
          if (!latest) return t;
          const ld = latest.date || '';
          const td = t.date || '';
          return td > ld ? t : latest;
        }, null)
      : null;

    const lastDate = lastTx?.date || (c.createdAt ? String(c.createdAt).substring(0, 10) : null);
    if (!lastDate) return;

    const daysSince = daysBetween(lastDate);
    if (daysSince > 15) {
      alerts.push({
        type: 'customer-payment',
        typeId: `cust-${c.id}`,
        title: 'Customer Payment Overdue',
        description: `${c.customerName || 'Customer'} payment is overdue by ${daysSince} days`,
        details: `Outstanding: ₹${outstanding.toFixed(2)} | Last activity: ${lastDate}`,
        severity: daysSince > 30 ? 'critical' : 'warning',
        category: 'payment',
        icon: 'Users',
        color: daysSince > 30 ? 'red' : 'yellow',
        link: '/customers',
        action: 'View Customer'
      });
    }
  });
  return alerts;
};

const generateSalesRemindersFrom = ({ salesByDate }) => {
  const alerts = [];
  const today = localDate();
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const yesterday = localDate(y);

  const hasTodaySales = (salesByDate[today] || 0) > 0;
  const hasYesterdaySales = (salesByDate[yesterday] || 0) > 0;

  if (!hasYesterdaySales) {
    alerts.push({
      type: 'sales-reminder',
      typeId: `sales-${yesterday}`,
      title: 'Daily Sales Not Entered',
      description: `Sales for ${yesterday} have not been entered`,
      details: 'Please enter yesterday\'s sales to maintain accurate records',
      severity: 'warning',
      category: 'reminder',
      icon: 'ShoppingBag',
      color: 'yellow',
      link: '/daily-sales',
      action: 'Enter Sales'
    });
  }

  const hour = new Date().getHours();
  if (hour >= 20 && !hasTodaySales) {
    alerts.push({
      type: 'sales-reminder',
      typeId: `sales-today-${today}`,
      title: 'Today\'s Sales Not Entered',
      description: `Sales for today (${today}) have not been entered yet`,
      details: 'Please enter today\'s sales before closing',
      severity: 'warning',
      category: 'reminder',
      icon: 'ShoppingBag',
      color: 'yellow',
      link: '/daily-sales',
      action: 'Enter Sales'
    });
  }
  return alerts;
};

// ============================================================
// COMPONENT
// ============================================================
const Alerts = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showDismissModal, setShowDismissModal] = useState(false);
  const [dismissId, setDismissId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alerts, setAlerts] = useState([]);

  // ★ Subscribe to alerts collection
  useEffect(() => {
    const q = query(collection(db, 'alerts'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setAlerts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (e) => {
      console.error('alerts listener:', e);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // ============================================================
  // GENERATE ALERTS — single function, dedup by querying Firestore
  // ============================================================
  const generateAllAlerts = useCallback(async () => {
    try {
      // 1. Fetch source data
      const [ingSnap, packSnap, stockSnap, custSnap, salesSnap] = await Promise.all([
        getDocs(collection(db, 'ingredients')),
        getDocs(collection(db, 'packingMaterials')),
        getDocs(collection(db, 'stock')),
        getDocs(collection(db, 'customers')),
        getDocs(collection(db, 'daily_sales'))
      ]);

      const ingredients = ingSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const packing = packSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const stock = stockSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const customers = custSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // ★ Filter out payment-only entries for sales reminder
      const realSales = salesSnap.docs
        .map(d => d.data())
        .filter(isRealSale);
      const salesByDate = {};
      realSales.forEach(s => {
        if (s.date) salesByDate[s.date] = (salesByDate[s.date] || 0) + 1;
      });

      // 2. Compute what alerts SHOULD exist
      const desired = [
        ...generateStockAlertsFrom({ ingredients, packing, stock }),
        ...generatePaymentAlertsFrom({ customers }),
        ...generateSalesRemindersFrom({ salesByDate })
      ];

      // 3. Fetch current alerts to dedup
      const currentSnap = await getDocs(collection(db, 'alerts'));
      const current = currentSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const currentByTypeId = new Map(current.map(a => [a.typeId, a]));

      // 4. Compute diff
      const desiredIds = new Set(desired.map(a => a.typeId));
      const nowISO = new Date().toISOString();

      const toCreate = desired.filter(a => !currentByTypeId.has(a.typeId));
      // ★ Only auto-dismiss alerts that were auto-generated (not user-created)
      const toDismiss = current.filter(a =>
        a.typeId &&                          // must have typeId (auto)
        !a.isRead &&                         // still unread
        !desiredIds.has(a.typeId) &&         // no longer needed
        a.category !== 'manual'              // not manually created
      );

      // 5. Apply diff
      if (toCreate.length > 0 || toDismiss.length > 0) {
        const batch = writeBatch(db);

        toCreate.forEach(a => {
          const ref = doc(collection(db, 'alerts'));
          batch.set(ref, {
            ...a,
            isRead: false,
            createdAt: nowISO
          });
        });

        toDismiss.forEach(a => {
          batch.delete(doc(db, 'alerts', a.id));
        });

        await batch.commit();
      }
    } catch (e) {
      console.error('generateAllAlerts failed:', e);
    }
  }, []);

  // ★ Run ONCE on mount, then every 15 minutes
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (cancelled) return;
      await generateAllAlerts();
    };
    run();
    const interval = setInterval(run, 15 * 60 * 1000); // 15 min
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [generateAllAlerts]);

  // ============================================================
  // DERIVED — summary counts
  // ============================================================
  const totalAlerts = alerts.length;
  const unreadAlerts = alerts.filter(a => !a.isRead).length;
  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
  const warningAlerts = alerts.filter(a => a.severity === 'warning').length;

  const getSeverityBadge = (severity) => {
    const configs = {
      critical: { bg: 'bg-red-50', text: 'text-red-700', icon: AlertCircle, label: 'Critical' },
      warning: { bg: 'bg-yellow-50', text: 'text-yellow-700', icon: AlertTriangle, label: 'Warning' },
      info: { bg: 'bg-blue-50', text: 'text-blue-700', icon: Info, label: 'Info' }
    };
    const config = configs[severity] || configs.info;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const configs = {
      'ingredient-stock': { bg: 'bg-green-50', text: 'text-green-700', icon: Carrot, label: 'Ingredients' },
      'packing-stock': { bg: 'bg-purple-50', text: 'text-purple-700', icon: Box, label: 'Packing' },
      'finished-stock': { bg: 'bg-cyan-50', text: 'text-cyan-700', icon: Package, label: 'Finished' },
      'customer-payment': { bg: 'bg-blue-50', text: 'text-blue-700', icon: Users, label: 'Customer' },
      'supplier-payment': { bg: 'bg-orange-50', text: 'text-orange-700', icon: Truck, label: 'Supplier' },
      'sales-reminder': { bg: 'bg-pink-50', text: 'text-pink-700', icon: ShoppingBag, label: 'Sales' },
      'expense-reminder': { bg: 'bg-amber-50', text: 'text-amber-700', icon: DollarSign, label: 'Expense' }
    };
    const config = configs[type] || configs['ingredient-stock'];
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  // ============================================================
  // ACTIONS
  // ============================================================
  const handleDismiss = (id) => {
    setDismissId(id);
    setShowDismissModal(true);
  };

  const confirmDismiss = async () => {
    if (!dismissId) return;
    setSaving(true);
    try {
      await deleteDoc(doc(db, 'alerts', dismissId));
      setShowDismissModal(false);
      setDismissId(null);
    } catch (e) {
      console.error('dismiss:', e);
      alert('Failed to dismiss alert.');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await updateDoc(doc(db, 'alerts', id), {
        isRead: true,
        readAt: new Date().toISOString()
      });
    } catch (e) {
      console.error('markRead:', e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const unread = alerts.filter(a => !a.isRead);
      if (unread.length === 0) return;
      const batch = writeBatch(db);
      const nowISO = new Date().toISOString();
      unread.forEach(a => {
        batch.update(doc(db, 'alerts', a.id), { isRead: true, readAt: nowISO });
      });
      await batch.commit();
    } catch (e) {
      console.error('markAllRead:', e);
    }
  };

  // ============================================================
  // FILTERS
  // ============================================================
  const filteredAlerts = alerts
    .filter(a => activeFilter === 'all' || a.category === activeFilter)
    .filter(a => {
      if (!searchTerm.trim()) return true;
      const t = searchTerm.toLowerCase();
      return (
        (a.title || '').toLowerCase().includes(t) ||
        (a.description || '').toLowerCase().includes(t)
      );
    });

  const getFilterCount = (category) => {
    if (category === 'all') return alerts.length;
    return alerts.filter(a => a.category === category).length;
  };

  const getIconComponent = (iconName) => {
    const icons = {
      Carrot, Box, Package, Users, Truck, DollarSign, ShoppingBag, Zap
    };
    return icons[iconName] || AlertCircle;
  };

  // ============================================================
  // LOADING
  // ============================================================
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading alerts...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="space-y-5 md:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl shadow-lg p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 backdrop-blur rounded-xl">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">Alerts</h1>
              <p className="text-red-100 text-sm">Stay updated with important notifications</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur px-3 py-2 rounded-xl border border-white/30">
              <Calendar className="w-4 h-4 text-white" />
              <span className="text-sm text-white">{new Date().toLocaleDateString()}</span>
            </div>
            <button
              onClick={handleMarkAllRead}
              className="bg-white text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              <Check className="w-4 h-4" />
              <span className="hidden sm:inline">Mark All Read</span>
              <span className="sm:hidden">Read All</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Alerts</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1">{totalAlerts}</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Unread</p>
              <p className="text-xl md:text-2xl font-bold text-orange-600 mt-1">{unreadAlerts}</p>
            </div>
            <div className="p-2 bg-orange-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Critical</p>
              <p className="text-xl md:text-2xl font-bold text-red-600 mt-1">{criticalAlerts}</p>
            </div>
            <div className="p-2 bg-red-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Warnings</p>
              <p className="text-xl md:text-2xl font-bold text-yellow-600 mt-1">{warningAlerts}</p>
            </div>
            <div className="p-2 bg-yellow-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex flex-wrap gap-2">
            {['all', 'low-stock', 'payment', 'reminder'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeFilter === filter
                    ? 'bg-red-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filter === 'all' ? 'All' :
                 filter === 'low-stock' ? 'Low Stock' :
                 filter === 'payment' ? 'Payments' : 'Reminders'}
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                  activeFilter === filter ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {getFilterCount(filter)}
                </span>
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 w-full md:w-48"
              />
            </div>
            <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
              <Download className="w-4 h-4 text-gray-600" />
            </button>
            <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
              <Printer className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 md:p-6">
          <div className="space-y-4">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">No alerts found</p>
                <p className="text-sm text-gray-400 mt-1">All clear! No pending alerts</p>
              </div>
            ) : (
              filteredAlerts.map((alert) => {
                const Icon = getIconComponent(alert.icon);
                const isUnread = !alert.isRead;
                return (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-xl border transition-all duration-200 ${
                      isUnread ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-50 border-gray-100'
                    } ${
                      alert.severity === 'critical' ? 'border-l-4 border-l-red-500' :
                      alert.severity === 'warning' ? 'border-l-4 border-l-yellow-500' :
                      'border-l-4 border-l-blue-500'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-xl ${
                        alert.color === 'red' ? 'bg-red-50 text-red-600' :
                        alert.color === 'yellow' ? 'bg-yellow-50 text-yellow-600' :
                        alert.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                        'bg-gray-50 text-gray-600'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className={`font-semibold ${isUnread ? 'text-gray-900' : 'text-gray-600'}`}>
                                {alert.title}
                              </h3>
                              {isUnread && (
                                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                                  New
                                </span>
                              )}
                              {getSeverityBadge(alert.severity)}
                              {getTypeBadge(alert.type)}
                            </div>
                            <p className={`text-sm mt-1 ${isUnread ? 'text-gray-700' : 'text-gray-500'}`}>
                              {alert.description}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">{alert.details}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-xs text-gray-400">
                                {alert.createdAt ? new Date(alert.createdAt).toLocaleString() : ''}
                              </span>
                              <button
                                onClick={() => navigate(alert.link)}
                                className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                              >
                                {alert.action}
                                <ArrowUpRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-1 flex-shrink-0">
                        {isUnread && (
                          <button
                            onClick={() => handleMarkRead(alert.id)}
                            className="p-1.5 hover:bg-green-50 rounded-lg text-gray-400 hover:text-green-600"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDismiss(alert.id)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600"
                          title="Dismiss alert"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <button
          onClick={() => navigate('/ingredients')}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all hover:border-red-200 group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg group-hover:bg-red-100">
              <Carrot className="w-5 h-5 text-red-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">Ingredients</p>
              <p className="text-xs text-gray-500">Check low stock</p>
            </div>
          </div>
        </button>
        <button
          onClick={() => navigate('/packing-materials')}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all hover:border-purple-200 group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100">
              <Box className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">Packing</p>
              <p className="text-xs text-gray-500">Check stock</p>
            </div>
          </div>
        </button>
        <button
          onClick={() => navigate('/customers')}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all hover:border-blue-200 group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">Customers</p>
              <p className="text-xs text-gray-500">Check overdue</p>
            </div>
          </div>
        </button>
        <button
          onClick={() => navigate('/expenses')}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all hover:border-amber-200 group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg group-hover:bg-amber-100">
              <DollarSign className="w-5 h-5 text-amber-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">Expenses</p>
              <p className="text-xs text-gray-500">Check payments</p>
            </div>
          </div>
        </button>
      </div>

      {/* Dismiss Modal */}
      {showDismissModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Dismiss Alert</h3>
              <p className="text-gray-500 mb-6">
                Are you sure you want to dismiss this alert? It will be removed from your list.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDismissModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDismiss}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-50"
                >
                  {saving ? 'Dismissing...' : 'Dismiss'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Alerts;