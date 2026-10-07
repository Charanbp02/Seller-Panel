// Pages/AssetsPurchase/AssetsPurchase.jsx
import React, { useState, useEffect } from 'react';
import {
  Hammer, Plus, Search, Calendar, Edit, Trash2, Eye, FileText,
  DollarSign, Save, RefreshCw, X, AlertTriangle, Wallet, Building2,
  CreditCard, Tag, Receipt, Truck, Box, Home, Monitor, Smartphone
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

const CASH_MODES = new Set(['cash', 'upi', 'bank']);

const CATEGORIES = [
  { value: 'equipment', label: 'Equipment', Icon: Hammer, bg: 'bg-blue-50', text: 'text-blue-700' },
  { value: 'furniture', label: 'Furniture', Icon: Home, bg: 'bg-amber-50', text: 'text-amber-700' },
  { value: 'vehicle', label: 'Vehicle', Icon: Truck, bg: 'bg-orange-50', text: 'text-orange-700' },
  { value: 'electronics', label: 'Electronics', Icon: Monitor, bg: 'bg-purple-50', text: 'text-purple-700' },
  { value: 'other', label: 'Other', Icon: Box, bg: 'bg-gray-50', text: 'text-gray-700' }
];

const PAYMENT_MODES = [
  { value: 'cash', label: 'Cash', Icon: Wallet, bg: 'bg-blue-50', text: 'text-blue-700' },
  { value: 'upi', label: 'UPI', Icon: Smartphone, bg: 'bg-purple-50', text: 'text-purple-700' },
  { value: 'bank', label: 'Bank', Icon: Building2, bg: 'bg-indigo-50', text: 'text-indigo-700' },
  { value: 'credit', label: 'Credit', Icon: CreditCard, bg: 'bg-orange-50', text: 'text-orange-700' }
];

const emptyForm = () => ({
  date: localDate(),
  itemName: '',
  quantity: '',
  purchasePrice: '',
  vendorName: '',
  usedFor: '',
  category: 'equipment',
  paymentMode: 'cash',
  invoiceNumber: '',
  warranty: '',
  notes: ''
});

// ============================================================
// COMPONENT
// ============================================================
const AssetsPurchase = () => {
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
  const [assetsData, setAssetsData] = useState([]);
  const [formData, setFormData] = useState(emptyForm());

  const patchForm = (patch) => setFormData(p => ({ ...p, ...patch }));

  // ---------- Live listener ----------
  useEffect(() => {
    const q = query(collection(db, 'assets'), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      rows.sort((a, b) => {
        const d = (b.date || '').localeCompare(a.date || '');
        if (d !== 0) return d;
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
      setAssetsData(rows);
      setLoading(false);
    }, (e) => { console.error('assets listener:', e); setLoading(false); });
    return () => unsub();
  }, []);

  // ---------- Total value helper ----------
  const totalValue = (item) => num(item.quantity) * num(item.purchasePrice);

  // ---------- SAVE ----------
  const handleAdd = async () => {
    if (!formData.itemName || !formData.quantity || !formData.purchasePrice || !formData.vendorName) {
      return alert('Please fill all required fields');
    }
    setSaving(true);
    try {
      const qty = parseInt(formData.quantity) || 0;
      const price = parseFloat(formData.purchasePrice) || 0;
      const total = qty * price;

      const payload = {
        date: formData.date,
        itemName: formData.itemName,
        quantity: qty,
        purchasePrice: price,
        vendorName: formData.vendorName,
        usedFor: formData.usedFor || '',
        category: formData.category,
        paymentMode: formData.paymentMode,
        invoiceNumber: formData.invoiceNumber || '',
        warranty: formData.warranty || '',
        notes: formData.notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const ref = await addDoc(collection(db, 'assets'), payload);

      // ✅ Sync to cashbook (total value)
      await syncCashbookEntry({
        date: payload.date,
        type: 'expense',
        amount: total,
        paymentMode: payload.paymentMode,
        description: `Asset — ${payload.itemName} × ${qty}`,
        source: 'assets',
        sourceId: ref.id,
        reference: payload.invoiceNumber
      });

      showToast('Asset added & Cashbook synced!');
      handleCancel();
    } catch (e) {
      console.error('add asset:', e);
      alert('Failed to add asset: ' + (e.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!formData.itemName || !formData.quantity || !formData.purchasePrice || !formData.vendorName) {
      return alert('Please fill all required fields');
    }
    if (!editingId) return alert('No asset selected');

    setSaving(true);
    try {
      const old = assetsData.find(a => a.id === editingId);
      if (!old) throw new Error('Asset not found');

      const qty = parseInt(formData.quantity) || 0;
      const price = parseFloat(formData.purchasePrice) || 0;
      const total = qty * price;

      const payload = {
        date: formData.date,
        itemName: formData.itemName,
        quantity: qty,
        purchasePrice: price,
        vendorName: formData.vendorName,
        usedFor: formData.usedFor || '',
        category: formData.category,
        paymentMode: formData.paymentMode,
        invoiceNumber: formData.invoiceNumber || '',
        warranty: formData.warranty || '',
        notes: formData.notes || '',
        updatedAt: new Date().toISOString()
      };

      await updateDoc(doc(db, 'assets', editingId), payload);

      // ✅ Reverse old + add new
      const oldTotal = num(old.quantity) * num(old.purchasePrice);
      if (CASH_MODES.has(old.paymentMode) && oldTotal > 0) {
        await syncCashbookEntry({
          date: old.date, type: 'expense', amount: oldTotal,
          paymentMode: old.paymentMode, source: 'assets',
          sourceId: editingId, mode: 'remove'
        });
      }
      if (CASH_MODES.has(payload.paymentMode) && total > 0) {
        await syncCashbookEntry({
          date: payload.date, type: 'expense', amount: total,
          paymentMode: payload.paymentMode,
          description: `Asset — ${payload.itemName} × ${qty}`,
          source: 'assets', sourceId: editingId,
          reference: payload.invoiceNumber
        });
      }

      showToast('Asset updated & Cashbook synced!');
      handleCancel();
    } catch (e) {
      console.error('update asset:', e);
      alert('Failed to update asset: ' + (e.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try {
      const a = assetsData.find(x => x.id === deleteId);
      if (!a) throw new Error('Asset not found');

      await deleteDoc(doc(db, 'assets', deleteId));

      const total = num(a.quantity) * num(a.purchasePrice);
      if (CASH_MODES.has(a.paymentMode) && total > 0) {
        await syncCashbookEntry({
          date: a.date, type: 'expense', amount: total,
          paymentMode: a.paymentMode, source: 'assets',
          sourceId: deleteId, mode: 'remove'
        });
      }

      setShowDeleteModal(false);
      setDeleteId(null);
      showToast('Asset deleted & Cashbook reversed!');
    } catch (e) {
      console.error('delete asset:', e);
      alert('Failed to delete asset: ' + (e.message || 'Unknown error'));
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
      itemName: item.itemName || '',
      quantity: item.quantity?.toString() || '',
      purchasePrice: item.purchasePrice?.toString() || '',
      vendorName: item.vendorName || '',
      usedFor: item.usedFor || '',
      category: item.category || 'equipment',
      paymentMode: item.paymentMode || 'cash',
      invoiceNumber: item.invoiceNumber || '',
      warranty: item.warranty || '',
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
  const filteredData = assetsData.filter(item =>
    item.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.usedFor?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totals = {
    count: assetsData.length,
    items: assetsData.reduce((s, x) => s + num(x.quantity), 0),
    value: assetsData.reduce((s, x) => s + num(x.quantity) * num(x.purchasePrice), 0),
    avgPerItem: 0
  };
  totals.avgPerItem = totals.count > 0 ? totals.value / totals.count : 0;

  // ---------- RENDER ----------
  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Loading assets...</p>
      </div>
    </div>
  );

  const CategoryBadge = ({ category }) => {
    const c = CATEGORIES.find(x => x.value === category) || CATEGORIES[4];
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
    { label: 'Total Assets', value: totals.count, Icon: Hammer, bg: 'bg-blue-50', color: 'text-blue-600' },
    { label: 'Total Items', value: totals.items, Icon: Box, bg: 'bg-green-50', color: 'text-green-600' },
    { label: 'Total Value', value: fmt(totals.value), Icon: DollarSign, bg: 'bg-emerald-50', color: 'text-emerald-600' },
    { label: 'Avg Price/Item', value: fmt(totals.avgPerItem), Icon: Wallet, bg: 'bg-amber-50', color: 'text-amber-600' }
  ];

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl shadow-lg p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 backdrop-blur rounded-xl">
              <Hammer className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">Assets Purchase</h1>
              <p className="text-amber-100 text-sm">Auto-syncs to Cashbook as expense</p>
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
              className="bg-white text-amber-600 hover:bg-amber-50 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Asset</span>
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
              {isEditing ? 'Edit Asset' : 'Add Asset Purchase'}
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
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Tag className="w-4 h-4 inline mr-1.5" /> Category
              </label>
              <select value={formData.category}
                onChange={e => patchForm({ category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none">
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Building2 className="w-4 h-4 inline mr-1.5" /> Vendor *
              </label>
              <input type="text" value={formData.vendorName}
                onChange={e => patchForm({ vendorName: e.target.value })}
                placeholder="Vendor/supplier name"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Box className="w-4 h-4 inline mr-1.5" /> Item Name *
              </label>
              <input type="text" value={formData.itemName}
                onChange={e => patchForm({ itemName: e.target.value })}
                placeholder="Enter asset/item name"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Box className="w-4 h-4 inline mr-1.5" /> Quantity *
              </label>
              <input type="number" min="1" value={formData.quantity}
                onChange={e => patchForm({ quantity: e.target.value })}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <DollarSign className="w-4 h-4 inline mr-1.5" /> Price/Unit (₹) *
              </label>
              <input type="number" step="0.01" value={formData.purchasePrice}
                onChange={e => patchForm({ purchasePrice: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Wallet className="w-4 h-4 inline mr-1.5" /> Payment Mode
              </label>
              <select value={formData.paymentMode}
                onChange={e => patchForm({ paymentMode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none">
                {PAYMENT_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Receipt className="w-4 h-4 inline mr-1.5" /> Invoice Number
              </label>
              <input type="text" value={formData.invoiceNumber}
                onChange={e => patchForm({ invoiceNumber: e.target.value })}
                placeholder="Invoice/Ref number"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Hammer className="w-4 h-4 inline mr-1.5" /> Warranty
              </label>
              <input type="text" value={formData.warranty}
                onChange={e => patchForm({ warranty: e.target.value })}
                placeholder="e.g., 2 years"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Hammer className="w-4 h-4 inline mr-1.5" /> Used For
              </label>
              <input type="text" value={formData.usedFor}
                onChange={e => patchForm({ usedFor: e.target.value })}
                placeholder="e.g., Production, Office, Delivery"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <FileText className="w-4 h-4 inline mr-1.5" /> Notes
            </label>
            <textarea rows="2" value={formData.notes}
              onChange={e => patchForm({ notes: e.target.value })}
              placeholder="Additional notes..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
          </div>

          {/* Sync info */}
          <div className={`mt-4 border rounded-xl p-3 text-sm ${CASH_MODES.has(formData.paymentMode) ? 'bg-green-50 border-green-200 text-green-800' : 'bg-orange-50 border-orange-200 text-orange-800'}`}>
            {CASH_MODES.has(formData.paymentMode)
              ? `✅ Total (${fmt(num(formData.quantity) * num(formData.purchasePrice))}) will be added as expense to Cashbook on ${formData.date}`
              : `⚠️ Credit mode — no Cashbook impact. Set to Cash/UPI/Bank to sync.`}
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
              className="w-full sm:w-auto px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
              {saving ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-4 h-4" /> {isEditing ? 'Update' : 'Save Asset'}</>
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
            <input type="text" placeholder="Search by item, vendor, purpose..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none w-full md:w-72" />
          </div>
          <span className="text-sm text-gray-500">{filteredData.length} entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-3">Date</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-3">Item</th>
                <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-3">Qty</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-3">Price</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-3">Total</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-3">Vendor</th>
                <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-3">Category</th>
                <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-3">Payment</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(item => (
                <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-3 text-sm text-gray-600">{item.date}</td>
                  <td className="px-3 py-3">
                    <span className="font-medium text-gray-900">{item.itemName}</span>
                    {item.invoiceNumber && <p className="text-xs text-gray-400">Inv: {item.invoiceNumber}</p>}
                  </td>
                  <td className="px-3 py-3 text-center font-medium text-gray-700">{item.quantity}</td>
                  <td className="px-3 py-3 text-right text-gray-700">{fmt(item.purchasePrice)}</td>
                  <td className="px-3 py-3 text-right font-semibold text-emerald-600">{fmt(totalValue(item))}</td>
                  <td className="px-3 py-3 text-sm text-gray-600">{item.vendorName}</td>
                  <td className="px-3 py-3 text-center"><CategoryBadge category={item.category} /></td>
                  <td className="px-3 py-3 text-center"><PaymentBadge mode={item.paymentMode} /></td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
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
            <Hammer className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No asset records found</p>
          </div>
        )}
      </div>

      {/* View Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Asset Details</h3>
                <p className="text-sm text-gray-500">{selectedItem.date}</p>
              </div>
              <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Item Name</p>
                  <p className="font-medium">{selectedItem.itemName}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Category</p>
                  <CategoryBadge category={selectedItem.category} />
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Quantity</p>
                  <p className="font-medium">{selectedItem.quantity}</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Purchase Price</p>
                  <p className="font-bold text-emerald-600 text-lg">{fmt(selectedItem.purchasePrice)}</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 col-span-2">
                  <p className="text-xs text-gray-500">Total Value</p>
                  <p className="font-bold text-amber-600 text-2xl">{fmt(totalValue(selectedItem))}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Payment</p>
                  <PaymentBadge mode={selectedItem.paymentMode} />
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Vendor</p>
                  <p className="font-medium">{selectedItem.vendorName}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Invoice</p>
                  <p className="font-medium">{selectedItem.invoiceNumber || '-'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Warranty</p>
                  <p className="font-medium">{selectedItem.warranty || '-'}</p>
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
                  className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2">
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
              <h3 className="text-xl font-bold mb-2">Delete Asset</h3>
              <p className="text-gray-500 mb-6">
                This will remove the entry and reverse the Cashbook expense. Continue?
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

export default AssetsPurchase;