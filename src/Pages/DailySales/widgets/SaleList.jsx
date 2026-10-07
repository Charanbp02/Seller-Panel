// Pages/DailySales/widgets/SaleList.jsx
import React from 'react';
import { Search, Eye, Edit, Trash2, IndianRupee } from 'lucide-react';
import { fmt } from '../utils/salesHelpers';
import StatusBadge from './StatusBadge';

const SaleList = ({ sales, searchTerm, setSearchTerm, onView, onEdit, onDelete, onAddPayment }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by customer or invoice..." value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-72" />
        </div>
        <span className="text-sm text-gray-500">{sales.length} sales</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              {['Invoice', 'Customer', 'Amount', 'Received', 'Balance'].map(h => (
                <th key={h}
                  className={`text-xs font-medium text-gray-500 uppercase px-4 py-3 ${h === 'Invoice' || h === 'Customer' ? 'text-left' : 'text-right'}`}>
                  {h}
                </th>
              ))}
              <th className="text-center text-xs font-medium text-gray-500 uppercase px-4 py-3">Status</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sales.map(s => (
              <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{s.invoiceNumber}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{s.customerName}</p>
                  <p className="text-xs text-gray-400 capitalize">{s.customerType}</p>
                </td>
                <td className="px-4 py-3 text-right font-semibold">{fmt(s.grandTotal)}</td>
                <td className="px-4 py-3 text-right text-gray-600">{fmt(s._paid)}</td>
                <td className={`px-4 py-3 text-right font-medium ${s._balance > 0 ? 'text-red-600' : 'text-green-600'}`}>{fmt(s._balance)}</td>
                <td className="px-4 py-3 text-center"><StatusBadge status={s._status} /></td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      title={s._balance > 0 ? 'Add Payment' : 'Fully paid'}
                      disabled={s._balance <= 0}
                      onClick={() => onAddPayment(s)}
                      className={`p-1.5 rounded-lg ${s._balance <= 0 ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-emerald-50 text-emerald-600'}`}>
                      <IndianRupee className="w-4 h-4" />
                    </button>
                    <button onClick={() => onView(s)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"><Eye className="w-4 h-4" /></button>
                    <button onClick={() => onEdit(s)} className="p-1.5 hover:bg-green-50 rounded-lg text-green-600"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => onDelete(s)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sales.length === 0 && <div className="text-center py-12 text-gray-500">No sales for this date</div>}
    </div>
  );
};

export default SaleList;