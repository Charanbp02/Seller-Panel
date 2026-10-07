// src/Pages/ProductCosting/widgets/EmptyRow.jsx
import React from 'react';
import { Receipt, Plus } from 'lucide-react';

const EmptyRow = ({ colSpan, editing, onAdd, label }) => (
  <tr>
    <td colSpan={colSpan} className="px-3 py-10 text-center">
      <div className="inline-flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
          <Receipt className="w-5 h-5 text-slate-400" />
        </div>
        <p className="text-sm text-slate-500">{label}</p>
        {editing && onAdd && (
          <button
            onClick={onAdd}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add now
          </button>
        )}
      </div>
    </td>
  </tr>
);

export default EmptyRow;