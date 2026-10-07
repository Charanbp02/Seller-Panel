// Pages/Cashbook/utils/cashbookHelpers.js
import {
  TrendingUp, TrendingDown, Users, PiggyBank,
  Banknote, Smartphone, Building2, CreditCard
} from 'lucide-react';

export const getLocalDateString = (d = new Date()) => {
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const CASH_MODES = new Set(['cash', 'upi', 'bank']);

export const buildEntryId = (source, sourceId) => {
  const src = String(source || 'manual').trim();
  const id = String(sourceId || '');
  return id ? `${src}_${id}` : `${src}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
};

export const computeDayTotals = (entries) => {
  let sales = 0, expense = 0, owner = 0, investment = 0;
  (entries || []).forEach(e => {
    const amt = Number(e.amount) || 0;
    if (!CASH_MODES.has(e.paymentMode)) return;
    if (e.type === 'sales') sales += amt;
    else if (e.type === 'expense') expense += amt;
    else if (e.type === 'owner') owner += amt;
    else if (e.type === 'investment') investment += amt;
  });
  return { sales, expense, owner, investment };
};

export const computeClosing = (opening, totals) =>
  opening + totals.sales + totals.investment - totals.expense - totals.owner;

export const emptyEntryForm = (date) => ({
  date: date || getLocalDateString(),
  type: 'sales',
  description: '',
  amount: '',
  paymentMode: 'cash',
  reference: '',
  notes: ''
});

export const isAutomatic = (entry) =>
  entry?.source && entry.source !== 'manual';

// ---------- badge configs ----------
export const TYPE_BADGE = {
  sales:      { bg: 'bg-green-50',  text: 'text-green-700',  iconName: 'TrendingUp',  label: 'Sales' },
  expense:    { bg: 'bg-red-50',    text: 'text-red-700',    iconName: 'TrendingDown', label: 'Expense' },
  owner:      { bg: 'bg-purple-50', text: 'text-purple-700', iconName: 'Users',        label: 'Owner' },
  investment: { bg: 'bg-blue-50',   text: 'text-blue-700',   iconName: 'PiggyBank',    label: 'Investment' }
};

export const PAYMENT_BADGE = {
  cash:   { bg: 'bg-blue-50',   text: 'text-blue-700',   iconName: 'Banknote',   label: 'Cash' },
  upi:    { bg: 'bg-purple-50', text: 'text-purple-700', iconName: 'Smartphone', label: 'UPI' },
  bank:   { bg: 'bg-indigo-50', text: 'text-indigo-700', iconName: 'Building2',  label: 'Bank' },
  credit: { bg: 'bg-orange-50', text: 'text-orange-700', iconName: 'CreditCard', label: 'Credit' }
};

// icon registries for consumers
export const TYPE_ICONS = {
  TrendingUp, TrendingDown, Users, PiggyBank
};
export const PAYMENT_ICONS = {
  Banknote, Smartphone, Building2, CreditCard
};

export const showToast = (text) => {
  const el = document.createElement('div');
  el.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
};