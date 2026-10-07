// Pages/Production/widgets/StockTable.jsx
import React from 'react';
import { Search, Box } from 'lucide-react';
import { fmt2, stockStatus } from '../utils/productionHelpers';

const StockTable = ({ rows, searchTerm, setSearchTerm }) => {
  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="relative flex-1 md:flex-none">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search stock..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none w-full md:w-64"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 ml-1">{rows.length} products</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Product</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Produced</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Sold</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Current Stock</th>
              <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(item => {
              const s = stockStatus(item);
              return (
                <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{item.productName}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-700">{fmt2(item.produced)} kg</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-700">{fmt2(item.sold)} kg</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">{fmt2(item.currentStock)} kg</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${s.color}`}>
                      {s.label}
                    </span>
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
          <p className="text-gray-500 font-medium">No stock available</p>
          <p className="text-sm text-gray-400 mt-1">Add production to update stock</p>
        </div>
      )}
    </>
  );
};

export default StockTable;