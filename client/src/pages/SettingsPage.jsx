import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useToast } from '../components/Toast';
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  RefreshCw,
  FileSpreadsheet,
  Loader2,
  GripVertical,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

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

  // Drag & Drop State
  const [draggedItem, setDraggedItem] = useState(null); // { sectionKey, index }
  const [dragOverIndex, setDragOverIndex] = useState(null);

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

  // Add item to bottom of list (under present names)
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
    // Append to bottom of list under present names
    const updated = {
      ...lists,
      [sectionKey]: [...currentArr, clean]
    };
    saveListsToBackend(updated);
    clearFn('');
  };

  // Delete Item
  const handleDeleteItem = (sectionKey, index) => {
    const currentArr = lists[sectionKey] || [];
    const updatedArr = currentArr.filter((_, idx) => idx !== index);
    const updated = {
      ...lists,
      [sectionKey]: updatedArr
    };
    saveListsToBackend(updated);
  };

  // Edit Item Save
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

  // Move Up / Move Down Handler
  const handleMoveItem = (sectionKey, index, direction) => {
    const currentArr = [...(lists[sectionKey] || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= currentArr.length) return;

    const temp = currentArr[index];
    currentArr[index] = currentArr[targetIndex];
    currentArr[targetIndex] = temp;

    const updated = {
      ...lists,
      [sectionKey]: currentArr
    };
    setLists(updated);
    saveListsToBackend(updated);
  };

  // Drag and Drop Handlers
  const handleDragStart = (e, sectionKey, index) => {
    setDraggedItem({ sectionKey, index });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, sectionKey, index) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.sectionKey !== sectionKey) return;
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e, sectionKey, targetIndex) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.sectionKey !== sectionKey) return;
    const fromIndex = draggedItem.index;
    if (fromIndex === targetIndex) return;

    const currentArr = [...(lists[sectionKey] || [])];
    const [moved] = currentArr.splice(fromIndex, 1);
    currentArr.splice(targetIndex, 0, moved);

    const updated = {
      ...lists,
      [sectionKey]: currentArr
    };
    setLists(updated);
    saveListsToBackend(updated);
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
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
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddItem(sectionKey, newValue, setNewValue);
              }
            }}
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

        {/* List Items with Drag & Drop */}
        <div className="space-y-1.5 pt-2 max-h-64 overflow-y-auto pr-1">
          {items.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">No options added yet.</p>
          ) : (
            items.map((item, idx) => {
              const isEditingThis = editingItem?.sectionKey === sectionKey && editingItem?.index === idx;
              const isDragging = draggedItem?.sectionKey === sectionKey && draggedItem?.index === idx;
              const isDragOver = dragOverIndex === idx && draggedItem?.sectionKey === sectionKey;

              return (
                <div
                  key={idx}
                  draggable={!isEditingThis}
                  onDragStart={(e) => handleDragStart(e, sectionKey, idx)}
                  onDragOver={(e) => handleDragOver(e, sectionKey, idx)}
                  onDrop={(e) => handleDrop(e, sectionKey, idx)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition select-none ${
                    isDragging
                      ? 'opacity-40 bg-brand-50 border-brand-300 border-dashed'
                      : isDragOver
                      ? 'border-brand-500 bg-brand-50/50 shadow-sm scale-[1.01]'
                      : 'bg-slate-50 border-slate-100 hover:border-slate-300'
                  }`}
                >
                  {isEditingThis ? (
                    <div className="flex items-center gap-2 flex-1 mr-2">
                      <input
                        type="text"
                        value={editingItem.value}
                        onChange={(e) => setEditingItem({ ...editingItem, value: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') setEditingItem(null);
                        }}
                        className="flex-1 px-2 py-1 rounded-lg border border-brand-400 text-xs focus:outline-none bg-white"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveEdit}
                        disabled={saving}
                        className="p-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                        title="Save changes"
                      >
                        <Save className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingItem(null)}
                        className="p-1 bg-slate-300 text-slate-700 rounded-md hover:bg-slate-400"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                        {/* Drag Handle */}
                        <div
                          className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-600 p-0.5 rounded transition"
                          title="Drag to reorder priority"
                        >
                          <GripVertical className="w-4 h-4" />
                        </div>

                        {/* Move Up/Down Quick Buttons */}
                        <div className="flex flex-col -space-y-1">
                          <button
                            type="button"
                            disabled={idx === 0 || saving}
                            onClick={() => handleMoveItem(sectionKey, idx, 'up')}
                            className="text-slate-300 hover:text-brand-600 disabled:opacity-20 disabled:hover:text-slate-300 transition"
                            title="Move Up (Higher Priority)"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === items.length - 1 || saving}
                            onClick={() => handleMoveItem(sectionKey, idx, 'down')}
                            className="text-slate-300 hover:text-brand-600 disabled:opacity-20 disabled:hover:text-slate-300 transition"
                            title="Move Down (Lower Priority)"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Priority Badge & Title */}
                        <span className="font-medium text-[10px] text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded-md">
                          #{idx + 1}
                        </span>
                        <span className="font-semibold text-slate-800 truncate">{item}</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setEditingItem({ sectionKey, index: idx, value: item })}
                          title="Edit option"
                          className="p-1 text-slate-400 hover:text-amber-600 rounded-md hover:bg-amber-50 transition"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(sectionKey, idx)}
                          title="Delete option"
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition"
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
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Dropdown Settings & Priority Reordering</h2>
          <p className="text-xs text-slate-500 mt-1">
            Drag items or use the up/down arrows to reorder priority. Top items appear first in all sales dropdowns.
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
