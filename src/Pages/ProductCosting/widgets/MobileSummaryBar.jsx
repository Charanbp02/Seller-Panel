// src/Pages/ProductCosting/widgets/MobileSummaryBar.jsx
import React from 'react';
import { fmt } from '../utils/costingHelpers';

const MobileSummaryBar = ({
  totals,
  isEditing,
  sellingPrice,
  updateSellingPrice
}) => {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 shadow-2xl shadow-slate-900/10">
      <div className="p-3 md:p-4 grid grid-cols-3 gap-2 max-w-2xl mx-auto">
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Total Cost
          </p>
          <p className="text-sm md:text-base font-extrabold text-slate-900">
            {fmt(totals.totalCost)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Selling
          </p>
          {isEditing ? (
            <input
              type="number"
              value={sellingPrice || ''}
              onChange={e => updateSellingPrice(e.target.value)}
              placeholder="0"
              step="0.01"
              className="w-full px-2 py-1 rounded-lg bg-slate-100 ring-1 ring-slate-200 text-sm font-bold text-slate-900 text-center focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          ) : (
            <p className="text-sm md:text-base font-extrabold text-slate-900">
              {fmt(totals.sellingPrice)}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Profit
          </p>
          <p
            className={`text-sm md:text-base font-extrabold ${
              totals.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {fmt(totals.profit)}
          </p>
          <p
            className={`text-[10px] font-semibold ${
              totals.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {totals.profitMarginPct.toFixed(1)}% margin
          </p>
        </div>
      </div>
    </div>
  );
};

export default MobileSummaryBar;