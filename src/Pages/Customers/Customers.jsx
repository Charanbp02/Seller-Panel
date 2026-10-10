// src/Pages/Customers/Customers.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Plus, Search, Filter, Download, Printer, Calendar,
  Edit, Trash2, Eye, FileText, DollarSign, Save, RefreshCw,
  AlertCircle, X, Clock, CheckCircle, AlertTriangle, Trash,
  Wallet, Building2, Phone, MapPin, User, Store, TrendingUp,
  TrendingDown, Receipt, ShoppingBag, CreditCard, Banknote,
  Smartphone, ArrowUpRight, ArrowDownRight, Tag, Briefcase,
  Home, Mail, UserCheck, UserPlus, Lock, Loader2
} from 'lucide-react';
import { db } from '../../firebase/firebaseConfig';
import {
  collection, addDoc, updateDoc, deleteDoc, doc, query,
  orderBy, onSnapshot, getDocs, where, runTransaction
} from 'firebase/firestore';

// ---------- Helpers ----------
const getLocalDateString = (d = new Date()) => {
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const CASH_MODES = new Set(['cash', 'upi', 'bank']);
const num = (v) => Number(v) || 0;
const fmt = (n) => `₹${num(n).toFixed(2)}`;

const computeOutstandingFromTxs = (txs, openingBalance = 0) => {
  let purchases = 0, paid = 0;
  (txs || []).forEach(t => {
    const amt = num(t.amount);
    if (t.type === 'sale' || t.type === 'credit') purchases += amt;
    else if (t.type === 'payment') paid += amt;
  });
  return Math.max(0, +(purchases - paid + num(openingBalance)).toFixed(2));
};

const emptyTransactionForm = () => ({
  date: getLocalDateString(),
  type: 'payment',
  amount: '',
  description: '',
  paymentMode: 'cash',
  reference: '',
  saleId: ''
});

const emptyCustomerForm = () => ({
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

// ============================================================
// COMPONENT
// ============================================================
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customersData, setCustomersData] = useState([]);
  const [salesPayments, setSalesPayments] = useState([]);

  const [formData, setFormData] = useState(emptyCustomerForm());
  const [transactionForm, setTransactionForm] = useState(emptyTransactionForm());

  // Customer sales (loaded on demand)
  const [customerSales, setCustomerSales] = useState([]);
  const [loadingSales, setLoadingSales] = useState(false);

  // ============================================================
  // LISTENERS
  // ============================================================
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'customers'), (snap) => {
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      rows.sort((a, b) => {
        const ta = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
        const tb = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
        return tb - ta;
      });
      setCustomersData(rows);
      setLoading(false);
    }, (e) => { console.error('customers listener:', e); setLoading(false); });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'sales_payments'), (snap) => {
      setSalesPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (e) => console.warn('sales_payments listener:', e.message));
    return () => unsub();
  }, []);

  // Load sales for the selected customer
  useEffect(() => {
    if (!selectedCustomer) {
      setCustomerSales([]);
      return;
    }
    setLoadingSales(true);
    const q = query(
      collection(db, 'daily_sales'),
      where('customerId', '==', selectedCustomer.id)
    );
    const unsub = onSnapshot(q, (snap) => {
      const sales = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(s => !s.isPaymentOnly)
        .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
      setCustomerSales(sales);
      setLoadingSales(false);
    }, (e) => { console.warn('customer sales:', e.message); setLoadingSales(false); });
    return () => unsub();
  }, [selectedCustomer]);

  // Keep selectedCustomer synced
  useEffect(() => {
    if (!selectedCustomer) return;
    const fresh = customersData.find(c => c.id === selectedCustomer.id);
    if (fresh) setSelectedCustomer(prev => ({ ...fresh, ...calculateBalance(fresh) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customersData]);

  // ============================================================
  // HELPERS
  // ============================================================
  const isAutoEntry = (t) => !!(t.source && t.source !== 'manual');

  const showToast = (text) => {
    const msg = document.createElement('div');
    msg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    msg.textContent = text;
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 3000);
  };

  const calculateBalance = (customer) => {
    let totalPurchases = 0;
    let totalPaid = 0;
    (customer.transactions || []).forEach((t) => {
      const amt = num(t.amount);
      if (t.type === 'sale' || t.type === 'credit') totalPurchases += amt;
      else if (t.type === 'payment') totalPaid += amt;
    });
    const opening = num(customer.openingBalance);
    return {
      totalPurchases,
      totalPaid,
      currentBalance: totalPurchases - totalPaid + opening
    };
  };

  const customersWithBalance = useMemo(
    () => customersData.map(c => ({ ...c, ...calculateBalance(c) })),
    [customersData]
  );

  // Sales with running balance from sales_payments
  const salesWithBalance = useMemo(() => {
    return customerSales.map(sale => {
      const paid = salesPayments
        .filter(p => p.saleId === sale.id)
        .reduce((s, p) => s + num(p.amount), 0);
      const balance = Math.max(0, num(sale.grandTotal) - paid);
      return { ...sale, _paid: paid, _balance: balance };
    });
  }, [customerSales, salesPayments]);

  const pendingSales = salesWithBalance.filter(s => s._balance > 0);

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

      await addDoc(collection(db, 'customers'), {
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
      });

      setIsAdding(false);
      resetForm();
      showToast('Customer added successfully!');
    } catch (error) {
      console.error('Error adding customer:', error);
      alert('Failed: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // ADD TRANSACTION — syncs to sales_payments for pending-clear
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

    const amount = parseFloat(transactionForm.amount) || 0;
    if (amount <= 0) {
      alert('Amount must be greater than 0');
      return;
    }

    const type = transactionForm.type;
    const paymentMode = transactionForm.paymentMode || 'cash';
    const dateStr = transactionForm.date;
    const selectedSale = transactionForm.saleId
      ? salesWithBalance.find(s => s.id === transactionForm.saleId)
      : null;

    // Validation: payment must not exceed sale balance if linked to a sale
    if (selectedSale && amount > selectedSale._balance + 0.001) {
      alert(`Amount exceeds sale balance (${fmt(selectedSale._balance)})`);
      return;
    }

    setSaving(true);
    try {
      const nowISO = new Date().toISOString();
      const txId = `manual_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      // Should we create a sales_payments entry?
      // Yes if: payment type + sale selected + amount > 0
      const shouldCreateSalePayment =
        type === 'payment' &&
        !!selectedSale &&
        amount > 0;

      const custRef = doc(db, 'customers', selectedCustomer.id);

      // Payment doc ref (created before tx so we know its ID)
      const payRef = shouldCreateSalePayment ? doc(collection(db, 'sales_payments')) : null;
      const paymentId = payRef?.id || null;

      // Customer ledger row
      const ledgerRow = {
        id: txId,
        date: dateStr,
        type,
        amount,
        description: transactionForm.description,
        paymentMode,
        reference: transactionForm.reference || '',
        saleId: selectedSale?.id || null,
        saleInvoice: selectedSale?.invoiceNumber || null,
        // Link to sales_payments entry for easy reverse lookup
        paymentRefId: paymentId,
        source: 'manual',
        createdAt: nowISO
      };

      const paymentDoc = shouldCreateSalePayment ? {
        saleId: selectedSale.id,
        invoiceNumber: selectedSale.invoiceNumber,
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.customerName,
        amount,
        date: dateStr,
        mode: paymentMode,
        notes: transactionForm.description,
        reference: transactionForm.reference || '',
        source: 'customers',
        sourceId: txId,             // links back to customer ledger row
        createdAt: nowISO,
        updatedAt: nowISO
      } : null;

      await runTransaction(db, async (tx) => {
        // ============ PHASE A: ALL READS ============
        const custSnap = await tx.get(custRef);
        if (!custSnap.exists()) throw new Error('Customer not found');

        // ============ PHASE B: ALL WRITES ============
        const existingTxs = custSnap.data().transactions || [];
        const updatedTx = [...existingTxs, ledgerRow];
        const newOutstanding = computeOutstandingFromTxs(
          updatedTx,
          custSnap.data().openingBalance
        );

        tx.update(custRef, {
          transactions: updatedTx,
          currentOutstanding: newOutstanding,
          updatedAt: nowISO
        });

        // Write sales_payments entry if linking to a sale
        if (shouldCreateSalePayment && payRef && paymentDoc) {
          tx.set(payRef, paymentDoc);
        }
      });

      setShowTransactionModal(false);
      setTransactionForm(emptyTransactionForm());

      if (selectedSale) {
        showToast(`Payment ₹${amount} applied to ${selectedSale.invoiceNumber}`);
      } else {
        showToast('Transaction added!');
      }
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
    if (!editingId) return;

    setSaving(true);
    try {
      const old = customersData.find(c => c.id === editingId);
      const oldOpening = num(old?.openingBalance);
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
        const oldOutstanding = num(old?.currentOutstanding);
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
      alert('Failed: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // DELETE TRANSACTION — also removes linked sales_payments
  // ============================================================
  const handleDeleteTransaction = async (customer, txIndex) => {
    const txn = customer.transactions?.[txIndex];
    if (!txn) return;

    if (isAutoEntry(txn)) {
      alert(
        `This transaction was auto-generated by "${txn.source}". ` +
        `Delete/edit it from the source page.`
      );
      return;
    }

    if (!window.confirm('Delete this transaction? If it was applied to a sale, the sale balance will reverse.')) return;

    setSaving(true);
    try {
      // Find linked sales_payment via paymentRefId OR (saleId + amount + date)
      const linkedPayment = salesPayments.find(p =>
        (txn.paymentRefId && p.id === txn.paymentRefId) ||
        (p.sourceId === txn.id) ||
        (txn.saleId && p.saleId === txn.saleId &&
          num(p.amount) === num(txn.amount) &&
          p.date === txn.date &&
          (p.notes || '') === (txn.description || ''))
      );

      const custRef = doc(db, 'customers', customer.id);
      const payRef = linkedPayment ? doc(db, 'sales_payments', linkedPayment.id) : null;

      await runTransaction(db, async (tx) => {
        // ============ PHASE A: ALL READS ============
        const custSnap = await tx.get(custRef);
        if (!custSnap.exists()) throw new Error('Customer not found');

        const paySnap = payRef ? await tx.get(payRef) : null;

        // ============ PHASE B: ALL WRITES ============
        const existingTxs = custSnap.data().transactions || [];
        const updatedTx = existingTxs.filter((t, i) => i !== txIndex);
        const newOutstanding = computeOutstandingFromTxs(
          updatedTx,
          custSnap.data().openingBalance
        );

        tx.update(custRef, {
          transactions: updatedTx,
          currentOutstanding: newOutstanding,
          updatedAt: new Date().toISOString()
        });

        if (payRef && paySnap?.exists()) {
          tx.delete(payRef);
        }
      });

      showToast(
        linkedPayment
          ? 'Transaction deleted & sale balance reversed!'
          : 'Transaction deleted!'
      );
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Failed: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // RESET
  // ============================================================
  const resetForm = () => {
    setFormData(emptyCustomerForm());
    setIsEditing(false);
    setEditingId(null);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setIsEditing(false);
    setEditingId(null);
    resetForm();
  };

  const handleView = (customer) => {
    setSelectedCustomer({ ...customer, ...calculateBalance(customer) });
  };

  // ============================================================
  // DERIVED
  // ============================================================
  const filteredCustomers = customersWithBalance.filter(c =>
    c.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.ownerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.mobile?.includes(searchTerm)
  );

  const totalCustomers = customersData.length;
  const totalOutstanding = customersWithBalance.reduce(
    (sum, c) => sum + Math.max(0, c.currentBalance), 0
  );
  const totalSales = customersWithBalance.reduce((sum, c) => sum + c.totalPurchases, 0);
  const totalPaid = customersWithBalance.reduce((sum, c) => sum + c.totalPaid, 0);

  // ============================================================
  // UI BADGES
  // ============================================================
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
        <Icon className="w-3 h-3" /> {config.label}
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
        <Icon className="w-3 h-3" /> {config.label}
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
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
        <Icon className="w-3 h-3" /> {c.label}
      </span>
    );
  };

  const formatCurrency = (amount) => `₹${num(amount).toFixed(2)}`;

  // ============================================================
  // RENDER
  // ============================================================
  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Loading customers...</p>
      </div>
    </div>
  );

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
              <p className="text-blue-100 text-sm">Payments sync to Daily Sales automatically</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { resetForm(); setIsAdding(true); }}
              className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg"
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
              <p className="text-xs text-gray-500 font-medium uppercase">Total Customers</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1">{totalCustomers}</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg"><Users className="w-5 h-5 text-blue-600" /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase">Total Sales</p>
              <p className="text-xl md:text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totalSales)}</p>
            </div>
            <div className="p-2 bg-emerald-50 rounded-lg"><TrendingUp className="w-5 h-5 text-emerald-600" /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase">Total Paid</p>
              <p className="text-xl md:text-2xl font-bold text-green-600 mt-1">{formatCurrency(totalPaid)}</p>
            </div>
            <div className="p-2 bg-green-50 rounded-lg"><Wallet className="w-5 h-5 text-green-600" /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase">Outstanding</p>
              <p className="text-xl md:text-2xl font-bold text-amber-600 mt-1">{formatCurrency(totalOutstanding)}</p>
            </div>
            <div className="p-2 bg-amber-50 rounded-lg"><CreditCard className="w-5 h-5 text-amber-600" /></div>
          </div>
        </div>
      </div>

      {/* Add/Edit Customer Form */}
      {isAdding && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl"><UserPlus className="w-5 h-5 text-blue-600" /></div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {isEditing ? 'Edit Customer' : 'Add Customer'}
                </h2>
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
                onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="Enter business name"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <User className="w-4 h-4 inline mr-1.5" /> Owner Name
              </label>
              <input type="text" value={formData.ownerName}
                onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Phone className="w-4 h-4 inline mr-1.5" /> Mobile *
              </label>
              <input type="text" value={formData.mobile}
                onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <MapPin className="w-4 h-4 inline mr-1.5" /> Address
              </label>
              <input type="text" value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Tag className="w-4 h-4 inline mr-1.5" /> Type
              </label>
              <select value={formData.customerType}
                onChange={e => setFormData({ ...formData, customerType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                <option value="hotel">🏨 Hotel</option>
                <option value="shop">🏪 Shop</option>
                <option value="individual">👤 Individual</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Wallet className="w-4 h-4 inline mr-1.5" /> Opening Balance
              </label>
              <input type="number" step="0.01" value={formData.openingBalance}
                onChange={e => setFormData({ ...formData, openingBalance: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">GST</label>
              <input type="text" value={formData.gstNumber}
                onChange={e => setFormData({ ...formData, gstNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input type="email" value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
            <textarea rows="2" value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <button onClick={handleCancel}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button onClick={isEditing ? handleUpdateCustomer : handleAddCustomer} disabled={saving}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : (isEditing ? 'Update' : 'Save Customer')}
            </button>
          </div>
        </div>
      )}

      {/* Customers List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="relative flex-1 md:flex-none">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search by name, owner, mobile..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-full md:w-80" />
          </div>
          <span className="text-sm text-gray-500">{filteredCustomers.length} customers</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-3 py-3">Customer</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-3 py-3">Mobile</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase px-3 py-3">Purchases</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase px-3 py-3">Paid</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase px-3 py-3">Balance</th>
                <th className="text-center text-xs font-medium text-gray-500 uppercase px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(customer => (
                <tr key={customer.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-3">
                    <span className="font-medium text-gray-900">{customer.customerName}</span>
                    {customer.address && (
                      <p className="text-xs text-gray-400 truncate max-w-xs">{customer.address}</p>
                    )}
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-600">{customer.mobile}</td>
                  <td className="px-3 py-3 text-right text-emerald-600 font-medium">{formatCurrency(customer.totalPurchases)}</td>
                  <td className="px-3 py-3 text-right text-green-600 font-medium">{formatCurrency(customer.totalPaid)}</td>
                  <td className={`px-3 py-3 text-right font-bold ${customer.currentBalance > 0 ? 'text-red-600' : customer.currentBalance < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                    {formatCurrency(customer.currentBalance)}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleView(customer)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => {
                        setSelectedCustomer({ ...customer, ...calculateBalance(customer) });
                        setTransactionForm(emptyTransactionForm());
                        setShowTransactionModal(true);
                      }} className="p-1.5 hover:bg-green-50 rounded-lg text-green-600" title="Add Payment">
                        <Receipt className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleEdit(customer)} className="p-1.5 hover:bg-amber-50 rounded-lg text-amber-600"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(customer.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-600"><Trash2 className="w-4 h-4" /></button>
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
              <div>
                <h3 className="font-semibold text-gray-900">{selectedCustomer.customerName}</h3>
                <p className="text-sm text-gray-500">{selectedCustomer.mobile}</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Summary */}
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

              {/* Pending Sales */}
              {pendingSales.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Pending Sales</h4>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {pendingSales.map(s => (
                      <div key={s.id} className="flex items-center justify-between bg-amber-50 rounded px-3 py-2 text-sm">
                        <div>
                          <span className="font-medium">{s.invoiceNumber}</span>
                          <span className="text-xs text-gray-500 ml-2">{s.date}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-gray-600 mr-2">Total {formatCurrency(s.grandTotal)}</span>
                          <span className="font-bold text-red-600">Due {formatCurrency(s._balance)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Transactions */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">Transaction History</h4>
                  <button onClick={() => { setTransactionForm(emptyTransactionForm()); setShowTransactionModal(true); }}
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
                        <tr><td colSpan="6" className="text-center py-4 text-gray-500 text-sm">No transactions</td></tr>
                      ) : (
                        selectedCustomer.transactions.map((t, idx) => (
                          <tr key={t.id || idx} className="border-t border-gray-100">
                            <td className="px-3 py-2 text-sm text-gray-600">{t.date}</td>
                            <td className="px-3 py-2 text-center">{getTransactionTypeBadge(t)}</td>
                            <td className="px-3 py-2 text-sm text-gray-700">
                              {t.description}
                              {t.saleInvoice && (
                                <span className="text-xs text-blue-600 ml-1">→ {t.saleInvoice}</span>
                              )}
                            </td>
                            <td className={`px-3 py-2 text-right font-medium ${t.type === 'payment' ? 'text-blue-600' : 'text-emerald-600'}`}>
                              {t.type === 'payment' ? '-' : '+'}{formatCurrency(t.amount)}
                            </td>
                            <td className="px-3 py-2 text-center">{getPaymentBadge(t.paymentMode)}</td>
                            <td className="px-3 py-2 text-center">
                              {!isAutoEntry(t) ? (
                                <button onClick={() => handleDeleteTransaction(selectedCustomer, idx)}
                                  className="p-1 hover:bg-red-50 rounded text-red-600" title="Delete">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              ) : (
                                <span className="text-xs text-blue-600"><Lock className="w-3 h-3 inline" /></span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <button onClick={() => { setTransactionForm(emptyTransactionForm()); setShowTransactionModal(true); }}
                  className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium">
                  Add Payment
                </button>
                <button onClick={() => { const c = selectedCustomer; setSelectedCustomer(null); handleEdit(c); }}
                  className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium">
                  Edit
                </button>
                <button onClick={() => { const id = selectedCustomer.id; setSelectedCustomer(null); handleDelete(id); }}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {showTransactionModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="font-semibold text-gray-900">Add Transaction</h3>
                <p className="text-sm text-gray-500">{selectedCustomer.customerName}</p>
              </div>
              <button onClick={() => setShowTransactionModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
                  <input type="date" value={transactionForm.date}
                    onChange={e => setTransactionForm({ ...transactionForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
                  <select value={transactionForm.type}
                    onChange={e => setTransactionForm({ ...transactionForm, type: e.target.value, saleId: '' })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                    <option value="payment">Payment (Customer paid)</option>
                    <option value="sale">Sale (Customer owes)</option>
                    <option value="credit">Debit Adjustment</option>
                  </select>
                </div>
              </div>

              {/* Against Sale dropdown — only for payment type */}
              {transactionForm.type === 'payment' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Apply to Sale (Optional)
                  </label>
                  {loadingSales ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading sales...
                    </div>
                  ) : pendingSales.length === 0 ? (
                    <p className="text-xs text-gray-400 py-2 bg-gray-50 rounded px-3">
                      No pending sales for this customer. Payment will only reduce outstanding.
                    </p>
                  ) : (
                    <select value={transactionForm.saleId}
                      onChange={e => setTransactionForm({ ...transactionForm, saleId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                      <option value="">— No specific sale (standalone) —</option>
                      {pendingSales.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.invoiceNumber} • {s.date} • Due {formatCurrency(s._balance)}
                        </option>
                      ))}
                    </select>
                  )}
                  {transactionForm.saleId && (
                    <p className="text-xs text-blue-600 mt-1">
                      ✅ Applied to {salesWithBalance.find(s => s.id === transactionForm.saleId)?.invoiceNumber} — pending will reduce automatically
                    </p>
                  )}
                  {!transactionForm.saleId && pendingSales.length > 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠️ No sale selected — only customer outstanding will reduce
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
                <input type="text" value={transactionForm.description}
                  onChange={e => setTransactionForm({ ...transactionForm, description: e.target.value })}
                  placeholder="e.g., Sambhar powder payment"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount *</label>
                  <input type="number" step="0.01" value={transactionForm.amount}
                    onChange={e => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Mode</label>
                  <select value={transactionForm.paymentMode}
                    onChange={e => setTransactionForm({ ...transactionForm, paymentMode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="bank">Bank</option>
                    <option value="credit">Credit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Reference</label>
                <input type="text" value={transactionForm.reference}
                  onChange={e => setTransactionForm({ ...transactionForm, reference: e.target.value })}
                  placeholder="Invoice / Ref number"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
              </div>

              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  Current Balance: <span className="font-bold">{formatCurrency(selectedCustomer.currentBalance)}</span>
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button onClick={() => setShowTransactionModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={handleAddTransaction} disabled={saving}
                  className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {saving ? 'Saving...' : 'Save Transaction'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Customer Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Delete Customer</h3>
            <p className="text-gray-500 mb-6">
              Are you sure? This will also remove all transaction history.
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
      )}
    </div>
  );
};

export default Customers;