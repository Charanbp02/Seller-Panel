// Pages/Investments/Investments.jsx
import React, { useState, useEffect } from 'react';
import {
  TrendingUp, Plus, Search, Calendar, Edit, Trash2, Eye, FileText,
  DollarSign, Save, RefreshCw, X, AlertTriangle, Wallet, Building2,
  PiggyBank, Package, Box, Banknote, Smartphone, CreditCard, Tag, Receipt
} from 'lucide-react';
import { db } from '../../firebase/firebaseConfig';
import {
  collection, doc, addDoc, updateDoc, deleteDoc, query, orderBy, onSnapshot
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

const emptyForm = () => ({
  date: localDate(),
  assets: '', packing: '', ingredients: '', expenses: '',
  investment: '', selling: '', totalBalance: '',
  paymentMode: 'cash',
  notes: ''
});

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
  const [investmentData, setInvestmentData] = useState([]);
  const [formData, setFormData] = useState(emptyForm());

  const patchForm = (patch) => setFormData(p => ({ ...p, ...patch }));

  // ---------- Live listener ----------
  useEffect(() => {
    const q = query(collection(db, 'investments'), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      rows.sort((a, b) => {
        const d = (b.date || '').localeCompare(a.date || '');
        if (d !== 0) return d;
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
      setInvestmentData(rows);
      setLoading(false);
    }, (e) => { console.error('investments listener:', e); setLoading(false); });
    return () => unsub();
  }, []);

  // ---------- Auto-recalc total ----------
  const recomputeTotal = (form) => {
    return ['assets', 'packing', 'ingredients', 'expenses', 'investment', 'selling']
      .reduce((s, k) => s + (parseFloat(form[k]) || 0), 0);
  };

  const handleFieldChange = (field, value) => {
    const next = { ...formData, [field]: value };
    next.totalBalance = recomputeTotal(next).toString();
    setFormData(next);
  };

  // ---------- SAVE ----------
  const handleAdd = async () => {
    if (!formData.date) return alert('Please select a date');
    setSaving(true);
    try {
      const payload = {
        date: formData.date,
        assets: parseFloat(formData.assets) || 0,
        packing: parseFloat(formData.packing) || 0,
        ingredients: parseFloat(formData.ingredients) || 0,
        expenses: parseFloat(formData.expenses) || 0,
        investment: parseFloat(formData.investment) || 0,
        selling: parseFloat(formData.selling) || 0,
        totalBalance: parseFloat(formData.totalBalance) || 0,
        paymentMode: formData.paymentMode || 'cash',
        notes: formData.notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const ref = await addDoc(collection(db, 'investments'), payload);

      // ✅ Sync to cashbook — investment amount only
      await syncCashbookEntry({
        date: payload.date,
        type: 'investment',
        amount: payload.investment,
        paymentMode: payload.paymentMode,
        description: `Investment — ${payload.notes || payload.date}`,
        source: 'investments',
        sourceId: ref.id,
        reference: ''
      });

      showToast('Investment added & Cashbook synced!');
      handleCancel();
    } catch (e) {
      console.error('add investment:', e);
      alert('Failed to add investment: ' + (e.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!formData.date) return alert('Please select a date');
    if (!editingId) return alert('No investment selected');

    setSaving(true);
    try {
      const old = investmentData.find(i => i.id === editingId);
      if (!old) throw new Error('Investment not found');

      const payload = {
        date: formData.date,
        assets: parseFloat(formData.assets) || 0,
        packing: parseFloat(formData.packing) || 0,
        ingredients: parseFloat(formData.ingredients) || 0,
        expenses: parseFloat(formData.expenses) || 0,
        investment: parseFloat(formData.investment) || 0,
        selling: parseFloat(formData.selling) || 0,
        totalBalance: parseFloat(formData.totalBalance) || 0,
        paymentMode: formData.paymentMode || 'cash',
        notes: formData.notes || '',
        updatedAt: new Date().toISOString()
      };

      await updateDoc(doc(db, 'investments', editingId), payload);

      // ✅ Reverse old cashbook entry (if exists) then add new
      const oldDate = old.date;
      const oldMode = old.paymentMode || 'cash';
      const oldAmount = num(old.investment);
      const oldDateChanged = oldDate !== payload.date;
      const oldModeChanged = oldMode !== payload.paymentMode;

      // Always remove previous entry (source-based cleanup)
      if (CASH_MODES.has(oldMode)) {
        await syncCashbookEntry({
          date: oldDate, type: 'investment', amount: oldAmount,
          paymentMode: oldMode, source: 'investments', sourceId: editingId,
          mode: 'remove'
        });
      }

      // Add new (if cash mode)
      if (CASH_MODES.has(payload.paymentMode) && payload.investment > 0) {
        await syncCashbookEntry({
          date: payload.date, type: 'investment', amount: payload.investment,
          paymentMode: payload.paymentMode,
          description: `Investment — ${payload.notes || payload.date}`,
          source: 'investments', sourceId: editingId
        });
      }

      showToast('Investment updated & Cashbook synced!');
      handleCancel();
    } catch (e) {
      console.error('update investment:', e);
      alert('Failed to update investment: ' + (e.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try {
      const inv = investmentData.find(i => i.id === deleteId);
      if (!inv) throw new Error('Investment not found');

      await deleteDoc(doc(db, 'investments', deleteId));

      // ✅ Reverse cashbook
      if (CASH_MODES.has(inv.paymentMode) && num(inv.investment) > 0) {
        await syncCashbookEntry({
          date: inv.date, type: 'investment', amount: num(inv.investment),
          paymentMode: inv.paymentMode, source: 'investments',
          sourceId: deleteId, mode: 'remove'
        });
      }

      setShowDeleteModal(false);
      setDeleteId(null);
      showToast('Investment deleted & Cashbook reversed!');
    } catch (e) {
      console.error('delete investment:', e);
      alert('Failed to delete investment: ' + (e.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  // ---------- FORM HANDLERS ----------
  const handleEdit = (item) => {
    setIsEditing(true);
    setEditingId(item.id);
    setFormData({
      date: item.date || localDate(),
      assets: item.assets?.toString() || '',
      packing: item.packing?.toString() || '',
      ingredients: item.ingredients?.toString() || '',
      expenses: item.expenses?.toString() || '',
      investment: item.investment?.toString() || '',
      selling: item.selling?.toString() || '',
      totalBalance: item.totalBalance?.toString() || '',
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

  // ---------- DERIVED ----------
  const filteredData = investmentData.filter(item =>
    item.date?.includes(searchTerm) ||
    item.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totals = investmentData.reduce((acc, item) => {
    acc.assets += num(item.assets);
    acc.packing += num(item.packing);
    acc.ingredients += num(item.ingredients);
    acc.expenses += num(item.expenses);
    acc.investment += num(item.investment);
    acc.selling += num(item.selling);
    acc.totalBalance += num(item.totalBalance);
    return acc;
  }, { assets: 0, packing: 0, ingredients: 0, expenses: 0, investment: 0, selling: 0, totalBalance: 0 });

  const summaryCards = [
    { label: 'Total Assets', value: fmt(totals.assets), Icon: Building2, bg: 'bg-blue-50', color: 'text-blue-600' },
    { label: 'Total Investment', value: fmt(totals.investment), Icon: PiggyBank, bg: 'bg-purple-50', color: 'text-purple-600' },
    { label: 'Total Selling', value: fmt(totals.selling), Icon: TrendingUp, bg: 'bg-emerald-50', color: 'text-emerald-600' },
    { label: 'Total Balance', value: fmt(totals.totalBalance), Icon: Wallet, bg: 'bg-amber-50', color: 'text-amber-600' }
  ];

  // ---------- RENDER ----------
  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Loading investments...</p>
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
              <p className="text-indigo-100 text-sm">Auto-syncs to Cashbook</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur px-3 py-2 rounded-xl border border-white/30">
              <Calendar className="w-4 h-4 text-white" />
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                className="bg-transparent outline-none text-sm text-white w-32 [color-scheme:dark]" />
            </div>
            <button
              onClick={() => { setFormData(emptyForm()); setIsAdding(true); }}
              className="bg-white text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Investment</span>
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
            <h2 className="text-lg font-semibold text-gray-900">
              {isEditing ? 'Edit Investment' : 'Add Investment'}
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
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            {[
              { k: 'assets', l: 'Assets', I: Building2 },
              { k: 'packing', l: 'Packing', I: Package },
              { k: 'ingredients', l: 'Ingredients', I: Box },
              { k: 'expenses', l: 'Expenses', I: Wallet },
              { k: 'investment', l: 'Investment', I: PiggyBank },
              { k: 'selling', l: 'Selling', I: TrendingUp }
            ].map(({ k, l, I }) => (
              <div key={k}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <I className="w-4 h-4 inline mr-1.5" /> {l}
                </label>
                <input type="number" step="0.01" value={formData[k]}
                  onChange={e => handleFieldChange(k, e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
            ))}
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
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Wallet className="w-4 h-4 inline mr-1.5" /> Total Balance (auto)
              </label>
              <div className="px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg text-lg font-bold text-indigo-600">
                {formData.totalBalance ? fmt(formData.totalBalance) : '₹0.00'}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <FileText className="w-4 h-4 inline mr-1.5" /> Notes
            </label>
            <textarea rows="2" value={formData.notes}
              onChange={e => patchForm({ notes: e.target.value })}
              placeholder="Additional notes..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>

          {/* Sync info */}
          <div className={`mt-4 border rounded-xl p-3 text-sm ${CASH_MODES.has(formData.paymentMode) ? 'bg-green-50 border-green-200 text-green-800' : 'bg-orange-50 border-orange-200 text-orange-800'}`}>
            {CASH_MODES.has(formData.paymentMode)
              ? `✅ Investment amount will be added to Cashbook (${formData.paymentMode}) on ${formData.date}`
              : `⚠️ Credit mode — no Cashbook impact. Set payment mode to Cash/UPI/Bank to sync.`}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <button onClick={() => setFormData(emptyForm())}
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
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-4 h-4" /> {isEditing ? 'Update' : 'Save Investment'}</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div className="relative flex-1 md:flex-none">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search by date or notes..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none w-full md:w-72" />
          </div>
          <span className="text-sm text-gray-500">{filteredData.length} entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-3">Date</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-3">Assets</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-3">Packing</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-3">Ingredients</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-3">Expenses</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-3">Investment</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-3">Selling</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-3">Total</th>
                <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-3">Payment</th>
                <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(item => (
                <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-3 text-sm text-gray-600 font-medium">{item.date}</td>
                  <td className="px-3 py-3 text-right text-blue-600">{fmt(item.assets)}</td>
                  <td className="px-3 py-3 text-right text-purple-600">{fmt(item.packing)}</td>
                  <td className="px-3 py-3 text-right text-amber-600">{fmt(item.ingredients)}</td>
                  <td className="px-3 py-3 text-right text-red-600">{fmt(item.expenses)}</td>
                  <td className="px-3 py-3 text-right text-indigo-600 font-semibold">{fmt(item.investment)}</td>
                  <td className="px-3 py-3 text-right text-emerald-600 font-semibold">{fmt(item.selling)}</td>
                  <td className="px-3 py-3 text-right font-bold text-gray-900">{fmt(item.totalBalance)}</td>
                  <td className="px-3 py-3 text-center"><PaymentBadge mode={item.paymentMode} /></td>
                  <td className="px-3 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setSelectedItem(item)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => handleEdit(item)} className="p-1.5 hover:bg-green-50 rounded-lg text-green-600"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => { setDeleteId(item.id); setShowDeleteModal(true); }} className="p-1.5 hover:bg-red-50 rounded-lg text-red-600"><Trash2 className="w-4 h-4" /></button>
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
            <p className="text-gray-500 font-medium">No investment records</p>
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
                  { l: 'Investment', v: selectedItem.investment, c: 'text-indigo-600' },
                  { l: 'Selling', v: selectedItem.selling, c: 'text-emerald-600' }
                ].map(x => (
                  <div key={x.l} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">{x.l}</p>
                    <p className={`font-bold ${x.c} text-lg`}>{fmt(x.v)}</p>
                  </div>
                ))}
                <div className="bg-amber-50 rounded-lg p-3 col-span-2">
                  <p className="text-xs text-gray-500">Total Balance</p>
                  <p className="font-bold text-amber-600 text-2xl">{fmt(selectedItem.totalBalance)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                  <p className="text-xs text-gray-500">Payment Mode</p>
                  <PaymentBadge mode={selectedItem.paymentMode} />
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
              <h3 className="text-xl font-bold mb-2">Delete Investment</h3>
              <p className="text-gray-500 mb-6">
                This will remove the entry and reverse the Cashbook impact. Continue?
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

export default Investments;