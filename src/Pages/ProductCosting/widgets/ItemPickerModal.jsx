// src/Pages/ProductCosting/widgets/ItemPickerModal.jsx
import React from 'react';
import { Search, X, Carrot, Box } from 'lucide-react';
import { fmt, latestPurchaseRate, weightedAverageRate } from '../utils/costingHelpers';

const ItemPickerModal = ({
  open,
  mode,               // 'ingredient' | 'packing'
  items,
  search,
  onSearchChange,
  onPick,
  onClose,
  rateMethod
}) => {
  if (!open) return null;
  const isIngredient = mode === 'ingredient';

  const filtered = items.filter(x => {
    const name = isIngredient ? x.ingredientName : x.materialName;
    return !search.trim() || (name || '').toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-white rounded-t-3xl md:rounded-2xl shadow-2xl w-full md:max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm md:text-base">
            {isIngredient ? (
              <>
                <Carrot className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" /> Pick Ingredient
              </>
            ) : (
              <>
                <Box className="w-4 h-4 md:w-5 md:h-5 text-indigo-600" /> Pick Packing Material
              </>
            )}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 ring-1 ring-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {filtered.length === 0 && (
            <p className="text-center text-slate-400 text-sm py-10">No results.</p>
          )}
          {filtered.map(x => {
            const name = isIngredient ? x.ingredientName : x.materialName;
            const unit = x.unit || (isIngredient ? 'kg' : 'pcs');
            const latest = latestPurchaseRate(x);
            const weighted = weightedAverageRate(x);
            const sizeLabel = !isIngredient && x.size ? `Size: ${x.size} • ` : '';

            return (
              <button
                key={x.id}
                onClick={() => onPick(x)}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-left transition-colors ${
                  isIngredient ? 'hover:bg-emerald-50' : 'hover:bg-indigo-50'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 truncate">{name}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {sizeLabel}Unit: {unit}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Latest {fmt(latest)} • WAC {fmt(weighted)}
                  </p>
                </div>
                <span
                  className={`text-sm font-bold flex-shrink-0 ml-3 ${
                    isIngredient ? 'text-emerald-700' : 'text-indigo-700'
                  }`}
                >
                  {fmt(rateMethod === 'weighted' ? weighted : latest)}/{unit}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ItemPickerModal;