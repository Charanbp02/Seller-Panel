// Pages/Ingredients/widgets/UsageForm.jsx
import React from 'react';
import {
  Tag, Calendar, Package, AlertTriangle, FileText,
  Save, RefreshCw, X
} from 'lucide-react';

const UsageForm = ({ data, setData, inventoryData, saving, onSave, onCancel, onReset }) => {
  const patch = (p) => setData({ ...data, ...p });

  return (
    <div className="bg-gray-50 rounded-xl p-4 md:p-6 mb-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Add Usage</h3>
        <button onClick={onCancel} className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <Tag className="w-4 h-4 inline mr-1.5" /> Ingredient *
          </label>
          <input
            type="text"
            value={data.ingredientName}
            onChange={e => patch({ ingredientName: e.target.value })}
            placeholder="Select ingredient"
            list="usage-ingredients"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <datalist id="usage-ingredients">
            {inventoryData.map(item => (
              <option key={item.id} value={item.ingredientName} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <Calendar className="w-4 h-4 inline mr-1.5" /> Date
          </label>
          <input
            type="date"
            value={data.date}
            onChange={e => patch({ date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <Package className="w-4 h-4 inline mr-1.5" /> Production Usage
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={data.productionUsage}
              onChange={e => patch({ productionUsage: e.target.value })}
              placeholder="0"
              step="0.01"
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <select
              value={data.unit}
              onChange={e => patch({ unit: e.target.value })}
              className="w-20 px-2 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {['kg', 'g', 'L', 'ml'].map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <AlertTriangle className="w-4 h-4 inline mr-1.5" /> Wastage
          </label>
          <input
            type="number"
            value={data.wastage}
            onChange={e => patch({ wastage: e.target.value })}
            placeholder="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <FileText className="w-4 h-4 inline mr-1.5" /> Purpose
          </label>
          <input
            type="text"
            value={data.purpose}
            onChange={e => patch({ purpose: e.target.value })}
            placeholder="e.g., Production batch"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <FileText className="w-4 h-4 inline mr-1.5" /> Remarks
          </label>
          <input
            type="text"
            value={data.remarks}
            onChange={e => patch({ remarks: e.target.value })}
            placeholder="Optional notes..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={onReset}
          className="w-full sm:w-auto px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Reset
        </button>
        <button
          onClick={onCancel}
          className="w-full sm:w-auto px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="w-full sm:w-auto px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> Save Usage
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default UsageForm;