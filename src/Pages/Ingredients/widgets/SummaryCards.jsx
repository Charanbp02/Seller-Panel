// Pages/Ingredients/widgets/SummaryCards.jsx
import React from 'react';
import { Package, Wallet, AlertTriangle, AlertOctagon } from 'lucide-react';

const SummaryCards = ({ totalItems, totalStockValue, lowStockCount, outOfStockCount }) => {
  const cards = [
    { label: 'Total Ingredients', value: totalItems,                                Icon: Package,        bg: 'bg-blue-50',    color: 'text-blue-600' },
    { label: 'Total Stock Value', value: `₹${totalStockValue.toFixed(2)}`,          Icon: Wallet,         bg: 'bg-emerald-50', color: 'text-emerald-600' },
    { label: 'Low Stock',         value: lowStockCount,                             Icon: AlertTriangle,  bg: 'bg-yellow-50',  color: 'text-yellow-600' },
    { label: 'Out of Stock',      value: outOfStockCount,                           Icon: AlertOctagon,   bg: 'bg-red-50',     color: 'text-red-600' }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      {cards.map(c => {
        const Icon = c.Icon;
        return (
          <div key={c.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{c.label}</p>
                <p className={`text-xl md:text-2xl font-bold mt-1 ${c.color}`}>{c.value}</p>
              </div>
              <div className={`p-2 ${c.bg} rounded-lg`}>
                <Icon className={`w-5 h-5 ${c.color}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SummaryCards;