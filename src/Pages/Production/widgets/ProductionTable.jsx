// Pages/Production/widgets/ProductionTable.jsx
import React from 'react';
import { Search, Download, Printer, Eye, Edit, Trash2, Factory } from 'lucide-react';
import { toDateString, fmt2 } from '../utils/productionHelpers';

const ProductionTable = ({
  rows, searchTerm, setSearchTerm,
  onView, onEdit, onDelete
}) => {
  return (
    <>
      {/* Search + actions bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="relative flex-1 md:flex-none">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search production..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none w-full md:w-64"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4 text-gray-600" />
          </button>
          <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
            <Printer className="w-4 h-4 text-gray-600" />
          </button>
          <span className="text-sm text-gray-500 ml-1">{rows.length} entries</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Date</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Product</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Produced (kg)</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Packing Used</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Remarks</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(item => (
              <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-600">
                  {toDateString(item.date) || '-'}
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">{item.productName}</td>
                <td className="px-4 py-3 text-right font-semibold text-gray-900">
                  {fmt2(item.produced)} kg
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {(item.packingUsed || []).length === 0 ? (
                    <span className="text-gray-400 italic">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {item.packingUsed.slice(0, 3).map((p, i) => (
                        <span key={i} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                          {p.materialName} × {p.quantity}
                        </span>
                      ))}
                      {item.packingUsed.length > 3 && (
                        <span className="text-xs text-gray-400">
                          +{item.packingUsed.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{item.remarks || '-'}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => onView(item)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => onEdit(item)} className="p-1.5 hover:bg-green-50 rounded-lg text-green-600">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(item)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Factory className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">No production records found for this date</p>
          <p className="text-sm text-gray-400 mt-1">Add your first production entry</p>
        </div>
      )}
    </>
  );
};

export default ProductionTable;