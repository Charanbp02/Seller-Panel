// Pages/Production/widgets/ProductionForm.jsx
import React from 'react';
import {
  Save, RefreshCw, X, Tag, Calendar, Package, FileText
} from 'lucide-react';
import PackingUsedTable from './PackingUsedTable';

const ProductionForm = ({
  formData,
  patchForm,
  productList,
  packingList,
  isEditing,
  saving,
  onSave,
  onCancel,
  onReset,
  // packing row actions
  addPackingRow,
  updatePackingRow,
  removePackingRow
}) => {
  return (
    <div className="bg-gray-50 rounded-xl p-4 md:p-6 mb-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {isEditing ? 'Edit Production' : 'Add Production'}
        </h3>
        <button onClick={onCancel} className="p-1 hover:bg-gray-200 rounded-lg">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <Tag className="w-4 h-4 inline mr-1.5" /> Product *
          </label>
          <input
            type="text"
            list="products"
            value={formData.productName}
            onChange={e => patchForm({ productName: e.target.value })}
            placeholder="Type product name..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none"
          />
          <datalist id="products">
            {productList.map(n => <option key={n} value={n} />)}
          </datalist>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <Calendar className="w-4 h-4 inline mr-1.5" /> Date
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={e => patchForm({ date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <Package className="w-4 h-4 inline mr-1.5" /> Produced (kg) *
          </label>
          <input
            type="number"
            value={formData.produced}
            step="0.01"
            onChange={e => patchForm({ produced: e.target.value })}
            placeholder="0.00"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <FileText className="w-4 h-4 inline mr-1.5" /> Remarks
          </label>
          <input
            type="text"
            value={formData.remarks}
            onChange={e => patchForm({ remarks: e.target.value })}
            placeholder="Optional notes..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none"
          />
        </div>
      </div>

      <PackingUsedTable
        rows={formData.packingUsed || []}
        packingList={packingList}
        onAdd={addPackingRow}
        onChange={updatePackingRow}
        onRemove={removePackingRow}
      />

      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={onReset}
          className="w-full sm:w-auto px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Reset
        </button>
        <button
          onClick={onCancel}
          className="w-full sm:w-auto px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="w-full sm:w-auto px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> {isEditing ? 'Update' : 'Save'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ProductionForm;