// src/Pages/Customers/Customers.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Plus, Search, Filter, Download, Printer, Calendar,
  Edit, Trash2, Eye, FileText, DollarSign, Save, RefreshCw,
  AlertCircle, X, Clock, CheckCircle, AlertTriangle, Trash,
  Wallet, Building2, Phone, MapPin, User, Store, TrendingUp,
  TrendingDown, Receipt, ShoppingBag, CreditCard, Banknote,
  Smartphone, ArrowUpRight, ArrowDownRight, Tag, Briefcase,
  Home, Mail, UserCheck, UserPlus, Lock
} from 'lucide-react';
import { db } from '../../firebase/firebaseConfig';
import {
  collection, addDoc, updateDoc, deleteDoc, doc, query,
  orderBy, onSnapshot, getDocs, getDoc, writeBatch, runTransaction
} from 'firebase/firestore';

// ---------- Local-date helper (fixes IST midnight bug) ----------
const getLocalDateString = (d = new Date()) => {
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const CASH_MODES = new Set(['cash', 'upi', 'bank']);

// ---------- Compute outstanding from transactions ----------
const computeOutstandingFromTxs = (txs, openingBalance = 0) => {
  let purchases = 0, paid = 0;
  (txs || []).forEach(t => {
    const amt = Number(t.amount) || 0;
    if (t.type === 'sale' || t.type === 'credit') purchases += amt;
    else if (t.type === 'payment') paid += amt;
  });
  return Math.max(0, +(purchases - paid + (Number(openingBalance) || 0)).toFixed(2));
};

const Customers = () => {
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [activeTab, setActiveTab] = useState('customers');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customersData, setCustomersData] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    customerName: '',
    ownerName: '',
    mobile: '',
    address: '',
    customerType: 'hotel',
    openingBalance: '',
    gstNumber: '',
    email: '',
    notes: ''
  });

  // Transaction Form State
  const [transactionForm, setTransactionForm] = useState({
    date: getLocalDateString(),
    type: 'sale',
    amount: '',
    description: '',
    paymentMode: 'cash',
    reference: ''
  });

  // ---------- Live listener ----------
  useEffect(() => {
    const q = query(
      collection(db, 'customers'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const customers = [];
      snapshot.forEach((doc) => {
        customers.push({ id: doc.id, ...doc.data() });
      });
      setCustomersData(customers);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching customers:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ---------- Helpers ----------
  const isAutoEntry = (t) => !!(t.source && t.source !== 'manual');

  const showToast = (text) => {
    const msg = document.createElement('div');
    msg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    msg.textContent = text;
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 3000);
  };

  // ---------- Balance calculation ----------
  const calculateBalance = (customer) => {
    let totalPurchases = 0;
    let totalPaid = 0;

    (customer.transactions || []).forEach((t) => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'sale' || t.type === 'credit') totalPurchases += amt;
      else if (t.type === 'payment') totalPaid += amt;
    });

    const opening = Number(customer.openingBalance) || 0;
    const currentBalance = totalPurchases - totalPaid + opening;

    return { totalPurchases, totalPaid, currentBalance };
  };

  const customersWithBalance = customersData.map((c) => ({
    ...c,
    ...calculateBalance(c)
  }));

  // Keep selectedCustomer synced with the live listener
  useEffect(() => {
    if (!selectedCustomer) return;
    const fresh = customersWithBalance.find((c) => c.id === selectedCustomer.id);
    if (fresh) setSelectedCustomer(fresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customersData]);

  // ============================================================
  // ADD CUSTOMER
  // ============================================================
  const handleAddCustomer = async () => {
    if (!formData.customerName || !formData.mobile) {
      alert('Please fill all required fields');
      return;
    }

    setSaving(true);
    try {
      const nowISO = new Date().toISOString();
      const openingBal = parseFloat(formData.openingBalance) || 0;

      const newCustomer = {
        customerName: formData.customerName.trim(),
        ownerName: formData.ownerName || '',
        mobile: formData.mobile,
        address: formData.address || '',
        customerType: formData.customerType,
        openingBalance: openingBal,
        currentOutstanding: openingBal,
        gstNumber: formData.gstNumber || '',
        email: formData.email || '',
        notes: formData.notes || '',
        transactions: [],
        createdAt: nowISO,
        updatedAt: nowISO
      };

      await addDoc(collection(db, 'customers'), newCustomer);
      setIsAdding(false);
      resetForm();
      showToast('Customer added successfully!');
    } catch (error) {
      console.error('Error adding customer:', error);
      alert('Failed to add customer: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // ADD TRANSACTION
  // ============================================================
  const handleAddTransaction = async () => {
    if (saving) return;
    if (!transactionForm.amount || !transactionForm.description) {
      alert('Please fill all required fields');
      return;
    }
    if (!selectedCustomer) {
      alert('No customer selected');
      return;
    }

    setSaving(true);
    try {
      const amount = parseFloat(transactionForm.amount) || 0;
      const type = transactionForm.type;
      const nowISO = new Date().toISOString();
      const dateStr = transactionForm.date;
      const paymentMode = transactionForm.paymentMode || 'cash';

      const newTransaction = {
        id: `manual_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        date: dateStr,
        type,
        amount,
        description: transactionForm.description,
        paymentMode,
        reference: transactionForm.reference || '',
        source: 'manual',
        createdAt: nowISO
      };

      const isCashPayment =
        type === 'payment' &&
        CASH_MODES.has(paymentMode) &&
        amount > 0;

      // Refs prepared outside the transaction
      const custRef = doc(db, 'customers', selectedCustomer.id);
      const dailySalesRef = isCashPayment ? doc(collection(db, 'daily_sales')) : null;
      const dailySalesId = dailySalesRef?.id || null;

      const dailySalesDoc = isCashPayment ? {
        date: dateStr,
        isPaymentOnly: true,
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.customerName,
        customerType: selectedCustomer.customerType || 'hotel',
        products: [],
        subtotal: 0,
        totalDiscount: 0,
        grandTotal: amount,
        notes: transactionForm.description || '',
        invoiceNumber: `PAY-${dailySalesId}`,
        paymentMode,
        reference: transactionForm.reference || '',
        source: 'customers',
        sourceId: newTransaction.id,
        createdAt: nowISO,
        updatedAt: nowISO
      } : null;

      await runTransaction(db, async (trx) => {
        // ============ PHASE A: ALL READS ============
        const custSnap = await trx.get(custRef);
        if (!custSnap.exists()) throw new Error('Customer not found');

        // ============ PHASE B: ALL WRITES ============
        const existingTxs = custSnap.data().transactions || [];
        const updatedTx = [...existingTxs, newTransaction];
        const newOutstanding = computeOutstandingFromTxs(
          updatedTx,
          custSnap.data().openingBalance
        );

        trx.update(custRef, {
          transactions: updatedTx,
          currentOutstanding: newOutstanding,
          updatedAt: nowISO
        });

        if (isCashPayment && dailySalesRef) {
          trx.set(dailySalesRef, dailySalesDoc);
        }
      });

      setShowTransactionModal(false);
      resetTransactionForm();
      showToast(
        isCashPayment
          ? 'Payment added & synced to Daily Sales!'
          : 'Transaction added!'
      );
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Failed to add transaction: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // EDIT CUSTOMER
  // ============================================================
  const handleEdit = (customer) => {
    setIsEditing(true);
    setEditingId(customer.id);
    setFormData({
      customerName: customer.customerName || '',
      ownerName: customer.ownerName || '',
      mobile: customer.mobile || '',
      address: customer.address || '',
      customerType: customer.customerType || 'hotel',
      openingBalance: customer.openingBalance?.toString() || '',
      gstNumber: customer.gstNumber || '',
      email: customer.email || '',
      notes: customer.notes || ''
    });
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateCustomer = async () => {
    if (!formData.customerName || !formData.mobile) {
      alert('Please fill all required fields');
      return;
    }
    if (!editingId) {
      alert('No customer selected for editing');
      return;
    }

    setSaving(true);
    try {
      const old = customersData.find(c => c.id === editingId);
      const oldOpening = Number(old?.openingBalance) || 0;
      const newOpening = parseFloat(formData.openingBalance) || 0;
      const openingDiff = newOpening - oldOpening;

      const updatedCustomer = {
        customerName: formData.customerName.trim(),
        ownerName: formData.ownerName || '',
        mobile: formData.mobile,
        address: formData.address || '',
        customerType: formData.customerType,
        openingBalance: newOpening,
        gstNumber: formData.gstNumber || '',
        email: formData.email || '',
        notes: formData.notes || '',
        updatedAt: new Date().toISOString()
      };

      if (openingDiff !== 0) {
        const oldOutstanding = Number(old?.currentOutstanding) || 0;
        updatedCustomer.currentOutstanding = Math.max(0, oldOutstanding + openingDiff);
      }

      await updateDoc(doc(db, 'customers', editingId), updatedCustomer);

      setIsEditing(false);
      setEditingId(null);
      setIsAdding(false);
      resetForm();
      showToast('Customer updated!');
    } catch (error) {
      console.error('Error updating customer:', error);
      alert('Failed to update customer: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // DELETE CUSTOMER
  // ============================================================
  const handleDelete = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setSaving(true);
    try {
      await deleteDoc(doc(db, 'customers', deleteId));
      setShowDeleteModal(false);
      setDeleteId(null);
      showToast('Customer deleted!');
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('Failed to delete customer: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // DELETE TRANSACTION (with Daily Sales reverse)
  // ============================================================
  const handleDeleteTransaction = async (customer, txIndex) => {
    const txn = customer.transactions?.[txIndex];
    if (!txn) return;

    if (isAutoEntry(txn)) {
      alert(
        `This transaction was auto-generated by "${txn.source || 'source'}". ` +
        `Delete/edit it from the source page (Daily Sales / Expenses).`
      );
      return;
    }

    const ok = window.confirm('Delete this transaction?');
    if (!ok) return;

    setSaving(true);
    try {
      const isSameTx = (a, b) => {
        if (a.id && b.id) return a.id === b.id;
        return (
          a.date === b.date &&
          a.type === b.type &&
          Number(a.amount) === Number(b.amount) &&
          (a.description || '') === (b.description || '') &&
          (a.reference || '') === (b.reference || '')
        );
      };

      const shouldReverseDS =
        txn.type === 'payment' &&
        CASH_MODES.has(txn.paymentMode) &&
        !!txn.id;

      const custRef = doc(db, 'customers', customer.id);

      // Find the daily_sales doc created for this payment (if any)
      let dailySalesRef = null;
      if (shouldReverseDS) {
        try {
          const q = query(
            collection(db, 'daily_sales'),
            where('sourceId', '==', txn.id),
            where('source', '==', 'customers')
          );
          const snap = await getDocs(q);
          if (!snap.empty) dailySalesRef = snap.docs[0].ref;
        } catch (e) {
          console.warn('daily_sales lookup failed:', e.message);
        }
      }

      await runTransaction(db, async (trx) => {
        // ============ PHASE A: ALL READS ============
        const custSnap = await trx.get(custRef);
        if (!custSnap.exists()) throw new Error('Customer not found');

        const dsSnap = dailySalesRef ? await trx.get(dailySalesRef) : null;

        // ============ PHASE B: ALL WRITES ============
        const existingTxs = custSnap.data().transactions || [];
        const updatedTx = existingTxs.filter((t) => !isSameTx(t, txn));

        if (updatedTx.length === existingTxs.length) {
          throw new Error('Transaction no longer exists (already deleted?)');
        }

        const newOutstanding = computeOutstandingFromTxs(
          updatedTx,
          custSnap.data().openingBalance
        );

        trx.update(custRef, {
          transactions: updatedTx,
          currentOutstanding: newOutstanding,
          updatedAt: new Date().toISOString()
        });

        if (dailySalesRef && dsSnap?.exists()) {
          trx.delete(dailySalesRef);
        }
      });

      showToast('Transaction deleted & daily sales synced!');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Failed to delete transaction: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  // ---------- View ----------
  const handleView = (customer) => {
    setSelectedCustomer(customer);
    setActiveTab('customers');
  };

  // ---------- Reset forms ----------
  const resetForm = () => {
    setFormData({
      customerName: '',
      ownerName: '',
      mobile: '',
      address: '',
      customerType: 'hotel',
      openingBalance: '',
      gstNumber: '',
      email: '',
      notes: ''
    });
    setIsEditing(false);
    setEditingId(null);
  };

  const resetTransactionForm = () => {
    setTransactionForm({
      date: getLocalDateString(),
      type: 'sale',
      amount: '',
      description: '',
      paymentMode: 'cash',
      reference: ''
    });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setIsEditing(false);
    setEditingId(null);
    resetForm();
  };

  // ---------- Filters ----------
  const filteredCustomers = customersWithBalance.filter((customer) =>
    customer.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.ownerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.mobile?.includes(searchTerm) ||
    (customer.customerType && customer.customerType.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // ---------- Summary Stats ----------
  const totalCustomers = customersData.length;
  const totalOutstanding = customersWithBalance.reduce(
    (sum, c) => sum + (c.currentBalance > 0 ? c.currentBalance : 0), 0
  );
  const totalSales = customersWithBalance.reduce((sum, c) => sum + c.totalPurchases, 0);
  const totalPaid = customersWithBalance.reduce((sum, c) => sum + c.totalPaid, 0);

  const getCustomerTypeBadge = (type) => {
    const configs = {
      hotel: { bg: 'bg-blue-50', text: 'text-blue-700', icon: Building2, label: 'Hotel' },
      shop: { bg: 'bg-orange-50', text: 'text-orange-700', icon: Store, label: 'Shop' },
      individual: { bg: 'bg-green-50', text: 'text-green-700', icon: User, label: 'Individual' }
    };
    const config = configs[type] || configs.individual;
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

  const getTransactionTypeBadge = (t) => {
    const typeConfig = {
      sale: { bg: 'bg-green-50', text: 'text-green-700', icon: TrendingUp, label: 'Sale' },
      payment: { bg: 'bg-blue-50', text: 'text-blue-700', icon: TrendingDown, label: 'Payment' },
      credit: { bg: 'bg-yellow-50', text: 'text-yellow-700', icon: CreditCard, label: 'Credit' }
    };
    const c = typeConfig[t.type] || typeConfig.sale;
    const Icon = c.icon;

    if (isAutoEntry(t)) {
      return (
        <div className="flex items-center gap-1 justify-center flex-wrap">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
            <Icon className="w-3 h-3" /> {c.label}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
            <Lock className="w-3 h-3" /> Auto
          </span>
        </div>
      );
    }

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
        <Icon className="w-3 h-3" /> {c.label}
      </span>
    );
  };

  const formatCurrency = (amount) => `₹${(Number(amount) || 0).toFixed(2)}`;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 backdrop-blur rounded-xl">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">Customers</h1>
              <p className="text-blue-100 text-sm">Auto-syncs payments to Daily Sales</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur px-3 py-2 rounded-xl border border-white/30">
              <Calendar className="w-4 h-4 text-white" />
              <input
                type="date"
                value={getLocalDateString()}
                readOnly
                className="bg-transparent outline-none text-sm text-white w-32 [color-scheme:dark]"
              />
            </div>
            <button
              onClick={() => { resetForm(); setIsAdding(true); }}
              className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Customer</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Customers</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1">{totalCustomers}</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Sales</p>
              <p className="text-xl md:text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totalSales)}</p>
            </div>
            <div className="p-2 bg-emerald-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Paid</p>
              <p className="text-xl md:text-2xl font-bold text-green-600 mt-1">{formatCurrency(totalPaid)}</p>
            </div>
            <div className="p-2 bg-green-50 rounded-lg">
              <Wallet className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Outstanding</p>
              <p className="text-xl md:text-2xl font-bold text-amber-600 mt-1">{formatCurrency(totalOutstanding)}</p>
            </div>
            <div className="p-2 bg-amber-50 rounded-lg">
              <CreditCard className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Customer Form */}
      {isAdding && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <UserPlus className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {isEditing ? 'Edit Customer' : 'Add Customer'}
                </h2>
                <p className="text-sm text-gray-500">Enter customer details</p>
              </div>
            </div>
            <button onClick={handleCancel} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Store className="w-4 h-4 inline mr-1.5" /> Customer Name *
              </label>
              <input type="text" value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="Enter business name"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <User className="w-4 h-4 inline mr-1.5" /> Owner Name
              </label>
              <input type="text" value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                placeholder="Owner/Contact person"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Phone className="w-4 h-4 inline mr-1.5" /> Mobile Number *
              </label>
              <input type="text" value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                placeholder="Enter mobile number"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <MapPin className="w-4 h-4 inline mr-1.5" /> Address
              </label>
              <input type="text" value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter full address"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Tag className="w-4 h-4 inline mr-1.5" /> Customer Type
              </label>
              <select value={formData.customerType}
                onChange={(e) => setFormData({ ...formData, customerType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="hotel">🏨 Hotel / Restaurant</option>
                <option value="shop">🏪 Shop / Store</option>
                <option value="individual">👤 Individual</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Wallet className="w-4 h-4 inline mr-1.5" /> Opening Balance
              </label>
              <input type="number" step="0.01" value={formData.openingBalance}
                onChange={(e) => setFormData({ ...formData, openingBalance: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <FileText className="w-4 h-4 inline mr-1.5" /> GST Number
              </label>
              <input type="text" value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                placeholder="Enter GST number"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Mail className="w-4 h-4 inline mr-1.5" /> Email
              </label>
              <input type="email" value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <FileText className="w-4 h-4 inline mr-1.5" /> Notes
            </label>
            <textarea rows="2" value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <button onClick={resetForm}
              className="w-full sm:w-auto px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4" /> Reset
            </button>
            <button onClick={handleCancel}
              className="w-full sm:w-auto px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
              Cancel
            </button>
            <button onClick={isEditing ? handleUpdateCustomer : handleAddCustomer} disabled={saving}
              className="w-full sm:w-auto px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
              {saving ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-4 h-4" /> {isEditing ? 'Update' : 'Save Customer'}</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Customers List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div className="relative flex-1 md:flex-none">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search by name, owner, mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-80" />
          </div>
          <span className="text-sm text-gray-500">{filteredCustomers.length} customers</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                {['Customer', 'Owner', 'Mobile', 'Type'].map(h => (
                  <th key={h} className={`text-xs font-medium text-gray-500 uppercase px-3 py-3 ${h === 'Type' ? 'text-center' : 'text-left'}`}>{h}</th>
                ))}
                <th className="text-right text-xs font-medium text-gray-500 uppercase px-3 py-3">Purchases</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase px-3 py-3">Paid</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase px-3 py-3">Balance</th>
                <th className="text-center text-xs font-medium text-gray-500 uppercase px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-3">
                    <span className="font-medium text-gray-900">{customer.customerName}</span>
                    {customer.address && (
                      <p className="text-xs text-gray-400 truncate max-w-xs">{customer.address}</p>
                    )}
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-600">{customer.ownerName || '-'}</td>
                  <td className="px-3 py-3 text-sm text-gray-600">{customer.mobile}</td>
                  <td className="px-3 py-3 text-center">{getCustomerTypeBadge(customer.customerType)}</td>
                  <td className="px-3 py-3 text-right font-medium text-emerald-600">
                    {formatCurrency(customer.totalPurchases)}
                  </td>
                  <td className="px-3 py-3 text-right font-medium text-green-600">
                    {formatCurrency(customer.totalPaid)}
                  </td>
                  <td className={`px-3 py-3 text-right font-bold ${customer.currentBalance > 0 ? 'text-red-600' : customer.currentBalance < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                    {formatCurrency(customer.currentBalance)}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleView(customer)}
                        className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600" title="View">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => {
                        setSelectedCustomer(customer);
                        resetTransactionForm();
                        setShowTransactionModal(true);
                      }}
                        className="p-1.5 hover:bg-green-50 rounded-lg text-green-600" title="Add Transaction">
                        <Receipt className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleEdit(customer)}
                        className="p-1.5 hover:bg-amber-50 rounded-lg text-amber-600" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(customer.id)}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-red-600" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No customers found</p>
          </div>
        )}
      </div>

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedCustomer.customerName}</h3>
                  <p className="text-sm text-gray-500 capitalize">{selectedCustomer.customerType}</p>
                </div>
              </div>
              <button onClick={() => setSelectedCustomer(null)}
                className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Owner</p>
                  <p className="font-medium">{selectedCustomer.ownerName || '-'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Mobile</p>
                  <p className="font-medium">{selectedCustomer.mobile}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Type</p>
                  {getCustomerTypeBadge(selectedCustomer.customerType)}
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">GST</p>
                  <p className="font-medium">{selectedCustomer.gstNumber || '-'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                  <p className="text-xs text-gray-500">Address</p>
                  <p className="font-medium">{selectedCustomer.address || '-'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium">{selectedCustomer.email || '-'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Opening Balance</p>
                  <p className="font-medium">{formatCurrency(selectedCustomer.openingBalance)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Purchases</p>
                  <p className="font-bold text-emerald-600">{formatCurrency(selectedCustomer.totalPurchases)}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Paid</p>
                  <p className="font-bold text-blue-600">{formatCurrency(selectedCustomer.totalPaid)}</p>
                </div>
                <div className={`rounded-lg p-3 text-center ${selectedCustomer.currentBalance > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                  <p className="text-xs text-gray-500">Balance</p>
                  <p className={`font-bold text-lg ${selectedCustomer.currentBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(selectedCustomer.currentBalance)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Transactions</p>
                  <p className="font-bold text-gray-900">{(selectedCustomer.transactions || []).length}</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">Transaction History</h4>
                  <button onClick={() => {
                    resetTransactionForm();
                    setShowTransactionModal(true);
                  }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Add Transaction
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left text-xs font-medium text-gray-500 uppercase px-3 py-2">Date</th>
                        <th className="text-center text-xs font-medium text-gray-500 uppercase px-3 py-2">Type</th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase px-3 py-2">Description</th>
                        <th className="text-right text-xs font-medium text-gray-500 uppercase px-3 py-2">Amount</th>
                        <th className="text-center text-xs font-medium text-gray-500 uppercase px-3 py-2">Payment</th>
                        <th className="text-center text-xs font-medium text-gray-500 uppercase px-3 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!selectedCustomer.transactions || selectedCustomer.transactions.length === 0) ? (
                        <tr>
                          <td colSpan="6" className="text-center py-4 text-gray-500 text-sm">
                            No transactions found
                          </td>
                        </tr>
                      ) : (
                        selectedCustomer.transactions.map((t, idx) => (
                          <tr key={t.id || idx} className={`border-t border-gray-100 ${isAutoEntry(t) ? 'bg-blue-50/40' : ''}`}>
                            <td className="px-3 py-2 text-sm text-gray-600">{t.date}</td>
                            <td className="px-3 py-2 text-center">{getTransactionTypeBadge(t)}</td>
                            <td className="px-3 py-2 text-sm text-gray-700">{t.description}</td>
                            <td className={`px-3 py-2 text-right font-medium ${t.type === 'sale' || t.type === 'credit' ? 'text-emerald-600' : 'text-blue-600'}`}>
                              {t.type === 'sale' || t.type === 'credit' ? '+' : '-'}{formatCurrency(t.amount)}
                            </td>
                            <td className="px-3 py-2 text-center">{getPaymentBadge(t.paymentMode)}</td>
                            <td className="px-3 py-2 text-center">
                              {isAutoEntry(t) ? (
                                <span className="text-xs text-blue-600 inline-flex items-center gap-1">
                                  <Lock className="w-3 h-3" /> Auto
                                </span>
                              ) : (
                                <button onClick={() => handleDeleteTransaction(selectedCustomer, idx)}
                                  className="p-1 hover:bg-red-50 rounded text-red-600" title="Delete">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button onClick={() => {
                  resetTransactionForm();
                  setShowTransactionModal(true);
                }}
                  className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                  <Receipt className="w-4 h-4" /> Add Transaction
                </button>
                <button onClick={() => {
                  const c = selectedCustomer;
                  setSelectedCustomer(null);
                  handleEdit(c);
                }}
                  className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                  <Edit className="w-4 h-4" /> Edit
                </button>
                <button onClick={() => {
                  const id = selectedCustomer.id;
                  setSelectedCustomer(null);
                  handleDelete(id);
                }}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {showTransactionModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Receipt className="w-5 h-5 text-green-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Add Transaction</h3>
                  <p className="text-sm text-gray-500">{selectedCustomer.customerName}</p>
                </div>
              </div>
              <button onClick={() => setShowTransactionModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Calendar className="w-4 h-4 inline mr-1.5" /> Date
                  </label>
                  <input type="date" value={transactionForm.date}
                    onChange={(e) => setTransactionForm({ ...transactionForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Tag className="w-4 h-4 inline mr-1.5" /> Type
                  </label>
                  <select value={transactionForm.type}
                    onChange={(e) => setTransactionForm({ ...transactionForm, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none">
                    <option value="payment">Payment (Customer paid)</option>
                    <option value="sale">Sale (Customer owes)</option>
                    <option value="credit">Debit Adjustment (adds outstanding)</option>
                  </select>
                </div>
              </div>

              {transactionForm.type === 'payment' && CASH_MODES.has(transactionForm.paymentMode) && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                  ✅ This payment will be <strong>synced to Daily Sales</strong> and appear in Dashboard's Today's Collection on <strong>{transactionForm.date}</strong>.
                </div>
              )}

              {transactionForm.type === 'payment' && !CASH_MODES.has(transactionForm.paymentMode) && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800">
                  ⚠️ Credit mode — this payment will <strong>not</strong> be synced to Daily Sales.
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <FileText className="w-4 h-4 inline mr-1.5" /> Description *
                </label>
                <input type="text" value={transactionForm.description}
                  onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
                  placeholder="e.g., Sambhar powder payment"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <DollarSign className="w-4 h-4 inline mr-1.5" /> Amount *
                  </label>
                  <input type="number" step="0.01" value={transactionForm.amount}
                    onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Wallet className="w-4 h-4 inline mr-1.5" /> Payment Mode
                  </label>
                  <select value={transactionForm.paymentMode}
                    onChange={(e) => setTransactionForm({ ...transactionForm, paymentMode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none">
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="credit">Credit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Receipt className="w-4 h-4 inline mr-1.5" /> Reference
                </label>
                <input type="text" value={transactionForm.reference}
                  onChange={(e) => setTransactionForm({ ...transactionForm, reference: e.target.value })}
                  placeholder="Invoice / Ref number"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
              </div>

              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  <AlertCircle className="w-4 h-4 inline mr-1.5" />
                  Current Balance: <span className={`font-bold ${selectedCustomer.currentBalance > 0 ? 'text-red-600' : selectedCustomer.currentBalance < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                    {formatCurrency(selectedCustomer.currentBalance)}
                  </span>
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button onClick={() => setShowTransactionModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={handleAddTransaction} disabled={saving}
                  className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Transaction'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Customer</h3>
              <p className="text-gray-500 mb-6">
                Are you sure you want to delete this customer? This will also remove all transaction history.
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

export default Customers;