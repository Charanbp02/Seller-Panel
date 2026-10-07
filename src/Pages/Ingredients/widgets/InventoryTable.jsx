// Pages/Ingredients/widgets/InventoryTable.jsx
import React from 'react';
import {
  Search, Filter, Download, Printer, Eye, Edit, Trash2,
  Box, CheckCircle, AlertTriangle, AlertOctagon
} from 'lucide-react';
import { getStockStatus } from '../utils/ingredientHelpers';

const STATUS_ICONS = { CheckCircle, AlertTriangle, AlertOctagon };

const InventoryTable = ({
  rows, searchTerm, setSearchTerm,
  onView, onEdit, onDelete
}) => {
  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 md:flex-none">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search ingredients..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-full md:w-72"
            />
          </div>
          <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4 text-gray-600" />
          </button>
          <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Printer className="w-4 h-4 text-gray-600" />
          </button>
          <span className="text-sm text-gray-500 ml-1">{rows.length} items</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 rounded-xl">
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-3">Ingredient</th>
              <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-3">Unit</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-3">Opening</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-3">Purchased</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-3">Used</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-3">Wastage</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-3">Closing</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-3">Rate</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-3">Stock Value</th>
              <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-3">Status</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(item => {
              const status = getStockStatus(item);
              const StatusIcon = STATUS_ICONS[status.iconName] || CheckCircle;
              return (
                <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-3">
                    <div>
                      <span className="font-medium text-gray-900">{item.ingredientName}</span>
                      {item.supplier && <p className="text-xs text-gray-400">{item.supplier}</p>}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center text-sm text-gray-600">{item.unit}</td>
                  <td className="px-3 py-3 text-right text-sm">{item.openingStock}</td>
                  <td className="px-3 py-3 text-right text-sm text-green-600 font-medium">{item.totalPurchased}</td>
                  <td className="px-3 py-3 text-right text-sm text-blue-600 font-medium">{item.totalProductionUsage}</td>
                  <td className="px-3 py-3 text-right text-sm text-orange-600 font-medium">{item.totalWastage}</td>
                  <td className="px-3 py-3 text-right font-bold text-gray-900">{item.currentStock.toFixed(1)}</td>
                  <td className="px-3 py-3 text-right text-sm">₹{item.purchaseRate.toFixed(2)}</td>
                  <td className="px-3 py-3 text-right font-semibold text-emerald-600">₹{item.stockValue.toFixed(2)}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => onView(item)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors" title="View">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => onEdit(item)} className="p-1.5 hover:bg-green-50 rounded-lg text-green-600 transition-colors" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => onDelete(item.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-600 transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Box className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">No ingredients found</p>
          <p className="text-sm text-gray-400 mt-1">Add your first ingredient</p>
        </div>
      )}
    </>
  );
};

export default InventoryTable;