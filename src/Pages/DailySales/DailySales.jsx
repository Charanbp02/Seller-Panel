// src/Pages/DailySales/DailySales.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingBag, Plus, Calendar } from 'lucide-react';
import { db } from '../../firebase/firebaseConfig';
import {
  collection, doc, query, where, onSnapshot, getDocs, getDoc,
  runTransaction, serverTimestamp, increment, setDoc
} from 'firebase/firestore';

import {
  localDate, toBaseUnit, CASH_MODES, fmt,
  emptySaleForm, emptyPaymentForm, recalcSale,
  sumPayments, computeStatus, computeOutstanding,
  cashbookTotals, cashbookClosing,
  findRefByName, buildSaleLedgerRow, buildPaymentLedgerRow,
  removeSaleFromLedger, removePaymentFromLedger,
  buildCascade, previewInvoice, showToast, safeTxGet
} from './utils/salesHelpers';

import SummaryCards from './widgets/SummaryCards';
import SaleForm from './widgets/SaleForm';
import SaleList from './widgets/SaleList';
import SaleViewModal from './widgets/SaleViewModal';
import PaymentModal from './widgets/PaymentModal';
import DeleteConfirmModal from './widgets/DeleteConfirmModal';

const DailySales = () => {
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(localDate());
  const [selectedSale, setSelectedSale] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [salesData, setSalesData] = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  const [productList, setProductList] = useState([]);
  const [stockMap, setStockMap] = useState({});
  const [customerList, setCustomerList] = useState([]);
  const [formData, setFormData] = useState(emptySaleForm());

  const [paymentModal, setPaymentModal] = useState(null);
  const [paymentForm, setPaymentForm] = useState(null);

  const patchForm = (patch) => setFormData(p => ({ ...p, ...patch }));

  // ---------- Listeners ----------
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'stock'), (snap) => {
      const list = [], map = {};
      snap.forEach(d => {
        const x = d.data();
        if (!x.productName) return;
        const stock = Math.max(0, (Number(x.produced) || 0) - (Number(x.sold) || 0));
        const unit = x.unit || 'kg';
        list.push({ id: d.id, name: x.productName, unit, stock });
        map[x.productName] = { docId: d.id, currentStock: stock, sold: Number(x.sold) || 0, produced: Number(x.produced) || 0, unit };
      });
      list.sort((a, b) => a.name.localeCompare(b.name));
      setProductList(list);
      setStockMap(map);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'customers'), (snap) => {
      setCustomerList(snap.docs.map(d => {
        const c = d.data();
        return { id: d.id, customerName: c.customerName || '', mobile: c.mobile || '', address: c.address || '', customerType: c.customerType || 'hotel' };
      }));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'daily_sales'), (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      all.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setSalesData(all.filter(s => s.date === selectedDate && !s.isPaymentOnly));
      setLoading(false);
    }, (err) => { console.error('sales listener:', err); setLoading(false); });
    return () => unsub();
  }, [selectedDate]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'sales_payments'), (snap) => {
      setAllPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error('payments listener:', err));
    return () => unsub();
  }, []);

  // ---------- Derived data ----------
  const salesWithBalance = useMemo(() => {
    return salesData.map(s => {
      const paid = sumPayments(allPayments.filter(p => p.saleId === s.id));
      const balance = Math.max(0, (Number(s.grandTotal) || 0) - paid);
      return { ...s, _paid: paid, _balance: balance, _status: computeStatus(Number(s.grandTotal) || 0, paid) };
    });
  }, [salesData, allPayments]);

  const totals = useMemo(() => {
    const t = { sales: 0, received: 0, balance: 0 };
    salesWithBalance.forEach(s => {
      t.sales += Number(s.grandTotal) || 0;
      t.received += s._paid;
      t.balance += s._balance;
    });
    return t;
  }, [salesWithBalance]);

  const filteredSales = useMemo(() => salesWithBalance.filter(s =>
    s.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  ), [salesWithBalance, searchTerm]);

  const selectedSalePayments = useMemo(
    () => selectedSale ? allPayments.filter(p => p.saleId === selectedSale.id) : [],
    [selectedSale, allPayments]
  );

  // ---------- Customer resolution ----------
  const resolveCustomer = async () => {
    const trimmedName = formData.customerName.trim();
    if (!trimmedName) return null;

    if (formData.customerId) {
      const directRef = doc(db, 'customers', formData.customerId);
      const directSnap = await getDoc(directRef);
      if (directSnap.exists()) return { id: formData.customerId, ref: directRef };
    }
    const existingRef = await findRefByName('customers', 'customerName', trimmedName);
    if (existingRef) return { id: existingRef.id, ref: existingRef };

    const newRef = doc(collection(db, 'customers'));
    const nowISO = new Date().toISOString();
    await setDoc(newRef, {
      customerName: trimmedName,
      mobile: formData.customerPhone || '',
      address: formData.customerAddress || '',
      customerType: formData.customerType || 'hotel',
      currentOutstanding: 0,
      transactions: [],
      createdAt: nowISO,
      updatedAt: nowISO
    });
    return { id: newRef.id, ref: newRef };
  };

  const prefetchRefs = async ({ productNames, customerRef, oldSale, resolvedCustomerId }) => {
    const stockRefs = {};
    const allNames = [...new Set([...(productNames || []), ...((oldSale?.products || []).map(p => p.name))].filter(Boolean))];
    for (const name of allNames) {
      const ref = await findRefByName('stock', 'productName', name);
      if (ref) stockRefs[name] = ref;
    }
    const customerChanged = !!oldSale && (
      oldSale.customerId
        ? oldSale.customerId !== resolvedCustomerId
        : oldSale.customerName !== formData.customerName.trim()
    );
    let oldCustomerRef = null;
    if (customerChanged) {
      oldCustomerRef = oldSale.customerId
        ? doc(db, 'customers', oldSale.customerId)
        : await findRefByName('customers', 'customerName', oldSale.customerName);
    }
    return { stockRefs, customerRef, oldCustomerRef, customerChanged };
  };

  // ============================================================
  // SAVE SALE
  // ============================================================
  const handleSave = async () => {
    if (!formData.customerName) return alert('Please enter customer name');
    if (formData.products.some(p => !p.productName || !p.quantity || !p.rate))
      return alert('Please fill all product details');

    setSaving(true);
    try {
      const oldSale = isEditing ? salesData.find(s => s.id === editingId) : null;
      const customer = await resolveCustomer();
      if (!customer) throw new Error('Could not resolve customer');
      const resolvedCustomerId = customer.id;
      const resolvedCustomerRef = customer.ref;

      const buildDelta = (products) => {
        const d = {};
        products.forEach(p => {
          const name = p.name || p.productName;
          const base = stockMap[name]?.unit || p.unit || 'kg';
          d[name] = (d[name] || 0) + toBaseUnit(p.quantity, p.unit, base);
        });
        return d;
      };
      const oldDelta = oldSale ? buildDelta(oldSale.products || []) : {};
      const newDelta = buildDelta(formData.products);

      const nowISO = new Date().toISOString();
      const counterRef = doc(db, 'counters', formData.date);

      const refs = await prefetchRefs({
        productNames: Object.keys(newDelta),
        customerRef: resolvedCustomerRef,
        oldSale,
        resolvedCustomerId
      });

      await runTransaction(db, async (tx) => {
        // ============ PHASE A: ALL READS ============
        const stockSnaps = {};
        for (const [n, r] of Object.entries(refs.stockRefs)) {
          stockSnaps[n] = await safeTxGet(tx, r);
        }

        const customerSnap = await safeTxGet(tx, resolvedCustomerRef);
        const oldCustomerSnap = refs.oldCustomerRef
          ? await safeTxGet(tx, refs.oldCustomerRef)
          : null;

        const saleRef = isEditing && editingId
          ? doc(db, 'daily_sales', editingId)
          : doc(collection(db, 'daily_sales'));
        const saleId = saleRef.id;
        const existingSnap = isEditing && editingId ? await safeTxGet(tx, saleRef) : null;
        const counterSnap = await safeTxGet(tx, counterRef);

        // ============ PHASE B: ALL WRITES ============

        // Validation
        for (const name of Object.keys(newDelta)) {
          const snap = stockSnaps[name];
          if (!snap?.exists()) throw new Error(`Product "${name}" has no stock entry.`);
          const sd = snap.data();
          const available = (Number(sd.produced) || 0) - (Number(sd.sold) || 0) + (oldDelta[name] || 0);
          if (newDelta[name] > available + 1e-9)
            throw new Error(`Insufficient stock for "${name}". Available: ${available.toFixed(3)} ${sd.unit || 'kg'}`);
        }

        // Invoice
        let invoiceNumber = formData.invoiceNumber;
        if (!invoiceNumber || !isEditing) {
          const seq = counterSnap?.exists() ? Number(counterSnap.data().seq) || 0 : 0;
          const next = seq + 1;
          const d = new Date(formData.date + 'T00:00:00');
          const prefix = `INV-${String(d.getFullYear()).slice(-2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-`;
          invoiceNumber = prefix + String(next).padStart(3, '0');
          if (counterSnap?.exists()) tx.update(counterRef, { seq: increment(1), updatedAt: nowISO });
          else tx.set(counterRef, { seq: next, createdAt: nowISO, updatedAt: nowISO });
        }

        // Stock
        const touched = new Set([...Object.keys(oldDelta), ...Object.keys(newDelta)]);
        for (const name of touched) {
          const snap = stockSnaps[name];
          if (!snap?.exists()) continue;
          const sd = snap.data();
          const newSold = (Number(sd.sold) || 0) - (oldDelta[name] || 0) + (newDelta[name] || 0);
          tx.update(refs.stockRefs[name], { sold: newSold, updatedAt: serverTimestamp() });
        }

        // Sale doc
        const saleData = {
          date: formData.date,
          customerId: resolvedCustomerId,
          customerName: formData.customerName.trim(),
          customerType: formData.customerType,
          customerPhone: formData.customerPhone || '',
          customerAddress: formData.customerAddress || '',
          products: formData.products.map(p => ({
            name: p.productName,
            quantity: parseFloat(p.quantity),
            rate: parseFloat(p.rate),
            discount: parseFloat(p.discount) || 0,
            total: parseFloat(p.total) || 0,
            unit: p.unit
          })),
          subtotal: formData.subtotal,
          totalDiscount: formData.totalDiscount,
          grandTotal: formData.grandTotal,
          notes: formData.notes || '',
          invoiceNumber,
          updatedAt: nowISO,
          createdAt: oldSale?.createdAt || nowISO
        };

        if (isEditing && existingSnap?.exists()) tx.update(saleRef, saleData);
        else tx.set(saleRef, saleData);

        // Ledger
        const newRow = buildSaleLedgerRow(saleData, saleId, nowISO);

        if (oldSale && refs.oldCustomerRef && oldCustomerSnap?.exists()) {
          const oldTxs = removeSaleFromLedger(oldCustomerSnap.data().transactions || [], oldSale);
          tx.update(refs.oldCustomerRef, {
            transactions: oldTxs,
            currentOutstanding: computeOutstanding(oldTxs),
            updatedAt: nowISO
          });
        }

        // Customer ledger
        if (customerSnap?.exists()) {
          let txs = [...(customerSnap.data().transactions || [])];
          if (oldSale && !refs.customerChanged) {
            txs = removeSaleFromLedger(txs, oldSale);
          }
          txs.push(newRow);
          tx.update(resolvedCustomerRef, {
            transactions: txs,
            currentOutstanding: computeOutstanding(txs),
            updatedAt: nowISO,
            mobile: formData.customerPhone || customerSnap.data()?.mobile || '',
            address: formData.customerAddress || customerSnap.data()?.address || '',
            customerType: formData.customerType || customerSnap.data()?.customerType || 'hotel'
          });
        } else {
          tx.set(resolvedCustomerRef, {
            customerName: formData.customerName.trim(),
            mobile: formData.customerPhone || '',
            address: formData.customerAddress || '',
            customerType: formData.customerType || 'hotel',
            currentOutstanding: Number(saleData.grandTotal) || 0,
            transactions: [newRow],
            createdAt: nowISO,
            updatedAt: nowISO
          });
        }
      });

      showToast(isEditing ? 'Sale updated successfully!' : 'Sale created successfully!');
      handleCancel();
    } catch (e) {
      console.error('Save error:', e);
      alert('Failed to save sale: ' + (e.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // ADD PAYMENT
  // ============================================================
  const handleAddPayment = async () => {
    if (!paymentForm) return;
    const amount = parseFloat(paymentForm.amount) || 0;
    if (amount <= 0) return alert('Payment amount must be greater than 0');
    if (!paymentForm.date) return alert('Payment date is required');

    const sale = paymentModal?.sale;
    if (!sale) return alert('Sale not found');

    const alreadyPaid = sumPayments(allPayments.filter(p => p.saleId === sale.id));
    const remaining = (Number(sale.grandTotal) || 0) - alreadyPaid;
    if (amount > remaining + 0.001)
      return alert(`Amount exceeds remaining balance (${fmt(remaining)})`);
    if (paymentForm.date < sale.date)
      return alert('Payment date cannot be before the sale date.');

    setSaving(true);
    try {
      const cashbookDate = paymentForm.date;
      const customerRef = sale.customerId
        ? doc(db, 'customers', sale.customerId)
        : await findRefByName('customers', 'customerName', sale.customerName);
      const cashbookRef = await findRefByName('cashbook', 'date', cashbookDate);
      const nowISO = new Date().toISOString();

      await runTransaction(db, async (tx) => {
        // ============ PHASE A: ALL READS ============
        const saleRef = doc(db, 'daily_sales', sale.id);
        const saleSnap = await safeTxGet(tx, saleRef);
        if (!saleSnap?.exists()) throw new Error('Sale no longer exists');

        const customerSnap = customerRef ? await safeTxGet(tx, customerRef) : null;
        const cbSnap = cashbookRef ? await safeTxGet(tx, cashbookRef) : null;

        // Later cashbook days (for cascade)
        let laterDays = [];
        try {
          const laterSnap = await tx.get(
            query(collection(db, 'cashbook'), where('date', '>', cashbookDate))
          );
          laterDays = laterSnap.docs
            .map(d => ({ ref: d.ref, ...d.data() }))
            .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
        } catch (e) {
          console.warn('laterDays fetch failed:', e.message);
        }

        // Earlier cashbook days (only needed when creating a new day doc)
        let earlierClosing = 0;
        if (!cbSnap?.exists()) {
          try {
            const earlierSnap = await tx.get(
              query(collection(db, 'cashbook'), where('date', '<', cashbookDate))
            );
            const earlier = earlierSnap.docs
              .map(d => d.data())
              .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
            earlierClosing = earlier.length
              ? Number(earlier[earlier.length - 1].closingBalance) || 0
              : 0;
          } catch (e) {
            console.warn('earlier days fetch failed:', e.message);
          }
        }

        // ============ PHASE B: ALL WRITES ============

        // Payment doc
        const paymentRef = doc(collection(db, 'sales_payments'));
        const paymentId = paymentRef.id;
        const paymentDoc = {
          saleId: sale.id,
          invoiceNumber: sale.invoiceNumber,
          customerId: sale.customerId,
          customerName: sale.customerName,
          amount,
          date: paymentForm.date,
          mode: paymentForm.mode,
          notes: paymentForm.notes || '',
          createdAt: nowISO,
          updatedAt: nowISO
        };
        tx.set(paymentRef, paymentDoc);

        // Customer ledger
        const newLedgerRow = buildPaymentLedgerRow(
          { id: paymentId, ...paymentDoc }, sale, nowISO
        );

        if (customerSnap?.exists()) {
          const txs = [...(customerSnap.data().transactions || []), newLedgerRow];
          tx.update(customerRef, {
            transactions: txs,
            currentOutstanding: computeOutstanding(txs),
            updatedAt: nowISO
          });
        } else if (customerRef) {
          tx.set(customerRef, {
            customerName: sale.customerName || '',
            mobile: '',
            address: '',
            customerType: 'hotel',
            currentOutstanding: 0,
            transactions: [newLedgerRow],
            createdAt: nowISO,
            updatedAt: nowISO
          });
        }

        // Cashbook
        if (CASH_MODES.has(paymentForm.mode)) {
          const entry = {
            type: 'sales',
            description: `Payment ${sale.invoiceNumber} - ${sale.customerName}`,
            amount,
            paymentMode: paymentForm.mode,
            reference: sale.invoiceNumber,
            source: 'sales_payments',
            sourceId: paymentId,
            createdAt: nowISO
          };

          if (cashbookRef && cbSnap?.exists()) {
            const cb = cbSnap.data();
            const entries = [...(cb.entries || []), entry];
            const t = cashbookTotals(entries);
            const opening = Number(cb.openingBalance) || 0;
            const closing = cashbookClosing(opening, t);
            const oldClosing = Number(cb.closingBalance) || 0;
            tx.update(cashbookRef, {
              entries,
              ...t,
              closingBalance: closing,
              updatedAt: nowISO
            });
            if (Math.abs(closing - oldClosing) > 1e-9) {
              buildCascade(closing, laterDays, null, nowISO)
                .forEach(u => tx.update(u.ref, u.payload));
            }
          } else {
            const t = cashbookTotals([entry]);
            const closing = cashbookClosing(earlierClosing, t);
            tx.set(doc(collection(db, 'cashbook')), {
              date: cashbookDate,
              openingBalance: earlierClosing,
              ...t,
              closingBalance: closing,
              entries: [entry],
              createdAt: nowISO,
              updatedAt: nowISO
            });
            buildCascade(closing, laterDays, null, nowISO)
              .forEach(u => tx.update(u.ref, u.payload));
          }
        }
      });

      showToast('Payment recorded successfully!');
      setPaymentModal(null);
      setPaymentForm(null);
    } catch (e) {
      console.error('Add payment error:', e);
      alert('Failed to record payment: ' + (e.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // DELETE PAYMENT
  // ============================================================
  const handleDeletePayment = async (payment) => {
    if (!window.confirm(`Delete payment of ${fmt(payment.amount)} on ${payment.date}?`)) return;
    setSaving(true);
    try {
      const sale = salesData.find(s => s.id === payment.saleId);
      if (!sale) throw new Error('Sale not found');

      const customerRef = payment.customerId
        ? doc(db, 'customers', payment.customerId)
        : await findRefByName('customers', 'customerName', payment.customerName);
      const cashbookRef = await findRefByName('cashbook', 'date', payment.date);
      const nowISO = new Date().toISOString();

      await runTransaction(db, async (tx) => {
        // ============ PHASE A: ALL READS ============
        const paymentRef = doc(db, 'sales_payments', payment.id);
        const paySnap = await safeTxGet(tx, paymentRef);
        if (!paySnap?.exists()) throw new Error('Payment already deleted');

        const customerSnap = customerRef ? await safeTxGet(tx, customerRef) : null;
        const cbSnap = cashbookRef ? await safeTxGet(tx, cashbookRef) : null;

        let laterDays = [];
        try {
          const laterSnap = await tx.get(
            query(collection(db, 'cashbook'), where('date', '>', payment.date))
          );
          laterDays = laterSnap.docs
            .map(d => ({ ref: d.ref, ...d.data() }))
            .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
        } catch (e) {
          console.warn('laterDays fetch failed:', e.message);
        }

        // ============ PHASE B: ALL WRITES ============
        tx.delete(paymentRef);

        if (customerSnap?.exists()) {
          const txs = removePaymentFromLedger(customerSnap.data().transactions || [], payment.id);
          tx.update(customerRef, {
            transactions: txs,
            currentOutstanding: computeOutstanding(txs),
            updatedAt: nowISO
          });
        }

        if (CASH_MODES.has(payment.mode) && cashbookRef && cbSnap?.exists()) {
          const cb = cbSnap.data();
          const entries = (cb.entries || []).filter(e =>
            !(e.source === 'sales_payments' && e.sourceId === payment.id)
          );
          const t = cashbookTotals(entries);
          const closing = cashbookClosing(Number(cb.openingBalance) || 0, t);
          const oldClosing = Number(cb.closingBalance) || 0;
          tx.update(cashbookRef, { entries, ...t, closingBalance: closing, updatedAt: nowISO });
          if (Math.abs(closing - oldClosing) > 1e-9) {
            buildCascade(closing, laterDays, null, nowISO).forEach(u => tx.update(u.ref, u.payload));
          }
        }
      });

      showToast('Payment deleted & cashbook reversed!');
    } catch (e) {
      console.error('Delete payment error:', e);
      alert('Failed to delete payment: ' + (e.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // DELETE SALE
  // ============================================================
  const confirmDelete = async () => {
    setSaving(true);
    try {
      const sale = salesData.find(s => s.id === deleteId);
      if (!sale) { setShowDelete(false); return; }

      const customerRef = sale.customerId
        ? doc(db, 'customers', sale.customerId)
        : await findRefByName('customers', 'customerName', sale.customerName);

      const stockRefs = {};
      for (const name of [...new Set((sale.products || []).map(p => p.name))]) {
        const ref = await findRefByName('stock', 'productName', name);
        if (ref) stockRefs[name] = ref;
      }

      const paymentsSnap = await getDocs(query(collection(db, 'sales_payments'), where('saleId', '==', sale.id)));
      const payments = paymentsSnap.docs.map(d => ({ id: d.id, ref: d.ref, ...d.data() }));

      const paymentDates = [...new Set(payments.filter(p => CASH_MODES.has(p.mode)).map(p => p.date))];

      const cashbookRefs = {};
      for (const dt of paymentDates) {
        const ref = await findRefByName('cashbook', 'date', dt);
        if (ref) cashbookRefs[dt] = ref;
      }

      await runTransaction(db, async (tx) => {
        // ============ PHASE A: ALL READS ============
        const stockSnaps = {};
        for (const [n, r] of Object.entries(stockRefs)) {
          stockSnaps[n] = await safeTxGet(tx, r);
        }
        const customerSnap = customerRef ? await safeTxGet(tx, customerRef) : null;

        const cbSnaps = {};
        for (const [dt, r] of Object.entries(cashbookRefs)) {
          cbSnaps[dt] = await safeTxGet(tx, r);
        }

        const laterByDate = {};
        for (const dt of paymentDates) {
          try {
            const snap = await tx.get(
              query(collection(db, 'cashbook'), where('date', '>', dt))
            );
            laterByDate[dt] = snap.docs
              .map(d => ({ ref: d.ref, ...d.data() }))
              .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
          } catch (e) {
            console.warn(`laterByDate[${dt}] failed:`, e.message);
            laterByDate[dt] = [];
          }
        }

        const saleSnap = await safeTxGet(tx, doc(db, 'daily_sales', deleteId));

        // ============ PHASE B: ALL WRITES ============
        const nowISO = new Date().toISOString();

        // Restore stock
        const restore = {};
        (sale.products || []).forEach(p => {
          const base = stockMap[p.name]?.unit || p.unit || 'kg';
          restore[p.name] = (restore[p.name] || 0) + toBaseUnit(p.quantity, p.unit, base);
        });
        for (const [name, qty] of Object.entries(restore)) {
          const snap = stockSnaps[name];
          if (!snap?.exists()) continue;
          tx.update(stockRefs[name], {
            sold: Math.max(0, (Number(snap.data().sold) || 0) - qty),
            updatedAt: serverTimestamp()
          });
        }

        // Delete payments
        for (const p of payments) {
          if (p.ref) tx.delete(p.ref);
        }

        // Customer ledger
        if (customerSnap?.exists()) {
          let txs = removeSaleFromLedger(customerSnap.data().transactions || [], sale);
          payments.forEach(p => { txs = removePaymentFromLedger(txs, p.id); });
          tx.update(customerRef, {
            transactions: txs,
            currentOutstanding: computeOutstanding(txs),
            updatedAt: nowISO
          });
        }

        // Cashbook per payment date
        for (const dt of paymentDates) {
          const ref = cashbookRefs[dt];
          const snap = cbSnaps[dt];
          if (!ref || !snap?.exists()) continue;
          const cb = snap.data();
          const entries = (cb.entries || []).filter(e =>
            !(e.source === 'sales_payments' && payments.some(p => p.id === e.sourceId))
          );
          const t = cashbookTotals(entries);
          const closing = cashbookClosing(Number(cb.openingBalance) || 0, t);
          const oldClosing = Number(cb.closingBalance) || 0;
          tx.update(ref, { entries, ...t, closingBalance: closing, updatedAt: nowISO });
          if (Math.abs(closing - oldClosing) > 1e-9) {
            buildCascade(closing, laterByDate[dt] || [], null, nowISO).forEach(u => tx.update(u.ref, u.payload));
          }
        }

        if (saleSnap?.exists()) tx.delete(doc(db, 'daily_sales', deleteId));
      });

      setShowDelete(false);
      setDeleteId(null);
      showToast('Sale, payments, stock & cashbook reversed!');
    } catch (e) {
      console.error('Delete error:', e);
      alert('Failed to delete sale: ' + (e.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  // ---------- Form actions ----------
  const handleEdit = (sale) => {
    setIsEditing(true);
    setEditingId(sale.id);
    setFormData({
      date: sale.date || localDate(),
      customerId: sale.customerId || null,
      customerType: sale.customerType || 'hotel',
      customerName: sale.customerName || '',
      customerPhone: sale.customerPhone || '',
      customerAddress: sale.customerAddress || '',
      products: (sale.products || []).map((p, i) => ({
        id: i + 1, productName: p.name || '',
        quantity: p.quantity?.toString() || '', rate: p.rate?.toString() || '',
        discount: p.discount?.toString() || '', total: p.total || 0, unit: p.unit || 'kg'
      })),
      notes: sale.notes || '',
      invoiceNumber: sale.invoiceNumber || '',
      subtotal: sale.subtotal || 0,
      totalDiscount: sale.totalDiscount || 0,
      grandTotal: sale.grandTotal || 0
    });
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setIsEditing(false);
    setEditingId(null);
    setFormData(emptySaleForm(selectedDate));
  };

  const dateStatus = (() => {
    const today = localDate();
    if (selectedDate === today) return { bg: 'bg-green-50', color: 'text-green-600', label: 'Today' };
    if (selectedDate < today) return { bg: 'bg-blue-50', color: 'text-blue-600', label: 'Past' };
    return { bg: 'bg-purple-50', color: 'text-purple-600', label: 'Future' };
  })();

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Loading sales data...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl shadow-lg p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 backdrop-blur rounded-xl"><ShoppingBag className="w-6 h-6 text-white" /></div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">Daily Sales</h1>
              <p className="text-orange-100 text-sm">Connected: Stock • Customer • Cashbook • Payments</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur px-3 py-2 rounded-xl border border-white/30">
              <Calendar className="w-4 h-4 text-white" />
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                className="bg-transparent outline-none text-sm text-white w-32 [color-scheme:dark]" />
            </div>
            <button
              onClick={async () => {
                const inv = await previewInvoice(selectedDate);
                setFormData({ ...emptySaleForm(selectedDate), invoiceNumber: inv });
                setIsAdding(true);
              }}
              className="bg-white text-orange-600 hover:bg-orange-50 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Sale</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>
      </div>

      {/* Date status */}
      <div className="flex items-center gap-2">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${dateStatus.bg} ${dateStatus.color}`}>{dateStatus.label} Date</span>
        <span className="text-sm text-gray-500">
          {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>

      {/* Summary */}
      <SummaryCards totals={totals} orderCount={salesData.length} />

      {/* Form */}
      {isAdding && (
        <SaleForm
          formData={formData}
          patchForm={patchForm}
          setFormData={setFormData}
          isEditing={isEditing}
          saving={saving}
          customerList={customerList}
          productList={productList}
          stockMap={stockMap}
          selectedDate={selectedDate}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {/* List */}
      <SaleList
        sales={filteredSales}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onView={setSelectedSale}
        onEdit={handleEdit}
        onDelete={(s) => { setDeleteId(s.id); setShowDelete(true); }}
        onAddPayment={(s) => { setPaymentModal({ sale: s }); setPaymentForm(emptyPaymentForm(s)); }}
      />

      {/* View Modal */}
      <SaleViewModal
        sale={selectedSale}
        payments={selectedSalePayments}
        onClose={() => setSelectedSale(null)}
        onEdit={() => { const s = selectedSale; setSelectedSale(null); handleEdit(s); }}
        onDelete={() => { const s = selectedSale; setSelectedSale(null); setDeleteId(s.id); setShowDelete(true); }}
        onAddPayment={() => { const s = selectedSale; setSelectedSale(null); setPaymentModal({ sale: s }); setPaymentForm(emptyPaymentForm(s)); }}
        onDeletePayment={handleDeletePayment}
      />

      {/* Payment Modal */}
      {paymentModal && paymentForm && (
        <PaymentModal
          sale={paymentModal.sale}
          paymentForm={paymentForm}
          setPaymentForm={setPaymentForm}
          saving={saving}
          onClose={() => { setPaymentModal(null); setPaymentForm(null); }}
          onSubmit={handleAddPayment}
        />
      )}

      {/* Delete Modal */}
      <DeleteConfirmModal
        open={showDelete}
        saving={saving}
        onCancel={() => setShowDelete(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default DailySales;