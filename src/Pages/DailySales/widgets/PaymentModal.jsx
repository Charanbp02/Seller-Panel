// Pages/DailySales/widgets/PaymentModal.jsx
import React from 'react';
import { X, IndianRupee } from 'lucide-react';
import { fmt } from '../utils/salesHelpers';

const PaymentModal = ({ sale, paymentForm, setPaymentForm, saving, onClose, onSubmit }) => {
  if (!sale || !paymentForm) return null;
  const invalidDate = paymentForm.date < sale.date;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-emerald-600" /> Add Payment
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm space-y-1">
          <div className="flex justify-between"><span className="text-gray-500">Invoice</span><span className="font-medium">{sale.invoiceNumber}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Customer</span><span className="font-medium">{sale.customerName}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Sale Total</span><span className="font-medium">{fmt(sale.grandTotal)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Remaining</span><span className="font-medium text-red-600">{fmt(sale._balance)}</span></div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount *</label>
            <input type="number" value={paymentForm.amount}
              onChange={e => setPaymentForm(f => ({ ...f, amount: e.target.value }))}
              placeholder="0.00" step="0.01"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Date *</label>
            <input type="date" value={paymentForm.date}
              onChange={e => setPaymentForm(f => ({ ...f, date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
            {invalidDate && (
              <p className="text-xs text-red-600 mt-1">⚠ Cannot be before sale date ({sale.date})</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mode</label>
            <select value={paymentForm.mode}
              onChange={e => setPaymentForm(f => ({ ...f, mode: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg">
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="bank">Bank Transfer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
            <input type="text" value={paymentForm.notes}
              onChange={e => setPaymentForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg text-sm">Cancel</button>
          <button onClick={onSubmit} disabled={saving}
            className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {saving ? 'Saving...' : 'Record Payment'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;