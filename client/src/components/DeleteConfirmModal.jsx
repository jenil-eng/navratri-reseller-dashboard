import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';

export default function DeleteConfirmModal({ sale, onConfirm, onClose }) {
  const [deleting, setDeleting] = useState(false);

  if (!sale) return null;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onConfirm(sale);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Confirm Delete</h3>
              <p className="text-xs text-slate-500">Google Sheet Record Deletion</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={deleting}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-5 space-y-3">
          <p className="text-sm text-slate-600 leading-relaxed">
            Are you sure you want to delete this sale? This action cannot be undone.
          </p>
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">Customer:</span>
              <span className="font-bold text-slate-800">{sale.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">Pass Name:</span>
              <span className="font-semibold text-slate-700">{sale.passName} ({sale.quantity}x)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">Selling Amount:</span>
              <span className="font-bold text-emerald-600">₹{sale.totalSellingAmount}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20 transition disabled:opacity-50"
          >
            {deleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete Sale
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
