import React, { useState, useEffect, useMemo } from 'react';
import api from '../utils/api';
import StatCard from '../components/StatCard';
import { StatCardSkeleton, ChartSkeleton, TableSkeleton } from '../components/SkeletonLoader';
import SaleViewModal from '../components/SaleViewModal';
import SaleEditModal from '../components/SaleEditModal';
import { useToast } from '../components/Toast';
import { formatRupee, formatDateDisplay, getTodayInputDate, getPassGivenBadgeProps, getProfitBadgeProps } from '../utils/formatters';
import {
  ShoppingBag,
  Ticket,
  IndianRupee,
  TrendingUp,
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  RefreshCw,
  Eye,
  Edit,
  Sparkles
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function DashboardPage() {
  const [sales, setSales] = useState([]);
  const [lists, setLists] = useState({ passNames: [], passCategories: [], navratriDays: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters state
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterPassName, setFilterPassName] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterNavratriDay, setFilterNavratriDay] = useState('');

  // Modals
  const [viewingSale, setViewingSale] = useState(null);
  const [editingSale, setEditingSale] = useState(null);

  const { showSuccess, showError } = useToast();

  const fetchData = async () => {
    try {
      const [salesRes, listsRes] = await Promise.all([
        api.get('/sales'),
        api.get('/lists')
      ]);
      setSales(salesRes.data.data || []);
      setLists(listsRes.data.data || {});
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to fetch dashboard data from Google Sheets.');
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

  // Filtered Sales Logic
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      // Date range filter
      if (dateFrom && s.dateSold < dateFrom) return false;
      if (dateTo && s.dateSold > dateTo) return false;
      // Pass Name
      if (filterPassName && s.passName !== filterPassName) return false;
      // Category
      if (filterCategory && s.passCategory !== filterCategory) return false;
      // Navratri Day
      if (filterNavratriDay && s.navratriDay !== filterNavratriDay) return false;

      return true;
    });
  }, [sales, dateFrom, dateTo, filterPassName, filterCategory, filterNavratriDay]);

  // Dashboard Stats Calculations
  const stats = useMemo(() => {
    const todayStr = getTodayInputDate();

    let totalSalesCount = filteredSales.length;
    let totalPassesSold = 0;
    let totalRevenue = 0;
    let totalBuyingCost = 0;
    let totalProfit = 0;

    let todaySalesCount = 0;
    let todayRevenue = 0;
    let todayProfit = 0;

    let passesGivenCount = 0;
    let pendingDeliveryCount = 0;

    filteredSales.forEach(s => {
      const qty = Number(s.quantity) || 0;
      const rev = Number(s.totalSellingAmount) || 0;
      const cost = Number(s.totalBuyingCost) || 0;
      const prof = Number(s.profit) || 0;

      totalPassesSold += qty;
      totalRevenue += rev;
      totalBuyingCost += cost;
      totalProfit += prof;

      // Check today
      if (s.dateSold === todayStr) {
        todaySalesCount += 1;
        todayRevenue += rev;
        todayProfit += prof;
      }

      // Check Pass Given status
      const statusClean = String(s.passGiven || '').trim().toLowerCase();
      if (statusClean === 'yes') {
        passesGivenCount += qty;
      } else {
        pendingDeliveryCount += qty;
      }
    });

    return {
      totalSalesCount,
      totalPassesSold,
      totalRevenue,
      totalBuyingCost,
      totalProfit,
      todaySalesCount,
      todayRevenue,
      todayProfit,
      passesGivenCount,
      pendingDeliveryCount
    };
  }, [filteredSales]);

  // Chart 1: Sales by Navratri Day
  const salesByDayData = useMemo(() => {
    const dayMap = {};
    const defaultDays = lists.navratriDays?.length ? lists.navratriDays : ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7', 'Day 8', 'Day 9'];
    defaultDays.forEach(d => {
      dayMap[d] = { name: d, passes: 0, revenue: 0, profit: 0 };
    });

    filteredSales.forEach(s => {
      const day = s.navratriDay || 'Unassigned';
      if (!dayMap[day]) {
        dayMap[day] = { name: day, passes: 0, revenue: 0, profit: 0 };
      }
      dayMap[day].passes += Number(s.quantity) || 0;
      dayMap[day].revenue += Number(s.totalSellingAmount) || 0;
      dayMap[day].profit += Number(s.profit) || 0;
    });

    return Object.values(dayMap);
  }, [filteredSales, lists.navratriDays]);

  // Chart 2: Category Breakdown Data
  const categoryData = useMemo(() => {
    const catMap = {};
    filteredSales.forEach(s => {
      const cat = s.passCategory || 'General';
      catMap[cat] = (catMap[cat] || 0) + (Number(s.quantity) || 0);
    });

    return Object.keys(catMap).map(cat => ({
      name: cat,
      value: catMap[cat]
    }));
  }, [filteredSales]);

  const PIE_COLORS = ['#f97316', '#3b82f6', '#10b981', '#a855f7', '#ec4899', '#64748b'];

  // Recent 10 Sales
  const recentSales = useMemo(() => {
    return [...filteredSales]
      .sort((a, b) => new Date(b.dateSold || 0) - new Date(a.dateSold || 0))
      .slice(0, 10);
  }, [filteredSales]);

  const handleEditSave = async (id, updatedData) => {
    try {
      const res = await api.put(`/sales/${id}`, updatedData);
      showSuccess('Sale record updated in Google Sheets successfully.');
      setEditingSale(null);
      fetchData();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update sale record.');
    }
  };

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setFilterPassName('');
    setFilterCategory('');
    setFilterNavratriDay('');
  };

  return (
    <div className="space-y-8">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-3xl shadow-lg border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold tracking-tight">Navratri Pass Sales Overview</h2>
          </div>
          <p className="text-xs text-slate-300">
            Real-time analytics and sales data synchronized with Google Sheets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-brand-400' : ''}`} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Dynamic Filter Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-brand-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Filter Analytics</h3>
          </div>
          {(dateFrom || dateTo || filterPassName || filterCategory || filterNavratriDay) && (
            <button
              onClick={clearFilters}
              className="text-xs font-semibold text-rose-600 hover:underline"
            >
              Reset All Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">To Date</label>
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
              <option value="">All Passes</option>
              {lists.passNames?.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Pass Category</label>
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
      </div>

      {/* Summary Cards Grid (8 Metrics) */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="1. Total Sales"
            value={stats.totalSalesCount}
            icon={ShoppingBag}
            color="brand"
            subtitle="Total sales transactions"
          />
          <StatCard
            title="2. Passes Sold"
            value={stats.totalPassesSold}
            icon={Ticket}
            color="indigo"
            subtitle="Sum of pass quantities"
          />
          <StatCard
            title="3. Total Revenue"
            value={formatRupee(stats.totalRevenue)}
            icon={IndianRupee}
            color="amber"
            subtitle="Gross selling amount"
          />
          <StatCard
            title="4. Total Profit"
            value={formatRupee(stats.totalProfit)}
            icon={TrendingUp}
            color={stats.totalProfit >= 0 ? "emerald" : "rose"}
            subtitle="Net revenue minus cost"
          />
          <StatCard
            title="5. Today's Sales"
            value={stats.todaySalesCount}
            icon={Clock}
            color="slate"
            subtitle="Sales booked today"
          />
          <StatCard
            title="6. Today's Profit"
            value={formatRupee(stats.todayProfit)}
            icon={TrendingUp}
            color="emerald"
            subtitle="Profit earned today"
          />
          <StatCard
            title="7. Passes Given"
            value={`${stats.passesGivenCount} passes`}
            icon={CheckCircle2}
            color="emerald"
            subtitle="Delivered passes"
          />
          <StatCard
            title="8. Pending Delivery"
            value={`${stats.pendingDeliveryCount} passes`}
            icon={AlertCircle}
            color="rose"
            subtitle="Not yet handed over"
          />
        </div>
      )}

      {/* Analytics Charts Grid */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart 1: Sales by Navratri Day */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Sales & Revenue by Navratri Day</h3>
                <p className="text-xs text-slate-400">Passes sold across Days 1 through 9</p>
              </div>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesByDayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', pt: '10px' }} />
                  <Bar dataKey="passes" name="Passes Sold" fill="#f97316" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="profit" name="Profit (₹)" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Category Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="mb-2">
              <h3 className="text-sm font-bold text-slate-800">Pass Category Distribution</h3>
              <p className="text-xs text-slate-400">General vs VIP vs Couple</p>
            </div>
            <div className="h-64 w-full flex items-center justify-center">
              {categoryData.length === 0 ? (
                <div className="text-xs text-slate-400">No data for selected filters</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '10px', border: 'none', color: '#fff', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="flex flex-wrap gap-2 justify-center pt-2">
              {categoryData.map((cat, idx) => (
                <div key={cat.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></div>
                  <span>{cat.name}: <strong>{cat.value}</strong></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Sales Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Recent 10 Sales Transactions</h3>
            <p className="text-xs text-slate-400">Latest sales entered into Google Sheets</p>
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={5} cols={8} />
        ) : recentSales.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No sales records match the current filter selection.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Pass Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Qty</th>
                  <th className="py-3 px-4 text-right">Selling Amount</th>
                  <th className="py-3 px-4 text-right">Profit</th>
                  <th className="py-3 px-4 text-center">Pass Given?</th>
                  <th className="py-3 px-4">Date Sold</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {recentSales.map((sale, idx) => {
                  const passBadge = getPassGivenBadgeProps(sale.passGiven);
                  return (
                    <tr key={sale.id || idx} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {sale.customerName}
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs truncate">
                        {sale.passName}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                          {sale.passCategory}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">
                        {sale.quantity}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-800">
                        {formatRupee(sale.totalSellingAmount)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`px-2 py-0.5 rounded-md font-bold ${sale.profit >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`}>
                          {formatRupee(sale.profit)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${passBadge.className}`}>
                          {passBadge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {formatDateDisplay(sale.dateSold)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setViewingSale(sale)}
                            title="View Details"
                            className="p-1 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingSale(sale)}
                            title="Edit Record"
                            className="p-1 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          >
                            <Edit className="w-4 h-4" />
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
    </div>
  );
}
