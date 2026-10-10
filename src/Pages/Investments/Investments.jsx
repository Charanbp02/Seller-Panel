// Pages/Investments/Investments.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, Plus, Search, Calendar, Edit, Trash2, Eye, FileText,
  Save, RefreshCw, X, AlertTriangle, Wallet, Building2, PiggyBank,
  Package, Box, Banknote, Smartphone, CreditCard, Loader2
} from 'lucide-react';
import { db } from '../../firebase/firebaseConfig';
import {
  collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot
} from 'firebase/firestore';
import { syncCashbookEntry } from '../../utils/cashbookSync';

// ============================================================
// HELPERS
// ============================================================
const localDate = (d = new Date()) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};
const num = (v) => Number(v) || 0;
const fmt = (n) => `₹${num(n).toFixed(2)}`;

const PAYMENT_MODES = [
  { value: 'cash', label: 'Cash', Icon: Banknote, bg: 'bg-blue-50', text: 'text-blue-700' },
  { value: 'upi', label: 'UPI', Icon: Smartphone, bg: 'bg-purple-50', text: 'text-purple-700' },
  { value: 'bank', label: 'Bank', Icon: Building2, bg: 'bg-indigo-50', text: 'text-indigo-700' },
  { value: 'credit', label: 'Credit (no cash)', Icon: CreditCard, bg: 'bg-orange-50', text: 'text-orange-700' }
];

const CASH_MODES = new Set(['cash', 'upi', 'bank']);

const emptyForm = (date) => ({
  date: date || localDate(),
  paymentMode: 'cash',
  notes: ''
});

// Cost of a single row (today's actual spend, NOT running investment)
const rowCosts = (row) =>
  num(row?.assets) + num(row?.packing) + num(row?.ingredients) + num(row?.expenses);

// ============================================================
// Extract date from various field names
// ============================================================
const getRowDate = (x) => {
  if (!x) return '';
  const v = x.date || x.purchaseDate || x.createdAt || '';
  if (typeof v === 'string') return v.slice(0, 10);
  if (v?.toDate) return localDate(v.toDate());
  if (v instanceof Date) return localDate(v);
  return '';
};

// ============================================================
// Compute per-day aggregates from raw collections
// ============================================================
const computeDailyAggregates = ({ assets, packing, ingredients, expenses, payments }) => {
  const byDate = {};

  const ensure = (d) => {
    if (!byDate[d]) {
      byDate[d] = { assets: 0, packing: 0, ingredients: 0, expenses: 0, selling: 0 };
    }
    return byDate[d];
  };

  assets.forEach((row) => {
    const x = row.data ? row.data() : row;
    const d = getRowDate(x);
    if (!d) return;
    const value = num(x.purchasePrice) * (num(x.quantity) || 1);
    ensure(d).assets += value;
  });

  packing.forEach((row) => {
    const x = row.data ? row.data() : row;
    (x.purchases || []).forEach(p => {
      const d = getRowDate(p);
      if (!d) return;
      ensure(d).packing += num(p.amount);
    });
  });

  ingredients.forEach((row) => {
    const x = row.data ? row.data() : row;
    (x.purchases || []).forEach(p => {
      const d = getRowDate(p);
      if (!d) return;
      ensure(d).ingredients += num(p.amount);
    });
  });

  expenses.forEach((row) => {
    const x = row.data ? row.data() : row;
    const d = getRowDate(x);
    if (!d) return;
    ensure(d).expenses += num(x.amount);
  });

  payments.forEach((row) => {
    const x = row.data ? row.data() : row;
    const d = getRowDate(x);
    if (!d) return;
    ensure(d).selling += num(x.amount);
  });

  return byDate;
};

// ============================================================
// Compute running Investment + Total Balance across dates
// ============================================================
const computeRunningBalance = (rowsAsc) => {
  let runningTB = 0;
  return rowsAsc.map((r, idx) => {
    const costs = rowCosts(r);
    const investment = idx === 0 ? costs : runningTB + costs;
    const totalBalance = investment - num(r.selling);
    runningTB = totalBalance;
    return { ...r, costs, investment, totalBalance };
  });
};

// ============================================================
// COMPONENT
// ============================================================
const Investments = () => {
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(localDate());
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [rawAssets, setRawAssets] = useState([]);
  const [rawPacking, setRawPacking] = useState([]);
  const [rawIngredients, setRawIngredients] = useState([]);
  const [rawExpenses, setRawExpenses] = useState([]);
  const [rawPayments, setRawPayments] = useState([]);
  const [rawMeta, setRawMeta] = useState([]);
  const [collectionsLoaded, setCollectionsLoaded] = useState({
    assets: false, packing: false, ingredients: false,
    expenses: false, payments: false, meta: false
  });

  const [formData, setFormData] = useState(emptyForm());

  const patchForm = (patch) => setFormData(p => ({ ...p, ...patch }));

  // ============================================================
  // LISTENERS — 6 collections
  // ============================================================
  useEffect(() => {
    const subs = [];

    subs.push(onSnapshot(collection(db, 'assets'), (snap) => {
      setRawAssets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setCollectionsLoaded(p => ({ ...p, assets: true }));
    }, (e) => { console.warn('assets:', e.message); setCollectionsLoaded(p => ({ ...p, assets: true })); }));

    subs.push(onSnapshot(collection(db, 'packingMaterials'), (snap) => {
      setRawPacking(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setCollectionsLoaded(p => ({ ...p, packing: true }));
    }, (e) => { console.warn('packing:', e.message); setCollectionsLoaded(p => ({ ...p, packing: true })); }));

    subs.push(onSnapshot(collection(db, 'ingredients'), (snap) => {
      setRawIngredients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setCollectionsLoaded(p => ({ ...p, ingredients: true }));
    }, (e) => { console.warn('ingredients:', e.message); setCollectionsLoaded(p => ({ ...p, ingredients: true })); }));

    subs.push(onSnapshot(collection(db, 'expenses'), (snap) => {
      setRawExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setCollectionsLoaded(p => ({ ...p, expenses: true }));
    }, (e) => { console.warn('expenses:', e.message); setCollectionsLoaded(p => ({ ...p, expenses: true })); }));

    subs.push(onSnapshot(collection(db, 'sales_payments'), (snap) => {
      setRawPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setCollectionsLoaded(p => ({ ...p, payments: true }));
    }, (e) => { console.warn('payments:', e.message); setCollectionsLoaded(p => ({ ...p, payments: true })); }));

    subs.push(onSnapshot(collection(db, 'investments'), (snap) => {
      setRawMeta(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setCollectionsLoaded(p => ({ ...p, meta: true }));
    }, (e) => { console.warn('investments meta:', e.message); setCollectionsLoaded(p => ({ ...p, meta: true })); }));

    return () => subs.forEach(u => { try { u(); } catch {} });
  }, []);

  useEffect(() => {
    const all = Object.values(collectionsLoaded).every(Boolean);
    if (all) setLoading(false);
  }, [collectionsLoaded]);

  // ============================================================
  // COMPUTED
  // ============================================================
  const investmentData = useMemo(() => {
    const byDate = computeDailyAggregates({
      assets: rawAssets,
      packing: rawPacking,
      ingredients: rawIngredients,
      expenses: rawExpenses,
      payments: rawPayments
    });

    rawMeta.forEach(m => {
      const d = m.date;
      if (!d) return;
      if (!byDate[d]) {
        byDate[d] = { assets: 0, packing: 0, ingredients: 0, expenses: 0, selling: 0 };
      }
      byDate[d].paymentMode = m.paymentMode || 'cash';
      byDate[d].notes = m.notes || '';
      byDate[d].metaId = m.id;
    });

    const sortedDates = Object.keys(byDate).sort();
    const rowsAsc = sortedDates.map(d => ({ date: d, ...byDate[d] }));

    const computed = computeRunningBalance(rowsAsc);
    return computed.reverse();
  }, [rawAssets, rawPacking, rawIngredients, rawExpenses, rawPayments, rawMeta]);

  // Preview for current form
  const formPreview = useMemo(() => {
    const byDate = computeDailyAggregates({
      assets: rawAssets,
      packing: rawPacking,
      ingredients: rawIngredients,
      expenses: rawExpenses,
      payments: rawPayments
    });

    const today = byDate[formData.date] || {
      assets: 0, packing: 0, ingredients: 0, expenses: 0, selling: 0
    };

    const priorRows = investmentData
      .filter(r => r.date < formData.date)
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    const prevTB = priorRows.length > 0 ? num(priorRows[0].totalBalance) : 0;

    const costs = rowCosts(today);
    const investment = prevTB + costs;
    const totalBalance = investment - num(today.selling);

    return { ...today, costs, investment, totalBalance, prevTB };
  }, [formData.date, investmentData, rawAssets, rawPacking, rawIngredients, rawExpenses, rawPayments]);

  // ============================================================
  // SAVE — metadata + cashbook sync (using TODAY'S COSTS)
  // ============================================================
  const handleAdd = async () => {
    if (!formData.date) return alert('Please select a date');
    setSaving(true);
    try {
      const existing = rawMeta.find(m => m.date === formData.date);
      const payload = {
        date: formData.date,
        paymentMode: formData.paymentMode || 'cash',
        notes: formData.notes || '',
        updatedAt: new Date().toISOString()
      };

      let docId;
      if (existing) {
        await updateDoc(doc(db, 'investments', existing.id), payload);
        docId = existing.id;
      } else {
        const ref = await addDoc(collection(db, 'investments'), {
          ...payload,
          createdAt: new Date().toISOString()
        });
        docId = ref.id;
      }

      // ✅ Cashbook uses TODAY'S COSTS (not running investment total)
      const investmentAmount = formPreview.costs;
      if (CASH_MODES.has(payload.paymentMode) && investmentAmount > 0) {
        await syncCashbookEntry({
          date: payload.date,
          type: 'investment',
          amount: investmentAmount,
          paymentMode: payload.paymentMode,
          description: `Investment — ${payload.notes || payload.date}`,
          source: 'investments',
          sourceId: docId,
          reference: ''
        });
      }

      showToast('Investment saved & Cashbook synced!');
      handleCancel();
    } catch (e) {
      console.error('save investment:', e);
      alert('Failed to save: ' + (e.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingId && !formData.date) return alert('No entry selected');
    setSaving(true);
    try {
      const oldMeta = rawMeta.find(m => m.id === editingId || m.date === formData.date);
      const oldRow = investmentData.find(i => i.metaId === (oldMeta?.id) || i.date === oldMeta?.date);

      const payload = {
        date: formData.date,
        paymentMode: formData.paymentMode || 'cash',
        notes: formData.notes || '',
        updatedAt: new Date().toISOString()
      };

      let finalDocId = oldMeta?.id || null;

      if (oldMeta) {
        await updateDoc(doc(db, 'investments', oldMeta.id), payload);
      } else {
        const ref = await addDoc(collection(db, 'investments'), {
          ...payload,
          createdAt: new Date().toISOString()
        });
        finalDocId = ref.id;
      }

      // ---- Remove OLD cashbook entry (by source+sourceId) ----
      if (oldMeta) {
        const oldCosts = rowCosts(oldRow);
        const oldMode = oldMeta.paymentMode || 'cash';
        if (CASH_MODES.has(oldMode) && oldCosts > 0) {
          await syncCashbookEntry({
            date: oldMeta.date,
            source: 'investments',
            sourceId: oldMeta.id,
            mode: 'remove'
          });
        }
      }

      // ---- Add NEW cashbook entry (today's costs) ----
      const newCosts = formPreview.costs;
      if (CASH_MODES.has(payload.paymentMode) && newCosts > 0 && finalDocId) {
        await syncCashbookEntry({
          date: payload.date,
          type: 'investment',
          amount: newCosts,
          paymentMode: payload.paymentMode,
          description: `Investment — ${payload.notes || payload.date}`,
          source: 'investments',
          sourceId: finalDocId
        });
      }

      showToast('Investment updated!');
      handleCancel();
    } catch (e) {
      console.error('update investment:', e);
      alert('Failed: ' + (e.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try {
      const meta = rawMeta.find(m => m.id === deleteId);
      if (!meta) throw new Error('Entry not found');

      const row = investmentData.find(i => i.metaId === deleteId);
      const costs = rowCosts(row);

      await deleteDoc(doc(db, 'investments', deleteId));

      if (CASH_MODES.has(meta.paymentMode) && costs > 0) {
        await syncCashbookEntry({
          date: meta.date,
          source: 'investments',
          sourceId: deleteId,
          mode: 'remove'
        });
      }

      setShowDeleteModal(false);
      setDeleteId(null);
      showToast('Investment metadata removed!');
    } catch (e) {
      console.error('delete investment:', e);
      alert('Failed: ' + (e.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // FORM HANDLERS
  // ============================================================
  const handleEdit = (item) => {
    setIsEditing(true);
    setEditingId(item.metaId || null);
    setFormData({
      date: item.date || localDate(),
      paymentMode: item.paymentMode || 'cash',
      notes: item.notes || ''
    });
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setIsEditing(false);
    setEditingId(null);
    setFormData(emptyForm());
  };

  const showToast = (text) => {
    const el = document.createElement('div');
    el.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  };

  // ============================================================
  // DERIVED
  // ============================================================
  const filteredData = investmentData.filter(item =>
    item.date?.includes(searchTerm) ||
    (item.notes || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totals = investmentData.reduce((acc, item) => {
    acc.assets += num(item.assets);
    acc.packing += num(item.packing);
    acc.ingredients += num(item.ingredients);
    acc.expenses += num(item.expenses);
    acc.costs += num(item.costs);
    acc.investment += num(item.investment);
    acc.selling += num(item.selling);
    acc.totalBalance += num(item.totalBalance);
    return acc;
  }, { assets: 0, packing: 0, ingredients: 0, expenses: 0, costs: 0, investment: 0, selling: 0, totalBalance: 0 });

  const latestBalance = investmentData.length > 0
    ? num(investmentData[0].totalBalance)
    : 0;

  const summaryCards = [
    { label: 'Total Assets', value: fmt(totals.assets), Icon: Building2, bg: 'bg-blue-50', color: 'text-blue-600' },
    { label: 'Total Investment', value: fmt(totals.investment), Icon: PiggyBank, bg: 'bg-purple-50', color: 'text-purple-600' },
    { label: 'Total Selling', value: fmt(totals.selling), Icon: TrendingUp, bg: 'bg-emerald-50', color: 'text-emerald-600' },
    { label: 'Current Balance', value: fmt(latestBalance), Icon: Wallet, bg: 'bg-amber-50', color: 'text-amber-600' }
  ];

  // ============================================================
  // RENDER
  // ============================================================
  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Loading investment data...</p>
      </div>
    </div>
  );

  const PaymentBadge = ({ mode }) => {
    const c = PAYMENT_MODES.find(x => x.value === mode) || PAYMENT_MODES[0];
    const Icon = c.Icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
        <Icon className="w-3 h-3" /> {c.label}
      </span>
    );
  };

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 backdrop-blur rounded-xl">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">Investments</h1>
              <p className="text-indigo-100 text-sm">Auto-synced from all modules</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur px-3 py-2 rounded-xl border border-white/30">
              <Calendar className="w-4 h-4 text-white" />
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                className="bg-transparent outline-none text-sm text-white w-32 [color-scheme:dark]" />
            </div>
            <button
              onClick={() => { setFormData(emptyForm(selectedDate)); setIsAdding(true); }}
              className="bg-white text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Set Metadata</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
        ℹ️ <b>Assets, Packing, Ingredients, Expenses, Selling</b> are read automatically from their modules for each date.
        Investment and Total Balance are computed as a running balance.
        Only <b>Payment Mode</b> and <b>Notes</b> are stored per date.
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {summaryCards.map(c => {
          const Icon = c.Icon;
          return (
            <div key={c.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{c.label}</p>
                  <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1">{c.value}</p>
                </div>
                <div className={`p-2 ${c.bg} rounded-lg`}><Icon className={`w-5 h-5 ${c.color}`} /></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Form */}
      {isAdding && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {isEditing ? 'Update Metadata' : 'Set Metadata for Date'}
            </h2>
            <button onClick={handleCancel} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Calendar className="w-4 h-4 inline mr-1.5" /> Date
              </label>
              <input type="date" value={formData.date}
                onChange={e => patchForm({ date: e.target.value })}
                disabled={isEditing}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Wallet className="w-4 h-4 inline mr-1.5" /> Payment Mode
              </label>
              <select value={formData.paymentMode}
                onChange={e => patchForm({ paymentMode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                {PAYMENT_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <FileText className="w-4 h-4 inline mr-1.5" /> Notes
              </label>
              <input type="text" value={formData.notes}
                onChange={e => patchForm({ notes: e.target.value })}
                placeholder="Optional notes"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>

          {/* Live preview */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-blue-50 rounded-xl p-3">
              <p className="text-xs text-gray-600">Assets</p>
              <p className="text-lg font-bold text-blue-700">{fmt(formPreview.assets)}</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-3">
              <p className="text-xs text-gray-600">Packing</p>
              <p className="text-lg font-bold text-purple-700">{fmt(formPreview.packing)}</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3">
              <p className="text-xs text-gray-600">Ingredients</p>
              <p className="text-lg font-bold text-amber-700">{fmt(formPreview.ingredients)}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-3">
              <p className="text-xs text-gray-600">Expenses</p>
              <p className="text-lg font-bold text-red-700">{fmt(formPreview.expenses)}</p>
            </div>
            <div className="bg-indigo-50 rounded-xl p-3 col-span-2">
              <p className="text-xs text-gray-600">Investment (auto)</p>
              <p className="text-2xl font-bold text-indigo-700">{fmt(formPreview.investment)}</p>
              <p className="text-xs text-gray-500 mt-1">
                Prev {fmt(formPreview.prevTB)} + Costs {fmt(formPreview.costs)}
              </p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3">
              <p className="text-xs text-gray-600">Selling (auto)</p>
              <p className="text-lg font-bold text-emerald-700">{fmt(formPreview.selling)}</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 border-2 border-amber-300">
              <p className="text-xs text-gray-600">Total Balance (auto)</p>
              <p className="text-2xl font-bold text-amber-700">{fmt(formPreview.totalBalance)}</p>
            </div>
          </div>

          <div className={`mt-4 border rounded-xl p-3 text-sm ${CASH_MODES.has(formData.paymentMode) ? 'bg-green-50 border-green-200 text-green-800' : 'bg-orange-50 border-orange-200 text-orange-800'}`}>
            {CASH_MODES.has(formData.paymentMode)
              ? `✅ Today's costs ${fmt(formPreview.costs)} will be synced to Cashbook on ${formData.date}`
              : `⚠️ Credit mode — no Cashbook impact.`}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <button onClick={() => setFormData(emptyForm(selectedDate))}
              className="w-full sm:w-auto px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4" /> Reset
            </button>
            <button onClick={handleCancel}
              className="w-full sm:w-auto px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
              Cancel
            </button>
            <button onClick={isEditing ? handleUpdate : handleAdd} disabled={saving}
              className="w-full sm:w-auto px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-4 h-4" /> {isEditing ? 'Update' : 'Save'}</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div className="relative flex-1 md:flex-none">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search by date or notes..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none w-full md:w-72" />
          </div>
          <span className="text-sm text-gray-500">{filteredData.length} dates</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-3 py-3">Date</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase px-3 py-3">Assets</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase px-3 py-3">Packing</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase px-3 py-3">Ingredients</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase px-3 py-3">Expenses</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase px-3 py-3">Investment</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase px-3 py-3">Selling</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase px-3 py-3">Total</th>
                <th className="text-center text-xs font-medium text-gray-500 uppercase px-3 py-3">Payment</th>
                <th className="text-center text-xs font-medium text-gray-500 uppercase px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(item => (
                <tr key={item.date} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-3 text-sm text-gray-600 font-medium">{item.date}</td>
                  <td className="px-3 py-3 text-right text-blue-600">{fmt(item.assets)}</td>
                  <td className="px-3 py-3 text-right text-purple-600">{fmt(item.packing)}</td>
                  <td className="px-3 py-3 text-right text-amber-600">{fmt(item.ingredients)}</td>
                  <td className="px-3 py-3 text-right text-red-600">{fmt(item.expenses)}</td>
                  <td className="px-3 py-3 text-right text-indigo-600 font-semibold">{fmt(item.investment)}</td>
                  <td className="px-3 py-3 text-right text-emerald-600 font-semibold">{fmt(item.selling)}</td>
                  <td className="px-3 py-3 text-right font-bold text-gray-900">{fmt(item.totalBalance)}</td>
                  <td className="px-3 py-3 text-center">
                    <PaymentBadge mode={item.paymentMode || 'cash'} />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setSelectedItem(item)}
                        className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600" title="View">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleEdit(item)}
                        className="p-1.5 hover:bg-green-50 rounded-lg text-green-600"
                        title="Set payment mode / notes">
                        <Edit className="w-4 h-4" />
                      </button>
                      {item.metaId && (
                        <button onClick={() => { setDeleteId(item.metaId); setShowDeleteModal(true); }}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-red-600"
                          title="Remove payment mode / notes">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-gray-200">
                <td className="px-3 py-3 text-sm font-bold text-gray-900">Total</td>
                <td className="px-3 py-3 text-right font-bold text-blue-600">{fmt(totals.assets)}</td>
                <td className="px-3 py-3 text-right font-bold text-purple-600">{fmt(totals.packing)}</td>
                <td className="px-3 py-3 text-right font-bold text-amber-600">{fmt(totals.ingredients)}</td>
                <td className="px-3 py-3 text-right font-bold text-red-600">{fmt(totals.expenses)}</td>
                <td className="px-3 py-3 text-right font-bold text-indigo-600">{fmt(totals.investment)}</td>
                <td className="px-3 py-3 text-right font-bold text-emerald-600">{fmt(totals.selling)}</td>
                <td className="px-3 py-3 text-right font-bold text-gray-900">{fmt(totals.totalBalance)}</td>
                <td colSpan="2"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-12">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No data available</p>
            <p className="text-sm text-gray-400 mt-1">
              Add assets, purchases, expenses, or sales to see aggregated data here
            </p>
          </div>
        )}
      </div>

      {/* View Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Investment Details</h3>
                <p className="text-sm text-gray-500">{selectedItem.date}</p>
              </div>
              <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { l: 'Assets', v: selectedItem.assets, c: 'text-blue-600' },
                  { l: 'Packing', v: selectedItem.packing, c: 'text-purple-600' },
                  { l: 'Ingredients', v: selectedItem.ingredients, c: 'text-amber-600' },
                  { l: 'Expenses', v: selectedItem.expenses, c: 'text-red-600' },
                  { l: "Today's Cost", v: selectedItem.costs, c: 'text-indigo-600' },
                  { l: 'Selling', v: selectedItem.selling, c: 'text-emerald-600' }
                ].map(x => (
                  <div key={x.l} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">{x.l}</p>
                    <p className={`font-bold ${x.c} text-lg`}>{fmt(x.v)}</p>
                  </div>
                ))}
                <div className="bg-indigo-50 rounded-lg p-3 col-span-2">
                  <p className="text-xs text-gray-500">Cumulative Investment</p>
                  <p className="font-bold text-indigo-600 text-2xl">{fmt(selectedItem.investment)}</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 col-span-2">
                  <p className="text-xs text-gray-500">Total Balance</p>
                  <p className="font-bold text-amber-600 text-2xl">{fmt(selectedItem.totalBalance)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                  <p className="text-xs text-gray-500">Payment Mode</p>
                  <PaymentBadge mode={selectedItem.paymentMode || 'cash'} />
                </div>
              </div>

              {selectedItem.notes && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-500">Notes</p>
                  <p className="text-gray-900">{selectedItem.notes}</p>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                <button onClick={() => { setSelectedItem(null); handleEdit(selectedItem); }}
                  className="flex-1 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                  <Edit className="w-4 h-4" /> Edit Metadata
                </button>
                <button onClick={() => setSelectedItem(null)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Remove Metadata</h3>
              <p className="text-gray-500 mb-6">
                This removes payment mode & notes for this date. The underlying data
                (assets, purchases, expenses, payments) is NOT affected.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={confirmDelete} disabled={saving}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-50">
                  {saving ? 'Removing...' : 'Remove'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Investments;