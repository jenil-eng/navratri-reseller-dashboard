import React, { useState, useEffect, useRef } from 'react';
import { formatRupee } from '../utils/formatters';
import {
  CheckCircle2,
  X,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Truck,
  MessageCircle,
  Ticket,
  FileText,
  Sparkles
} from 'lucide-react';

export default function HandoverPassModal({
  sale,
  deliveryMethods = ['WhatsApp', 'Physical', 'QR Code', 'Email', 'Other'],
  isOpen,
  onClose,
  onConfirm
}) {
  if (!isOpen || !sale) return null;

  const inputRef = useRef(null);

  // Initialize state from sale
  const [buyingPrice, setBuyingPrice] = useState(
    sale.buyingPrice && Number(sale.buyingPrice) > 0 ? String(sale.buyingPrice) : ''
  );
  const [deliveryMethod, setDeliveryMethod] = useState(sale.passDeliveryMethod || 'Other');
  const [notes, setNotes] = useState(sale.notes || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Auto-focus input on open
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const qty = Math.max(1, Number(sale.quantity) || 1);
  const buyNum = buyingPrice === '' ? 0 : Math.max(0, Number(buyingPrice) || 0);
  const sellNum = Math.max(0, Number(sale.sellingPrice) || 0);

  const totalBuyingCost = qty * buyNum;
  const totalSellingAmount = Number(sale.totalSellingAmount) || (qty * sellNum);
  const profit = totalSellingAmount - totalBuyingCost;
  const profitMargin = totalSellingAmount > 0 ? Math.round((profit / totalSellingAmount) * 100) : 0;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (buyingPrice !== '' && (isNaN(Number(buyingPrice)) || Number(buyingPrice) < 0)) {
      setError('Please enter a valid buying price (0 or higher).');
      return;
    }

    setSubmitting(true);
    try {
      await onConfirm({
        passGiven: 'Yes',
        buyingPrice: buyNum,
        passDeliveryMethod: deliveryMethod,
        notes: notes.trim()
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update pass.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 flex items-start justify-between relative">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                <CheckCircle2 className="w-5 h-5" />
              </span>
              <h2 className="text-base font-bold text-white">Hand Over Pass & Enter Cost</h2>
            </div>
            <p className="text-xs text-slate-400 pl-10">
              Customer: <strong className="text-slate-200">{sale.customerName}</strong> ({sale.mobileNumber})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Ticket Information Pill */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-brand-600" />
                <span className="font-bold text-xs text-slate-900">{sale.passName}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 text-brand-700 border border-brand-200">
                {sale.navratriDay}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-200/60">
              <div>
                Quantity: <strong className="text-slate-900 font-extrabold">{qty} Passes</strong>
              </div>
              <div>
                Selling Price: <strong className="text-slate-900 font-mono font-bold">{formatRupee(sale.sellingPrice)}</strong> / pass
              </div>
              <div className="text-right">
                Revenue: <strong className="text-amber-700 font-mono font-bold">{formatRupee(totalSellingAmount)}</strong>
              </div>
            </div>
          </div>

          {/* Buying Price Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span>Buying Price / Pass</span>
                {(!sale.buyingPrice || Number(sale.buyingPrice) === 0) && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold border border-amber-200">
                    Cost was ₹0 / Not set
                  </span>
                )}
              </label>
              <span className="text-[11px] text-slate-400">Total Qty: {qty}</span>
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">
                ₹
              </span>
              <input
                ref={inputRef}
                type="number"
                min="0"
                step="any"
                value={buyingPrice}
                onChange={(e) => {
                  setBuyingPrice(e.target.value);
                  setError('');
                }}
                placeholder="Enter buying cost per pass (e.g. 700)"
                className="w-full pl-8 pr-4 py-3 rounded-2xl border-2 border-brand-500/40 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 text-lg font-bold font-mono text-slate-900 outline-none transition placeholder:text-slate-300"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Enter the actual amount you paid to purchase this pass. Profit will be recalculated instantly.
            </p>
          </div>

          {/* Dynamic Live Cost & Profit Breakdown Card */}
          <div className={`p-4 rounded-2xl border transition-all ${
            profit >= 0 ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50/70 border-rose-200'
          }`}>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Cost</p>
                <p className="text-sm font-bold font-mono text-slate-700 mt-0.5">
                  {formatRupee(totalBuyingCost)}
                </p>
                <p className="text-[10px] text-slate-400">({qty} × ₹{buyNum})</p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Revenue</p>
                <p className="text-sm font-bold font-mono text-amber-700 mt-0.5">
                  {formatRupee(totalSellingAmount)}
                </p>
                <p className="text-[10px] text-slate-400">({qty} × ₹{sellNum})</p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Net Profit</p>
                <p className={`text-base font-extrabold font-mono mt-0.5 ${
                  profit >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}>
                  {formatRupee(profit)}
                </p>
                <p className={`text-[10px] font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {profit >= 0 ? `+${profitMargin}% Margin` : 'Loss'}
                </p>
              </div>
            </div>
          </div>

          {/* Delivery Method Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-slate-500" />
              <span>Pass Delivery Method</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {deliveryMethods.map((method) => (
                <button
                  type="button"
                  key={method}
                  onClick={() => setDeliveryMethod(method)}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold border transition text-center truncate ${
                    deliveryMethod === method
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Handover Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Handover Notes (Optional)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Handed physical passes at Gate 2, cash collected"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/25 flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Saving...' : 'Confirm & Mark as Given'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
