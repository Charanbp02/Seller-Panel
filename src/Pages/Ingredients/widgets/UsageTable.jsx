// Pages/Ingredients/widgets/UsageTable.jsx
import React from 'react';
import {
  Search, Download, Printer, Trash2, Plus, TrendingDown
} from 'lucide-react';

const UsageTable = ({
  rows, searchTerm, setSearchTerm,
  onAdd, onDelete
}) => {
  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 md:flex-none">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search usage..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-full md:w-64"
            />
          </div>
          <button
            onClick={onAdd}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Usage</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4 text-gray-600" />
          </button>
          <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Printer className="w-4 h-4 text-gray-600" />
          </button>
          <span className="text-sm text-gray-500 ml-1">{rows.length} entries</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 rounded-xl">
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Date</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Ingredient</th>
              <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Production Usage</th>
              <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Wastage</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Purpose</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item, index) => (
              <tr key={index} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-600">{item.date}</td>
                <td className="px-4 py-3">
                  <span className="font-medium text-gray-900">{item.ingredientName}</span>
                </td>
                <td className="px-4 py-3 text-center font-medium text-blue-600">
                  {item.productionUsage || 0} {item.unit}
                </td>
                <td className="px-4 py-3 text-center font-medium text-orange-600">
                  {item.wastage || 0} {item.unit}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{item.purpose || '-'}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => onDelete(item)}
                    className="p-1.5 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <TrendingDown className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">No usage records found</p>
          <p className="text-sm text-gray-400 mt-1">Add your first usage entry</p>
        </div>
      )}
    </>
  );
};

export default UsageTable;