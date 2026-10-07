// Pages/Dashboard/utils/dashboardHelpers.js
import {
  TrendingUp, TrendingDown, DollarSign, Wallet, CreditCard, Clock,
  Package, CheckCircle, Building2, PiggyBank
} from 'lucide-react';

// ---------- date helpers ----------
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const yesterday = (dateStr) => {
  const y = new Date(`${dateStr}T12:00:00`);
  y.setDate(y.getDate() - 1);
  return `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
};

export const shortDate = (d) => {
  if (!d || d === 'N/A') return 'N/A';
  const parts = String(d).split('-');
  if (parts.length !== 3) return d;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${parts[2]} ${months[Number(parts[1]) - 1] || ''}`;
};

// ---------- numeric helpers ----------
export const fmt2 = (n) => `₹${(Number(n) || 0).toFixed(2)}`;

export const pct = (n) => `${n >= 0 ? '+' : ''}${n.toFixed(0)}%`;

export const change = (cur, prev) => {
  if (prev > 0) return ((cur - prev) / prev) * 100;
  if (cur > 0) return 100;
  return 0;
};

export const changeLabel = (cur, prev) => {
  if (prev === 0 && cur > 0) return 'New';
  return pct(change(cur, prev));
};

export const sumPayments = (payments = []) =>
  payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);

export const computeStatus = (grandTotal, paid) => {
  if (paid <= 0 && grandTotal > 0) return 'Pending';
  if (paid + 1e-9 < grandTotal) return 'Partial';
  return 'Completed';
};

// ---------- business logic ----------
export const deriveOutstanding = (customer) => {
  let purchases = 0, paid = 0;
  (customer.transactions || []).forEach(t => {
    const amt = Number(t.amount) || 0;
    if (t.type === 'sale' || t.type === 'credit') purchases += amt;
    else if (t.type === 'payment') paid += amt;
  });
  const opening = Number(customer.openingBalance) || 0;
  return Math.max(0, purchases - paid + opening);
};

export const totalAssetValue = (docOrData) => {
  const x = docOrData.data ? docOrData.data() : docOrData;
  return (Number(x.quantity) || 1) * (Number(x.purchasePrice) || 0);
};

/**
 * Build a recent-activity row from a sale doc + total paid for that sale.
 * `paid` should be sum of amount across all sales_payments with matching saleId.
 */
export const buildRecentRow = (doc, paid = 0) => {
  const x = doc.data ? doc.data() : doc;
  const grandTotal = Number(x.grandTotal) || 0;
  const balance = Math.max(0, grandTotal - paid);
  return {
    id: doc.id || x.id,
    type: 'Sale',
    customer: x.customerName || 'Unknown',
    amount: grandTotal,
    paid,
    balance,
    time: `Sold ${shortDate(x.date || 'N/A')}`,
    status: computeStatus(grandTotal, paid)
  };
};

// ---------- static UI config (never rebuilt) ----------
export const STATS_CONFIG = [
  { id: 'today-sales',      label: "Today's Sales",       icon: TrendingUp,   color: 'blue' },
  { id: 'today-collection', label: "Today's Collection",  icon: DollarSign,   color: 'green' },
  { id: 'today-expenses',   label: "Today's Expenses",    icon: TrendingDown, color: 'red' },
  // ★ Renamed: was "Operating Profit" — this is Sales − Expenses only.
  //    COGS (ingredients + packing + labour) is NOT deducted here.
  { id: 'gross-margin',     label: 'Gross Margin',        icon: Wallet,       color: 'emerald' }
];

export const FINANCIAL_CONFIG = [
  { id: 'cash-collection',     label: "Today's Cash Collection",     icon: Wallet,     color: 'amber',  bg: 'bg-amber-50' },
  { id: 'upi-bank-collection', label: "Today's UPI/Bank Collection", icon: CreditCard, color: 'indigo', bg: 'bg-indigo-50' },
  { id: 'total-outstanding',   label: 'Customer Outstanding',        icon: Clock,      color: 'orange', bg: 'bg-orange-50' },
  { id: 'total-investment',    label: 'Total Investment',            icon: PiggyBank,  color: 'purple', bg: 'bg-purple-50' },
  { id: 'total-assets',        label: 'Total Assets',                icon: Building2,  color: 'teal',   bg: 'bg-teal-50' }
];

export const STOCK_CONFIG = [
  { id: 'today-production', label: "Today's Production",     icon: Package,     color: 'cyan',   bg: 'bg-cyan-50' },
  { id: 'finished-stock',   label: 'Finished Product Stock', icon: CheckCircle, color: 'green',  bg: 'bg-green-50' },
  { id: 'ingredient-stock', label: 'Ingredient Stock',       icon: Package,     color: 'yellow', bg: 'bg-yellow-50' },
  { id: 'packing-stock',    label: 'Packing Material Stock', icon: Package,     color: 'gray',   bg: 'bg-gray-50' }
];

// ---------- UI class helpers ----------
export const iconColor = (c) => ({
  blue: 'text-blue-600', green: 'text-green-600', red: 'text-red-600',
  emerald: 'text-emerald-600', amber: 'text-amber-600', indigo: 'text-indigo-600',
  orange: 'text-orange-600', purple: 'text-purple-600', teal: 'text-teal-600',
  cyan: 'text-cyan-600', yellow: 'text-yellow-600', gray: 'text-gray-600'
}[c] || 'text-gray-600');

export const statusColor = (s) => s === 'Critical'
  ? 'bg-red-100 text-red-700 border-red-200'
  : 'bg-yellow-100 text-yellow-700 border-yellow-200';