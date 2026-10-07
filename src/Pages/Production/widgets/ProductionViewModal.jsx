// Pages/Production/widgets/ProductionViewModal.jsx
import React from 'react';
import { Factory, X, Edit, Trash2 } from 'lucide-react';
import { toDateString, fmt2 } from '../utils/productionHelpers';

const ProductionViewModal = ({ item, onClose, onEdit, onDelete }) => {
  if (!item) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <Factory className="w-5 h-5 text-cyan-600" />
            <h3 className="font-semibold text-gray-900">Production Details</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Product</p>
              <p className="font-semibold text-gray-900">{item.productName}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Date</p>
              <p className="text-gray-900">{toDateString(item.date) || '-'}</p>
            </div>
            <div className="bg-cyan-50 rounded-lg p-3 col-span-2">
              <p className="text-xs text-gray-500">Quantity Produced</p>
              <p className="text-xl font-bold text-cyan-600">{fmt2(item.produced)} kg</p>
            </div>
          </div>

          {(item.packingUsed || []).length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Packing Materials Used</p>
              <div className="space-y-1">
                {item.packingUsed.map((p, i) => (
                  <div key={i} className="flex justify-between bg-indigo-50 rounded px-3 py-2 text-sm">
                    <span className="text-gray-700">{p.materialName}</span>
                    <span className="font-semibold text-indigo-700">{p.quantity} {p.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {item.remarks && (
            <div>
              <p className="text-sm text-gray-500">Remarks</p>
              <p className="text-gray-900">{item.remarks}</p>
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <button
              onClick={onEdit}
              className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
            >
              <Edit className="w-4 h-4" /> Edit
            </button>
            <button
              onClick={onDelete}
              className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductionViewModal;