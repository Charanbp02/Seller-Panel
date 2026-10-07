// Pages/DailySales/widgets/DeleteConfirmModal.jsx
import React from 'react';
import { AlertTriangle } from 'lucide-react';

const DeleteConfirmModal = ({ open, saving, onCancel, onConfirm }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">Delete Sale</h3>
        <p className="text-gray-500 mb-6">
          This will reverse stock, all payments, customer ledger, and cashbook entries. Continue?
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2 border rounded-lg">Cancel</button>
          <button onClick={onConfirm} disabled={saving}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg disabled:opacity-50">
            {saving ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;