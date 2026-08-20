import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useToast } from '../components/Toast';
import { Settings, Plus, Edit, Trash2, Save, X, RefreshCw, FileSpreadsheet, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const [lists, setLists] = useState({
    passNames: [],
    passCategories: [],
    passGivenStatus: [],
    passDeliveryMethods: [],
    navratriDays: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New item input state per section
  const [newPassName, setNewPassName] = useState('');
  const [newPassCategory, setNewPassCategory] = useState('');
  const [newPassGivenStatus, setNewPassGivenStatus] = useState('');
  const [newDeliveryMethod, setNewDeliveryMethod] = useState('');
  const [newNavratriDay, setNewNavratriDay] = useState('');

  // Editing inline state
  const [editingItem, setEditingItem] = useState(null); // { sectionKey, index, value }

  const { showSuccess, showError } = useToast();

  const fetchLists = async () => {
    try {
      const res = await api.get('/lists');
      setLists(res.data.data || {});
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to fetch dropdown options from Google Sheets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, []);

  const saveListsToBackend = async (updatedLists) => {
    setSaving(true);
    try {
      const res = await api.put('/lists', updatedLists);
      setLists(res.data.data);
      showSuccess('Google Sheets LISTS sheet updated successfully.');
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update LISTS sheet.');
    } finally {
      setSaving(false);
      setEditingItem(null);
    }
  };

  // Generic Add Item
  const handleAddItem = (sectionKey, itemValue, clearFn) => {
    if (!itemValue || !itemValue.trim()) {
      showError('Option value cannot be blank.');
      return;
    }
    const clean = itemValue.trim();
    const currentArr = lists[sectionKey] || [];
    if (currentArr.includes(clean)) {
      showError('This option already exists.');
      return;
    }
    const updated = {
      ...lists,
      [sectionKey]: [...currentArr, clean]
    };
    saveListsToBackend(updated);
    clearFn('');
  };

  // Generic Delete Item
  const handleDeleteItem = (sectionKey, index) => {
    const currentArr = lists[sectionKey] || [];
    const updatedArr = currentArr.filter((_, idx) => idx !== index);
    const updated = {
      ...lists,
      [sectionKey]: updatedArr
    };
    saveListsToBackend(updated);
  };

  // Generic Edit Item Save
  const handleSaveEdit = () => {
    if (!editingItem || !editingItem.value.trim()) {
      showError('Option value cannot be blank.');
      return;
    }
    const { sectionKey, index, value } = editingItem;
    const currentArr = [...(lists[sectionKey] || [])];
    currentArr[index] = value.trim();

    const updated = {
      ...lists,
      [sectionKey]: currentArr
    };
    saveListsToBackend(updated);
  };

  if (loading) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-xs text-center space-y-3">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto" />
        <p className="text-sm text-slate-500 font-medium">Fetching dynamic dropdown lists from Google Sheets...</p>
      </div>
    );
  }

  const renderSection = (title, description, sectionKey, newValue, setNewValue, placeholder) => {
    const items = lists[sectionKey] || [];

    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">{title}</h3>
            <p className="text-xs text-slate-400">{description}</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {items.length} items
          </span>
        </div>

        {/* Add Input Bar */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder={placeholder}
            className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition"
          />
          <button
            type="button"
            disabled={saving}
            onClick={() => handleAddItem(sectionKey, newValue, setNewValue)}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>

        {/* List Items */}
        <div className="space-y-1.5 pt-2 max-h-56 overflow-y-auto pr-1">
          {items.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">No options added yet.</p>
          ) : (
            items.map((item, idx) => {
              const isEditingThis = editingItem?.sectionKey === sectionKey && editingItem?.index === idx;

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs hover:border-slate-200 transition"
                >
                  {isEditingThis ? (
                    <div className="flex items-center gap-2 flex-1 mr-2">
                      <input
                        type="text"
                        value={editingItem.value}
                        onChange={(e) => setEditingItem({ ...editingItem, value: e.target.value })}
                        className="flex-1 px-2 py-1 rounded-lg border border-brand-400 text-xs focus:outline-none"
                      />
                      <button
                        onClick={handleSaveEdit}
                        disabled={saving}
                        className="p-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                      >
                        <Save className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingItem(null)}
                        className="p-1 bg-slate-300 text-slate-700 rounded-md hover:bg-slate-400"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="font-semibold text-slate-800">{item}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingItem({ sectionKey, index: idx, value: item })}
                          title="Edit"
                          className="p-1 text-slate-400 hover:text-amber-600 rounded-md hover:bg-amber-50"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(sectionKey, idx)}
                          title="Delete"
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Title & Sync Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Dropdown Settings & LISTS Sheet</h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage dropdown selections. Changes automatically update the Google Sheets LISTS tab.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3.5 py-2 rounded-xl border border-emerald-200 text-xs font-semibold">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>LISTS Sheet Auto-Sync Active</span>
        </div>
      </div>

      {/* Grid of 5 Dropdown Management Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {renderSection(
          'Pass Names',
          'Dynamically loaded pass event names',
          'passNames',
          newPassName,
          setNewPassName,
          'e.g. Garba Night Pass'
        )}

        {renderSection(
          'Pass Categories',
          'Ticket pricing tiers and access types',
          'passCategories',
          newPassCategory,
          setNewPassCategory,
          'e.g. VIP, General, Couple'
        )}

        {renderSection(
          'Pass Given Status',
          'Customer fulfillment and delivery status',
          'passGivenStatus',
          newPassGivenStatus,
          setNewPassGivenStatus,
          'e.g. Yes, No, Partially'
        )}

        {renderSection(
          'Delivery Methods',
          'How tickets/QR codes are sent',
          'passDeliveryMethods',
          newDeliveryMethod,
          setNewDeliveryMethod,
          'e.g. WhatsApp, Physical'
        )}

        {renderSection(
          'Navratri Days',
          'Day 1 through Day 9 event schedule',
          'navratriDays',
          newNavratriDay,
          setNewNavratriDay,
          'e.g. Day 1, Special Night'
        )}
      </div>
    </div>
  );
}
