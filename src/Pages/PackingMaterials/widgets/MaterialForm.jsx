// Pages/PackingMaterials/widgets/MaterialForm.jsx
import React from 'react';
import {
  Tag, Ruler, Scale, Box, DollarSign, Truck, AlertTriangle,
  FileText, Save, RefreshCw, X
} from 'lucide-react';
import { MATERIAL_PRESETS, PACKING_UNITS } from '../utils/packingHelpers';

const MaterialForm = ({ data, setData, isEditing, saving, onSave, onCancel, onReset }) => {
  const patch = (p) => setData({ ...data, ...p });

  return (
    <div className="bg-gray-50 rounded-xl p-4 md:p-6 mb-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {isEditing ? 'Edit Material' : 'Add Material'}
        </h3>
        <button onClick={onCancel} className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <Tag className="w-4 h-4 inline mr-1.5" /> Material Name *
          </label>
          <input
            type="text"
            value={data.materialName}
            onChange={e => patch({ materialName: e.target.value })}
            placeholder="Enter material name"
            list="materials-list"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <datalist id="materials-list">
            {MATERIAL_PRESETS.map(name => <option key={name} value={name} />)}
          </datalist>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <Ruler className="w-4 h-4 inline mr-1.5" /> Size
          </label>
          <input
            type="text"
            value={data.size}
            onChange={e => patch({ size: e.target.value })}
            placeholder="e.g., 100g, 12x12 inch"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <Scale className="w-4 h-4 inline mr-1.5" /> Unit
          </label>
          <select
            value={data.unit}
            onChange={e => patch({ unit: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {PACKING_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <Box className="w-4 h-4 inline mr-1.5" /> Opening Quantity *
          </label>
          <input
            type="number"
            value={data.openingQuantity}
            onChange={e => patch({ openingQuantity: e.target.value })}
            placeholder="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <DollarSign className="w-4 h-4 inline mr-1.5" /> Rate
          </label>
          <input
            type="number"
            value={data.rate}
            onChange={e => patch({ rate: e.target.value })}
            placeholder="0.00"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <Truck className="w-4 h-4 inline mr-1.5" /> Supplier
          </label>
          <input
            type="text"
            value={data.supplier}
            onChange={e => patch({ supplier: e.target.value })}
            placeholder="Supplier name"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <AlertTriangle className="w-4 h-4 inline mr-1.5" /> Reorder Level
          </label>
          <input
            type="number"
            value={data.reorderLevel}
            onChange={e => patch({ reorderLevel: e.target.value })}
            placeholder="Min stock level"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          <FileText className="w-4 h-4 inline mr-1.5" /> Remarks
        </label>
        <input
          type="text"
          value={data.remarks}
          onChange={e => patch({ remarks: e.target.value })}
          placeholder="Optional notes..."
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
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
          className="w-full sm:w-auto px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {isEditing ? 'Update' : 'Save'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default MaterialForm;