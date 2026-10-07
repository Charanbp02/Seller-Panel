// Pages/PackingMaterials/widgets/MaterialViewModal.jsx
import React from 'react';
import { Box, X } from 'lucide-react';

const MaterialViewModal = ({ item, onClose }) => {
  if (!item) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Box className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="font-semibold text-gray-900">{item.materialName}</h3>
              <p className="text-sm text-gray-500">{item.size || 'No size specified'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Unit</p>
              <p className="font-medium">{item.unit}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Supplier</p>
              <p className="font-medium">{item.supplier || '-'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Opening Quantity</p>
              <p className="font-medium">{item.openingQuantity} {item.unit}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Total Purchased</p>
              <p className="font-medium text-green-600">{item.totalPurchased} {item.unit}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Total Used</p>
              <p className="font-medium text-blue-600">{item.totalUsed} {item.unit}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Total Damaged</p>
              <p className="font-medium text-orange-600">{item.totalDamaged} {item.unit}</p>
            </div>
            <div className="bg-indigo-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Current Stock</p>
              <p className="font-bold text-indigo-600 text-lg">{item.currentStock} {item.unit}</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Total Value</p>
              <p className="font-bold text-emerald-600 text-lg">₹{item.totalValue.toFixed(2)}</p>
            </div>
          </div>

          {item.purchases && item.purchases.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Purchase History</p>
              <div className="space-y-1">
                {item.purchases.map((p, idx) => (
                  <div key={idx} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                    <span>{p.date}</span>
                    <span>{p.quantity} × ₹{p.rate} = ₹{p.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {item.usage && item.usage.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Usage History</p>
              <div className="space-y-1">
                {item.usage.map((u, idx) => (
                  <div key={idx} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                    <span>{u.date}</span>
                    <span>
                      Used: {u.used || 0} | Damaged: {u.damaged || 0}
                      {u.purpose && ` (${u.purpose})`}
                    </span>
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
        </div>
      </div>
    </div>
  );
};

export default MaterialViewModal;