// Pages/Expenses/Expenses.jsx
import React, { useState, useEffect } from 'react';
import {
  TrendingDown, Plus, Search, Filter, Download, Printer, Calendar,
  Edit, Trash2, Eye, FileText, DollarSign, Save, RefreshCw, X,
  CheckCircle, AlertTriangle, Wallet, Building2, CreditCard,
  Banknote, Smartphone, Tag, Receipt, TrendingUp, Users,
  ShoppingBag, Utensils, Truck, Zap, PiggyBank
} from 'lucide-react';
import { db } from '../../firebase/firebaseConfig';
import {
  collection, doc, query, where, orderBy, onSnapshot, getDocs,
  addDoc, updateDoc, deleteDoc
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

const CASH_MODES = new Set(['cash', 'upi', 'bank']);

const CATEGORIES = [
  { value: 'purchase', label: 'Purchase', Icon: ShoppingBag, bg: 'bg-blue-50', text: 'text-blue-700' },
  { value: 'salary', label: 'Salary', Icon: Users, bg: 'bg-green-50', text: 'text-green-700' },
  { value: 'rent', label: 'Rent', Icon: Building2, bg: 'bg-purple-50', text: 'text-purple-700' },
  { value: 'utilities', label: 'Utilities', Icon: Zap, bg: 'bg-yellow-50', text: 'text-yellow-700' },
  { value: 'marketing', label: 'Marketing', Icon: TrendingUp, bg: 'bg-pink-50', text: 'text-pink-700' },
  { value: 'travel', label: 'Travel', Icon: Truck, bg: 'bg-orange-50', text: 'text-orange-700' },
  { value: 'food', label: 'Food', Icon: Utensils, bg: 'bg-red-50', text: 'text-red-700' },
  { value: 'other', label: 'Other', Icon: PiggyBank, bg: 'bg-gray-50', text: 'text-gray-700' }
];

const PAYMENT_MODES = [
  { value: 'cash', label: 'Cash', Icon: Banknote, bg: 'bg-blue-50', text: 'text-blue-700' },
  { value: 'upi', label: 'UPI', Icon: Smartphone, bg: 'bg-purple-50', text: 'text-purple-700' },
  { value: 'bank', label: 'Bank', Icon: Building2, bg: 'bg-indigo-50', text: 'text-indigo-700' },
  { value: 'credit', label: 'Credit', Icon: CreditCard, bg: 'bg-orange-50', text: 'text-orange-700' }
];

const emptyForm = (date) => ({
  date: date || localDate(),
  expense: '',
  amount: '',
  category: 'purchase',
  paymentMode: 'cash',
  description: '',
  notes: ''
});

// ============================================================
// COMPONENT
// ============================================================
const Expenses = () => {
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
  const [expenseData, setExpenseData] = useState([]);
  const [formData, setFormData] = useState(emptyForm());

  const patchForm = (patch) => setFormData(p => ({ ...p, ...patch }));

  // ---------- Live listener ----------
  useEffect(() => {
    const q = query(collection(db, 'expenses'), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const expenses = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      expenses.sort((a, b) => {
        const d = (b.date || '').localeCompare(a.date || '');
        if (d !== 0) return d;
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
      setExpenseData(expenses);
      setLoading(false);
    }, (e) => { console.error('expenses listener:', e); setLoading(false); });
    return () => unsub();
  }, []);

  // ============================================================
  // CASHBOOK SYNC (single entry-point)
  // ============================================================
  const syncCashbook = async ({ date, delta, paymentMode }) => {
    // Only cash/upi/bank affect cashbook
    if (!CASH_MODES.has(paymentMode)) return;

    const q = query(collection(db, 'cashbook'), where('date', '==', date));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const cbDoc = snap.docs[0];
      const cb = cbDoc.data();
      const newExpense = num(cb.expense) + delta;
      if (newExpense < 0) {
        console.warn('Cashbook expense going negative — clamping to 0');
      }
      const safeExpense = Math.max(0, newExpense);

      // Recompute totals from entries if present (source of truth), else use stored fields
      let sales = num(cb.sales);
      let owner = num(cb.owner);
      let investment = num(cb.investment);
      if (Array.isArray(cb.entries)) {
        sales = 0; owner = 0; investment = 0;
        cb.entries.forEach(e => {
          if (!CASH_MODES.has(e.paymentMode)) return;
          if (e.type === 'sales') sales += num(e.amount);
          else if (e.type === 'owner') owner += num(e.amount);
          else if (e.type === 'investment') investment += num(e.amount);
        });
      }

      const opening = num(cb.openingBalance);
      const closing = opening + sales + investment - safeExpense - owner;

      await updateDoc(doc(db, 'cashbook', cbDoc.id), {
        expense: safeExpense,
        sales, owner, investment,
        closingBalance: closing,
        updatedAt: new Date().toISOString()
      });
    } else {
      // Create new cashbook doc for this date
      const prevSnap = await getDocs(
        query(collection(db, 'cashbook'), where('date', '<', date))
      );
      const opening = prevSnap.docs.length
        ? num(prevSnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0].closingBalance)
        : 0;

      const expense = Math.max(0, delta);
      const closing = opening - expense;

      await addDoc(collection(db, 'cashbook'), {
        date,
        openingBalance: opening,
        sales: 0,
        expense,
        owner: 0,
        investment: 0,
        closingBalance: closing,
        entries: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  };

  // ============================================================
  // SAVE / UPDATE / DELETE
  // ============================================================
  const handleAdd = async () => {
    if (!formData.expense || !formData.amount) return alert('Please fill all required fields');
    setSaving(true);
    try {
      const amount = parseFloat(formData.amount) || 0;
      const nowISO = new Date().toISOString();
      await addDoc(collection(db, 'expenses'), {
        date: formData.date,
        expense: formData.expense,
        amount,
        category: formData.category,
        paymentMode: formData.paymentMode,
        description: formData.description || '',
        notes: formData.notes || '',
        createdAt: nowISO,
        updatedAt: nowISO
      });
      await syncCashbook({ date: formData.date, delta: amount, paymentMode: formData.paymentMode });
      showToast('Expense added & Cashbook updated!');
      handleCancel();
    } catch (e) {
      console.error('add expense:', e);
      alert('Failed to add expense: ' + (e.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!formData.expense || !formData.amount) return alert('Please fill all required fields');
    if (!editingId) return alert('No expense selected');

    setSaving(true);
    try {
      const old = expenseData.find(e => e.id === editingId);
      if (!old) throw new Error('Expense not found');

      const newAmount = parseFloat(formData.amount) || 0;
      const oldAmount = num(old.amount);
      const nowISO = new Date().toISOString();

      await updateDoc(doc(db, 'expenses', editingId), {
        date: formData.date,
        expense: formData.expense,
        amount: newAmount,
        category: formData.category,
        paymentMode: formData.paymentMode,
        description: formData.description || '',
        notes: formData.notes || '',
        updatedAt: nowISO
      });

      // ----- Cashbook sync -----
      const oldMode = old.paymentMode;
      const newMode = formData.paymentMode;
      const dateChanged = old.date !== formData.date;
      const modeChanged = oldMode !== newMode;
      const amountChanged = newAmount !== oldAmount;

      if (dateChanged || modeChanged) {
        // Reverse old + apply new
        if (CASH_MODES.has(oldMode)) {
          await syncCashbook({ date: old.date, delta: -oldAmount, paymentMode: oldMode });
        }
        if (CASH_MODES.has(newMode)) {
          await syncCashbook({ date: formData.date, delta: newAmount, paymentMode: newMode });
        }
      } else if (amountChanged && CASH_MODES.has(newMode)) {
        // Same date & mode — apply only the diff
        await syncCashbook({ date: formData.date, delta: newAmount - oldAmount, paymentMode: newMode });
      }

      showToast('Expense updated & Cashbook synced!');
      handleCancel();
    } catch (e) {
      console.error('update expense:', e);
      alert('Failed to update expense: ' + (e.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try {
      const exp = expenseData.find(e => e.id === deleteId);
      if (!exp) throw new Error('Expense not found');

      await deleteDoc(doc(db, 'expenses', deleteId));
      if (CASH_MODES.has(exp.paymentMode)) {
        await syncCashbook({ date: exp.date, delta: -num(exp.amount), paymentMode: exp.paymentMode });
      }

      setShowDeleteModal(false);
      setDeleteId(null);
      showToast('Expense deleted & Cashbook updated!');
    } catch (e) {
      console.error('delete expense:', e);
      alert('Failed to delete expense: ' + (e.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // FORM HANDLERS
  // ============================================================
  const handleEdit = (item) => {
    setIsEditing(true);
    setEditingId(item.id);
    setFormData({
      date: item.date || localDate(),
      expense: item.expense || '',
      amount: item.amount?.toString() || '',
      category: item.category || 'purchase',
      paymentMode: item.paymentMode || 'cash',
      description: item.description || '',
      notes: item.notes || ''
    });
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setIsEditing(false);
    setEditingId(null);
    setFormData(emptyForm(selectedDate));
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
  const filteredData = expenseData.filter(item =>
    item.expense?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalExpenses = expenseData.reduce((s, x) => s + num(x.amount), 0);
  const todayExpenses = expenseData
    .filter(x => x.date === selectedDate)
    .reduce((s, x) => s + num(x.amount), 0);
  const categoryTotals = expenseData.reduce((acc, x) => {
    acc[x.category] = num(acc[x.category]) + num(x.amount);
    return acc;
  }, {});

  // ============================================================
  // RENDER
  // ============================================================
  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Loading expenses...</p>
      </div>
    </div>
  );

  const CategoryBadge = ({ category }) => {
    const c = CATEGORIES.find(x => x.value === category) || CATEGORIES[7];
    const Icon = c.Icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
        <Icon className="w-3 h-3" /> {c.label}
      </span>
    );
  };

  const PaymentBadge = ({ mode }) => {
    const c = PAYMENT_MODES.find(x => x.value === mode) || PAYMENT_MODES[0];
    const Icon = c.Icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
        <Icon className="w-3 h-3" /> {c.label}
      </span>
    );
  };

  const summaryCards = [
    { label: 'Total Expenses', value: fmt(totalExpenses), Icon: TrendingDown, bg: 'bg-red-50', color: 'text-red-600' },
    { label: "Today's Expenses", value: fmt(todayExpenses), Icon: Calendar, bg: 'bg-orange-50', color: 'text-orange-600' },
    { label: 'Categories', value: Object.keys(categoryTotals).length, Icon: Tag, bg: 'bg-blue-50', color: 'text-blue-600' },
    { label: 'Transactions', value: expenseData.length, Icon: Receipt, bg: 'bg-green-50', color: 'text-green-600' }
  ];

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-600 to-red-600 rounded-2xl shadow-lg p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 backdrop-blur rounded-xl">
              <TrendingDown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">Expenses</h1>
              <p className="text-rose-100 text-sm">Track and manage all your business expenses</p>
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
              className="bg-white text-rose-600 hover:bg-rose-50 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Expense</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>
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
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-100 rounded-xl">
                <TrendingDown className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{isEditing ? 'Edit Expense' : 'Add Expense'}</h2>
                <p className="text-sm text-gray-500">{formData.date}</p>
              </div>
            </div>
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
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Tag className="w-4 h-4 inline mr-1.5" /> Category
              </label>
              <select value={formData.category}
                onChange={e => patchForm({ category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none">
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Wallet className="w-4 h-4 inline mr-1.5" /> Payment Mode
              </label>
              <select value={formData.paymentMode}
                onChange={e => patchForm({ paymentMode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none">
                {PAYMENT_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <FileText className="w-4 h-4 inline mr-1.5" /> Expense Description *
              </label>
              <input type="text" value={formData.expense}
                onChange={e => patchForm({ expense: e.target.value })}
                placeholder="e.g., Purchase, Salary, Rent"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <DollarSign className="w-4 h-4 inline mr-1.5" /> Amount *
              </label>
              <input type="number" step="0.01" value={formData.amount}
                onChange={e => patchForm({ amount: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none" />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <FileText className="w-4 h-4 inline mr-1.5" /> Description
            </label>
            <input type="text" value={formData.description}
              onChange={e => patchForm({ description: e.target.value })}
              placeholder="Additional details..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none" />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <FileText className="w-4 h-4 inline mr-1.5" /> Notes
            </label>
            <textarea rows="2" value={formData.notes}
              onChange={e => patchForm({ notes: e.target.value })}
              placeholder="Additional notes..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none" />
          </div>

          {/* Sync info */}
          <div className="mt-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-800">Cashbook Sync Activated</p>
                <p className="text-xs text-green-600 mt-1">
                  {CASH_MODES.has(formData.paymentMode)
                    ? `${isEditing ? 'Updating' : 'Adding'} this expense will update the Cashbook for ${formData.date}.`
                    : `"${formData.paymentMode}" mode — no Cashbook impact (vendor payable only).`}
                </p>
              </div>
            </div>
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
              className="w-full sm:w-auto px-6 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
              {saving ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-4 h-4" /> {isEditing ? 'Update' : 'Save Expense'}</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Expense List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 md:flex-none">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search expenses..." value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none w-full md:w-72" />
            </div>
            <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
              <Filter className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50"><Download className="w-4 h-4 text-gray-600" /></button>
            <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50"><Printer className="w-4 h-4 text-gray-600" /></button>
            <span className="text-sm text-gray-500 ml-1">{filteredData.length} entries</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                {[
                  { k: 'date', l: 'Date', align: 'left' },
                  { k: 'expense', l: 'Expense', align: 'left' },
                  { k: 'category', l: 'Category', align: 'center' },
                  { k: 'amount', l: 'Amount', align: 'right' },
                  { k: 'payment', l: 'Payment', align: 'center' }
                ].map(h => (
                  <th key={h.k} className={`text-${h.align} text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3`}>{h.l}</th>
                ))}
                <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(item => (
                <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">{item.date}</td>
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-medium text-gray-900">{item.expense}</span>
                      {item.description && <p className="text-xs text-gray-400">{item.description}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center"><CategoryBadge category={item.category} /></td>
                  <td className="px-4 py-3 text-right font-semibold text-red-600">{fmt(item.amount)}</td>
                  <td className="px-4 py-3 text-center"><PaymentBadge mode={item.paymentMode} /></td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setSelectedItem(item)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => handleEdit(item)} className="p-1.5 hover:bg-green-50 rounded-lg text-green-600"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => { setDeleteId(item.id); setShowDeleteModal(true); }} className="p-1.5 hover:bg-red-50 rounded-lg text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <TrendingDown className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No expenses found</p>
            <p className="text-sm text-gray-400 mt-1">Start by adding your first expense</p>
            <button onClick={() => { setFormData(emptyForm(selectedDate)); setIsAdding(true); }}
              className="mt-4 text-rose-600 hover:text-rose-700 font-medium inline-flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add Expense
            </button>
          </div>
        )}
      </div>

      {/* View Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <TrendingDown className="w-5 h-5 text-rose-600" />
                <h3 className="font-semibold text-gray-900">Expense Details</h3>
              </div>
              <button onClick={() => setSelectedItem(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div><p className="text-sm text-gray-500">Date</p><p className="font-medium">{selectedItem.date}</p></div>
              <div><p className="text-sm text-gray-500">Expense</p><p className="font-medium">{selectedItem.expense}</p></div>
              <div><p className="text-sm text-gray-500">Category</p><CategoryBadge category={selectedItem.category} /></div>
              <div><p className="text-sm text-gray-500">Amount</p><p className="text-2xl font-bold text-red-600">{fmt(selectedItem.amount)}</p></div>
              <div><p className="text-sm text-gray-500">Payment Mode</p><PaymentBadge mode={selectedItem.paymentMode} /></div>
              {selectedItem.description && <div><p className="text-sm text-gray-500">Description</p><p>{selectedItem.description}</p></div>}
              {selectedItem.notes && <div><p className="text-sm text-gray-500">Notes</p><p>{selectedItem.notes}</p></div>}
              <div className="flex gap-2 pt-4 border-t">
                <button onClick={() => { setSelectedItem(null); handleEdit(selectedItem); }}
                  className="flex-1 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                  <Edit className="w-4 h-4" /> Edit
                </button>
                <button onClick={() => { setSelectedItem(null); setDeleteId(selectedItem.id); setShowDeleteModal(true); }}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                  <Trash2 className="w-4 h-4" /> Delete
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
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Expense</h3>
              <p className="text-gray-500 mb-6">
                Are you sure you want to delete this expense? This will also update the Cashbook.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={confirmDelete} disabled={saving}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-50">
                  {saving ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;