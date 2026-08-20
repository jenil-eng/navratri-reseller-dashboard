import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useToast } from '../components/Toast';
import { formatRupee, getTodayInputDate } from '../utils/formatters';
import { PlusCircle, Save, RefreshCw, Calculator, Sparkles, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';

export default function AddSalePage() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [dropdowns, setDropdowns] = useState({
    passNames: [],
    passCategories: [],
    passGivenStatus: [],
    passDeliveryMethods: [],
    navratriDays: []
  });
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State matching 15 exact fields
  const [formData, setFormData] = useState({
    customerName: '',
    mobileNumber: '',
    passName: '',
    passCategory: '',
    quantity: 1,
    buyingPrice: 0,
    sellingPrice: 0,
    passGiven: 'No',
    passDeliveryMethod: 'WhatsApp',
    dateSold: getTodayInputDate(),
    navratriDay: 'Day 1',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    async function fetchLists() {
      try {
        const res = await api.get('/lists');
        const lists = res.data.data || {};
        setDropdowns(lists);
        
        // Set default dropdown values
        setFormData(prev => ({
          ...prev,
          passName: lists.passNames?.[0] || '',
          passCategory: lists.passCategories?.[0] || 'General',
          passGiven: lists.passGivenStatus?.[0] || 'No',
          passDeliveryMethod: lists.passDeliveryMethods?.[0] || 'WhatsApp',
          navratriDay: lists.navratriDays?.[0] || 'Day 1'
        }));
      } catch (err) {
        showError('Failed to load dropdown lists from Google Sheets.');
      } finally {
        setLoadingDropdowns(false);
      }
    }
    fetchLists();
  }, []);

  // Derived Calculations
  const qty = Math.max(1, Number(formData.quantity) || 1);
  const buying = Math.max(0, Number(formData.buyingPrice) || 0);
  const selling = Math.max(0, Number(formData.sellingPrice) || 0);

  const totalBuyingCost = qty * buying;
  const totalSellingAmount = qty * selling;
  const profit = totalSellingAmount - totalBuyingCost;

  const validate = () => {
    const errs = {};
    if (!formData.customerName.trim()) errs.customerName = 'Customer Name is required.';
    
    const mobStr = formData.mobileNumber.trim();
    if (!mobStr) {
      errs.mobileNumber = 'Mobile Number is required.';
    } else if (!/^(?:\+91|91)?[6-9]\d{9}$/.test(mobStr)) {
      errs.mobileNumber = 'Please enter a valid 10-digit Indian Mobile Number.';
    }

    if (!formData.passName.trim()) errs.passName = 'Pass Name is required.';
    if (!formData.passCategory.trim()) errs.passCategory = 'Pass Category is required.';
    if (qty < 1) errs.quantity = 'Quantity must be at least 1.';
    if (formData.buyingPrice < 0 || isNaN(formData.buyingPrice)) errs.buyingPrice = 'Buying Price cannot be negative.';
    if (formData.sellingPrice < 0 || isNaN(formData.sellingPrice)) errs.sellingPrice = 'Selling Price cannot be negative.';
    if (!formData.dateSold) errs.dateSold = 'Date Sold is required.';
    if (!formData.navratriDay.trim()) errs.navratriDay = 'Navratri Day is required.';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      showError('Please fix validation errors before submitting.');
      return;
    }

    setSubmitting(true);
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

      const res = await api.post('/sales', payload);
      if (res.data && res.data.success) {
        showSuccess('Sale added successfully.');
        // Reset form
        setFormData({
          customerName: '',
          mobileNumber: '',
          passName: dropdowns.passNames?.[0] || '',
          passCategory: dropdowns.passCategories?.[0] || 'General',
          quantity: 1,
          buyingPrice: 0,
          sellingPrice: 0,
          passGiven: dropdowns.passGivenStatus?.[0] || 'No',
          passDeliveryMethod: dropdowns.passDeliveryMethods?.[0] || 'WhatsApp',
          dateSold: getTodayInputDate(),
          navratriDay: dropdowns.navratriDays?.[0] || 'Day 1',
          notes: ''
        });
        setErrors({});
      } else {
        showError(res.data?.message || 'Unable to save sale. Please try again.');
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Unable to save sale. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingDropdowns) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-xs text-center space-y-3">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto" />
        <p className="text-sm text-slate-500 font-medium">Loading form dropdown options from Google Sheets...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Title & Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Record New Navratri Pass Sale</h2>
          <p className="text-xs text-slate-500 mt-1">
            Fill in the 15 sales fields below to automatically append to Google Sheets.
          </p>
        </div>
        <button
          onClick={() => navigate('/sales')}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Sales History
        </button>
      </div>

      {/* Main Form Box */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden">
        <div className="p-6 md:p-8 space-y-8">
          
          {/* Group 1: Customer Details */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-4 pb-2 border-b border-slate-100">
              Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  1. Customer Name *
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition ${
                    errors.customerName ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-200 focus:ring-brand-500'
                  }`}
                  placeholder="e.g. Rahul Patel"
                />
                {errors.customerName && <p className="text-xs text-rose-500 mt-1">{errors.customerName}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  2. Mobile Number *
                </label>
                <input
                  type="text"
                  value={formData.mobileNumber}
                  onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm font-mono focus:outline-none focus:ring-2 transition ${
                    errors.mobileNumber ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-200 focus:ring-brand-500'
                  }`}
                  placeholder="e.g. 9876543210"
                />
                {errors.mobileNumber && <p className="text-xs text-rose-500 mt-1">{errors.mobileNumber}</p>}
              </div>
            </div>
          </div>

          {/* Group 2: Pass Selection */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-4 pb-2 border-b border-slate-100">
              Pass Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  3. Pass Name *
                </label>
                <select
                  value={formData.passName}
                  onChange={(e) => setFormData({ ...formData, passName: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 transition ${
                    errors.passName ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-200 focus:ring-brand-500'
                  }`}
                >
                  <option value="">Select Pass Name</option>
                  {dropdowns.passNames?.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                {errors.passName && <p className="text-xs text-rose-500 mt-1">{errors.passName}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  4. Pass Category *
                </label>
                <select
                  value={formData.passCategory}
                  onChange={(e) => setFormData({ ...formData, passCategory: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                >
                  {dropdowns.passCategories?.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Group 3: Pricing & Quantity */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-4 pb-2 border-b border-slate-100">
              Quantity & Pricing
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  5. Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                />
                {errors.quantity && <p className="text-xs text-rose-500 mt-1">{errors.quantity}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  6. Buying Price / Pass (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.buyingPrice}
                  onChange={(e) => setFormData({ ...formData, buyingPrice: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                />
                {errors.buyingPrice && <p className="text-xs text-rose-500 mt-1">{errors.buyingPrice}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  7. Selling Price / Pass (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                />
                {errors.sellingPrice && <p className="text-xs text-rose-500 mt-1">{errors.sellingPrice}</p>}
              </div>
            </div>

            {/* Readonly Auto-Calculations (Fields 8, 9, 10) */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-900 text-white p-4 rounded-2xl">
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">8. Total Buying Cost (Read Only)</span>
                <span className="text-sm font-bold text-slate-200">{formatRupee(totalBuyingCost)}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">9. Total Selling Amount (Read Only)</span>
                <span className="text-sm font-bold text-amber-400">{formatRupee(totalSellingAmount)}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">10. Net Profit (Read Only)</span>
                <span className={`text-sm font-bold ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatRupee(profit)}
                </span>
              </div>
            </div>
          </div>

          {/* Form Live Preview Box */}
          <div className="bg-gradient-to-r from-amber-500/10 via-brand-500/10 to-amber-500/10 p-5 rounded-2xl border border-brand-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-brand-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-brand-600" />
                Live Form Summary Preview
              </span>
              <span className="text-[11px] text-slate-500 font-medium">Automatic Calculations</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-center text-xs">
              <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Quantity</span>
                <span className="font-bold text-slate-800 text-sm">{qty}</span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Buying Price</span>
                <span className="font-bold text-slate-800 text-sm">{formatRupee(buying)}</span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Selling Price</span>
                <span className="font-bold text-slate-800 text-sm">{formatRupee(selling)}</span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Total Cost</span>
                <span className="font-bold text-slate-800 text-sm">{formatRupee(totalBuyingCost)}</span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Total Revenue</span>
                <span className="font-bold text-amber-600 text-sm">{formatRupee(totalSellingAmount)}</span>
              </div>
              {/* Profit Visually Prominent */}
              <div className={`p-2.5 rounded-xl border font-bold shadow-xs ${profit >= 0 ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-rose-600 text-white border-rose-500'}`}>
                <span className="block text-[10px] opacity-90">PROFIT</span>
                <span className="text-base font-extrabold">{formatRupee(profit)}</span>
              </div>
            </div>
          </div>

          {/* Group 4: Pass Given & Delivery */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-4 pb-2 border-b border-slate-100">
              Delivery & Fulfillment Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  11. Pass Given?
                </label>
                <select
                  value={formData.passGiven}
                  onChange={(e) => setFormData({ ...formData, passGiven: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                >
                  {dropdowns.passGivenStatus?.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  12. Pass Delivery Method
                </label>
                <select
                  value={formData.passDeliveryMethod}
                  onChange={(e) => setFormData({ ...formData, passDeliveryMethod: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                >
                  {dropdowns.passDeliveryMethods?.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Group 5: Date Sold & Navratri Day */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-4 pb-2 border-b border-slate-100">
              Date & Schedule
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  13. Date Sold *
                </label>
                <input
                  type="date"
                  value={formData.dateSold}
                  onChange={(e) => setFormData({ ...formData, dateSold: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                />
                {errors.dateSold && <p className="text-xs text-rose-500 mt-1">{errors.dateSold}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  14. Navratri Day *
                </label>
                <select
                  value={formData.navratriDay}
                  onChange={(e) => setFormData({ ...formData, navratriDay: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                >
                  {dropdowns.navratriDays?.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Group 6: Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              15. Notes (Optional)
            </label>
            <textarea
              rows="3"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              placeholder="e.g. Paid via PhonePe, promised physical pass handover at venue..."
            ></textarea>
          </div>

        </div>

        {/* Action Footer Bar */}
        <div className="bg-slate-50 px-8 py-5 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setFormData({
              customerName: '',
              mobileNumber: '',
              passName: dropdowns.passNames?.[0] || '',
              passCategory: dropdowns.passCategories?.[0] || 'General',
              quantity: 1,
              buyingPrice: 0,
              sellingPrice: 0,
              passGiven: dropdowns.passGivenStatus?.[0] || 'No',
              passDeliveryMethod: dropdowns.passDeliveryMethods?.[0] || 'WhatsApp',
              dateSold: getTodayInputDate(),
              navratriDay: dropdowns.navratriDays?.[0] || 'Day 1',
              notes: ''
            })}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
          >
            Clear Form
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-brand-600 to-amber-600 text-white font-semibold rounded-xl text-sm shadow-lg shadow-brand-600/30 hover:brightness-110 transition disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Appending to Google Sheets...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Sale
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
