// Pages/DailySales/widgets/SummaryCards.jsx
import React from 'react';
import { fmt } from '../utils/salesHelpers';

const SummaryCards = ({ totals, orderCount }) => {
  const cards = [
    { label: 'Total Sales', value: fmt(totals.sales),   color: 'text-gray-900' },
    { label: 'Orders',      value: orderCount,          color: 'text-gray-900' },
    { label: 'Received',    value: fmt(totals.received), color: 'text-emerald-600' },
    { label: 'Balance',     value: fmt(totals.balance),  color: totals.balance > 0 ? 'text-red-600' : 'text-green-600' }
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      {cards.map(c => (
        <div key={c.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{c.label}</p>
          <p className={`text-xl md:text-2xl font-bold mt-1 ${c.color}`}>{c.value}</p>
        </div>
      ))}
    </div>
  );
};

export default SummaryCards;