// Pages/Dashboard/Dashboard.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { db } from '../../firebase/firebaseConfig';
import {
  collection, query, where, getDocs, onSnapshot, orderBy, limit
} from 'firebase/firestore';

import {
  today, yesterday, fmt2, changeLabel,
  deriveOutstanding, totalAssetValue, buildRecentRow
} from './utils/dashboardHelpers';

import DashboardHeader from './widgets/DashboardHeader';
import StatsCards from './widgets/StatsCards';
import FinancialOverview from './widgets/FinancialOverview';
import StockProduction from './widgets/StockProduction';
import LowStockAlerts from './widgets/LowStockAlerts';
import RecentActivity from './widgets/RecentActivity';
import QuickActions from './widgets/QuickActions';

// ★ Filter out payment-only entries from daily_sales
const isRealSale = (d) => {
  const x = d.data ? d.data() : d;
  return !x.isPaymentOnly;
};

const Dashboard = () => {
  const [selectedDate, setSelectedDate] = useState(today());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(null);

  const fetchInFlight = useRef(false);
  const lastFetchRef = useRef(0);

  // Raw numeric refs for cross-listener math
  const salesRef = useRef(0);
  const expRef = useRef(0);
  const ySalesRef = useRef(0);
  const yExpRef = useRef(0);

  // Value state keyed by card id (race-safe)
  const [statValues, setStatValues] = useState({});
  const [financialValues, setFinancialValues] = useState({});
  const [stockValues, setStockValues] = useState({});

  // List content
  const [alerts, setAlerts] = useState([]);
  const [recent, setRecent] = useState([]);
  const [finishedDetail, setFinishedDetail] = useState([]);
  const [ingredientDetail, setIngredientDetail] = useState([]);

  // ============================================================
  // APPLY FULL DATA
  // ============================================================
  const applyData = useCallback((d) => {
    const profit = d.sales - d.expenses;
    const yProfit = d.ySales - d.yExpenses;
    const collectRate = d.sales > 0 ? (d.received / d.sales * 100) : 0;

    setStatValues({
      'today-sales': {
        value: fmt2(d.sales),
        change: changeLabel(d.sales, d.ySales),
        subtitle: `${d.salesCount} orders • vs yesterday ${changeLabel(d.sales, d.ySales)} ${fmt2(d.sales - d.ySales)}`
      },
      'today-collection': {
        value: fmt2(d.received),
        change: `${collectRate.toFixed(0)}% collected`,
        subtitle: `${d.todayPaymentCount} payments received today`
      },
      'today-expenses': {
        value: fmt2(d.expenses),
        change: changeLabel(d.expenses, d.yExpenses),
        subtitle: `vs yesterday ${changeLabel(d.expenses, d.yExpenses)} ${fmt2(d.expenses - d.yExpenses)}`
      },
      // ★ id must match STATS_CONFIG: 'gross-margin'
      'gross-margin': {
        value: fmt2(profit),
        change: changeLabel(profit, yProfit),
        subtitle: 'Sales − Expenses • COGS not deducted'
      }
    });

    setFinancialValues({
      'cash-collection': {
        value: d.cash > 0 ? fmt2(d.cash) : '—',
        subtitle: 'Cash received today'
      },
      'upi-bank-collection': {
        value: (d.upi + d.bank) > 0 ? fmt2(d.upi + d.bank) : '—',
        subtitle: `UPI: ${fmt2(d.upi)} • Bank: ${fmt2(d.bank)}`
      },
      'total-outstanding': {
        value: d.outstanding > 0 ? fmt2(d.outstanding) : '—',
        subtitle: `${d.pendingCustomers} customers pending`
      },
      'total-investment': {
        value: d.investment > 0 ? fmt2(d.investment) : '—',
        subtitle: ''
      },
      'total-assets': {
        value: d.assets > 0 ? fmt2(d.assets) : '—',
        subtitle: `${d.assetCount || 0} items`
      }
    });

    setStockValues({
      'today-production': {
        value: `${(d.production || 0).toFixed(1)} units`,
        subtitle: `${d.productionItems} items produced`
      },
      'finished-stock': {
        value: `${d.finishedCount} variants`,
        subtitle: `${d.finishedDetail.length} product sizes`
      },
      'ingredient-stock': {
        value: `${d.ingredientCount} items`,
        subtitle: `${d.ingredientDetail.length} ingredients available`
      },
      'packing-stock': {
        value: `${d.packingCount} types`,
        subtitle: `${d.packingAlerts} low stock alerts`
      }
    });

    setAlerts(d.alerts);
    setFinishedDetail(d.finishedDetail);
    setIngredientDetail(d.ingredientDetail);
    setRecent(d.transactions);
  }, []);

  // ============================================================
  // COLLECTION — query sales_payments by payment date
  // ============================================================
  const computeCollection = useCallback(async (dateStr) => {
    let received = 0, cash = 0, upi = 0, bank = 0, count = 0;
    try {
      const snap = await getDocs(query(
        collection(db, 'sales_payments'),
        where('date', '==', dateStr)
      ));
      snap.docs.forEach(d => {
        const x = d.data();
        const r = Number(x.amount) || 0;
        if (r <= 0) return;
        received += r;
        const m = x.mode || 'cash';
        if (m === 'cash') cash += r;
        else if (m === 'upi') upi += r;
        else if (m === 'bank') bank += r;
        count++;
      });
    } catch (err) {
      console.warn('⚠️ sales_payments query failed:', err.message);
    }
    return { received, cash, upi, bank, count };
  }, []);

  // ============================================================
  // FETCH
  // ============================================================
  const fetchData = useCallback(async (force = false) => {
    if (fetchInFlight.current) return;
    if (!force && Date.now() - lastFetchRef.current < 30000) return;

    fetchInFlight.current = true;
    setIsFetching(true);
    setLoading(true);
    setError(null);

    try {
      const yStr = yesterday(selectedDate);

      const empty = { docs: [], size: 0 };
      const safe = (p) => p.catch(e => { console.log('⚠️', e.message); return empty; });

      const [
        salesS, ySalesS, expS, yExpS, custS, ingS, prodS, finS, packS, invS, astS
      ] = await Promise.all([
        safe(getDocs(query(collection(db, 'daily_sales'), where('date', '==', selectedDate)))),
        safe(getDocs(query(collection(db, 'daily_sales'), where('date', '==', yStr)))),
        safe(getDocs(query(collection(db, 'expenses'), where('date', '==', selectedDate)))),
        safe(getDocs(query(collection(db, 'expenses'), where('date', '==', yStr)))),
        safe(getDocs(collection(db, 'customers'))),
        safe(getDocs(collection(db, 'ingredients'))),
        safe(getDocs(query(collection(db, 'production'), where('date', '==', selectedDate)))),
        safe(getDocs(collection(db, 'finishedStock'))),
        safe(getDocs(collection(db, 'packingMaterials'))),
        safe(getDocs(collection(db, 'investments'))),
        safe(getDocs(collection(db, 'assets')))
      ]);

      // ★ Filter real sales only (exclude payment-only entries)
      const realSalesDocs = salesS.docs.filter(isRealSale);
      const realYSalesDocs = ySalesS.docs.filter(isRealSale);

      // ---- Recent sales (5 most recent by date) — real sales only ----
      const recentSalesSnap = await safe(
        getDocs(query(
          collection(db, 'daily_sales'),
          orderBy('date', 'desc'),
          limit(20)
        ))
      );
      const recentRealSales = recentSalesSnap.docs
        .filter(isRealSale)
        .slice(0, 5);

      // ---- Fetch all payments for those recent sales ----
      let recentPayments = [];
      if (recentRealSales.length > 0) {
        const ids = recentRealSales.map(d => d.id);
        try {
          const paySnap = await getDocs(query(
            collection(db, 'sales_payments'),
            where('saleId', 'in', ids)
          ));
          recentPayments = paySnap.docs.map(d => d.data());
        } catch (e) {
          console.warn('⚠️ recent payments query failed:', e.message);
        }
      }
      const paidBySale = {};
      recentPayments.forEach(p => {
        if (!p.saleId) return;
        paidBySale[p.saleId] = (paidBySale[p.saleId] || 0) + (Number(p.amount) || 0);
      });

      const collection_ = await computeCollection(selectedDate);
      const { received, cash, upi, bank, count: todayPaymentCount } = collection_;

      // ★ Sales — real sales only
      const sales = realSalesDocs.reduce((s, d) => s + (Number(d.data().grandTotal) || 0), 0);
      const ySales = realYSalesDocs.reduce((s, d) => s + (Number(d.data().grandTotal) || 0), 0);
      const expenses = expS.docs.reduce((s, d) => s + (Number(d.data().amount) || 0), 0);
      const yExpenses = yExpS.docs.reduce((s, d) => s + (Number(d.data().amount) || 0), 0);

      salesRef.current = sales; expRef.current = expenses;
      ySalesRef.current = ySales; yExpRef.current = yExpenses;

      // Customers
      let outstanding = 0, pendingCustomers = 0;
      custS.docs.forEach(d => {
        const balance = deriveOutstanding(d.data());
        outstanding += balance;
        if (balance > 1) pendingCustomers++;
      });

      // Ingredients
      const ingredientAlerts = [];
      const ingredientDetail = ingS.docs.map(d => {
        const x = d.data();
        const stock = Number(x.currentStock) || 0;
        const unit = x.unit || 'kg';
        const name = x.ingredientName || x.name || 'Unknown';
        const rl = Number(x.reorderLevel) || 5;
        if (stock <= rl) ingredientAlerts.push({
          id: `ing-${d.id}`, name,
          current: `${stock} ${unit}`, min: `${rl} ${unit}`,
          category: 'Ingredients', status: stock <= 2 ? 'Critical' : 'Warning'
        });
        return { id: d.id, name, stock, unit, reorderLevel: rl };
      });

      // Production
      const production = prodS.docs.reduce((s, d) => s + (Number(d.data().produced) || 0), 0);
      const productionItems = prodS.size;

      // Finished stock
      const finishedDetail = finS.docs.map(d => {
        const x = d.data();
        return {
          id: d.id,
          productName: x.productName || x.name || 'Unknown',
          size: x.size || 'N/A',
          stock: Number(x.stock) || 0,
          unit: x.unit || 'packets'
        };
      });

      // Packing
      const packingAlerts = [];
      packS.docs.forEach(d => {
        const x = d.data();
        const stock = Number(x.currentStock) || 0;
        const rl = Number(x.reorderLevel) || 100;
        if (stock <= rl) packingAlerts.push({
          id: `pack-${d.id}`,
          name: x.materialName || x.name || 'Unknown',
          current: `${stock} ${x.unit || 'pcs'}`,
          min: `${rl} ${x.unit || 'pcs'}`,
          category: 'Packing', status: stock <= 50 ? 'Critical' : 'Warning'
        });
      });

      const investment = invS.docs.reduce((s, d) => s + (Number(d.data().investment) || 0), 0);
      const assets = astS.docs.reduce((s, d) => s + totalAssetValue(d), 0);
      const assetCount = astS.docs.reduce((s, d) => s + (Number(d.data().quantity) || 1), 0);

      const transactions = recentRealSales.map(d =>
        buildRecentRow(d, paidBySale[d.id] || 0)
      );

      applyData({
        sales, ySales, expenses, yExpenses,
        received, cash, upi, bank, todayPaymentCount,
        salesCount: realSalesDocs.length,
        outstanding, pendingCustomers,
        ingredientCount: ingS.size, ingredientDetail,
        production, productionItems,
        finishedCount: finS.size, finishedDetail,
        packingCount: packS.size, packingAlerts: packingAlerts.length,
        investment, assets, assetCount,
        alerts: [...ingredientAlerts, ...packingAlerts],
        transactions: transactions.length ? transactions : [
          { id: 'empty', type: 'Sale', customer: 'No recent transactions', amount: 0, time: 'N/A', status: 'Pending' }
        ]
      });

      lastFetchRef.current = Date.now();
      setLastFetchTime(lastFetchRef.current);
    } catch (e) {
      console.error('❌ Dashboard fetch:', e);
      setError('Failed to load dashboard data. Please refresh.');
    } finally {
      fetchInFlight.current = false;
      setLoading(false);
      setIsFetching(false);
    }
  }, [selectedDate, computeCollection, applyData]);

  useEffect(() => { fetchData(true); }, [fetchData]);

  // ============================================================
  // LISTENERS
  // ============================================================
  useEffect(() => {
    let timer = null;
    const debounce = (fn, ms = 400) => { clearTimeout(timer); timer = setTimeout(fn, ms); };
    const unsubs = [];

    // Payments for the selected date
    unsubs.push(onSnapshot(
      query(collection(db, 'sales_payments'), where('date', '==', selectedDate)),
      (snap) => debounce(() => {
        let received = 0, cash = 0, upi = 0, bank = 0, count = 0;
        snap.docs.forEach(d => {
          const x = d.data();
          const r = Number(x.amount) || 0;
          if (r <= 0) return;
          received += r;
          const m = x.mode || 'cash';
          if (m === 'cash') cash += r;
          else if (m === 'upi') upi += r;
          else if (m === 'bank') bank += r;
          count++;
        });
        const rate = salesRef.current > 0 ? (received / salesRef.current * 100) : 0;

        setStatValues(v => ({
          ...v,
          'today-collection': {
            value: fmt2(received),
            change: `${rate.toFixed(0)}% collected`,
            subtitle: `${count} payments received today`
          }
        }));

        setFinancialValues(v => ({
          ...v,
          'cash-collection': { ...(v['cash-collection'] || {}), value: cash > 0 ? fmt2(cash) : '—' },
          'upi-bank-collection': {
            ...(v['upi-bank-collection'] || {}),
            value: (upi + bank) > 0 ? fmt2(upi + bank) : '—',
            subtitle: `UPI: ${fmt2(upi)} • Bank: ${fmt2(bank)}`
          }
        }));
      }),
      (e) => console.log('⚠️ payments listener:', e.message)
    ));

    // Sales (sale date) — filter out payment-only entries
    unsubs.push(onSnapshot(
      query(collection(db, 'daily_sales'), where('date', '==', selectedDate)),
      (snap) => debounce(() => {
        let sales = 0;
        let realCount = 0;
        snap.docs.forEach(d => {
          const x = d.data();
          if (x.isPaymentOnly) return;
          sales += Number(x.grandTotal) || 0;
          realCount++;
        });
        salesRef.current = sales;
        const profit = sales - expRef.current;
        const yProfit = ySalesRef.current - yExpRef.current;

        setStatValues(v => ({
          ...v,
          'today-sales': {
            value: fmt2(sales),
            change: changeLabel(sales, ySalesRef.current),
            subtitle: `${realCount} orders • vs yesterday ${changeLabel(sales, ySalesRef.current)} ${fmt2(sales - ySalesRef.current)}`
          },
          // ★ 'gross-margin' — matches STATS_CONFIG id
          'gross-margin': {
            value: fmt2(profit),
            change: changeLabel(profit, yProfit),
            subtitle: 'Sales − Expenses • COGS not deducted'
          }
        }));
      }),
      (e) => console.log('⚠️ sales listener:', e.message)
    ));

    // Expenses
    unsubs.push(onSnapshot(
      query(collection(db, 'expenses'), where('date', '==', selectedDate)),
      (snap) => debounce(() => {
        const expenses = snap.docs.reduce((s, d) => s + (Number(d.data().amount) || 0), 0);
        expRef.current = expenses;
        const profit = salesRef.current - expenses;
        const yProfit = ySalesRef.current - yExpRef.current;
        setStatValues(v => ({
          ...v,
          'today-expenses': {
            value: fmt2(expenses),
            change: changeLabel(expenses, yExpRef.current),
            subtitle: `vs yesterday ${changeLabel(expenses, yExpRef.current)} ${fmt2(expenses - yExpRef.current)}`
          },
          // ★ 'gross-margin' — matches STATS_CONFIG id
          'gross-margin': {
            value: fmt2(profit),
            change: changeLabel(profit, yProfit),
            subtitle: 'Sales − Expenses • COGS not deducted'
          }
        }));
      }),
      (e) => console.log('⚠️ expenses listener:', e.message)
    ));

    // Customers (outstanding)
    unsubs.push(onSnapshot(collection(db, 'customers'), (snap) => debounce(() => {
      let o = 0, p = 0;
      snap.docs.forEach(d => {
        const v = deriveOutstanding(d.data());
        o += v;
        if (v > 1) p++;
      });
      setFinancialValues(prev => ({
        ...prev,
        'total-outstanding': {
          ...(prev['total-outstanding'] || {}),
          value: o > 0 ? fmt2(o) : '—',
          subtitle: `${p} customers pending`
        }
      }));
    }), (e) => console.log('⚠️ customers listener:', e.message)));

    // Ingredients
    unsubs.push(onSnapshot(collection(db, 'ingredients'), (snap) => debounce(() => {
      const list = [];
      snap.docs.forEach(d => {
        const x = d.data();
        const stock = Number(x.currentStock) || 0;
        const rl = Number(x.reorderLevel) || 5;
        if (stock <= rl) list.push({
          id: `ing-${d.id}`,
          name: x.ingredientName || x.name || 'Unknown',
          current: `${stock} ${x.unit || 'kg'}`,
          min: `${rl} ${x.unit || 'kg'}`,
          category: 'Ingredients',
          status: stock <= 2 ? 'Critical' : 'Warning'
        });
      });
      setAlerts(p => [...p.filter(a => a.category !== 'Ingredients'), ...list]);
    }), (e) => console.log('⚠️ ingredients listener:', e.message)));

    // Packing
    unsubs.push(onSnapshot(collection(db, 'packingMaterials'), (snap) => debounce(() => {
      const list = [];
      snap.docs.forEach(d => {
        const x = d.data();
        const stock = Number(x.currentStock) || 0;
        const rl = Number(x.reorderLevel) || 100;
        if (stock <= rl) list.push({
          id: `pack-${d.id}`,
          name: x.materialName || x.name || 'Unknown',
          current: `${stock} ${x.unit || 'pcs'}`,
          min: `${rl} ${x.unit || 'pcs'}`,
          category: 'Packing',
          status: stock <= 50 ? 'Critical' : 'Warning'
        });
      });
      setAlerts(p => [...p.filter(a => a.category !== 'Packing'), ...list]);
    }), (e) => console.log('⚠️ packing listener:', e.message)));

    // Investments
    unsubs.push(onSnapshot(collection(db, 'investments'), (snap) => debounce(() => {
      const total = snap.docs.reduce((s, d) => s + (Number(d.data().investment) || 0), 0);
      setFinancialValues(p => ({
        ...p,
        'total-investment': { ...(p['total-investment'] || {}), value: total > 0 ? fmt2(total) : '—' }
      }));
    }), (e) => console.log('⚠️ investments listener:', e.message)));

    // Assets
    unsubs.push(onSnapshot(collection(db, 'assets'), (snap) => debounce(() => {
      const total = snap.docs.reduce((s, d) => s + totalAssetValue(d), 0);
      const count = snap.docs.reduce((s, d) => s + (Number(d.data().quantity) || 1), 0);
      setFinancialValues(p => ({
        ...p,
        'total-assets': {
          ...(p['total-assets'] || {}),
          value: total > 0 ? fmt2(total) : '—',
          subtitle: `${count} items`
        }
      }));
    }), (e) => console.log('⚠️ assets listener:', e.message)));

    // Production
    unsubs.push(onSnapshot(
      query(collection(db, 'production'), where('date', '==', selectedDate)),
      (snap) => debounce(() => {
        const total = snap.docs.reduce((s, d) => s + (Number(d.data().produced) || 0), 0);
        setStockValues(p => ({
          ...p,
          'today-production': {
            ...(p['today-production'] || {}),
            value: `${total.toFixed(1)} units`,
            subtitle: `${snap.size} items produced`
          }
        }));
      }),
      (e) => console.log('⚠️ production listener:', e.message)
    ));

    return () => {
      clearTimeout(timer);
      unsubs.forEach(u => { try { u && u(); } catch (e) { console.log(e); } });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  // ============================================================
  // LOADING / ERROR
  // ============================================================
  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Loading dashboard data...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <p className="text-red-600 font-medium">{error}</p>
        <button
          onClick={() => fetchData(true)}
          className="mt-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium">
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 md:space-y-6">
      <DashboardHeader
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        isFetching={isFetching}
        onRefresh={() => fetchData(true)}
      />

      <StatsCards values={statValues} />

      <FinancialOverview values={financialValues} />

      <StockProduction
        values={stockValues}
        finishedDetail={finishedDetail}
        ingredientDetail={ingredientDetail}
        lastFetchTime={lastFetchTime}
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 md:gap-6">
        <LowStockAlerts alerts={alerts} />
        <RecentActivity recent={recent} />
      </div>

      <QuickActions />
    </div>
  );
};

export default Dashboard;