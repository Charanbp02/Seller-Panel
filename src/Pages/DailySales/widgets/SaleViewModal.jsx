// Pages/DailySales/widgets/SaleViewModal.jsx
import React from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { fmt, sumPayments, computeStatus } from '../utils/salesHelpers';
import StatusBadge from './StatusBadge';

const SaleViewModal = ({ sale, payments, onClose, onEdit, onDelete, onAddPayment, onDeletePayment }) => {
  if (!sale) return null;
  const paid = sumPayments(payments);
  const balance = Math.max(0, (Number(sale.grandTotal) || 0) - paid);
  const status = computeStatus(Number(sale.grandTotal) || 0, paid);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{sale.invoiceNumber}</h3>
            <span className="text-xs text-gray-500">Sale: {sale.date}</span>
            <span className="text-xs text-gray-500 ml-2">• {payments.length} payment(s)</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Customer</p>
              <p className="font-medium text-gray-900">{sale.customerName}</p>
              <p className="text-xs text-gray-400 capitalize">{sale.customerType}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Contact</p>
              <p className="text-sm text-gray-700">{sale.customerPhone || '—'}</p>
              <p className="text-xs text-gray-500">{sale.customerAddress || '—'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Sale Date</p>
              <p className="text-sm text-gray-700">{sale.date}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Status</p>
              <div className="mt-1"><StatusBadge status={status} /></div>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Products</p>
            <div className="space-y-2">
              {sale.products?.map((p, i) => (
                <div key={i} className="flex justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <div>
                    <span className="font-medium text-gray-900">{p.name}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      {p.quantity} {p.unit} × ₹{p.rate}{p.discount > 0 ? ` − ${p.discount}%` : ''}
                    </span>
                  </div>
                  <span className="font-semibold">{fmt(p.total)}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Payments</p>
              {balance > 0 && (
                <button onClick={onAddPayment}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Add Payment
                </button>
              )}
            </div>
            {payments.length === 0 ? (
              <p className="text-sm text-gray-400 italic bg-gray-50 rounded-lg px-3 py-3">No payments recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {payments.slice().sort((a, b) => (a.date || '').localeCompare(b.date || '')).map(p => (
                  <div key={p.id} className="flex items-center justify-between bg-emerald-50 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-emerald-900">{fmt(p.amount)}</p>
                      <p className="text-xs text-emerald-700">{p.date} • {p.mode}{p.notes ? ` • ${p.notes}` : ''}</p>
                    </div>
                    <button onClick={() => onDeletePayment(p)}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-red-500" title="Delete payment">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t pt-4 space-y-1">
            {[
              ['Subtotal', fmt(sale.subtotal), ''],
              ['Discount', `−${fmt(sale.totalDiscount)}`, 'text-red-600'],
              ['Received', fmt(paid), 'text-green-600'],
              ['Balance', fmt(balance), balance > 0 ? 'text-red-600 font-medium' : 'text-green-600 font-medium']
            ].map(([label, value, cls]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-500">{label}</span>
                <span className={cls}>{value}</span>
              </div>
            ))}
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Grand Total</span>
              <span className="text-orange-600">{fmt(sale.grandTotal)}</span>
            </div>
            {sale.notes && (
              <div className="pt-3 border-t mt-2">
                <p className="text-xs text-gray-500">Notes</p>
                <p className="text-sm text-gray-700">{sale.notes}</p>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={onEdit}
              className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium">Edit Sale</button>
            <button onClick={onDelete}
              className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium">Delete Sale</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaleViewModal;