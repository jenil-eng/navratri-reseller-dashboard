import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useToast } from '../components/Toast';
import { formatRupee, getTodayInputDate } from '../utils/formatters';
import { X, Save, Calculator, Loader2, Plus, Sparkles, PlusCircle } from 'lucide-react';

export default function QuickAddSaleModal({ dropdownLists, onSaleAdded, onClose }) {
  const { showSuccess, showError } = useToast();

  const [lists, setLists] = useState(dropdownLists || {});
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

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Inline Quick Add Pass Name state
  const [showInlinePassAdd, setShowInlinePassAdd] = useState(false);
  const [newPassNameInput, setNewPassNameInput] = useState('');
  const [addingNewPass, setAddingNewPass] = useState(false);

  useEffect(() => {
    if (dropdownLists) {
      setLists(dropdownLists);
      setFormData(prev => ({
        ...prev,
        passName: prev.passName || dropdownLists.passNames?.[0] || '',
        passCategory: prev.passCategory || dropdownLists.passCategories?.[0] || 'General',
        passGiven: prev.passGiven || dropdownLists.passGivenStatus?.[0] || 'No',
        passDeliveryMethod: prev.passDeliveryMethod || dropdownLists.passDeliveryMethods?.[0] || 'WhatsApp',
        navratriDay: prev.navratriDay || dropdownLists.navratriDays?.[0] || 'Day 1'
      }));
    }
  }, [dropdownLists]);

  // Derived totals
  const qty = Math.max(1, Number(formData.quantity) || 1);
  const buying = Math.max(0, Number(formData.buyingPrice) || 0);
  const selling = Math.max(0, Number(formData.sellingPrice) || 0);

  const totalBuyingCost = qty * buying;
  const totalSellingAmount = qty * selling;
  const profit = totalSellingAmount - totalBuyingCost;

  // Inline Add New Pass Name
  const handleInlineAddPassName = async () => {
    if (!newPassNameInput || !newPassNameInput.trim()) {
      showError('Pass Name cannot be blank.');
      return;
    }
    const cleanName = newPassNameInput.trim();
    const currentArr = lists.passNames || [];
    if (currentArr.includes(cleanName)) {
      showError('This Pass Name already exists.');
      return;
    }

    setAddingNewPass(true);
    try {
      const updatedLists = {
        ...lists,
        passNames: [...currentArr, cleanName]
      };
      const res = await api.put('/lists', updatedLists);
      const savedLists = res.data.data;
      setLists(savedLists);
      setFormData(prev => ({ ...prev, passName: cleanName }));
      showSuccess(`Added "${cleanName}" to pass names list.`);
      setNewPassNameInput('');
      setShowInlinePassAdd(false);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to save new pass name to Google Sheets.');
    } finally {
      setAddingNewPass(false);
    }
  };

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

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        customerName: formData.customerName.trim(),
        mobileNumber: formData.mobileNumber.trim(),
        quantity: qty,
        buyingPrice: buying,
        sellingPrice: selling,
        totalBuyingCost,
        totalSellingAmount,
        profit
      };

      const res = await api.post('/sales', payload);
      showSuccess('Pass Sale recorded & synced to Google Sheets!');
      if (onSaleAdded) onSaleAdded(res.data.data);
      onClose();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to record sale.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all my-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-600 via-brand-700 to-indigo-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <div>
              <h3 className="font-bold text-base text-white">Quick Add Pass Sale</h3>
              <p className="text-[11px] text-brand-100">Record a new ticket sale directly into Google Sheets</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {/* Customer Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className={`w-full px-3.5 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 transition ${
                  errors.customerName ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-200 focus:ring-brand-500'
                }`}
                placeholder="e.g. Rahul Patel"
                autoFocus
              />
              {errors.customerName && <p className="text-[11px] text-rose-500 mt-1">{errors.customerName}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Mobile Number *
              </label>
              <input
                type="text"
                value={formData.mobileNumber}
                onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                className={`w-full px-3.5 py-2 rounded-xl border text-xs font-mono focus:outline-none focus:ring-2 transition ${
                  errors.mobileNumber ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-200 focus:ring-brand-500'
                }`}
                placeholder="e.g. 9876543210"
              />
              {errors.mobileNumber && <p className="text-[11px] text-rose-500 mt-1">{errors.mobileNumber}</p>}
            </div>
          </div>

          {/* Pass Name & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Pass Name *
                </label>
                <button
                  type="button"
                  onClick={() => setShowInlinePassAdd(!showInlinePassAdd)}
                  className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                >
                  <PlusCircle className="w-3 h-3" />
                  {showInlinePassAdd ? 'Select Existing' : '+ New Pass Name'}
                </button>
              </div>

              {showInlinePassAdd ? (
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={newPassNameInput}
                    onChange={(e) => setNewPassNameInput(e.target.value)}
                    placeholder="Enter new pass event name..."
                    className="flex-1 px-3 py-1.5 rounded-xl border border-brand-300 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={addingNewPass}
                    onClick={handleInlineAddPassName}
                    className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition disabled:opacity-50"
                  >
                    {addingNewPass ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                  </button>
                </div>
              ) : (
                <select
                  value={formData.passName}
                  onChange={(e) => setFormData({ ...formData, passName: e.target.value })}
                  className={`w-full px-3.5 py-2 rounded-xl border text-xs bg-white focus:outline-none focus:ring-2 transition ${
                    errors.passName ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-200 focus:ring-brand-500'
                  }`}
                >
                  <option value="">Select Pass Name</option>
                  {lists.passNames?.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              )}
              {errors.passName && <p className="text-[11px] text-rose-500 mt-1">{errors.passName}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Pass Category *
              </label>
              <select
                value={formData.passCategory}
                onChange={(e) => setFormData({ ...formData, passCategory: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              >
                {lists.passCategories?.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Quantity, Buying & Selling Price */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Quantity *
              </label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Buying Price / Pass (₹) *
              </label>
              <input
                type="number"
                min="0"
                value={formData.buyingPrice}
                onChange={(e) => setFormData({ ...formData, buyingPrice: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Selling Price / Pass (₹) *
              </label>
              <input
                type="number"
                min="0"
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              />
            </div>
          </div>

          {/* Live Calculations Bar */}
          <div className="bg-slate-900 text-white p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-brand-400" />
              <span className="text-xs font-semibold text-slate-300">Live Calculation:</span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div>
                <span className="text-slate-400">Total Cost: </span>
                <span className="font-bold text-slate-200">{formatRupee(totalBuyingCost)}</span>
              </div>
              <div>
                <span className="text-slate-400">Revenue: </span>
                <span className="font-bold text-amber-400">{formatRupee(totalSellingAmount)}</span>
              </div>
              <div className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${profit >= 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'}`}>
                Profit: {formatRupee(profit)}
              </div>
            </div>
          </div>

          {/* Status & Delivery Method */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Pass Given?
              </label>
              <select
                value={formData.passGiven}
                onChange={(e) => setFormData({ ...formData, passGiven: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              >
                {lists.passGivenStatus?.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Delivery Method
              </label>
              <select
                value={formData.passDeliveryMethod}
                onChange={(e) => setFormData({ ...formData, passDeliveryMethod: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              >
                {lists.passDeliveryMethods?.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Navratri Day */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Date Sold *
              </label>
              <input
                type="date"
                value={formData.dateSold}
                onChange={(e) => setFormData({ ...formData, dateSold: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Navratri Day *
              </label>
              <select
                value={formData.navratriDay}
                onChange={(e) => setFormData({ ...formData, navratriDay: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              >
                {lists.navratriDays?.map((day) => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-600/20 transition disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Recording Sale...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save & Sync to Google Sheets
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
