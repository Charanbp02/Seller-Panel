// Pages/Reports/Reports.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3, TrendingUp, TrendingDown, Download, Printer, Calendar,
  Filter, Eye, FileText, DollarSign, Package, Box, Wallet, Users,
  Truck, ShoppingBag, Factory, Clock, CheckCircle, AlertTriangle,
  PieChart, LineChart, ArrowUpRight, ArrowDownRight, ChevronDown,
  ChevronRight, X, Plus, Minus, Building2, CreditCard, Banknote, Smartphone
} from 'lucide-react';
import { db } from '../../firebase/firebaseConfig';
import {
  collection, query, where, onSnapshot, orderBy, limit
} from 'firebase/firestore';

// ============================================================
// HELPERS
// ============================================================
const localDate = (d = new Date()) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};
const num = (v) => Number(v) || 0;
const fmt = (n) => `₹${num(n).toFixed(2)}`;
const isRealSale = (x) => !x.isPaymentOnly;

// Unit conversion (mirrors costingHelpers)
const CONV = {
  'g->kg': 1e-3, 'mg->kg': 1e-6, 'mg->g': 1e-3,
  'ml->L': 1e-3, 'kg->g': 1e3, 'L->ml': 1e3
};
const convertToBase = (qty, from, base) => {
  const q = Number(qty) || 0;
  if (!from || !base || from === base) return q;
  return q * (CONV[`${from}->${base}`] ?? 1);
};

/**
 * Build { productName: { costPerBaseUnit, baseUnit } } from products + costings
 */
const buildCostingsByName = (products, costings) => {
  const nameById = {};
  products.forEach(p => {
    const x = p.data ? p.data() : p;
    nameById[p.id || x.id] = x.productName || '';
  });

  const byName = {};
  costings.forEach(c => {
    const x = c.data ? c.data() : c;
    const productName = nameById[x.productId];
    if (!productName) return;
    const totalCost = Number(x?.totals?.totalCost ?? 0);
    const batchSize = Number(x.batchSize) || 1000;
    const batchUnit = x.batchUnit || 'g';
    if (batchSize <= 0) return;
    byName[productName] = {
      costPerBaseUnit: totalCost / batchSize,
      baseUnit: batchUnit
    };
  });
  return byName;
};

// ============================================================
// COMPONENT
// ============================================================
const Reports = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('sales');
  const [reportType, setReportType] = useState('daily');
  const [startDate, setStartDate] = useState(localDate());
  const [endDate, setEndDate] = useState(localDate());
  const [selectedCustomer, setSelectedCustomer] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [showFilters, setShowFilters] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ★ RAW data state — collects from Firebase, computed values derived via useMemo
  const [rawSales, setRawSales] = useState([]);
  const [rawPayments, setRawPayments] = useState([]);
  const [rawProduction, setRawProduction] = useState([]);
  const [rawIngredients, setRawIngredients] = useState([]);
  const [rawPacking, setRawPacking] = useState([]);
  const [rawStock, setRawStock] = useState([]);
  const [rawCashbook, setRawCashbook] = useState([]);
  const [rawExpenses, setRawExpenses] = useState([]);
  const [rawInvestments, setRawInvestments] = useState([]);
  const [rawAssets, setRawAssets] = useState([]);
  const [rawCustomers, setRawCustomers] = useState([]);
  const [rawProducts, setRawProducts] = useState([]);
  const [rawCostings, setRawCostings] = useState([]);

  // ============================================================
  // LISTENER — customers & products (for filters)
  // ============================================================
  useEffect(() => {
    const u1 = onSnapshot(collection(db, 'customers'), (snap) => {
      setRawCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, e => console.warn('customers:', e.message));
    const u2 = onSnapshot(collection(db, 'products'), (snap) => {
      setRawProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, e => console.warn('products:', e.message));
    return () => { u1(); u2(); };
  }, []);

  // ============================================================
  // SALES — listen to daily_sales + sales_payments
  // ============================================================
  useEffect(() => {
    if (activeTab !== 'sales') return;
    setLoading(true);

    // ★ Determine date range based on report type
    let rangeStart, rangeEnd;
    if (reportType === 'daily') {
      rangeStart = startDate;
      rangeEnd = startDate;
    } else if (reportType === 'weekly') {
      const d = new Date();
      d.setDate(d.getDate() - 6);
      rangeStart = localDate(d);
      rangeEnd = localDate();
    } else if (reportType === 'monthly') {
      const now = new Date();
      rangeStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      rangeEnd   = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;
    } else {
      rangeStart = startDate;
      rangeEnd = endDate;
    }

    const qSales = query(
      collection(db, 'daily_sales'),
      where('date', '>=', rangeStart),
      where('date', '<=', rangeEnd)
    );
    const qPayments = query(
      collection(db, 'sales_payments'),
      where('date', '>=', rangeStart),
      where('date', '<=', rangeEnd)
    );

    const u1 = onSnapshot(qSales, (snap) => {
      // ★ Filter out payment-only entries
      setRawSales(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(isRealSale));
    }, e => { console.error('sales:', e.message); setError('Failed to load sales'); });

    const u2 = onSnapshot(qPayments, (snap) => {
      setRawPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, e => console.warn('payments:', e.message));

    setLoading(false);
    return () => { u1(); u2(); };
  }, [activeTab, reportType, startDate, endDate]);

  // ============================================================
  // PRODUCTION + COSTINGS
  // ============================================================
  useEffect(() => {
    if (activeTab !== 'production') return;
    setLoading(true);

    const u1 = onSnapshot(collection(db, 'production'), (snap) => {
      setRawProduction(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, e => { console.error('production:', e.message); setLoading(false); });

    const u2 = onSnapshot(collection(db, 'productCostings'), (snap) => {
      setRawCostings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, e => console.warn('costings:', e.message));

    return () => { u1(); u2(); };
  }, [activeTab]);

  // ============================================================
  // STOCK — ingredients + packing + stock
  // ============================================================
  useEffect(() => {
    if (activeTab !== 'stock') return;
    setLoading(true);
    let loaded = { ing: false, pack: false, stock: false };
    const flush = () => {
      if (loaded.ing && loaded.pack && loaded.stock) setLoading(false);
    };

    const u1 = onSnapshot(collection(db, 'ingredients'), (snap) => {
      setRawIngredients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      loaded.ing = true; flush();
    }, e => { console.warn('ingredients:', e.message); loaded.ing = true; flush(); });

    const u2 = onSnapshot(collection(db, 'packingMaterials'), (snap) => {
      setRawPacking(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      loaded.pack = true; flush();
    }, e => { console.warn('packing:', e.message); loaded.pack = true; flush(); });

    const u3 = onSnapshot(collection(db, 'stock'), (snap) => {
      setRawStock(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      loaded.stock = true; flush();
    }, e => { console.warn('stock:', e.message); loaded.stock = true; flush(); });

    return () => { u1(); u2(); u3(); };
  }, [activeTab]);

  // ============================================================
  // FINANCE — cashbook + expenses + investments + assets + customers + costings
  // ============================================================
  useEffect(() => {
    if (activeTab !== 'finance') return;
    setLoading(true);
    let loaded = { cb: false, ex: false, inv: false, ast: false, cus: false, cost: false };
    const flush = () => {
      if (loaded.cb && loaded.ex && loaded.inv && loaded.ast && loaded.cus && loaded.cost) {
        setLoading(false);
      }
    };

    const u1 = onSnapshot(collection(db, 'cashbook'), (snap) => {
      setRawCashbook(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      loaded.cb = true; flush();
    }, e => { console.warn('cashbook:', e.message); loaded.cb = true; flush(); });

    const u2 = onSnapshot(collection(db, 'expenses'), (snap) => {
      setRawExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      loaded.ex = true; flush();
    }, e => { console.warn('expenses:', e.message); loaded.ex = true; flush(); });

    const u3 = onSnapshot(collection(db, 'investments'), (snap) => {
      setRawInvestments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      loaded.inv = true; flush();
    }, e => { console.warn('investments:', e.message); loaded.inv = true; flush(); });

    const u4 = onSnapshot(collection(db, 'assets'), (snap) => {
      setRawAssets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      loaded.ast = true; flush();
    }, e => { console.warn('assets:', e.message); loaded.ast = true; flush(); });

    const u5 = onSnapshot(collection(db, 'customers'), (snap) => {
      setRawCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      loaded.cus = true; flush();
    }, e => { console.warn('customers:', e.message); loaded.cus = true; flush(); });

    // ★ Need costings for COGS in P&L
    const u6 = onSnapshot(collection(db, 'productCostings'), (snap) => {
      setRawCostings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      loaded.cost = true; flush();
    }, e => { console.warn('costings:', e.message); loaded.cost = true; flush(); });

    return () => { u1(); u2(); u3(); u4(); u5(); u6(); };
  }, [activeTab]);

  // ============================================================
  // DERIVED — SALES
  // ============================================================
  const salesReport = useMemo(() => {
    // ★ Apply customer / product filters
    let sales = rawSales;
    if (selectedCustomer !== 'all') {
      sales = sales.filter(s => s.customerName === selectedCustomer);
    }
    if (selectedProduct !== 'all') {
      sales = sales.filter(s =>
        (s.products || []).some(p => p.name === selectedProduct)
      );
    }

    const total = sales.reduce((s, x) => s + num(x.grandTotal), 0);
    const orders = sales.length;
    const averageOrder = orders > 0 ? total / orders : 0;

    // Customer-wise
    const customerMap = {};
    sales.forEach(s => {
      const name = s.customerName || 'Unknown';
      if (!customerMap[name]) customerMap[name] = { amount: 0, orders: 0 };
      customerMap[name].amount += num(s.grandTotal);
      customerMap[name].orders += 1;
    });
    const byCustomer = Object.entries(customerMap)
      .map(([name, d]) => ({ name, amount: d.amount, orders: d.orders }))
      .sort((a, b) => b.amount - a.amount);

    // Product-wise
    const productMap = {};
    sales.forEach(s => {
      (s.products || []).forEach(p => {
        const name = p.name || 'Unknown';
        if (!productMap[name]) productMap[name] = { quantity: 0, amount: 0 };
        productMap[name].quantity += num(p.quantity);
        productMap[name].amount += num(p.total);
      });
    });
    const byProduct = Object.entries(productMap)
      .map(([name, d]) => ({ name, quantity: d.quantity, amount: d.amount }))
      .sort((a, b) => b.amount - a.amount);

    // ★ Payment modes — from sales_payments (real collection), not from sale.paymentMode
    const paymentModes = {};
    rawPayments.forEach(p => {
      const mode = p.mode || 'cash';
      paymentModes[mode] = num(paymentModes[mode]) + num(p.amount);
    });

    // Weekly days / Monthly weeks
    let days = [], weeks = [];
    if (reportType === 'weekly') {
      const dayMap = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        dayMap[localDate(d)] = 0;
      }
      sales.forEach(s => {
        if (dayMap[s.date] !== undefined) dayMap[s.date] += num(s.grandTotal);
      });
      days = Object.entries(dayMap).map(([date, amount]) => ({
        day: new Date(date + 'T12:00:00').toLocaleDateString('en', { weekday: 'short' }),
        amount
      }));
    } else if (reportType === 'monthly') {
      const weekMap = {};
      sales.forEach(s => {
        const day = new Date(s.date + 'T12:00:00').getDate();
        const week = `Week ${Math.ceil(day / 7)}`;
        weekMap[week] = num(weekMap[week]) + num(s.grandTotal);
      });
      weeks = Object.entries(weekMap).map(([week, amount]) => ({ week, amount }));
    }

    return { total, orders, averageOrder, byCustomer, byProduct, paymentModes, days, weeks };
  }, [rawSales, rawPayments, reportType, selectedCustomer, selectedProduct]);

  // ============================================================
  // DERIVED — PRODUCTION (with Product Costing integration)
  // ============================================================
  const productionReport = useMemo(() => {
    const costingsByName = buildCostingsByName(rawProducts, rawCostings);
    const items = rawProduction.length;
    let total = 0;
    let totalCost = 0;

    const productMap = {};
    rawProduction.forEach(p => {
      const name = p.productName || 'Unknown';
      const qty = num(p.produced);
      const unit = p.unit || 'kg';
      total += qty;

      // ★ Compute cost from Product Costing
      const c = costingsByName[name];
      let batchCost = 0;
      if (c) {
        const qtyInBase = convertToBase(qty, unit, c.baseUnit);
        batchCost = qtyInBase * c.costPerBaseUnit;
      }
      totalCost += batchCost;

      if (!productMap[name]) productMap[name] = { quantity: 0, cost: 0, unit };
      productMap[name].quantity += qty;
      productMap[name].cost += batchCost;
    });

    const costPerKg = total > 0 ? totalCost / total : 0;

    const byProduct = Object.entries(productMap)
      .map(([name, d]) => ({
        name,
        quantity: d.quantity,
        unit: d.unit,
        cost: d.cost,
        costPerKg: d.quantity > 0 ? d.cost / d.quantity : 0
      }))
      .sort((a, b) => b.cost - a.cost);

    const batches = rawProduction
      .map(p => {
        const name = p.productName || 'Unknown';
        const qty = num(p.produced);
        const unit = p.unit || 'kg';
        const c = costingsByName[name];
        const batchCost = c ? convertToBase(qty, unit, c.baseUnit) * c.costPerBaseUnit : 0;
        return {
          batch: p.batchNumber || `B-${p.date || ''}`,
          product: name,
          quantity: qty,
          unit,
          cost: batchCost,
          date: p.date || 'N/A'
        };
      })
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
      .slice(0, 10);

    // Monthly
    const monthMap = {};
    rawProduction.forEach(p => {
      if (!p.date) return;
      const month = String(p.date).substring(0, 7);
      const name = p.productName || 'Unknown';
      const qty = num(p.produced);
      const unit = p.unit || 'kg';
      const c = costingsByName[name];
      const cost = c ? convertToBase(qty, unit, c.baseUnit) * c.costPerBaseUnit : 0;
      if (!monthMap[month]) monthMap[month] = { quantity: 0, cost: 0 };
      monthMap[month].quantity += qty;
      monthMap[month].cost += cost;
    });
    const monthly = Object.entries(monthMap)
      .map(([month, d]) => ({ month, quantity: d.quantity, cost: d.cost }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return { total, items, costPerKg, byProduct, batches, monthly, totalCost };
  }, [rawProduction, rawProducts, rawCostings]);

  // ============================================================
  // DERIVED — STOCK
  // ============================================================
  const stockReport = useMemo(() => {
    const ingredients = rawIngredients.map(x => ({
      name: x.ingredientName || x.name || 'Unknown',
      stock: num(x.currentStock ?? ((num(x.openingStock) + (x.purchases || []).reduce((s, p) => s + num(p.quantity), 0)) - (x.usage || []).reduce((s, u) => s + num(u.productionUsage) + num(u.wastage), 0))),
      purchased: num(x.purchases?.reduce((s, p) => s + num(p.quantity), 0)),
      used: num(x.usage?.reduce((s, u) => s + num(u.productionUsage) + num(u.wastage), 0)),
      reorderLevel: num(x.reorderLevel) || 5,
      unit: x.unit || 'kg'
    }));

    const packingMaterials = rawPacking.map(x => ({
      name: x.materialName || x.name || 'Unknown',
      stock: num(x.currentStock ?? ((num(x.openingQuantity) + (x.purchases || []).reduce((s, p) => s + num(p.quantity), 0)) - (x.usage || []).reduce((s, u) => s + num(u.used) + num(u.damaged), 0))),
      purchased: num(x.purchases?.reduce((s, p) => s + num(p.quantity), 0)),
      used: num(x.usage?.reduce((s, u) => s + num(u.used) + num(u.damaged), 0)),
      reorderLevel: num(x.reorderLevel) || 100,
      unit: x.unit || 'pcs'
    }));

    const finishedProducts = rawStock.map(x => ({
      name: x.productName || 'Unknown',
      produced: num(x.produced),
      sold: num(x.sold),
      stock: Math.max(0, num(x.produced) - num(x.sold)),
      unit: x.unit || 'kg'
    }));

    const lowStockItems = [
      ...ingredients.filter(i => i.stock <= i.reorderLevel).map(i => ({ ...i, category: 'Ingredient' })),
      ...packingMaterials.filter(p => p.stock <= p.reorderLevel).map(p => ({ ...p, category: 'Packing' })),
      ...finishedProducts.filter(f => f.stock < 30).map(f => ({ ...f, category: 'Finished', reorderLevel: 30 }))
    ];

    return { ingredients, packingMaterials, finishedProducts, lowStockItems };
  }, [rawIngredients, rawPacking, rawStock]);

  // ============================================================
  // DERIVED — FINANCE (with Product Costing COGS)
  // ============================================================
  const financeReport = useMemo(() => {
    // Cashbook
    const cb = { opening: 0, sales: 0, expense: 0, owner: 0, closing: 0 };
    rawCashbook.forEach(d => {
      cb.sales += num(d.sales);
      cb.expense += num(d.expense);
      cb.owner += num(d.owner);
    });
    if (rawCashbook.length > 0) {
      const sorted = [...rawCashbook].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      cb.closing = num(sorted[0].closingBalance);
      cb.opening = num(sorted[sorted.length - 1].openingBalance);
    }

    // Expenses
    const totalExpenses = rawExpenses.reduce((s, e) => s + num(e.amount), 0);
    const categoryMap = {};
    rawExpenses.forEach(e => {
      const cat = e.category || 'other';
      categoryMap[cat] = num(categoryMap[cat]) + num(e.amount);
    });
    const byCategory = Object.entries(categoryMap)
      .map(([category, amount]) => ({
        category: category.charAt(0).toUpperCase() + category.slice(1),
        amount
      }))
      .sort((a, b) => b.amount - a.amount);

    // Investments
    const totalInvestments = rawInvestments.reduce((s, i) => s + num(i.investment ?? i.amount), 0);

    // Assets
    const totalAssets = rawAssets.reduce((s, a) => s + num(a.purchasePrice) * (num(a.quantity) || 1), 0);

    // ★ Customer outstanding — derived from transactions
    let customerOutstanding = 0;
    rawCustomers.forEach(c => {
      let purchases = 0, paid = 0;
      (c.transactions || []).forEach(t => {
        const amt = num(t.amount);
        if (t.type === 'sale' || t.type === 'credit') purchases += amt;
        else if (t.type === 'payment') paid += amt;
      });
      customerOutstanding += Math.max(0, purchases - paid + num(c.openingBalance));
    });

    // ★ Profit & Loss — computed from REAL sources
    // 1. Total sales — from daily_sales (real sales only)
    const realSales = rawSales.filter(isRealSale);
    const totalSales = realSales.reduce((s, x) => s + num(x.grandTotal), 0);

    // 2. COGS — from Product Costing applied to each sale
    const costingsByName = buildCostingsByName(rawProducts, rawCostings);
    let cogs = 0;
    realSales.forEach(sale => {
      (sale.products || []).forEach(p => {
        const c = costingsByName[p.name];
        if (!c) return;
        const qtyInBase = convertToBase(p.quantity, p.unit, c.baseUnit);
        cogs += qtyInBase * c.costPerBaseUnit;
      });
    });

    // 3. Gross Profit = Sales − COGS
    const grossProfit = totalSales - cogs;
    const grossMarginPct = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;

    // 4. Net Profit = Gross Profit − Operating Expenses
    const netProfit = grossProfit - totalExpenses;
    const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

    return {
      cashbook: cb,
      expenses: { total: totalExpenses, byCategory },
      investments: { total: totalInvestments },
      assets: { total: totalAssets },
      outstanding: { customers: customerOutstanding, suppliers: 0 },
      profitLoss: {
        sales: totalSales,
        cogs,                 // ← real COGS from costing
        grossProfit,
        grossMarginPct,
        expenses: totalExpenses,
        netProfit,
        profitMargin
      }
    };
  }, [rawCashbook, rawExpenses, rawInvestments, rawAssets, rawCustomers, rawSales, rawProducts, rawCostings]);

  // ============================================================
  // UI HELPERS
  // ============================================================
  const getTabIcon = (tab) => ({
    sales: <ShoppingBag className="w-4 h-4" />,
    production: <Factory className="w-4 h-4" />,
    stock: <Box className="w-4 h-4" />,
    finance: <Wallet className="w-4 h-4" />
  }[tab] || <ShoppingBag className="w-4 h-4" />);

  const getReportTypeLabel = (type) => ({
    daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', custom: 'Custom'
  }[type] || type);

  const formatCurrency = (amount) => `₹${num(amount).toFixed(2)}`;

  // ============================================================
  // RENDER: SALES
  // ============================================================
  const renderSalesReport = () => {
    const data = salesReport;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Sales</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.total)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Orders</p>
            <p className="text-2xl font-bold text-gray-900">{data.orders}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Average Order</p>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(data.averageOrder)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Payments Received</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(Object.values(data.paymentModes || {}).reduce((s, x) => s + num(x), 0))}
            </p>
          </div>
        </div>

        {data.byCustomer && data.byCustomer.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h4 className="text-sm font-semibold text-gray-700 mb-4">Customer-wise Sales</h4>
              <div className="space-y-3">
                {data.byCustomer.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{item.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">{item.orders} orders</span>
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(item.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h4 className="text-sm font-semibold text-gray-700 mb-4">Product-wise Sales</h4>
              <div className="space-y-3">
                {data.byProduct && data.byProduct.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{item.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">{item.quantity} units</span>
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(item.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {data.paymentModes && Object.keys(data.paymentModes).length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Payment Modes (Received)</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(data.paymentModes).map(([mode, amount]) => (
                <div key={mode} className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 capitalize">{mode}</p>
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(amount)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.days && data.days.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Weekly Sales</h4>
            <div className="space-y-2">
              {data.days.map((d, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-10">{d.day}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, (d.amount / Math.max(...data.days.map(x => x.amount), 1)) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-700 w-20 text-right">{formatCurrency(d.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ============================================================
  // RENDER: PRODUCTION
  // ============================================================
  const renderProductionReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Production</p>
          <p className="text-2xl font-bold text-gray-900">
            {productionReport.total.toFixed(1)} units
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Items Produced</p>
          <p className="text-2xl font-bold text-gray-900">{productionReport.items}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Avg Cost/Unit</p>
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(productionReport.costPerKg)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Cost</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(productionReport.totalCost)}</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
        ℹ️ Production cost is estimated from <strong>Product Costing</strong> module — the standard cost per unit of each product.
      </div>

      {productionReport.byProduct.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Product-wise Production</h4>
            <div className="space-y-3">
              {productionReport.byProduct.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{item.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{item.quantity.toFixed(1)} {item.unit}</span>
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(item.cost)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Recent Batches</h4>
            <div className="space-y-3">
              {productionReport.batches.slice(0, 5).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-900">{item.batch}</span>
                    <span className="text-xs text-gray-400 ml-2">{item.product}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{item.quantity} {item.unit}</span>
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(item.cost)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ============================================================
  // RENDER: STOCK
  // ============================================================
  const renderStockReport = () => {
    const { ingredients, packingMaterials, finishedProducts, lowStockItems } = stockReport;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Finished Products</p>
            <p className="text-2xl font-bold text-gray-900">{finishedProducts.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Ingredients</p>
            <p className="text-2xl font-bold text-gray-900">{ingredients.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Packing Materials</p>
            <p className="text-2xl font-bold text-gray-900">{packingMaterials.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Low Stock Items</p>
            <p className="text-2xl font-bold text-red-600">{lowStockItems.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Finished Products</h4>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {finishedProducts.length === 0 && (
                <p className="text-sm text-gray-400 italic">No products</p>
              )}
              {finishedProducts.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{item.name}</span>
                  <span className={`text-sm font-bold ${item.stock < 30 ? 'text-red-600' : 'text-green-600'}`}>
                    {item.stock.toFixed(1)} {item.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Ingredients</h4>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {ingredients.length === 0 && (
                <p className="text-sm text-gray-400 italic">No ingredients</p>
              )}
              {ingredients.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{item.name}</span>
                  <span className={`text-sm font-bold ${item.stock <= item.reorderLevel ? 'text-red-600' : 'text-green-600'}`}>
                    {item.stock.toFixed(1)} {item.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Packing Materials</h4>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {packingMaterials.length === 0 && (
                <p className="text-sm text-gray-400 italic">No materials</p>
              )}
              {packingMaterials.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{item.name}</span>
                  <span className={`text-sm font-bold ${item.stock <= item.reorderLevel ? 'text-red-600' : 'text-green-600'}`}>
                    {item.stock.toFixed(1)} {item.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {lowStockItems.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-red-700 mb-3">⚠️ Low Stock Alerts</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {lowStockItems.slice(0, 8).map((item, idx) => (
                <div key={idx} className="bg-white rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-600 truncate">{item.name}</p>
                  <p className="text-xs text-gray-400">{item.category}</p>
                  <p className="text-sm font-bold text-red-600">{item.stock.toFixed(1)} {item.unit}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ============================================================
  // RENDER: FINANCE
  // ============================================================
  const renderFinanceReport = () => {
    const pl = financeReport.profitLoss;

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Profit & Loss Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-500">Total Sales</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(pl.sales)}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-500">COGS (from Costing)</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(pl.cogs)}</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-500">Gross Profit</p>
              <p className="text-2xl font-bold text-amber-600">{formatCurrency(pl.grossProfit)}</p>
              <p className="text-xs text-gray-500 mt-1">{pl.grossMarginPct.toFixed(1)}% margin</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-500">Expenses</p>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(pl.expenses)}</p>
            </div>
            <div className={`rounded-lg p-4 text-center md:col-span-4 ${pl.netProfit >= 0 ? 'bg-blue-50' : 'bg-red-100'}`}>
              <p className="text-xs text-gray-500">Net Profit</p>
              <p className={`text-3xl font-bold ${pl.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {formatCurrency(pl.netProfit)}
              </p>
              <p className="text-sm text-gray-600 mt-1">{pl.profitMargin.toFixed(1)}% margin</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Expenses by Category</h4>
            {financeReport.expenses.byCategory.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No expenses recorded</p>
            ) : (
              <div className="space-y-3">
                {financeReport.expenses.byCategory.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{item.category}</span>
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Cashbook Summary</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Opening Balance</span>
                <span className="text-sm font-medium text-gray-900">{formatCurrency(financeReport.cashbook.opening)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Sales</span>
                <span className="text-sm font-medium text-green-600">{formatCurrency(financeReport.cashbook.sales)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Expenses</span>
                <span className="text-sm font-medium text-red-600">{formatCurrency(financeReport.cashbook.expense)}</span>
              </div>
              <div className="flex items-center justify-between border-t pt-2">
                <span className="text-sm font-semibold text-gray-700">Closing Balance</span>
                <span className="text-lg font-bold text-emerald-600">{formatCurrency(financeReport.cashbook.closing)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Outstanding</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Customer Outstanding</span>
                <span className="text-lg font-bold text-amber-600">{formatCurrency(financeReport.outstanding.customers)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Supplier Outstanding</span>
                <span className="text-lg font-bold text-amber-600">{formatCurrency(financeReport.outstanding.suppliers)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Investments & Assets</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Investments</span>
                <span className="text-lg font-bold text-purple-600">{formatCurrency(financeReport.investments.total)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Assets</span>
                <span className="text-lg font-bold text-blue-600">{formatCurrency(financeReport.assets.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================
  // LOADING / ERROR
  // ============================================================
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
    <div className="space-y-5 md:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 backdrop-blur rounded-xl">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">Reports</h1>
              <p className="text-indigo-100 text-sm">Real-time business analytics</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur px-3 py-2 rounded-xl border border-white/30">
              <Calendar className="w-4 h-4 text-white" />
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent outline-none text-sm text-white w-28 [color-scheme:dark]" />
              <span className="text-white/60">to</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent outline-none text-sm text-white w-28 [color-scheme:dark]" />
            </div>
            <button className="bg-white text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {['daily', 'weekly', 'monthly', 'custom'].map((type) => (
              <button
                key={type}
                onClick={() => setReportType(type)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  reportType === type ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {getReportTypeLabel(type)}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Filter className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-600">Filters</span>
          </button>
          <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
            <Printer className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Customer</label>
              <select value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="all">All Customers</option>
                {rawCustomers.map(c => (
                  <option key={c.id} value={c.customerName}>{c.customerName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Product</label>
              <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="all">All Products</option>
                {rawProducts.map(p => (
                  <option key={p.id} value={p.productName}>{p.productName}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end md:col-span-2">
              <button
                onClick={() => { setSelectedCustomer('all'); setSelectedProduct('all'); }}
                className="w-full px-4 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {['sales', 'production', 'stock', 'finance'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {getTabIcon(tab)}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="p-4 md:p-6">
          {activeTab === 'sales' && renderSalesReport()}
          {activeTab === 'production' && renderProductionReport()}
          {activeTab === 'stock' && renderStockReport()}
          {activeTab === 'finance' && renderFinanceReport()}
        </div>
      </div>
    </div>
  );
};

export default Reports;