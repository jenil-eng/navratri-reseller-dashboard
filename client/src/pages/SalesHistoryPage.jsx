import React, { useState, useEffect, useMemo } from 'react';
import api from '../utils/api';
import { useToast } from '../components/Toast';
import { TableSkeleton } from '../components/SkeletonLoader';
import SaleViewModal from '../components/SaleViewModal';
import SaleEditModal from '../components/SaleEditModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { formatRupee, formatDateDisplay, getPassGivenBadgeProps, getProfitBadgeProps } from '../utils/formatters';
import {
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Download,
  PlusCircle,
  Sparkles,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';

export default function SalesHistoryPage() {
  const [sales, setSales] = useState([]);
  const [lists, setLists] = useState({ passNames: [], passCategories: [], passGivenStatus: [], navratriDays: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterPassName, setFilterPassName] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPassGiven, setFilterPassGiven] = useState('');
  const [filterNavratriDay, setFilterNavratriDay] = useState('');

  // Sort State (Default: Date Sold Newest First)
  const [sortBy, setSortBy] = useState('dateSold');
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal State
  const [viewingSale, setViewingSale] = useState(null);
  const [editingSale, setEditingSale] = useState(null);
  const [deletingSale, setDeletingSale] = useState(null);

  const { showSuccess, showError } = useToast();

  const fetchSalesData = async () => {
    try {
      const [salesRes, listsRes] = await Promise.all([
        api.get('/sales'),
        api.get('/lists')
      ]);
      setSales(salesRes.data.data || []);
      setLists(listsRes.data.data || {});
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to load sales history from Google Sheets.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSalesData();
  };

  // Filter & Search Logic
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      // Search bar
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchName = String(s.customerName || '').toLowerCase().includes(query);
        const matchMobile = String(s.mobileNumber || '').toLowerCase().includes(query);
        const matchPass = String(s.passName || '').toLowerCase().includes(query);
        if (!matchName && !matchMobile && !matchPass) return false;
      }

      // Date range filter
      if (dateFrom && s.dateSold < dateFrom) return false;
      if (dateTo && s.dateSold > dateTo) return false;

      // Dropdown filters
      if (filterPassName && s.passName !== filterPassName) return false;
      if (filterCategory && s.passCategory !== filterCategory) return false;
      if (filterPassGiven && s.passGiven !== filterPassGiven) return false;
      if (filterNavratriDay && s.navratriDay !== filterNavratriDay) return false;

      return true;
    });
  }, [sales, searchQuery, dateFrom, dateTo, filterPassName, filterCategory, filterPassGiven, filterNavratriDay]);

  // Sorting Logic
  const sortedSales = useMemo(() => {
    return [...filteredSales].sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (sortBy === 'dateSold') {
        valA = new Date(a.dateSold || 0).getTime();
        valB = new Date(b.dateSold || 0).getTime();
      } else if (sortBy === 'quantity' || sortBy === 'totalSellingAmount' || sortBy === 'profit') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredSales, sortBy, sortOrder]);

  // Pagination Calculations
  const totalRecords = sortedSales.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  
  // Ensure current page does not exceed bounds
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedSales.slice(start, start + pageSize);
  }, [sortedSales, currentPage, pageSize]);

  // Actions
  const handleEditSave = async (id, updatedData) => {
    try {
      await api.put(`/sales/${id}`, updatedData);
      showSuccess('Sale record updated in Google Sheets.');
      setEditingSale(null);
      fetchSalesData();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update sale record.');
    }
  };

  const handleDeleteConfirm = async (sale) => {
    try {
      const targetId = sale.id || sale.rowIndex;
      await api.delete(`/sales/${targetId}`);
      showSuccess('Sale record removed from Google Sheets.');
      setDeletingSale(null);
      fetchSalesData();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete sale record.');
    }
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
    setFilterPassName('');
    setFilterCategory('');
    setFilterPassGiven('');
    setFilterNavratriDay('');
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sales History Management</h2>
          <p className="text-xs text-slate-500 mt-1">
            Search, filter, edit and manage all 15 Google Sheet sales records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-brand-600' : ''}`} />
            Sync Sheets
          </button>
        </div>
      </div>

      {/* Search & Filter Control Card */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Customer Name, Mobile Number, or Pass Name..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition placeholder:text-slate-400"
          />
        </div>

        {/* Filter Toolbar Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Pass Name</label>
            <select
              value={filterPassName}
              onChange={(e) => setFilterPassName(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-1 focus:ring-brand-500 focus:outline-none"
            >
              <option value="">All Pass Names</option>
              {lists.passNames?.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-1 focus:ring-brand-500 focus:outline-none"
            >
              <option value="">All Categories</option>
              {lists.passCategories?.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Pass Given?</label>
            <select
              value={filterPassGiven}
              onChange={(e) => setFilterPassGiven(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-1 focus:ring-brand-500 focus:outline-none"
            >
              <option value="">All Statuses</option>
              {lists.passGivenStatus?.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Navratri Day</label>
            <select
              value={filterNavratriDay}
              onChange={(e) => setFilterNavratriDay(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-1 focus:ring-brand-500 focus:outline-none"
            >
              <option value="">All Days</option>
              {lists.navratriDays?.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Filters Toolbar */}
        {(searchQuery || dateFrom || dateTo || filterPassName || filterCategory || filterPassGiven || filterNavratriDay) && (
          <div className="flex justify-end pt-1">
            <button
              onClick={clearAllFilters}
              className="text-xs font-semibold text-rose-600 hover:underline"
            >
              Clear All Filters & Search
            </button>
          </div>
        )}
      </div>

      {/* Table & Pagination Box */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden">
        {/* Table Toolbar Header */}
        <div className="p-4 px-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-800">
              Showing {totalRecords} Record{totalRecords !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Sorting Buttons */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Sort by:</span>
            <button
              onClick={() => toggleSort('dateSold')}
              className={`px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1 transition ${
                sortBy === 'dateSold' ? 'bg-brand-50 text-brand-700 border-brand-200' : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              Date {sortBy === 'dateSold' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => toggleSort('quantity')}
              className={`px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1 transition ${
                sortBy === 'quantity' ? 'bg-brand-50 text-brand-700 border-brand-200' : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              Qty {sortBy === 'quantity' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => toggleSort('totalSellingAmount')}
              className={`px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1 transition ${
                sortBy === 'totalSellingAmount' ? 'bg-brand-50 text-brand-700 border-brand-200' : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              Revenue {sortBy === 'totalSellingAmount' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => toggleSort('profit')}
              className={`px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1 transition ${
                sortBy === 'profit' ? 'bg-brand-50 text-brand-700 border-brand-200' : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              Profit {sortBy === 'profit' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>

        {/* Table View */}
        {loading ? (
          <TableSkeleton rows={8} cols={10} />
        ) : paginatedSales.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <p className="text-sm font-semibold text-slate-600">No Sales Records Found</p>
            <p className="text-xs text-slate-400">Try broadening your search query or reset filter settings.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-slate-300 text-[11px] font-semibold uppercase tracking-wider border-b border-slate-800">
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Mobile</th>
                  <th className="py-3.5 px-4">Pass Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-center">Qty</th>
                  <th className="py-3.5 px-4 text-right">Buying</th>
                  <th className="py-3.5 px-4 text-right">Selling</th>
                  <th className="py-3.5 px-4 text-right">Total Cost</th>
                  <th className="py-3.5 px-4 text-right">Revenue</th>
                  <th className="py-3.5 px-4 text-right">Profit</th>
                  <th className="py-3.5 px-4 text-center">Given?</th>
                  <th className="py-3.5 px-4">Delivery</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Day</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedSales.map((sale, idx) => {
                  const passBadge = getPassGivenBadgeProps(sale.passGiven);
                  return (
                    <tr key={sale.id || idx} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {sale.customerName}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {sale.mobileNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-medium max-w-xs truncate">
                        {sale.passName}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                          {sale.passCategory}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-900">
                        {sale.quantity}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500 font-mono">
                        {formatRupee(sale.buyingPrice)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-700 font-mono">
                        {formatRupee(sale.sellingPrice)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600 font-mono">
                        {formatRupee(sale.totalBuyingCost)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-amber-600 font-mono">
                        {formatRupee(sale.totalSellingAmount)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`px-2 py-0.5 rounded-md font-bold font-mono ${sale.profit >= 0 ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-rose-700 bg-rose-50 border border-rose-200'}`}>
                          {formatRupee(sale.profit)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${passBadge.className}`}>
                          {passBadge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-[11px]">
                        {sale.passDeliveryMethod}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {formatDateDisplay(sale.dateSold)}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {sale.navratriDay}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setViewingSale(sale)}
                            title="View Details"
                            className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingSale(sale)}
                            title="Edit Record"
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingSale(sale)}
                            title="Delete Record"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 px-6 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 rounded-lg border border-slate-200 bg-white font-medium focus:outline-none"
            >
              <option value={10}>10 records</option>
              <option value={25}>25 records</option>
              <option value={50}>50 records</option>
            </select>
            <span>per page</span>
          </div>

          <div className="flex items-center gap-3">
            <span>
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-100 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-100 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* View Modal */}
      {viewingSale && (
        <SaleViewModal sale={viewingSale} onClose={() => setViewingSale(null)} />
      )}

      {/* Edit Modal */}
      {editingSale && (
        <SaleEditModal
          sale={editingSale}
          dropdownLists={lists}
          onSave={handleEditSave}
          onClose={() => setEditingSale(null)}
        />
      )}

      {/* Delete Modal */}
      {deletingSale && (
        <DeleteConfirmModal
          sale={deletingSale}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeletingSale(null)}
        />
      )}
    </div>
  );
}
