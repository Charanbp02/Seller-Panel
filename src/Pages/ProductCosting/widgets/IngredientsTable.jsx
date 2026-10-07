// src/Pages/ProductCosting/widgets/IngredientsTable.jsx
import React from 'react';
import { Carrot, Plus, Trash2, AlertCircle, Receipt } from 'lucide-react';
import SectionShell from './SectionShell';
import EmptyRow from './EmptyRow';
import { fmt } from '../utils/costingHelpers';

const IngredientsTable = ({
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
      icon={Carrot}
      iconColor={{ bg: 'bg-emerald-100', text: 'text-emerald-600' }}
      title="Ingredients Cost"
      subtitle={
        rows.length === 0
          ? 'No ingredients yet'
          : `${rows.length} ingredient${rows.length !== 1 ? 's' : ''}`
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
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-emerald-50"
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
                Ingredient
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
                label="No ingredients in recipe"
              />
            )}
            {rows.map((r, idx) => (
              <tr key={r.ingredientId || idx} className="border-t border-slate-100 hover:bg-slate-50/60">
                <td className="px-3 py-3">
                  {isEditing ? (
                    <button
                      type="button"
                      onClick={() => onOpenPicker(idx)}
                      className="w-full text-left px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 ring-1 ring-slate-200 text-sm font-medium text-slate-800"
                    >
                      {r.ingredientName || (
                        <span className="text-slate-400">Pick ingredient...</span>
                      )}
                    </button>
                  ) : (
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{r.ingredientName}</p>
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
                        value={r.recipeQty ?? ''}
                        onChange={e => onUpdate(idx, 'recipeQty', e.target.value)}
                        className="w-20 px-2 py-1.5 rounded-lg bg-slate-50 ring-1 ring-slate-200 text-sm text-right focus:outline-none focus:ring-2 focus:ring-purple-400"
                        step="0.01"
                      />
                      <select
                        value={r.recipeUnit || 'g'}
                        onChange={e => onUpdate(idx, 'recipeUnit', e.target.value)}
                        className="w-16 px-2 py-1.5 rounded-lg bg-slate-50 ring-1 ring-slate-200 text-sm"
                      >
                        {['g', 'kg', 'mg'].map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <span className="text-sm font-medium text-slate-700">
                      {Number(r.recipeQty || 0).toFixed(2)}{r.recipeUnit}
                    </span>
                  )}
                </td>
                <td className="px-3 py-3 text-right text-sm text-slate-500">
                  {r.rate ? `${fmt(r.rate)}/${r.rateUnit || ''}` : '—'}
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
            <tr className="border-t-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50">
              <td colSpan={isEditing ? 4 : 3} className="px-3 py-3 text-sm font-bold text-slate-700 text-right">
                Total Ingredient Cost
              </td>
              <td className="px-3 py-3 text-right text-base md:text-lg font-extrabold text-emerald-700">
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
            <p className="text-sm text-slate-500">No ingredients in recipe</p>
            {isEditing && (
              <button
                onClick={onAdd}
                className="mt-3 text-xs font-semibold text-emerald-600 inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Ingredient
              </button>
            )}
          </div>
        )}
        {rows.map((r, idx) => (
          <div key={r.ingredientId || idx} className="rounded-xl bg-slate-50/80 ring-1 ring-slate-100 p-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              {isEditing ? (
                <button
                  type="button"
                  onClick={() => onOpenPicker(idx)}
                  className="flex-1 text-left px-3 py-2 rounded-lg bg-white ring-1 ring-slate-200 text-sm font-medium"
                >
                  {r.ingredientName || <span className="text-slate-400">Pick ingredient...</span>}
                </button>
              ) : (
                <p className="text-sm font-semibold text-slate-900">{r.ingredientName}</p>
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
            {r.error && (
              <p className="text-[11px] text-rose-600 flex items-center gap-1 mb-1.5">
                <AlertCircle className="w-3 h-3" /> {r.error}
              </p>
            )}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-slate-400 mb-0.5">Qty</p>
                {isEditing ? (
                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={r.recipeQty ?? ''}
                      onChange={e => onUpdate(idx, 'recipeQty', e.target.value)}
                      className="w-full px-1.5 py-1 rounded bg-white ring-1 ring-slate-200 text-xs text-right"
                      step="0.01"
                    />
                    <select
                      value={r.recipeUnit || 'g'}
                      onChange={e => onUpdate(idx, 'recipeUnit', e.target.value)}
                      className="w-12 px-1 py-1 rounded bg-white ring-1 ring-slate-200 text-xs"
                    >
                      {['g', 'kg'].map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                ) : (
                  <p className="font-medium text-slate-700">
                    {Number(r.recipeQty || 0).toFixed(2)}{r.recipeUnit}
                  </p>
                )}
              </div>
              <div>
                <p className="text-slate-400 mb-0.5">Rate</p>
                <p className="font-medium text-slate-700">
                  {r.rate ? `${fmt(r.rate)}/${r.rateUnit || ''}` : '—'}
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
          <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 ring-1 ring-emerald-200 p-3 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
              Total Ingredients
            </span>
            <span className="text-base font-extrabold text-emerald-700">{fmt(total)}</span>
          </div>
        )}
      </div>
    </SectionShell>
  );
};

export default IngredientsTable;