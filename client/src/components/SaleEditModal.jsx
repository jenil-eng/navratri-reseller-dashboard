import React, { useState, useEffect } from 'react';
import { X, Save, Calculator, Loader2 } from 'lucide-react';
import { formatRupee, getProfitBadgeProps } from '../utils/formatters';

export default function SaleEditModal({ sale, dropdownLists, onSave, onClose }) {
  const [formData, setFormData] = useState({
    customerName: '',
    mobileNumber: '',
    passName: '',
    passCategory: 'General',
    quantity: 1,
    buyingPrice: 0,
    sellingPrice: 0,
    passGiven: 'No',
    passDeliveryMethod: 'WhatsApp',
    dateSold: '',
    navratriDay: 'Day 1',
    notes: ''
  });

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (sale) {
      setFormData({
        customerName: sale.customerName || '',
        mobileNumber: sale.mobileNumber || '',
        passName: sale.passName || '',
        passCategory: sale.passCategory || dropdownLists?.passCategories?.[0] || 'General',
        quantity: sale.quantity || 1,
        buyingPrice: sale.buyingPrice || 0,
        sellingPrice: sale.sellingPrice || 0,
        passGiven: sale.passGiven || dropdownLists?.passGivenStatus?.[0] || 'No',
        passDeliveryMethod: sale.passDeliveryMethod || dropdownLists?.passDeliveryMethods?.[0] || 'WhatsApp',
        dateSold: sale.dateSold || '',
        navratriDay: sale.navratriDay || dropdownLists?.navratriDays?.[0] || 'Day 1',
        notes: sale.notes || ''
      });
    }
  }, [sale, dropdownLists]);

  if (!sale) return null;

  // Auto-calculated derived values
  const qty = Math.max(1, Number(formData.quantity) || 1);
  const buying = Math.max(0, Number(formData.buyingPrice) || 0);
  const selling = Math.max(0, Number(formData.sellingPrice) || 0);
  
  const totalBuyingCost = qty * buying;
  const totalSellingAmount = qty * selling;
  const profit = totalSellingAmount - totalBuyingCost;

  const profitBadge = getProfitBadgeProps(profit);

  const validate = () => {
    const errs = {};
    if (!formData.customerName.trim()) errs.customerName = 'Customer Name is required';
    if (!formData.mobileNumber.trim()) {
      errs.mobileNumber = 'Mobile Number is required';
    } else if (!/^(?:\+91|91)?[6-9]\d{9}$/.test(formData.mobileNumber.trim())) {
      errs.mobileNumber = 'Invalid 10-digit Indian Mobile Number';
    }
    if (!formData.passName.trim()) errs.passName = 'Pass Name is required';
    if (!formData.passCategory.trim()) errs.passCategory = 'Pass Category is required';
    if (qty < 1) errs.quantity = 'Quantity must be at least 1';
    if (formData.buyingPrice < 0) errs.buyingPrice = 'Buying Price cannot be negative';
    if (formData.sellingPrice < 0) errs.sellingPrice = 'Selling Price cannot be negative';
    if (!formData.dateSold) errs.dateSold = 'Date Sold is required';
    if (!formData.navratriDay.trim()) errs.navratriDay = 'Navratri Day is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        ...formData,
        quantity: qty,
        buyingPrice: buying,
        sellingPrice: selling,
        totalBuyingCost,
        totalSellingAmount,
        profit
      };
      await onSave(sale.id || sale.rowIndex, payload);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all my-8">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg text-white">Edit Sale Record</h3>
            <p className="text-xs text-slate-400">Google Sheet Row #{sale.rowIndex || 'Synced'}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Section 1: Customer Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                1. Customer Name *
              </label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 transition ${
                  errors.customerName ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-200 focus:ring-brand-500'
                }`}
                placeholder="e.g. Rahul Patel"
              />
              {errors.customerName && <p className="text-xs text-rose-500 mt-1">{errors.customerName}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                2. Mobile Number *
              </label>
              <input
                type="text"
                value={formData.mobileNumber}
                onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                className={`w-full px-3.5 py-2 rounded-xl border text-sm font-mono focus:outline-none focus:ring-2 transition ${
                  errors.mobileNumber ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-200 focus:ring-brand-500'
                }`}
                placeholder="e.g. 9876543210"
              />
              {errors.mobileNumber && <p className="text-xs text-rose-500 mt-1">{errors.mobileNumber}</p>}
            </div>
          </div>

          {/* Section 2: Pass Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                3. Pass Name *
              </label>
              <select
                value={formData.passName}
                onChange={(e) => setFormData({ ...formData, passName: e.target.value })}
                className={`w-full px-3.5 py-2 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 transition ${
                  errors.passName ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-200 focus:ring-brand-500'
                }`}
              >
                <option value="">Select Pass Name</option>
                {dropdownLists?.passNames?.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              {errors.passName && <p className="text-xs text-rose-500 mt-1">{errors.passName}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                4. Pass Category *
              </label>
              <select
                value={formData.passCategory}
                onChange={(e) => setFormData({ ...formData, passCategory: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              >
                {dropdownLists?.passCategories?.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 3: Quantity & Prices */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                5. Quantity *
              </label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              />
              {errors.quantity && <p className="text-xs text-rose-500 mt-1">{errors.quantity}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                6. Buying Price / Pass (₹) *
              </label>
              <input
                type="number"
                min="0"
                value={formData.buyingPrice}
                onChange={(e) => setFormData({ ...formData, buyingPrice: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                7. Selling Price / Pass (₹) *
              </label>
              <input
                type="number"
                min="0"
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              />
            </div>
          </div>

          {/* Derived Totals Summary Bar */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-brand-400" />
              <span className="text-xs font-semibold text-slate-300">Live Auto-Calculations:</span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div>
                <span className="text-slate-400">Total Cost: </span>
                <span className="font-bold text-slate-200">{formatRupee(totalBuyingCost)}</span>
              </div>
              <div>
                <span className="text-slate-400">Total Revenue: </span>
                <span className="font-bold text-amber-400">{formatRupee(totalSellingAmount)}</span>
              </div>
              <div className={`px-2.5 py-1 rounded-lg text-xs font-bold ${profit >= 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'}`}>
                Profit: {formatRupee(profit)}
              </div>
            </div>
          </div>

          {/* Section 4: Pass Given & Delivery */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                11. Pass Given?
              </label>
              <select
                value={formData.passGiven}
                onChange={(e) => setFormData({ ...formData, passGiven: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              >
                {dropdownLists?.passGivenStatus?.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                12. Delivery Method
              </label>
              <select
                value={formData.passDeliveryMethod}
                onChange={(e) => setFormData({ ...formData, passDeliveryMethod: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              >
                {dropdownLists?.passDeliveryMethods?.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 5: Date Sold & Navratri Day */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                13. Date Sold *
              </label>
              <input
                type="date"
                value={formData.dateSold}
                onChange={(e) => setFormData({ ...formData, dateSold: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              />
              {errors.dateSold && <p className="text-xs text-rose-500 mt-1">{errors.dateSold}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                14. Navratri Day *
              </label>
              <select
                value={formData.navratriDay}
                onChange={(e) => setFormData({ ...formData, navratriDay: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              >
                {dropdownLists?.navratriDays?.map((day) => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 6: Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              15. Notes
            </label>
            <textarea
              rows="2"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              placeholder="Optional notes or remarks..."
            ></textarea>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-600/20 transition disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving to Google Sheets...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
