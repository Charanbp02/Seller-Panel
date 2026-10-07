// src/Pages/ProductCosting/widgets/PackingTable.jsx
import React from 'react';
import { Box, Plus, Trash2, AlertCircle, Receipt } from 'lucide-react';
import SectionShell from './SectionShell';
import EmptyRow from './EmptyRow';
import { fmt } from '../utils/costingHelpers';

const PackingTable = ({
  rows,
  total,
  isEditing,
  scaleFactor,
  onAdd,
  onUpdate,
  onRemove,
  onOpenPicker
}) => {
  return (
    <SectionShell
      icon={Box}
      iconColor={{ bg: 'bg-indigo-100', text: 'text-indigo-600' }}
      title="Packing Cost"
      subtitle={
        rows.length === 0
          ? 'No packing materials yet'
          : `${rows.length} material${rows.length !== 1 ? 's' : ''}`
      }
      badge={
        scaleFactor !== 1 && (
          <span className="text-[10px] md:text-xs text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full font-semibold">
            ×{scaleFactor.toFixed(2)}
          </span>
        )
      }
      action={
        isEditing && (
          <button
            onClick={onAdd}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-indigo-50"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        )
      }
    >
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50/80">
              <th className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 py-2.5 rounded-l-lg">
                Material
              </th>
              <th className="text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 py-2.5">
                Qty
              </th>
              <th className="text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 py-2.5">
                Rate
              </th>
              <th className="text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 py-2.5 rounded-r-lg">
                Cost
              </th>
              {isEditing && <th className="w-10" />}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <EmptyRow
                colSpan={isEditing ? 5 : 4}
                editing={isEditing}
                onAdd={onAdd}
                label="No packing materials in recipe"
              />
            )}
            {rows.map((r, idx) => (
              <tr key={r.packingId || idx} className="border-t border-slate-100 hover:bg-slate-50/60">
                <td className="px-3 py-3">
                  {isEditing ? (
                    <button
                      type="button"
                      onClick={() => onOpenPicker(idx)}
                      className="w-full text-left px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 ring-1 ring-slate-200 text-sm font-medium text-slate-800"
                    >
                      {r.materialName || (
                        <span className="text-slate-400">Pick packing material...</span>
                      )}
                    </button>
                  ) : (
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{r.materialName}</p>
                      {r.error && (
                        <p className="text-[11px] text-rose-600 flex items-center gap-1 mt-0.5">
                          <AlertCircle className="w-3 h-3" /> {r.error}
                        </p>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-3 py-3 text-right">
                  {isEditing ? (
                    <div className="flex justify-end gap-1">
                      <input
                        type="number"
                        value={r.qty ?? ''}
                        onChange={e => onUpdate(idx, 'qty', e.target.value)}
                        className="w-20 px-2 py-1.5 rounded-lg bg-slate-50 ring-1 ring-slate-200 text-sm text-right"
                        step="0.01"
                      />
                      <select
                        value={r.unit || 'pcs'}
                        onChange={e => onUpdate(idx, 'unit', e.target.value)}
                        className="w-20 px-2 py-1.5 rounded-lg bg-slate-50 ring-1 ring-slate-200 text-sm"
                      >
                        {['pcs', 'rolls', 'sheets', 'meters', 'kg'].map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <span className="text-sm font-medium text-slate-700">
                      {Number(r.qty || 0).toFixed(2)} {r.unit}
                    </span>
                  )}
                </td>
                <td className="px-3 py-3 text-right text-sm text-slate-500">
                  {r.rate ? `${fmt(r.rate)}/${r.baseUnit || ''}` : '—'}
                </td>
                <td className="px-3 py-3 text-right text-sm font-bold text-slate-900">
                  {fmt(r.cost || 0)}
                </td>
                {isEditing && (
                  <td className="px-3 py-3 text-right">
                    <button
                      onClick={() => onRemove(idx)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50">
              <td colSpan={isEditing ? 4 : 3} className="px-3 py-3 text-sm font-bold text-slate-700 text-right">
                Total Packing Cost
              </td>
              <td className="px-3 py-3 text-right text-base md:text-lg font-extrabold text-indigo-700">
                {fmt(total)}
              </td>
              {isEditing && <td />}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {rows.length === 0 && (
          <div className="text-center py-8">
            <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No packing materials in recipe</p>
            {isEditing && (
              <button
                onClick={onAdd}
                className="mt-3 text-xs font-semibold text-indigo-600 inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Packing
              </button>
            )}
          </div>
        )}
        {rows.map((r, idx) => (
          <div key={r.packingId || idx} className="rounded-xl bg-slate-50/80 ring-1 ring-slate-100 p-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              {isEditing ? (
                <button
                  type="button"
                  onClick={() => onOpenPicker(idx)}
                  className="flex-1 text-left px-3 py-2 rounded-lg bg-white ring-1 ring-slate-200 text-sm font-medium"
                >
                  {r.materialName || <span className="text-slate-400">Pick material...</span>}
                </button>
              ) : (
                <p className="text-sm font-semibold text-slate-900">{r.materialName}</p>
              )}
              {isEditing && (
                <button
                  onClick={() => onRemove(idx)}
                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-slate-400 mb-0.5">Qty</p>
                {isEditing ? (
                  <input
                    type="number"
                    value={r.qty ?? ''}
                    onChange={e => onUpdate(idx, 'qty', e.target.value)}
                    className="w-full px-1.5 py-1 rounded bg-white ring-1 ring-slate-200 text-xs text-right"
                    step="0.01"
                  />
                ) : (
                  <p className="font-medium text-slate-700">
                    {Number(r.qty || 0).toFixed(2)} {r.unit}
                  </p>
                )}
              </div>
              <div>
                <p className="text-slate-400 mb-0.5">Rate</p>
                <p className="font-medium text-slate-700">
                  {r.rate ? `${fmt(r.rate)}/${r.baseUnit || ''}` : '—'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 mb-0.5">Cost</p>
                <p className="font-bold text-slate-900">{fmt(r.cost || 0)}</p>
              </div>
            </div>
          </div>
        ))}
        {rows.length > 0 && (
          <div className="rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 ring-1 ring-indigo-200 p-3 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
              Total Packing
            </span>
            <span className="text-base font-extrabold text-indigo-700">{fmt(total)}</span>
          </div>
        )}
      </div>
    </SectionShell>
  );
};

export default PackingTable;