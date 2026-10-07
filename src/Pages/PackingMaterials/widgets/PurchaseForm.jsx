// Pages/PackingMaterials/widgets/PurchaseForm.jsx
import React from 'react';
import {
  Tag, Calendar, Truck, Package, DollarSign, Wallet,
  FileText, Save, RefreshCw, X
} from 'lucide-react';
import { PACKING_UNITS } from '../utils/packingHelpers';

const PurchaseForm = ({ data, setData, inventoryData, saving, onSave, onCancel, onReset }) => {
  const patch = (p) => setData({ ...data, ...p });

  return (
    <div className="bg-gray-50 rounded-xl p-4 md:p-6 mb-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Add Purchase</h3>
        <button onClick={onCancel} className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <Tag className="w-4 h-4 inline mr-1.5" /> Material *
          </label>
          <input
            type="text"
            value={data.materialName}
            onChange={e => patch({ materialName: e.target.value })}
            placeholder="Select material"
            list="purchase-materials"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <datalist id="purchase-materials">
            {inventoryData.map(item => (
              <option key={item.id} value={item.materialName} />
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
            <Package className="w-4 h-4 inline mr-1.5" /> Quantity *
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={data.quantity}
              onChange={e => {
                const qty = e.target.value;
                const rate = parseFloat(data.rate) || 0;
                patch({ quantity: qty, amount: (parseFloat(qty) * rate).toString() });
              }}
              placeholder="0"
              step="0.01"
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={data.unit}
              onChange={e => patch({ unit: e.target.value })}
              className="w-20 px-2 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {PACKING_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <DollarSign className="w-4 h-4 inline mr-1.5" /> Rate *
          </label>
          <input
            type="number"
            value={data.rate}
            onChange={e => {
              const rate = e.target.value;
              const qty = parseFloat(data.quantity) || 0;
              patch({ rate, amount: (qty * parseFloat(rate)).toString() });
            }}
            placeholder="0.00"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <Wallet className="w-4 h-4 inline mr-1.5" /> Amount
          </label>
          <input
            type="text"
            value={data.amount ? `₹${parseFloat(data.amount).toFixed(2)}` : '₹0.00'}
            disabled
            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-700 font-semibold"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <FileText className="w-4 h-4 inline mr-1.5" /> Invoice #
          </label>
          <input
            type="text"
            value={data.invoiceNumber}
            onChange={e => patch({ invoiceNumber: e.target.value })}
            placeholder="Invoice number"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          className="w-full sm:w-auto px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> Save Purchase
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PurchaseForm;