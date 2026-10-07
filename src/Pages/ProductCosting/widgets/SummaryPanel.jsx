// src/Pages/ProductCosting/widgets/SummaryPanel.jsx
import React from 'react';
import {
  Target, TrendingUp, TrendingDown, Percent, Wallet,
  IndianRupee, TrendingUp as TrendingUpIcon
} from 'lucide-react';
import { fmt } from '../utils/costingHelpers';

const CostLine = ({ label, value, chip, chipText }) => (
  <div className="flex items-center justify-between gap-3 py-1.5">
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${chip}`} />
      <span className="text-sm font-medium text-slate-600">{label}</span>
    </div>
    <span className={`text-sm font-bold ${chipText}`}>{fmt(value)}</span>
  </div>
);

const SummaryPanel = ({
  selectedProduct,
  batchSize,
  batchUnit,
  ingResult,
  packResult,
  totals,
  isEditing,
  updateSellingPrice,
  updateSellingPriceUnit,
  sellingPrice,
  sellingPriceUnit,
  rateMethod
}) => {
  const profitPositive = totals.profit >= 0;
  const rateLabel =
    rateMethod === 'weighted' ? 'WAC' :
    rateMethod === 'manual' ? 'Manual' :
    'Latest';

  const batchLabel =
    batchSize >= 1000 && batchUnit === 'g'
      ? `${batchSize / 1000}kg`
      : `${batchSize}${batchUnit}`;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-purple-50 to-indigo-50 shadow-xl shadow-purple-500/10 ring-1 ring-purple-100">
      <div className="h-1.5 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500" />
      <div className="p-5 md:p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest mb-1">
              Costing Summary
            </p>
            <h2 className="text-lg md:text-xl font-extrabold text-slate-900 leading-tight truncate">
              {selectedProduct.productName}
            </h2>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
              per {batchLabel} batch • {rateLabel} rate
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-white shadow-lg shadow-purple-500/10 ring-1 ring-purple-100 flex-shrink-0">
            <Target className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
          </div>
        </div>

        {/* Cost breakdown */}
        <div className="space-y-2.5 mb-5">
          <CostLine label="Ingredients" value={ingResult.total} chip="bg-emerald-100" chipText="text-emerald-700" />
          <CostLine label="Packing"    value={packResult.total} chip="bg-indigo-100" chipText="text-indigo-700" />
          <CostLine label="Other"      value={totals.otherTotal} chip="bg-orange-100" chipText="text-orange-700" />
        </div>

        {/* Total cost hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-4 mb-5 shadow-lg">
          <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-purple-500/20 blur-2xl pointer-events-none" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Total Production Cost
              </p>
              <p className="text-2xl md:text-3xl font-extrabold text-white mt-1 tracking-tight">
                {fmt(totals.totalCost)}
              </p>
            </div>
            <Wallet className="w-7 h-7 md:w-8 md:h-8 text-purple-300/60" />
          </div>
        </div>

        {/* Selling rate */}
        <div className="mb-5">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
            <IndianRupee className="w-3 h-3 inline mr-0.5 -mt-0.5" /> Selling Rate
          </label>

          {isEditing ? (
            <div className="flex gap-2">
              <input
                type="number"
                value={sellingPrice || ''}
                onChange={e => updateSellingPrice(e.target.value)}
                placeholder="0.00"
                step="0.01"
                className="flex-1 px-4 py-3 rounded-xl bg-white ring-2 ring-purple-300 focus:ring-purple-500 outline-none text-xl font-extrabold text-slate-900 tracking-tight"
              />
              <select
                value={sellingPriceUnit || 'kg'}
                onChange={e => updateSellingPriceUnit(e.target.value)}
                className="w-24 px-3 py-3 rounded-xl bg-white ring-2 ring-purple-300 focus:ring-purple-500 outline-none text-sm font-bold text-slate-900"
              >
                <option value="g">per g</option>
                <option value="kg">per kg</option>
                <option value="pcs">per pcs</option>
              </select>
            </div>
          ) : (
            <div className="px-4 py-3 rounded-xl bg-white ring-1 ring-purple-100">
              <p className="text-lg font-extrabold text-slate-900 tracking-tight">
                {fmt(sellingPrice)}/{sellingPriceUnit || 'kg'}
                <span className="text-sm text-slate-400 font-semibold ml-2">
                  = {fmt(totals.sellingPrice)} for {batchLabel}
                </span>
              </p>
            </div>
          )}

          <p className="text-[10px] text-slate-400 mt-1.5">
            Rate per unit. For batch {batchLabel}: <b>{fmt(totals.sellingPrice)}</b>
            {' '}({fmt(sellingPrice)}/{sellingPriceUnit || 'kg'} × {totals.batchInRateUnit}{sellingPriceUnit || 'kg'}).
          </p>
        </div>

        {/* Profit hero */}
        <div
          className={`relative overflow-hidden rounded-2xl p-5 shadow-lg ${
            profitPositive
              ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/30'
              : 'bg-gradient-to-br from-rose-500 to-red-600 shadow-rose-500/30'
          }`}
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">
                Net Profit
              </span>
              {profitPositive ? (
                <TrendingUp className="w-5 h-5 text-white" />
              ) : (
                <TrendingDown className="w-5 h-5 text-white" />
              )}
            </div>
            <p className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              {fmt(totals.profit)}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-white/15 backdrop-blur px-3 py-2">
                <div className="flex items-center gap-1 mb-0.5">
                  <Percent className="w-3 h-3 text-white/80" />
                  <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">
                    Margin
                  </span>
                </div>
                <p className="text-sm font-bold text-white">
                  {totals.profitMarginPct.toFixed(2)}%
                </p>
                <p className="text-[9px] text-white/60">÷ Selling Price</p>
              </div>
              <div className="rounded-lg bg-white/15 backdrop-blur px-3 py-2">
                <div className="flex items-center gap-1 mb-0.5">
                  <TrendingUpIcon className="w-3 h-3 text-white/80" />
                  <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">
                    Markup
                  </span>
                </div>
                <p className="text-sm font-bold text-white">
                  {totals.profitMarkupPct.toFixed(2)}%
                </p>
                <p className="text-[9px] text-white/60">÷ Total Cost</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryPanel;