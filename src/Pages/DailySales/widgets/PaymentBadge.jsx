// Pages/DailySales/widgets/PaymentBadge.jsx
import React from 'react';
import { Banknote, Smartphone, Building2, CreditCard } from 'lucide-react';

const PaymentBadge = ({ mode }) => {
  const cfg = {
    cash:   { bg: 'bg-blue-50',   text: 'text-blue-700',   Icon: Banknote,   label: 'Cash' },
    upi:    { bg: 'bg-purple-50', text: 'text-purple-700', Icon: Smartphone, label: 'UPI' },
    bank:   { bg: 'bg-indigo-50', text: 'text-indigo-700', Icon: Building2,  label: 'Bank' },
    credit: { bg: 'bg-orange-50', text: 'text-orange-700', Icon: CreditCard, label: 'Credit' }
  }[mode] || { bg: 'bg-blue-50', text: 'text-blue-700', Icon: Banknote, label: 'Cash' };
  const { Icon } = cfg;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
};

export default PaymentBadge;