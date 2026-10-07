// src/Pages/ProductCosting/widgets/CostingHeader.jsx
import React, { useState } from 'react';
import {
  Calculator, Package, Layers, Edit3, Save, X, Plus, Loader2,
  Sparkles, Scale, AlertCircle
} from 'lucide-react';
import { BATCH_PRESETS, RATE_METHODS } from '../utils/costingHelpers';

const CostingHeader = ({
  products,
  selectedProductId,
  onProductChange,
  batchSize,
  batchUnit,
  onBatchChange,
  rateMethod,
  onRateMethodChange,
  isEditing,
  onEditToggle,
  onSave,
  saving,
  hasRecipe,
  onCreateProduct
}) => {
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [creatingProduct, setCreatingProduct] = useState(false);

  const handleCreate = async () => {
    const name = newProductName.trim();
    if (!name) return;
    setCreatingProduct(true);
    try {
      await onCreateProduct(name);
      setNewProductName('');
      setShowNewProduct(false);
    } finally {
      setCreatingProduct(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 shadow-2xl shadow-purple-500/20">
      {/* Decorative glows */}
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-fuchsia-400/20 blur-3xl pointer-events-none" />

      <div className="relative p-5 md:p-8">
        {/* Title row */}
        <div className="flex items-start gap-3 md:gap-4 mb-6">
          <div className="p-3 md:p-4 bg-white/15 backdrop-blur rounded-2xl ring-1 ring-white/25 shadow-inner">
            <Calculator className="w-6 h-6 md:w-7 md:h-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl md:text-3xl font-bold text-white tracking-tight">
                Product Costing
              </h1>
              <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-yellow-300" />
            </div>
            <p className="text-purple-100 text-xs md:text-sm">
              Live ingredient + packing + other costs → instant profit
            </p>
          </div>
          <button
            onClick={() => setShowNewProduct(v => !v)}
            className="px-3 py-2 md:px-4 md:py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs md:text-sm font-semibold flex items-center gap-1.5 ring-1 ring-white/25 backdrop-blur transition-all flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Product</span>
          </button>
        </div>

        {/* New product inline form */}
        {showNewProduct && (
          <div className="mb-5 bg-white/10 backdrop-blur ring-1 ring-white/25 rounded-2xl p-3 flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newProductName}
              onChange={e => setNewProductName(e.target.value)}
              placeholder="Product name (e.g., Sambar Powder)"
              className="flex-1 px-4 py-2.5 rounded-xl text-sm text-slate-900 outline-none ring-2 ring-transparent focus:ring-yellow-300 bg-white"
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
            <button
              onClick={handleCreate}
              disabled={creatingProduct || !newProductName.trim()}
              className="px-5 py-2.5 bg-yellow-300 hover:bg-yellow-200 text-purple-900 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-lg shadow-yellow-500/30"
            >
              {creatingProduct ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {creatingProduct ? 'Adding...' : 'Add'}
            </button>
          </div>
        )}

        {/* Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4">
          <div className="md:col-span-4">
            <label className="block text-[10px] md:text-xs font-bold text-purple-100 uppercase tracking-widest mb-1.5">
              <Package className="w-3 h-3 inline mr-1 -mt-0.5" /> Product
            </label>
            <select
              value={selectedProductId}
              onChange={e => onProductChange(e.target.value)}
              className="w-full px-4 py-3 bg-white/95 backdrop-blur rounded-xl text-sm font-semibold text-slate-900 outline-none ring-2 ring-transparent focus:ring-yellow-300"
            >
              <option value="">— Select product —</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.productName}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="block text-[10px] md:text-xs font-bold text-purple-100 uppercase tracking-widest mb-1.5">
              <Layers className="w-3 h-3 inline mr-1 -mt-0.5" /> Batch Size
            </label>
            <select
              value={`${batchSize}${batchUnit}`}
              onChange={e => {
                const p = BATCH_PRESETS.find(x => `${x.value}${x.unit}` === e.target.value);
                if (p) onBatchChange(p.value, p.unit);
              }}
              className="w-full px-4 py-3 bg-white/95 backdrop-blur rounded-xl text-sm font-semibold text-slate-900 outline-none ring-2 ring-transparent focus:ring-yellow-300"
            >
              {BATCH_PRESETS.map(p => (
                <option key={p.label} value={`${p.value}${p.unit}`}>{p.label}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-[10px] md:text-xs font-bold text-purple-100 uppercase tracking-widest mb-1.5">
              <Scale className="w-3 h-3 inline mr-1 -mt-0.5" /> Rate
            </label>
            <select
              value={rateMethod}
              onChange={e => onRateMethodChange(e.target.value)}
              className="w-full px-4 py-3 bg-white/95 backdrop-blur rounded-xl text-sm font-semibold text-slate-900 outline-none ring-2 ring-transparent focus:ring-yellow-300"
            >
              {RATE_METHODS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3 flex items-end">
            {!isEditing ? (
              <button
                onClick={onEditToggle}
                disabled={!selectedProductId}
                className="w-full px-4 py-3 bg-white text-purple-700 hover:bg-purple-50 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40 shadow-lg shadow-purple-900/20"
              >
                <Edit3 className="w-4 h-4" />
                {hasRecipe ? 'Edit Recipe' : 'Add Recipe'}
              </button>
            ) : (
              <div className="w-full flex gap-2">
                <button
                  onClick={onEditToggle}
                  className="flex-1 px-3 py-3 bg-white/15 hover:bg-white/25 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 ring-1 ring-white/25"
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
                <button
                  onClick={onSave}
                  disabled={saving}
                  className="flex-1 px-3 py-3 bg-yellow-300 hover:bg-yellow-200 text-purple-900 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-yellow-500/30"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* No-recipe warning */}
        {selectedProductId && !hasRecipe && !isEditing && (
          <div className="mt-4 bg-yellow-300/20 ring-1 ring-yellow-300/40 rounded-xl p-3 text-yellow-50 text-xs md:text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              ಈ product ಗೆ <b>{batchSize}{batchUnit}</b> batch ನಲ್ಲಿ recipe ಇಲ್ಲ.
              <b> Add Recipe</b> click ಮಾಡಿ ingredients ಸೇರಿಸಿ.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CostingHeader;