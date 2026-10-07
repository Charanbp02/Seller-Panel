// Pages/Production/widgets/PackingUsedTable.jsx
import React from 'react';
import { Plus, Trash2, Box } from 'lucide-react';
import { PACKING_UNITS } from '../utils/productionHelpers';

const PackingUsedTable = ({ rows, packingList, onAdd, onChange, onRemove }) => (
  <div className="mt-5 pt-5 border-t border-gray-200">
    <div className="flex items-center justify-between mb-3">
      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <Box className="w-4 h-4" /> Packing Materials Used (auto-deduct from stock)
      </label>
      <button
        onClick={onAdd}
        className="text-sm text-cyan-600 hover:text-cyan-700 font-medium flex items-center gap-1"
      >
        <Plus className="w-4 h-4" /> Add Packing
      </button>
    </div>

    {rows.length === 0 ? (
      <p className="text-xs text-gray-400 italic">
        No packing materials used. Click "+ Add Packing" to add.
      </p>
    ) : (
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-3 py-2">Material</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase px-3 py-2">Available</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-3 py-2">Quantity</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-3 py-2">Unit</th>
              <th className="text-center text-xs font-medium text-gray-500 uppercase px-3 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p, idx) => {
              const found = packingList.find(x => x.materialName === p.materialName);
              return (
                <tr key={idx} className="border-t border-gray-100">
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      list={`packing-${idx}`}
                      value={p.materialName}
                      onChange={e => onChange(idx, 'materialName', e.target.value)}
                      placeholder="Select packing material..."
                      className="w-48 px-2 py-1.5 border border-gray-200 rounded text-sm"
                    />
                    <datalist id={`packing-${idx}`}>
                      {packingList.map(m => (
                        <option key={m.id} value={m.materialName} />
                      ))}
                    </datalist>
                  </td>
                  <td className="px-3 py-2 text-right text-sm text-gray-500">
                    {found ? `${found.currentStock} ${found.unit}` : '—'}
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={p.quantity}
                      step="0.01"
                      onChange={e => onChange(idx, 'quantity', e.target.value)}
                      placeholder="0"
                      className="w-24 px-2 py-1.5 border border-gray-200 rounded text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={p.unit}
                      onChange={e => onChange(idx, 'unit', e.target.value)}
                      className="w-20 px-2 py-1.5 border border-gray-200 rounded text-sm"
                    >
                      {PACKING_UNITS.map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => onRemove(idx)}
                      className="p-1 rounded-lg text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

export default PackingUsedTable;