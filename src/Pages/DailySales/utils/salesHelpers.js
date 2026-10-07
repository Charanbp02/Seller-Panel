// src/Pages/DailySales/utils/salesHelpers.js
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../firebase/firebaseConfig';

export const localDate = (d = new Date()) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};

export const toBaseUnit = (qty, from, base) => {
  const q = Number(qty) || 0;
  if (!from || !base || from === base) return q;
  const map = { 'g->kg': 1e-3, 'mg->kg': 1e-6, 'mg->g': 1e-3, 'ml->L': 1e-3, 'kg->g': 1e3, 'L->ml': 1e3 };
  return q * (map[`${from}->${base}`] ?? 1);
};

export const CASH_MODES = new Set(['cash', 'upi', 'bank']);
export const fmt = (n) => `₹${(Number(n) || 0).toFixed(2)}`;

export const emptySaleForm = (date) => ({
  date: date || localDate(),
  customerId: null, customerType: 'hotel', customerName: '', customerPhone: '', customerAddress: '',
  products: [{ id: 1, productName: '', quantity: '', rate: '', discount: '', total: '', unit: 'kg' }],
  notes: '', invoiceNumber: '',
  subtotal: 0, totalDiscount: 0, grandTotal: 0
});

export const emptyPaymentForm = (sale) => ({
  saleId: sale.id,
  invoiceNumber: sale.invoiceNumber,
  customerId: sale.customerId,
  customerName: sale.customerName,
  amount: '',
  date: localDate(),
  mode: 'cash',
  notes: ''
});

export const recalcSale = (products) => {
  let subtotal = 0, totalDiscount = 0;
  products.forEach(p => {
    const line = (parseFloat(p.quantity) || 0) * (parseFloat(p.rate) || 0);
    subtotal += line;
    totalDiscount += (line * (parseFloat(p.discount) || 0)) / 100;
  });
  return { subtotal, totalDiscount, grandTotal: subtotal - totalDiscount };
};

export const sumPayments = (payments = []) =>
  payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);

export const computeStatus = (grandTotal, paid) => {
  if (paid <= 0 && grandTotal > 0) return 'pending';
  if (paid + 1e-9 < grandTotal) return 'partial';
  return 'completed';
};

export const computeOutstanding = (txs = []) => {
  let sale = 0, paid = 0;
  txs.forEach(t => {
    if (t.type === 'sale') sale += Number(t.amount) || 0;
    if (t.type === 'payment') paid += Number(t.amount) || 0;
  });
  return Math.max(0, +(sale - paid).toFixed(2));
};

export const cashbookTotals = (entries = []) => {
  const t = { sales: 0, expense: 0, owner: 0, investment: 0 };
  entries.forEach(e => {
    if (!CASH_MODES.has(e.paymentMode)) return;
    if (t[e.type] !== undefined) t[e.type] += Number(e.amount) || 0;
  });
  return t;
};

export const cashbookClosing = (opening, t) =>
  opening + t.sales + t.investment - t.expense - t.owner;

export const findRefByName = async (col, field, value) => {
  if (!value) return null;
  try {
    const snap = await getDocs(query(collection(db, col), where(field, '==', value)));
    return snap.empty ? null : snap.docs[0].ref;
  } catch (e) {
    console.warn(`findRefByName(${col}, ${field}=${value}) failed:`, e.message);
    return null;
  }
};

export const buildSaleLedgerRow = (saleData, saleId, nowISO) => ({
  date: saleData.date, type: 'sale', amount: saleData.grandTotal,
  description: `Sale ${saleData.invoiceNumber}`, paymentMode: null,
  reference: saleData.invoiceNumber, source: 'daily_sales', sourceId: saleId, createdAt: nowISO
});

export const buildPaymentLedgerRow = (payment, sale, nowISO) => ({
  date: payment.date, type: 'payment', amount: Number(payment.amount) || 0,
  description: `Payment against ${sale.invoiceNumber}`, paymentMode: payment.mode,
  reference: sale.invoiceNumber, source: 'sales_payments', sourceId: payment.id, createdAt: nowISO
});

export const removeSaleFromLedger = (txs, sale) =>
  txs.filter(t => t.sourceId ? t.sourceId !== sale.id : t.reference !== sale.invoiceNumber);

export const removePaymentFromLedger = (txs, paymentId) =>
  txs.filter(t => !(t.source === 'sales_payments' && t.sourceId === paymentId));

export const buildCascade = (startingClosing, laterDays, skipDate, nowISO) => {
  const updates = [];
  let carry = startingClosing;
  for (const d of laterDays) {
    if (skipDate && d.date === skipDate) continue;
    const t = cashbookTotals(d.entries || []);
    const opening = carry;
    const closing = cashbookClosing(opening, t);
    updates.push({ ref: d.ref, payload: { openingBalance: opening, ...t, closingBalance: closing, updatedAt: nowISO } });
    carry = closing;
  }
  return updates;
};

export const previewInvoice = async (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  const prefix = `INV-${String(d.getFullYear()).slice(-2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-`;
  const snap = await getDoc(doc(db, 'counters', dateStr));
  const next = snap.exists() ? (Number(snap.data().seq) || 0) + 1 : 1;
  return prefix + String(next).padStart(3, '0');
};

export const showToast = (text) => {
  const el = document.createElement('div');
  el.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-[60]';
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
};

// Safe transaction read — returns null if ref is null/undefined
export const safeTxGet = async (tx, ref) => {
  if (!ref) return null;
  try {
    return await tx.get(ref);
  } catch (e) {
    console.warn('safeTxGet failed:', e.message);
    return null;
  }
};