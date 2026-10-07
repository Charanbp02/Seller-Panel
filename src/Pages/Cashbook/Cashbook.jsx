// Pages/Cashbook/Cashbook.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Plus, Search, Filter, Download, Printer, Calendar,
  TrendingUp, TrendingDown, Edit, Trash2, Eye, FileText, DollarSign,
  Save, RefreshCw, AlertCircle, X, Clock, CheckCircle, AlertTriangle,
  Trash, Wallet, Building2, CreditCard, Banknote, Smartphone,
  Users, Tag, Receipt, Lock, PiggyBank
} from 'lucide-react';
import { db } from '../../firebase/firebaseConfig';
import {
  collection, doc, query, where, onSnapshot, getDocs, getDoc,
  runTransaction
} from 'firebase/firestore';

// ---------- Local-date helper (fixes IST midnight bug) ----------
const getLocalDateString = (d = new Date()) => {
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// ---------- Cash mode — only these count toward real cash/bank ----------
const CASH_MODES = new Set(['cash', 'upi', 'bank']);

// ---------- Deterministic entry ID (source + sourceId → same ID) ----------
const buildEntryId = (source, sourceId) => {
  const src = String(source || 'manual').trim();
  const id = String(sourceId || '');
  return id ? `${src}_${id}` : `${src}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
};

// ---------- Compute totals with proper type + mode awareness ----------
const computeDayTotals = (entries) => {
  let sales = 0, expense = 0, owner = 0, investment = 0;
  (entries || []).forEach((e) => {
    const amt = Number(e.amount) || 0;
    const isCash = CASH_MODES.has(e.paymentMode);
    if (!isCash) return; // credit → no cash impact (sales, expense, owner, investment — all)

    if (e.type === 'sales') sales += amt;
    else if (e.type === 'expense') expense += amt;
    else if (e.type === 'owner') owner += amt;
    else if (e.type === 'investment') investment += amt;
  });
  return { sales, expense, owner, investment };
};

// ---------- Compute closing balance ----------
const computeClosing = (opening, totals) =>
  opening + totals.sales + totals.investment - totals.expense - totals.owner;

const Cashbook = () => {
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);            // day-doc id (for move-between-dates)
  const [editingEntryId, setEditingEntryId] = useState(null);  // 🆕 entry.id (stable)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cashbookData, setCashbookData] = useState([]);

  const [formData, setFormData] = useState({
    date: getLocalDateString(),
    type: 'sales',
    description: '',
    amount: '',
    paymentMode: 'cash',
    reference: '',
    notes: ''
  });

  // ---------- Live listener ----------
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'cashbook'), (snapshot) => {
      const rows = [];
      snapshot.forEach((d) => rows.push({ id: d.id, ...d.data() }));
      rows.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      setCashbookData(rows);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching cashbook:', error);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // =====================================================================
  // FETCH ALL DAYS (outside tx)
  // =====================================================================
  const fetchAllDays = async () => {
    const snap = await getDocs(collection(db, 'cashbook'));
    return snap.docs
      .map((d) => ({ id: d.id, ref: d.ref, ...d.data() }))
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  };

  // =====================================================================
  // CORE UPSERT — one entry, cascaded forward from its date.
  // Move-between-dates handled in ONE transaction (merged updates).
  // =====================================================================
  const upsertEntry = async (entryPayload, oldDate = null) => {
    const {
      id: providedId,
      date,
      type,
      amount,
      paymentMode,
      description,
      reference = '',
      notes = '',
      source = 'manual',
      sourceId = null,
      createdAt = null
    } = entryPayload;

    const entryId = providedId || buildEntryId(source, sourceId);
    const nowISO = new Date().toISOString();

    const allDocs = await fetchAllDays();

    const buildEntry = (existing) => ({
      id: entryId,
      date,
      type,
      amount: Number(amount) || 0,
      paymentMode,
      description,
      reference,
      notes,
      source,
      sourceId,
      createdAt: existing?.createdAt || createdAt || nowISO,
      updatedAt: nowISO
    });

    // Compute cascade updates for a specific base date
    const computeCascade = (baseDate, mutateEntries) => {
      const targetExisting = allDocs.find((d) => d.date === baseDate) || null;
      const existingEntries = targetExisting?.entries || [];
      const newEntries = mutateEntries(existingEntries);
      const targetTotals = computeDayTotals(newEntries);

      const earlier = allDocs.filter((d) => d.date < baseDate);
      let carry = earlier.length > 0
        ? Number(earlier[earlier.length - 1].closingBalance) || 0
        : 0;

      const updates = [];
      const baseClosing = computeClosing(carry, targetTotals);
      updates.push({
        date: baseDate,
        ref: targetExisting?.ref || null,
        isNew: !targetExisting,
        entries: newEntries,
        totals: targetTotals,
        opening: carry,
        closing: baseClosing
      });
      carry = baseClosing;

      const later = allDocs.filter((d) => d.date > baseDate);
      for (const d of later) {
        const t = computeDayTotals(d.entries || []);
        const opening = carry;
        const closing = computeClosing(opening, t);
        updates.push({
          date: d.date,
          ref: d.ref,
          isNew: false,
          entries: d.entries || [],
          totals: t,
          opening,
          closing
        });
        carry = closing;
      }
      return updates;
    };

    let mergedUpdates;
    if (oldDate && oldDate !== date) {
      // Move between dates — single transaction
      const removeUpdates = computeCascade(oldDate, (entries) =>
        entries.filter((e) => e.id !== entryId)
      );
      const addUpdates = computeCascade(date, (entries) => {
        const existing = entries.find((e) => e.id === entryId);
        const without = entries.filter((e) => e.id !== entryId);
        return [...without, buildEntry(existing)];
      });
      const map = new Map();
      for (const u of [...removeUpdates, ...addUpdates]) map.set(u.date, u);
      mergedUpdates = [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
    } else {
      mergedUpdates = computeCascade(date, (entries) => {
        const existing = entries.find((e) => e.id === entryId);
        const without = entries.filter((e) => e.id !== entryId);
        return [...without, buildEntry(existing)];
      });
    }

    await runTransaction(db, async (tx) => {
      // PHASE A: reads
      for (const u of mergedUpdates) {
        if (!u.isNew && u.ref) await tx.get(u.ref);
      }
      // PHASE B: writes
      for (const u of mergedUpdates) {
        const payload = {
          date: u.date,
          openingBalance: u.opening,
          sales: u.totals.sales,
          expense: u.totals.expense,
          owner: u.totals.owner,
          investment: u.totals.investment,
          closingBalance: u.closing,
          entries: u.entries,
          updatedAt: nowISO
        };
        if (u.isNew) {
          tx.set(doc(collection(db, 'cashbook')), { ...payload, createdAt: nowISO });
        } else {
          tx.update(u.ref, payload);
        }
      }
    });

    return entryId;
  };

  // =====================================================================
  // REMOVE ENTRY
  // =====================================================================
  const removeEntry = async (date, entryId) => {
    const nowISO = new Date().toISOString();
    const allDocs = await fetchAllDays();
    const targetExisting = allDocs.find((d) => d.date === date) || null;
    if (!targetExisting) return;

    const newEntries = (targetExisting.entries || []).filter((e) => e.id !== entryId);
    const targetTotals = computeDayTotals(newEntries);

    const earlier = allDocs.filter((d) => d.date < date);
    let carry = earlier.length > 0
      ? Number(earlier[earlier.length - 1].closingBalance) || 0
      : 0;

    const updates = [];
    const baseClosing = computeClosing(carry, targetTotals);
    updates.push({
      ref: targetExisting.ref,
      isNew: false,
      payload: {
        date,
        openingBalance: carry,
        sales: targetTotals.sales,
        expense: targetTotals.expense,
        owner: targetTotals.owner,
        investment: targetTotals.investment,
        closingBalance: baseClosing,
        entries: newEntries,
        updatedAt: nowISO
      }
    });
    carry = baseClosing;

    for (const d of allDocs.filter((x) => x.date > date)) {
      const t = computeDayTotals(d.entries || []);
      const opening = carry;
      const closing = computeClosing(opening, t);
      updates.push({
        ref: d.ref,
        isNew: false,
        payload: {
          date: d.date,
          openingBalance: opening,
          sales: t.sales,
          expense: t.expense,
          owner: t.owner,
          investment: t.investment,
          closingBalance: closing,
          entries: d.entries || [],
          updatedAt: nowISO
        }
      });
      carry = closing;
    }

    await runTransaction(db, async (tx) => {
      for (const u of updates) if (u.ref) await tx.get(u.ref);
      for (const u of updates) if (u.ref) tx.update(u.ref, u.payload);
    });
  };

  // =====================================================================
  // REMOVE WHOLE DAY
  // =====================================================================
  const removeWholeDay = async (dayDocId, dayDate) => {
    const nowISO = new Date().toISOString();
    const allDocs = await fetchAllDays();
    const targetDoc = allDocs.find((d) => d.id === dayDocId);
    if (!targetDoc) return;

    const earlier = allDocs.filter((d) => d.date < dayDate);
    let carry = earlier.length > 0
      ? Number(earlier[earlier.length - 1].closingBalance) || 0
      : 0;

    const updates = [];
    for (const d of allDocs.filter((x) => x.date > dayDate)) {
      const t = computeDayTotals(d.entries || []);
      const opening = carry;
      const closing = computeClosing(opening, t);
      updates.push({
        ref: d.ref,
        payload: {
          date: d.date,
          openingBalance: opening,
          sales: t.sales,
          expense: t.expense,
          owner: t.owner,
          investment: t.investment,
          closingBalance: closing,
          entries: d.entries || [],
          updatedAt: nowISO
        }
      });
      carry = closing;
    }

    await runTransaction(db, async (tx) => {
      if (targetDoc.ref) await tx.get(targetDoc.ref);
      for (const u of updates) await tx.get(u.ref);
      if (targetDoc.ref) tx.delete(targetDoc.ref);
      for (const u of updates) tx.update(u.ref, u.payload);
    });
  };

  // ---------- Add / Update entry ----------
  const handleAddEntry = async () => {
    if (!formData.description || !formData.amount) {
      alert('Please fill all required fields');
      return;
    }
    if (formData.paymentMode === 'credit' && formData.type !== 'expense') {
      // Only warn for non-expense (expenses might genuinely be on credit with vendor)
      const ok = window.confirm(
        `This ${formData.type} is marked as Credit. It will NOT affect your cashbook balance. Continue?`
      );
      if (!ok) return;
    }
    if (formData.paymentMode === 'credit' && formData.type === 'expense') {
      const ok = window.confirm(
        'This expense is marked as Credit. It will NOT reduce your cash balance (vendor payable only). Continue?'
      );
      if (!ok) return;
    }

    setSaving(true);
    try {
      const entryPayload = {
        id: editingEntryId || undefined,
        date: formData.date,
        type: formData.type,
        amount: Number(formData.amount) || 0,
        paymentMode: formData.paymentMode,
        description: formData.description,
        reference: formData.reference || '',
        notes: formData.notes || '',
        source: 'manual',
        sourceId: null
      };

      // If editing and the DATE changed, we need old date for the move
      let oldDate = null;
      if (isEditing && editingId) {
        // Fetch target day doc directly (issue #10 fix)
        const dayRef = doc(db, 'cashbook', editingId);
        const daySnap = await getDoc(dayRef);
        if (daySnap.exists()) {
          oldDate = daySnap.data().date;
        }
      }

      await upsertEntry(entryPayload, oldDate);

      setIsAdding(false);
      setIsEditing(false);
      setEditingId(null);
      setEditingEntryId(null);
      resetForm();
      const msg = document.createElement('div');
      msg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      msg.textContent = isEditing ? 'Entry updated!' : 'Entry added!';
      document.body.appendChild(msg);
      setTimeout(() => msg.remove(), 3000);
    } catch (error) {
      console.error('Error saving entry:', error);
      alert('Failed to save entry: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  // ---------- Edit ----------
  const handleEdit = (dayItem, entryIndex) => {
    const idx = typeof entryIndex === 'number' ? entryIndex : 0;
    const entry = dayItem.entries?.[idx];
    if (!entry) {
      resetForm();
      setFormData((p) => ({ ...p, date: dayItem.date }));
      setIsAdding(true);
      return;
    }
    // 🔒 Guard: automatic entries are read-only in Cashbook
    if (entry.source && entry.source !== 'manual') {
      alert(
        `This entry was auto-generated by "${entry.source}". ` +
        `Edit it in the source page instead.`
      );
      return;
    }
    setIsEditing(true);
    setEditingId(dayItem.id);                     // day-doc id (for move)
    setEditingEntryId(entry.id || null);          // 🆕 stable entry id
    setFormData({
      date: dayItem.date,
      type: entry.type || 'sales',
      description: entry.description || '',
      amount: entry.amount?.toString() || '',
      paymentMode: entry.paymentMode || 'cash',
      reference: entry.reference || '',
      notes: entry.notes || ''
    });
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ---------- Delete ----------
  const handleDelete = (dayItem, entryIndex) => {
    if (typeof entryIndex === 'number') {
      const entry = dayItem.entries?.[entryIndex];
      if (entry?.source && entry.source !== 'manual') {
        alert(
          `This entry was auto-generated by "${entry.source}". ` +
          `Delete it from the source page instead.`
        );
        return;
      }
      setDeleteTarget({
        docId: dayItem.id,
        date: dayItem.date,
        entryId: entry?.id,
        entryIndex
      });
    } else {
      const hasAuto = (dayItem.entries || []).some(
        (e) => e.source && e.source !== 'manual'
      );
      if (hasAuto) {
        alert(
          'This day contains automatic entries (from Daily Sales / Expenses). ' +
          'Delete those from their source pages first.'
        );
        return;
      }
      setDeleteTarget({ docId: dayItem.id, date: dayItem.date, whole: true });
    }
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      if (deleteTarget.whole) {
        await removeWholeDay(deleteTarget.docId, deleteTarget.date);
      } else {
        // Prefer stable entry.id; fall back to index for legacy entries
        if (deleteTarget.entryId) {
          await removeEntry(deleteTarget.date, deleteTarget.entryId);
        } else {
          // Legacy fallback: remove by index using inline helper
          const dayRef = doc(db, 'cashbook', deleteTarget.docId);
          const daySnap = await getDoc(dayRef);
          if (!daySnap.exists()) throw new Error('Cashbook day not found');
          const dayData = daySnap.data();
          const newEntries = (dayData.entries || []).filter(
            (_, i) => i !== deleteTarget.entryIndex
          );
          // Write via upsertEntry path by replacing the whole day's entries
          // (Simple because we already have the day id)
          const nowISO = new Date().toISOString();
          const allDocs = await fetchAllDays();
          const t = computeDayTotals(newEntries);
          const earlier = allDocs.filter((d) => d.date < deleteTarget.date);
          let carry = earlier.length > 0
            ? Number(earlier[earlier.length - 1].closingBalance) || 0
            : 0;
          const updates = [];
          const baseClosing = computeClosing(carry, t);
          updates.push({
            ref: dayRef,
            payload: {
              date: deleteTarget.date,
              openingBalance: carry,
              sales: t.sales,
              expense: t.expense,
              owner: t.owner,
              investment: t.investment,
              closingBalance: baseClosing,
              entries: newEntries,
              updatedAt: nowISO
            }
          });
          carry = baseClosing;
          for (const d of allDocs.filter((x) => x.date > deleteTarget.date)) {
            const tt = computeDayTotals(d.entries || []);
            const opening = carry;
            const closing = computeClosing(opening, tt);
            updates.push({
              ref: d.ref,
              payload: {
                date: d.date,
                openingBalance: opening,
                sales: tt.sales,
                expense: tt.expense,
                owner: tt.owner,
                investment: tt.investment,
                closingBalance: closing,
                entries: d.entries || [],
                updatedAt: nowISO
              }
            });
            carry = closing;
          }
          await runTransaction(db, async (tx) => {
            for (const u of updates) await tx.get(u.ref);
            for (const u of updates) tx.update(u.ref, u.payload);
          });
        }
      }
      setShowDeleteModal(false);
      setDeleteTarget(null);
      const msg = document.createElement('div');
      msg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      msg.textContent = 'Deleted successfully!';
      document.body.appendChild(msg);
      setTimeout(() => msg.remove(), 3000);
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Failed to delete: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleView = (item) => setSelectedEntry(item);

  const resetForm = () => {
    setFormData({
      date: selectedDate || getLocalDateString(),
      type: 'sales',
      description: '',
      amount: '',
      paymentMode: 'cash',
      reference: '',
      notes: ''
    });
    setIsEditing(false);
    setEditingId(null);
    setEditingEntryId(null);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setIsEditing(false);
    setEditingId(null);
    setEditingEntryId(null);
    resetForm();
  };

  // ---------- Filters ----------
  const filteredData = cashbookData.filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (item.date || '').includes(searchTerm) ||
      (item.entries || []).some((e) =>
        (e.description || '').toLowerCase().includes(term) ||
        (e.reference || '').toLowerCase().includes(term)
      )
    );
  });

  // ---------- Summary Stats ----------
  const totalSales = cashbookData.reduce((s, i) => s + (Number(i.sales) || 0), 0);
  const totalExpense = cashbookData.reduce((s, i) => s + (Number(i.expense) || 0), 0);
  const totalOwner = cashbookData.reduce((s, i) => s + (Number(i.owner) || 0), 0);
  const totalInvestment = cashbookData.reduce((s, i) => s + (Number(i.investment) || 0), 0);
  const currentBalance = cashbookData.length > 0
    ? Number(cashbookData[0].closingBalance) || 0
    : 0;

  const getTypeBadge = (type) => {
    const configs = {
      sales: { bg: 'bg-green-50', text: 'text-green-700', icon: TrendingUp, label: 'Sales' },
      expense: { bg: 'bg-red-50', text: 'text-red-700', icon: TrendingDown, label: 'Expense' },
      owner: { bg: 'bg-purple-50', text: 'text-purple-700', icon: Users, label: 'Owner' },
      investment: { bg: 'bg-blue-50', text: 'text-blue-700', icon: PiggyBank, label: 'Investment' }
    };
    const config = configs[type] || configs.sales;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const getPaymentBadge = (mode) => {
    const configs = {
      cash: { bg: 'bg-blue-50', text: 'text-blue-700', icon: Banknote, label: 'Cash' },
      upi: { bg: 'bg-purple-50', text: 'text-purple-700', icon: Smartphone, label: 'UPI' },
      bank: { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: Building2, label: 'Bank' },
      credit: { bg: 'bg-orange-50', text: 'text-orange-700', icon: CreditCard, label: 'Credit' }
    };
    const config = configs[mode] || configs.cash;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const isAutomatic = (entry) => entry?.source && entry.source !== 'manual';

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading cashbook data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl shadow-lg p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 backdrop-blur rounded-xl">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">Cashbook</h1>
              <p className="text-amber-100 text-sm">Track daily cash flow and transactions</p>
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
            <button
              onClick={() => {
                resetForm();
                setFormData((p) => ({ ...p, date: selectedDate }));
                setIsAdding(true);
              }}
              className="bg-white text-amber-600 hover:bg-amber-50 px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Entry</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Current Balance</p>
          <p className="text-xl md:text-2xl font-bold text-emerald-600 mt-1">
            ₹{currentBalance.toFixed(2)}
          </p>
          <p className="text-[10px] text-gray-400 mt-1">Cash + UPI + Bank only</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Sales</p>
          <p className="text-xl md:text-2xl font-bold text-green-600 mt-1">₹{totalSales.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Expenses</p>
          <p className="text-xl md:text-2xl font-bold text-red-600 mt-1">₹{totalExpense.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Owner Withdrawals</p>
          <p className="text-xl md:text-2xl font-bold text-purple-600 mt-1">₹{totalOwner.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Investments</p>
          <p className="text-xl md:text-2xl font-bold text-blue-600 mt-1">₹{totalInvestment.toFixed(2)}</p>
        </div>
      </div>

      {/* Add/Edit Form */}
      {isAdding && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 md:p-6 animate-fadeIn">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {isEditing ? 'Edit Entry' : 'Add Entry'}
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
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Tag className="w-4 h-4 inline mr-1.5" /> Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="sales">Sales (Income)</option>
                <option value="expense">Expense</option>
                <option value="owner">Owner Withdrawal</option>
                <option value="investment">Owner Investment</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Wallet className="w-4 h-4 inline mr-1.5" /> Payment Mode
              </label>
              <select
                value={formData.paymentMode}
                onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="bank">Bank Transfer</option>
                <option value="credit">Credit (no cash impact)</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <FileText className="w-4 h-4 inline mr-1.5" /> Description *
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter description"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <DollarSign className="w-4 h-4 inline mr-1.5" /> Amount *
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Receipt className="w-4 h-4 inline mr-1.5" /> Reference
              </label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                placeholder="Invoice/Ref number"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {formData.paymentMode === 'credit' && (
            <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm text-orange-800">
                <AlertCircle className="w-4 h-4 inline mr-1.5" />
                <strong>Credit entry:</strong> This will NOT affect your cashbook balance.
                {formData.type === 'sales' && ' Outstanding will be tracked in the Customer Ledger.'}
                {formData.type === 'expense' && ' Track as vendor payable instead.'}
              </p>
            </div>
          )}

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <FileText className="w-4 h-4 inline mr-1.5" /> Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows="2"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <button onClick={resetForm} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
              Reset
            </button>
            <button onClick={handleCancel} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
              Cancel
            </button>
            <button
              onClick={handleAddEntry}
              disabled={saving}
              className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {saving ? 'Saving...' : (isEditing ? 'Update Entry' : 'Save Entry')}
            </button>
          </div>
        </div>
      )}

      {/* Cashbook List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div className="relative flex-1 md:flex-none">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by date, description, or reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 w-full md:w-80"
            />
          </div>
          <span className="text-sm text-gray-500">{filteredData.length} entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Date</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">Opening</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">Sales</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">Investment</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">Expense</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">Owner</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">Closing</th>
                <th className="text-center text-xs font-medium text-gray-500 uppercase px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">{item.date}</span>
                    <div className="text-xs text-gray-400">
                      {(item.entries || []).length} transaction{(item.entries || []).length !== 1 ? 's' : ''}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    ₹{Number(item.openingBalance || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-green-600">
                    ₹{Number(item.sales || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-blue-600">
                    ₹{Number(item.investment || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-red-600">
                    ₹{Number(item.expense || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-purple-600">
                    ₹{Number(item.owner || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-600">
                    ₹{Number(item.closingBalance || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleView(item)}
                        className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          resetForm();
                          setFormData((p) => ({ ...p, date: item.date }));
                          setIsAdding(true);
                        }}
                        className="p-1.5 hover:bg-green-50 rounded-lg text-green-600"
                        title="Add to this day"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-red-600"
                        title="Delete whole day (only if no automatic entries)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No entries found</p>
          </div>
        )}
      </div>

      {/* View Details Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Cashbook — {selectedEntry.date}</h3>
              </div>
              <button
                onClick={() => setSelectedEntry(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Opening</p>
                  <p className="font-bold text-gray-900">
                    ₹{Number(selectedEntry.openingBalance || 0).toFixed(2)}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Sales</p>
                  <p className="font-bold text-green-600">
                    ₹{Number(selectedEntry.sales || 0).toFixed(2)}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Investment</p>
                  <p className="font-bold text-blue-600">
                    ₹{Number(selectedEntry.investment || 0).toFixed(2)}
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Expense</p>
                  <p className="font-bold text-red-600">
                    ₹{Number(selectedEntry.expense || 0).toFixed(2)}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Owner</p>
                  <p className="font-bold text-purple-600">
                    ₹{Number(selectedEntry.owner || 0).toFixed(2)}
                  </p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 text-center col-span-2 md:col-span-5">
                  <p className="text-xs text-gray-500">Closing Balance</p>
                  <p className="font-bold text-emerald-600 text-xl">
                    ₹{Number(selectedEntry.closingBalance || 0).toFixed(2)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Transactions</p>
                <div className="space-y-2">
                  {(selectedEntry.entries || []).map((entry, idx) => (
                    <div
                      key={entry.id || idx}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        isAutomatic(entry)
                          ? 'border-blue-200 bg-blue-50/40'
                          : 'border-gray-100 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`p-2 rounded-lg ${
                          entry.type === 'sales' ? 'bg-green-50 text-green-600' :
                          entry.type === 'expense' ? 'bg-red-50 text-red-600' :
                          entry.type === 'investment' ? 'bg-blue-50 text-blue-600' :
                          'bg-purple-50 text-purple-600'
                        }`}>
                          {entry.type === 'sales' ? <TrendingUp className="w-4 h-4" /> :
                           entry.type === 'expense' ? <TrendingDown className="w-4 h-4" /> :
                           entry.type === 'investment' ? <PiggyBank className="w-4 h-4" /> :
                           <Users className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {getTypeBadge(entry.type)}
                            {getPaymentBadge(entry.paymentMode)}
                            {isAutomatic(entry) && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                <Lock className="w-3 h-3" />
                                Auto ({entry.source})
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-gray-900 truncate">{entry.description}</p>
                          {entry.reference && (
                            <p className="text-xs text-gray-400 truncate">Ref: {entry.reference}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <p className={`text-sm font-semibold ${
                          entry.type === 'sales' ? 'text-green-600' :
                          entry.type === 'expense' ? 'text-red-600' :
                          entry.type === 'investment' ? 'text-blue-600' :
                          'text-purple-600'
                        }`}>
                          {entry.type === 'sales' || entry.type === 'investment' ? '+' : '-'}₹{Number(entry.amount || 0).toFixed(2)}
                        </p>
                        {!isAutomatic(entry) && (
                          <div className="flex gap-1 mt-1 justify-end">
                            <button
                              onClick={() => {
                                setSelectedEntry(null);
                                handleEdit(selectedEntry, idx);
                              }}
                              className="p-1 hover:bg-green-50 rounded text-green-600"
                              title="Edit this entry"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedEntry(null);
                                handleDelete(selectedEntry, idx);
                              }}
                              className="p-1 hover:bg-red-50 rounded text-red-600"
                              title="Delete this entry"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">
              {deleteTarget.whole ? 'Delete Day Entry' : 'Delete Transaction'}
            </h3>
            <p className="text-gray-500 mb-6">
              {deleteTarget.whole
                ? 'This will delete the entire day and all its transactions. Later days will be recalculated.'
                : 'This will remove the selected transaction. Later days will be recalculated.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg"
              >
                {saving ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cashbook;