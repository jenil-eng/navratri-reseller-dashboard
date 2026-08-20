import React from 'react';
import { X, User, Phone, Ticket, Tag, Hash, Calendar, Clock, Truck, CheckCircle2, FileText, IndianRupee, ShieldCheck } from 'lucide-react';
import { formatRupee, formatDateDisplay, getPassGivenBadgeProps, getProfitBadgeProps } from '../utils/formatters';

export default function SaleViewModal({ sale, onClose }) {
  if (!sale) return null;

  const passBadge = getPassGivenBadgeProps(sale.passGiven);
  const profitBadge = getProfitBadgeProps(sale.profit);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600/30 border border-brand-500/30 flex items-center justify-center text-brand-400">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Sale Detail Overview</h3>
              <p className="text-xs text-slate-400">Google Sheet Record Row #{sale.rowIndex || 'Synced'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Top Key Info Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Customer</span>
              <p className="font-bold text-slate-800 text-base flex items-center gap-2">
                <User className="w-4 h-4 text-brand-600" />
                {sale.customerName}
              </p>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 font-mono">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {sale.mobileNumber}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Pass & Category</span>
              <p className="font-bold text-slate-800 text-sm truncate flex items-center gap-1.5">
                <Ticket className="w-4 h-4 text-amber-500 shrink-0" />
                {sale.passName}
              </p>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                {sale.passCategory}
              </span>
            </div>
          </div>

          {/* Pricing & Profit Grid */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
              <div>
                <span className="text-xs text-slate-400 block">Quantity Sold</span>
                <span className="text-lg font-bold text-slate-100">{sale.quantity} pass(es)</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Buying Price / Pass</span>
                <span className="text-sm font-semibold text-slate-300">{formatRupee(sale.buyingPrice)}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Selling Price / Pass</span>
                <span className="text-sm font-semibold text-amber-400">{formatRupee(sale.sellingPrice)}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <span className="text-[11px] text-slate-400 block mb-1">Total Cost</span>
                <span className="text-sm font-bold text-slate-300">{formatRupee(sale.totalBuyingCost)}</span>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <span className="text-[11px] text-slate-400 block mb-1">Total Revenue</span>
                <span className="text-sm font-bold text-amber-400">{formatRupee(sale.totalSellingAmount)}</span>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <span className="text-[11px] text-slate-400 block mb-1">Net Profit</span>
                <span className={`text-sm font-bold ${sale.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatRupee(sale.profit)}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery & Event Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Pass Delivery Status</span>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">Pass Given:</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${passBadge.className}`}>
                  {passBadge.label}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Method:</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-brand-600" />
                  {sale.passDeliveryMethod || 'N/A'}
                </span>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Event Schedule</span>
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Date Sold:</span>
                <span className="font-mono font-semibold text-slate-800 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {formatDateDisplay(sale.dateSold)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Navratri Day:</span>
                <span className="font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                  {sale.navratriDay}
                </span>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          {sale.notes && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                Notes
              </span>
              <p className="text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">{sale.notes}</p>
            </div>
          )}
        </div>

        {/* Footer Action */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-semibold transition"
          >
            Close View
          </button>
        </div>
      </div>
    </div>
  );
}
