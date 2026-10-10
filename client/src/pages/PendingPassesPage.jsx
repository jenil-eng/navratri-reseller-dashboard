import React, { useState, useEffect, useMemo } from 'react';
import api from '../utils/api';
import { useToast } from '../components/Toast';
import SaleViewModal from '../components/SaleViewModal';
import SaleEditModal from '../components/SaleEditModal';
import { formatRupee, formatDateDisplay, getPassGivenBadgeProps } from '../utils/formatters';
import {
  PackageCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Phone,
  MessageCircle,
  Copy,
  Check,
  X,
  ExternalLink,
  ChevronDown,
  LayoutGrid,
  Table as TableIcon,
  Sparkles,
  Ticket,
  Calendar,
  Send,
  Edit,
  Eye,
  CheckCheck,
  AlertTriangle,
  ArrowRight,
  User,
  Layers,
  ArrowUpDown
} from 'lucide-react';

export default function PendingPassesPage() {
  const [sales, setSales] = useState([]);
  const [lists, setLists] = useState({ passNames: [], passCategories: [], passGivenStatus: ['Yes', 'No', 'Partially'], passDeliveryMethods: [], navratriDays: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // View Mode: 'table' or 'grid'
  const [viewMode, setViewMode] = useState('table');

  // Filter & Search State
  // Status Tab: 'pending' (No + Partially), 'No', 'Partially', 'Yes', 'all'
  const [statusTab, setStatusTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterNavratriDay, setFilterNavratriDay] = useState('');
  const [filterPassName, setFilterPassName] = useState('');
  const [filterDeliveryMethod, setFilterDeliveryMethod] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Multi-select for Bulk Actions
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals
  const [viewingSale, setViewingSale] = useState(null);
  const [editingSale, setEditingSale] = useState(null);
  const [noteModalSale, setNoteModalSale] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [copiedMobile, setCopiedMobile] = useState(null);

  const { showSuccess, showError } = useToast();

  // Fetch sales and lists
  const fetchData = async () => {
    try {
      const [salesRes, listsRes] = await Promise.all([
        api.get('/sales'),
        api.get('/lists')
      ]);
      setSales(salesRes.data.data || []);
      setLists(prev => ({
        ...prev,
        ...(listsRes.data.data || {})
      }));
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to fetch passes from server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Compute Overall Stats
  const stats = useMemo(() => {
    let pendingCount = 0;
    let pendingQty = 0;
    let noCount = 0;
    let noQty = 0;
    let partialCount = 0;
    let partialQty = 0;
    let yesCount = 0;
    let yesQty = 0;
    let pendingRevenue = 0;

    sales.forEach(s => {
      const status = String(s.passGiven || '').trim().toLowerCase();
      const qty = Number(s.quantity) || 1;
      const amount = Number(s.totalSellingAmount) || 0;

      if (status === 'no') {
        noCount++;
        noQty += qty;
        pendingCount++;
        pendingQty += qty;
        pendingRevenue += amount;
      } else if (status === 'partially') {
        partialCount++;
        partialQty += qty;
        pendingCount++;
        pendingQty += qty;
        pendingRevenue += amount;
      } else if (status === 'yes') {
        yesCount++;
        yesQty += qty;
      }
    });

    return {
      pendingCount,
      pendingQty,
      noCount,
      noQty,
      partialCount,
      partialQty,
      yesCount,
      yesQty,
      pendingRevenue,
      totalSales: sales.length
    };
  }, [sales]);

  // Filter Sales based on Status Tab and Filters
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const status = String(s.passGiven || '').trim().toLowerCase();

      // Tab Filtering
      if (statusTab === 'pending') {
        if (status === 'yes') return false; // Show only 'No' and 'Partially'
      } else if (statusTab === 'No') {
        if (status !== 'no') return false;
      } else if (statusTab === 'Partially') {
        if (status !== 'partially') return false;
      } else if (statusTab === 'Yes') {
        if (status !== 'yes') return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const name = String(s.customerName || '').toLowerCase();
        const mobile = String(s.mobileNumber || '').toLowerCase();
        const pass = String(s.passName || '').toLowerCase();
        const notes = String(s.notes || '').toLowerCase();
        if (!name.includes(query) && !mobile.includes(query) && !pass.includes(query) && !notes.includes(query)) {
          return false;
        }
      }

      // Dropdown Filters
      if (filterNavratriDay && s.navratriDay !== filterNavratriDay) return false;
      if (filterPassName && s.passName !== filterPassName) return false;
      if (filterDeliveryMethod && s.passDeliveryMethod !== filterDeliveryMethod) return false;
      if (filterCategory && s.passCategory !== filterCategory) return false;

      return true;
    });
  }, [sales, statusTab, searchQuery, filterNavratriDay, filterPassName, filterDeliveryMethod, filterCategory]);

  // Direct Status Update for a Single Item
  const handleUpdateStatus = async (sale, newStatus, optionalDelivery = null) => {
    const targetId = sale.id || sale.rowIndex;
    setUpdatingId(targetId);

    // Optimistic Update
    const prevSales = [...sales];
    setSales(current =>
      current.map(item => {
        const itemId = item.id || item.rowIndex;
        if (itemId === targetId) {
          return {
            ...item,
            passGiven: newStatus,
            ...(optionalDelivery ? { passDeliveryMethod: optionalDelivery } : {})
          };
        }
        return item;
      })
    );

    try {
      const payload = { passGiven: newStatus };
      if (optionalDelivery) {
        payload.passDeliveryMethod = optionalDelivery;
      }

      const res = await api.patch(`/sales/${targetId}/status`, payload);
      showSuccess(`✓ Pass status updated to "${newStatus}" for ${sale.customerName}.`);

      // Update with server confirmation
      if (res.data?.data) {
        setSales(current =>
          current.map(item => {
            const itemId = item.id || item.rowIndex;
            return itemId === targetId ? { ...item, ...res.data.data } : item;
          })
        );
      }
    } catch (err) {
      // Revert on error
      setSales(prevSales);
      showError(err.response?.data?.message || 'Failed to update pass status.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Direct Delivery Method Update
  const handleUpdateDeliveryMethod = async (sale, newMethod) => {
    const targetId = sale.id || sale.rowIndex;
    setUpdatingId(targetId);

    const prevSales = [...sales];
    setSales(current =>
      current.map(item => {
        const itemId = item.id || item.rowIndex;
        return itemId === targetId ? { ...item, passDeliveryMethod: newMethod } : item;
      })
    );

    try {
      await api.patch(`/sales/${targetId}/status`, { passDeliveryMethod: newMethod });
      showSuccess(`Delivery method set to "${newMethod}" for ${sale.customerName}.`);
    } catch (err) {
      setSales(prevSales);
      showError(err.response?.data?.message || 'Failed to update delivery method.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Save Note Modal
  const handleSaveNote = async () => {
    if (!noteModalSale) return;
    const targetId = noteModalSale.id || noteModalSale.rowIndex;
    try {
      await api.patch(`/sales/${targetId}/status`, { notes: noteText });
      setSales(current =>
        current.map(item => {
          const itemId = item.id || item.rowIndex;
          return itemId === targetId ? { ...item, notes: noteText } : item;
        })
      );
      showSuccess('Notes updated successfully.');
      setNoteModalSale(null);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update notes.');
    }
  };

  // Multi-select helpers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allFilteredIds = filteredSales.map(s => s.id || s.rowIndex);
      setSelectedIds(allFilteredIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Bulk Status Update
  const handleBulkUpdateStatus = async (newStatus) => {
    if (selectedIds.length === 0) return;
    setBulkUpdating(true);

    try {
      await api.post('/sales/bulk-status', {
        items: selectedIds,
        passGiven: newStatus
      });

      // Update state locally
      setSales(current =>
        current.map(item => {
          const itemId = item.id || item.rowIndex;
          if (selectedIds.includes(itemId)) {
            return { ...item, passGiven: newStatus };
          }
          return item;
        })
      );

      showSuccess(`✓ Updated ${selectedIds.length} passes to "${newStatus}".`);
      setSelectedIds([]);
    } catch (err) {
      showError(err.response?.data?.message || 'Bulk status update failed.');
    } finally {
      setBulkUpdating(false);
    }
  };

  // Bulk Delivery Method Update
  const handleBulkUpdateDelivery = async (newMethod) => {
    if (selectedIds.length === 0 || !newMethod) return;
    setBulkUpdating(true);

    try {
      await api.post('/sales/bulk-status', {
        items: selectedIds,
        passDeliveryMethod: newMethod
      });

      setSales(current =>
        current.map(item => {
          const itemId = item.id || item.rowIndex;
          if (selectedIds.includes(itemId)) {
            return { ...item, passDeliveryMethod: newMethod };
          }
          return item;
        })
      );

      showSuccess(`✓ Set delivery method to "${newMethod}" for ${selectedIds.length} passes.`);
      setSelectedIds([]);
    } catch (err) {
      showError(err.response?.data?.message || 'Bulk delivery update failed.');
    } finally {
      setBulkUpdating(false);
    }
  };

  // Copy mobile number
  const handleCopyMobile = (mobile) => {
    navigator.clipboard.writeText(mobile);
    setCopiedMobile(mobile);
    showSuccess(`Copied: ${mobile}`);
    setTimeout(() => setCopiedMobile(null), 2500);
  };

  // WhatsApp Quick Link
  const getWhatsAppLink = (sale) => {
    const rawNum = String(sale.mobileNumber || '').replace(/[^0-9]/g, '');
    const cleanNum = rawNum.length === 10 ? `91${rawNum}` : rawNum;
    const msg = encodeURIComponent(
      `Hello ${sale.customerName}! 🪔\nRegarding your Navratri Pass order:\n` +
      `🎟️ Pass: ${sale.passName} (${sale.passCategory})\n` +
      `📦 Quantity: ${sale.quantity} Pass(es)\n` +
      `📅 Navratri: ${sale.navratriDay}\n` +
      `Status: ${sale.passGiven === 'Yes' ? 'Pass Handed Over / Delivered' : 'Ready for Pickup / Handover'}.\n` +
      `Let us know if you have any questions!`
    );
    return `https://wa.me/${cleanNum}?text=${msg}`;
  };

  const deliveryMethodsList = lists.passDeliveryMethods?.length
    ? lists.passDeliveryMethods
    : ['WhatsApp', 'Physical', 'Email', 'QR Code', 'Other'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Title & Main Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-3xl shadow-xl shadow-slate-950/10 border border-slate-700/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-brand-500/10 to-transparent pointer-events-none"></div>

        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-500 to-amber-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                Pass Distribution Portal
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 font-medium">
                  Direct Live Updates
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Track passes not yet handed over and update delivery status with one click.
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher & Sync */}
        <div className="flex items-center gap-2.5 relative z-10">
          <div className="bg-slate-800/90 p-1 rounded-xl border border-slate-700 flex items-center gap-1">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'table'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Table View"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'grid'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Ticket Cards View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition shadow-xs"
            title="Refresh from Google Sheets"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-brand-400' : ''}`} />
            <span>Sync Sheets</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Highlights Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Undelivered Passes */}
        <div
          onClick={() => setStatusTab('pending')}
          className={`cursor-pointer p-4 rounded-2xl border transition duration-200 ${
            statusTab === 'pending'
              ? 'bg-gradient-to-br from-brand-50 to-orange-50 border-brand-300 ring-2 ring-brand-500/20 shadow-sm'
              : 'bg-white border-slate-200/80 hover:border-brand-200 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-brand-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pending Delivery</span>
            <AlertTriangle className="w-4 h-4 text-brand-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{stats.pendingQty}</span>
            <span className="text-xs font-medium text-slate-500">tickets</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Across <strong className="text-slate-800">{stats.pendingCount}</strong> customer orders
          </p>
        </div>

        {/* Not Given (No) */}
        <div
          onClick={() => setStatusTab('No')}
          className={`cursor-pointer p-4 rounded-2xl border transition duration-200 ${
            statusTab === 'No'
              ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-500/20 shadow-sm'
              : 'bg-white border-slate-200/80 hover:border-rose-200 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Not Given (No)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-rose-700">{stats.noQty}</span>
            <span className="text-xs font-medium text-slate-500">tickets</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            <strong className="text-rose-700 font-semibold">{stats.noCount}</strong> orders not handed over
          </p>
        </div>

        {/* Partially Given */}
        <div
          onClick={() => setStatusTab('Partially')}
          className={`cursor-pointer p-4 rounded-2xl border transition duration-200 ${
            statusTab === 'Partially'
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20 shadow-sm'
              : 'bg-white border-slate-200/80 hover:border-amber-200 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Partially Given</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-700">{stats.partialQty}</span>
            <span className="text-xs font-medium text-slate-500">tickets</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            <strong className="text-amber-700 font-semibold">{stats.partialCount}</strong> orders partially handed
          </p>
        </div>

        {/* Completed / Handed Over (Yes) */}
        <div
          onClick={() => setStatusTab('Yes')}
          className={`cursor-pointer p-4 rounded-2xl border transition duration-200 ${
            statusTab === 'Yes'
              ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20 shadow-sm'
              : 'bg-white border-slate-200/80 hover:border-emerald-200 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Handed Over (Yes)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-700">{stats.yesQty}</span>
            <span className="text-xs font-medium text-slate-500">tickets</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            <strong className="text-emerald-700 font-semibold">{stats.yesCount}</strong> orders delivered
          </p>
        </div>

        {/* Pending Revenue */}
        <div className="col-span-2 sm:col-span-2 lg:col-span-1 p-4 rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pending Value</span>
            <Ticket className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono">
            {formatRupee(stats.pendingRevenue)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Total value of undelivered passes
          </p>
        </div>
      </div>

      {/* Control Panel: Status Tabs & Filter Toolbar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        {/* Status Tabs Navigation */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-4">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2 hidden sm:inline">
            Status Filter:
          </span>

          {/* Pending Tab */}
          <button
            onClick={() => setStatusTab('pending')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              statusTab === 'pending'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <span>All Undelivered</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              statusTab === 'pending' ? 'bg-white/20 text-white' : 'bg-brand-100 text-brand-700'
            }`}>
              {stats.pendingCount}
            </span>
          </button>

          {/* Not Given (No) */}
          <button
            onClick={() => setStatusTab('No')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              statusTab === 'No'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>Not Given (No)</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              statusTab === 'No' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700'
            }`}>
              {stats.noCount}
            </span>
          </button>

          {/* Partially Given */}
          <button
            onClick={() => setStatusTab('Partially')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              statusTab === 'Partially'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Partially Given</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              statusTab === 'Partially' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
            }`}>
              {stats.partialCount}
            </span>
          </button>

          {/* Handed Over (Yes) */}
          <button
            onClick={() => setStatusTab('Yes')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              statusTab === 'Yes'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Handed Over (Yes)</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              statusTab === 'Yes' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
            }`}>
              {stats.yesCount}
            </span>
          </button>

          {/* Show All */}
          <button
            onClick={() => setStatusTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ml-auto ${
              statusTab === 'all'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <span>All Sales</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              statusTab === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {stats.totalSales}
            </span>
          </button>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Instant Search Bar */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer, phone, pass name, notes..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition placeholder:text-slate-400"
            />
          </div>

          {/* Navratri Day Filter */}
          <div>
            <select
              value={filterNavratriDay}
              onChange={(e) => setFilterNavratriDay(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none text-slate-700"
            >
              <option value="">All Navratri Days</option>
              {lists.navratriDays?.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>

          {/* Pass Name Filter */}
          <div>
            <select
              value={filterPassName}
              onChange={(e) => setFilterPassName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none text-slate-700 truncate"
            >
              <option value="">All Pass Types</option>
              {lists.passNames?.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {/* Delivery Method Filter */}
          <div>
            <select
              value={filterDeliveryMethod}
              onChange={(e) => setFilterDeliveryMethod(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none text-slate-700"
            >
              <option value="">All Delivery Methods</option>
              {deliveryMethodsList.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Filters Prompt */}
        {(searchQuery || filterNavratriDay || filterPassName || filterDeliveryMethod || filterCategory) && (
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-500">
              Filters active. Showing <strong className="text-slate-800">{filteredSales.length}</strong> matching records.
            </span>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterNavratriDay('');
                setFilterPassName('');
                setFilterDeliveryMethod('');
                setFilterCategory('');
              }}
              className="text-brand-600 hover:text-brand-700 font-semibold"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Floating Multi-Select Bulk Action Bar (When items are selected) */}
      {selectedIds.length > 0 && (
        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-800 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center text-white font-bold text-xs">
              {selectedIds.length}
            </span>
            <div>
              <p className="text-xs font-bold text-slate-100">
                {selectedIds.length} Pass Order{selectedIds.length !== 1 ? 's' : ''} Selected
              </p>
              <p className="text-[11px] text-slate-400">Apply quick batch updates to all selected records</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleBulkUpdateStatus('Yes')}
              disabled={bulkUpdating}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark as Given (Yes)</span>
            </button>

            <button
              onClick={() => handleBulkUpdateStatus('Partially')}
              disabled={bulkUpdating}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Mark as Partial</span>
            </button>

            <button
              onClick={() => handleBulkUpdateStatus('No')}
              disabled={bulkUpdating}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" />
              <span>Mark as Not Given</span>
            </button>

            {/* Quick Delivery Selector */}
            <select
              onChange={(e) => {
                if (e.target.value) handleBulkUpdateDelivery(e.target.value);
              }}
              defaultValue=""
              disabled={bulkUpdating}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="" disabled>Set Delivery Method...</option>
              {deliveryMethodsList.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-2 text-slate-400 hover:text-white text-xs font-medium"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Main Content: Table or Cards View */}
      {loading ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-medium text-slate-500">Loading passes from Google Sheets...</p>
        </div>
      ) : filteredSales.length === 0 ? (
        <div className="bg-white p-16 rounded-3xl border border-slate-200/80 shadow-xs text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCheck className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {statusTab === 'pending'
              ? 'Awesome! No Pending Passes Found'
              : `No Passes Found for "${statusTab}"`}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {statusTab === 'pending'
              ? 'All customer passes in this category have been marked as handed over or no orders match your search criteria.'
              : 'Try selecting a different status tab or reset your search filters above.'}
          </p>
          {statusTab !== 'all' && (
            <button
              onClick={() => setStatusTab('all')}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md transition"
            >
              View All Passes
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">
                {filteredSales.length} Record{filteredSales.length !== 1 ? 's' : ''}
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-xs text-slate-500">
                Total Qty:{' '}
                <strong className="text-slate-800 font-bold">
                  {filteredSales.reduce((acc, curr) => acc + (Number(curr.quantity) || 1), 0)} passes
                </strong>
              </span>
            </div>

            <div className="text-xs text-slate-400">
              💡 Tip: Click status buttons to update live
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-slate-300 text-[11px] font-semibold uppercase tracking-wider border-b border-slate-800">
                  <th className="py-3.5 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.length > 0 && selectedIds.length === filteredSales.length}
                      onChange={handleSelectAll}
                      className="rounded border-slate-700 text-brand-600 focus:ring-brand-500"
                    />
                  </th>
                  <th className="py-3.5 px-4">Customer & Contact</th>
                  <th className="py-3.5 px-4">Pass Name & Day</th>
                  <th className="py-3.5 px-4 text-center">Qty</th>
                  <th className="py-3.5 px-4">Delivery Method</th>
                  <th className="py-3.5 px-4 text-center">Current Status</th>
                  <th className="py-3.5 px-4 text-center min-w-[280px]">
                    Direct Status Update
                  </th>
                  <th className="py-3.5 px-4 text-right">Selling Total</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredSales.map((sale, idx) => {
                  const saleId = sale.id || sale.rowIndex;
                  const isSelected = selectedIds.includes(saleId);
                  const isUpdating = updatingId === saleId;
                  const badgeProps = getPassGivenBadgeProps(sale.passGiven);
                  const status = String(sale.passGiven || '').trim().toLowerCase();

                  return (
                    <tr
                      key={saleId || idx}
                      className={`hover:bg-slate-50/90 transition ${
                        isSelected ? 'bg-brand-50/40' : ''
                      } ${status === 'no' ? 'bg-rose-50/20' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(saleId)}
                          className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                        />
                      </td>

                      {/* Customer Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{sale.customerName}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-[11px] text-slate-500">
                            {sale.mobileNumber}
                          </span>
                          <button
                            onClick={() => handleCopyMobile(sale.mobileNumber)}
                            title="Copy Phone Number"
                            className="p-1 hover:bg-slate-200/60 rounded text-slate-400 hover:text-slate-700"
                          >
                            {copiedMobile === sale.mobileNumber ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                          <a
                            href={getWhatsAppLink(sale)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Message on WhatsApp"
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] font-bold border border-emerald-200"
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                        {sale.notes && (
                          <p className="text-[11px] text-amber-700 font-medium mt-1 truncate max-w-xs" title={sale.notes}>
                            📝 {sale.notes}
                          </p>
                        )}
                      </td>

                      {/* Pass Details */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 max-w-xs truncate" title={sale.passName}>
                          {sale.passName}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 text-brand-700 border border-brand-200">
                            {sale.passCategory}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {sale.navratriDay}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {formatDateDisplay(sale.dateSold)}
                          </span>
                        </div>
                      </td>

                      {/* Quantity */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-slate-100 text-slate-900 font-extrabold text-sm border border-slate-200">
                          {sale.quantity}
                        </span>
                      </td>

                      {/* Delivery Method Selector (Interactive Inline) */}
                      <td className="py-3.5 px-4">
                        <select
                          value={sale.passDeliveryMethod || 'Other'}
                          onChange={(e) => handleUpdateDeliveryMethod(sale, e.target.value)}
                          disabled={isUpdating}
                          className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-white font-medium text-slate-700 focus:ring-1 focus:ring-brand-500 focus:outline-none hover:border-slate-300"
                        >
                          {deliveryMethodsList.map(method => (
                            <option key={method} value={method}>{method}</option>
                          ))}
                        </select>
                      </td>

                      {/* Current Status Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${badgeProps.className}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            status === 'yes' ? 'bg-emerald-600' : status === 'partially' ? 'bg-amber-600' : 'bg-rose-600'
                          }`}></span>
                          {badgeProps.label}
                        </span>
                      </td>

                      {/* DIRECT 1-CLICK STATUS UPDATE ACTIONS */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Button 1: Mark as Given (Yes) */}
                          <button
                            onClick={() => handleUpdateStatus(sale, 'Yes')}
                            disabled={isUpdating || status === 'yes'}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs ${
                              status === 'yes'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 opacity-60 cursor-default'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-md hover:scale-[1.02]'
                            }`}
                            title="Mark as Delivered / Given"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Given</span>
                          </button>

                          {/* Button 2: Mark as Partial */}
                          <button
                            onClick={() => handleUpdateStatus(sale, 'Partially')}
                            disabled={isUpdating || status === 'partially'}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs ${
                              status === 'partially'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300 opacity-60 cursor-default'
                                : 'bg-amber-500 hover:bg-amber-400 text-white hover:shadow-md hover:scale-[1.02]'
                            }`}
                            title="Mark as Partially Handed"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Partial</span>
                          </button>

                          {/* Button 3: Mark as Not Given (No) */}
                          <button
                            onClick={() => handleUpdateStatus(sale, 'No')}
                            disabled={isUpdating || status === 'no'}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs ${
                              status === 'no'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300 opacity-60 cursor-default'
                                : 'bg-slate-200 hover:bg-rose-600 hover:text-white text-slate-700'
                            }`}
                            title="Mark as Not Given"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Not Given</span>
                          </button>

                          {isUpdating && (
                            <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin ml-1"></div>
                          )}
                        </div>
                      </td>

                      {/* Selling Price Total */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800">
                        {formatRupee(sale.totalSellingAmount)}
                      </td>

                      {/* Extra Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setNoteModalSale(sale);
                              setNoteText(sale.notes || '');
                            }}
                            title="Add / Edit Delivery Note"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setViewingSale(sale)}
                            title="View Full Details"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* TICKET CARDS VIEW (Mobile & Touch-Friendly) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSales.map((sale, idx) => {
            const saleId = sale.id || sale.rowIndex;
            const isSelected = selectedIds.includes(saleId);
            const isUpdating = updatingId === saleId;
            const badgeProps = getPassGivenBadgeProps(sale.passGiven);
            const status = String(sale.passGiven || '').trim().toLowerCase();

            return (
              <div
                key={saleId || idx}
                className={`bg-white rounded-3xl border transition duration-200 shadow-xs hover:shadow-md flex flex-col justify-between overflow-hidden relative ${
                  isSelected ? 'border-brand-500 ring-2 ring-brand-500/20' : 'border-slate-200/80'
                } ${status === 'no' ? 'border-t-4 border-t-rose-500' : status === 'partially' ? 'border-t-4 border-t-amber-500' : 'border-t-4 border-t-emerald-500'}`}
              >
                {/* Card Header */}
                <div className="p-5 pb-3 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(saleId)}
                        className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 mt-0.5"
                      />
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 text-brand-700 border border-brand-200">
                        {sale.navratriDay}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {sale.passCategory}
                      </span>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeProps.className}`}>
                      {badgeProps.label}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1" title={sale.passName}>
                      {sale.passName}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Sold on {formatDateDisplay(sale.dateSold)}
                    </p>
                  </div>

                  {/* Quantity & Amount Banner */}
                  <div className="bg-slate-50 p-3 rounded-2xl flex items-center justify-between border border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
                        {sale.quantity}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900">Pass{sale.quantity !== 1 ? 'es' : ''}</span>
                        <p className="text-[10px] text-slate-400">To Deliver</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold font-mono text-slate-900">
                        {formatRupee(sale.totalSellingAmount)}
                      </span>
                      <p className="text-[10px] text-slate-400">Total Price</p>
                    </div>
                  </div>

                  {/* Customer Row */}
                  <div className="pt-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold">
                          {sale.customerName ? sale.customerName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 truncate max-w-[140px]">{sale.customerName}</p>
                          <p className="text-[11px] font-mono text-slate-500">{sale.mobileNumber}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <a
                          href={`tel:${sale.mobileNumber}`}
                          title="Call Customer"
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={getWhatsAppLink(sale)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open WhatsApp Chat"
                          className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-xs transition"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    {sale.notes && (
                      <div className="mt-2 text-[11px] bg-amber-50 text-amber-800 p-2 rounded-xl border border-amber-200/60 line-clamp-2">
                        📝 {sale.notes}
                      </div>
                    )}
                  </div>

                  {/* Delivery Method Selector */}
                  <div className="pt-1 flex items-center justify-between text-xs">
                    <span className="text-[11px] font-semibold text-slate-500">Delivery:</span>
                    <select
                      value={sale.passDeliveryMethod || 'Other'}
                      onChange={(e) => handleUpdateDeliveryMethod(sale, e.target.value)}
                      disabled={isUpdating}
                      className="px-2 py-1 rounded-lg border border-slate-200 text-[11px] bg-white font-medium text-slate-700 focus:outline-none"
                    >
                      {deliveryMethodsList.map(method => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Direct Action Bottom Toolbar */}
                <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateStatus(sale, 'Yes')}
                    disabled={isUpdating || status === 'yes'}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs ${
                      status === 'yes'
                        ? 'bg-emerald-100 text-emerald-800 opacity-60 cursor-default'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Given</span>
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(sale, 'Partially')}
                    disabled={isUpdating || status === 'partially'}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-xs ${
                      status === 'partially'
                        ? 'bg-amber-100 text-amber-800 opacity-60 cursor-default'
                        : 'bg-amber-500 hover:bg-amber-400 text-white'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Partial</span>
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(sale, 'No')}
                    disabled={isUpdating || status === 'no'}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-xs ${
                      status === 'no'
                        ? 'bg-rose-100 text-rose-800 opacity-60 cursor-default'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-rose-600 hover:text-white'
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      setNoteModalSale(sale);
                      setNoteText(sale.notes || '');
                    }}
                    title="Add Delivery Note"
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/60"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setViewingSale(sale)}
                    title="View Full Sale"
                    className="p-2 rounded-xl text-slate-500 hover:text-brand-600 hover:bg-brand-50"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Note / Handover Details Modal */}
      {noteModalSale && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Delivery & Handover Notes</h3>
                <p className="text-xs text-slate-500">Customer: {noteModalSale.customerName}</p>
              </div>
              <button
                onClick={() => setNoteModalSale(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Notes / Handover Instructions
              </label>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="e.g. Delivered 2 passes at Gate 1, remaining 2 to give tomorrow..."
                rows={4}
                className="w-full p-3 rounded-2xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setNoteModalSale(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md shadow-brand-600/20"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingSale && (
        <SaleViewModal
          sale={viewingSale}
          onClose={() => setViewingSale(null)}
          onEdit={(sale) => {
            setViewingSale(null);
            setEditingSale(sale);
          }}
        />
      )}

      {/* Edit Modal */}
      {editingSale && (
        <SaleEditModal
          sale={editingSale}
          lists={lists}
          onClose={() => setEditingSale(null)}
          onSave={async (id, data) => {
            try {
              await api.put(`/sales/${id}`, data);
              showSuccess('Sale record updated in Google Sheets.');
              setEditingSale(null);
              fetchData();
            } catch (err) {
              showError(err.response?.data?.message || 'Failed to update sale record.');
            }
          }}
        />
      )}
    </div>
  );
}
