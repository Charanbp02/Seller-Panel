// Pages/Production/widgets/SummaryCards.jsx
import React from 'react';
import { TrendingUp, Package, Box, ShoppingBag } from 'lucide-react';
import { fmt2 } from '../utils/productionHelpers';

const SummaryCards = ({ totals }) => {
  const cards = [
    { label: "Today's Production", value: fmt2(totals.today),   Icon: TrendingUp,  bg: 'bg-blue-50',    color: 'text-blue-600' },
    { label: 'Total Products',     value: totals.products,      Icon: Package,     bg: 'bg-green-50',   color: 'text-green-600' },
    { label: 'Total Stock',        value: fmt2(totals.stock),   Icon: Box,         bg: 'bg-emerald-50', color: 'text-emerald-600' },
    { label: 'Total Sold',         value: fmt2(totals.sold),    Icon: ShoppingBag, bg: 'bg-orange-50',  color: 'text-orange-600' }
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
                <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1">{c.value}</p>
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