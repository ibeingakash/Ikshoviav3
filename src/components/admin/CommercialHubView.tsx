import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  CreditCard,
  Key,
  Users,
  AlertTriangle,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  RefreshCw,
  ShoppingBag,
  Tag,
  Download,
  Filter,
  BarChart3,
  ExternalLink,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { api } from '../../lib/api.js';
import {
  CommercialDashboardMetrics,
  RevenueAnalyticsMetrics,
  CourseSalesAnalytics,
} from '../../types/index.js';
import { useLearner } from '../../context/LearnerContext.js';

export const CommercialHubView: React.FC = () => {
  const { setActiveSection } = useLearner();
  const [metrics, setMetrics] = useState<CommercialDashboardMetrics | null>(null);
  const [analytics, setAnalytics] = useState<RevenueAnalyticsMetrics | null>(null);
  const [courseSales, setCourseSales] = useState<CourseSalesAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<string>('30days');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashMetrics, revAnalytics, salesData] = await Promise.all([
        api.getCommercialMetrics(),
        api.getRevenueAnalytics(timeRange, customStart || undefined, customEnd || undefined),
        api.getCourseSalesAnalytics(timeRange, customStart || undefined, customEnd || undefined),
      ]);
      setMetrics(dashMetrics);
      setAnalytics(revAnalytics);
      setCourseSales(salesData);
    } catch (err: any) {
      console.error('Failed to load commercial dashboard data:', err);
      setError(err.message || 'Failed to load commercial analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [timeRange]);

  const handleApplyCustomDates = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStart || !customEnd) return;
    fetchAllData();
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16 max-w-7xl mx-auto font-sans-editorial">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-900 border border-amber-300 shadow-2xs">
              <TrendingUp className="w-5 h-5 text-amber-800" />
            </div>
            <div>
              <h1 className="text-2xl font-serif-editorial font-bold text-[#111426] flex items-center gap-2">
                Commercial & Financial Hub
              </h1>
              <p className="text-xs text-stone-500 font-medium">
                Executive revenue analytics, payment reconciliation, course sales performance, and subscription lifecycle metrics.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Quick Hub Navigation Shortcuts */}
          <button
            onClick={() => setActiveSection('admin-coupons')}
            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Manage Coupons</span>
          </button>
          <button
            onClick={() => setActiveSection('admin-entitlements')}
            className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Subscriptions</span>
          </button>
          <button
            onClick={() => setActiveSection('admin-payments')}
            className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Razorpay Logs</span>
          </button>
          <button
            onClick={fetchAllData}
            className="p-2 bg-white hover:bg-stone-50 text-stone-600 border border-stone-200 rounded-xl cursor-pointer shadow-2xs"
            title="Refresh Commercial Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* PRIMARY COMMERCIAL KPIS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Net Revenue */}
        <div className="p-5 bg-white border border-stone-200/80 rounded-2xl shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-medium">Net Realized Revenue</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif-editorial text-[#111426]">
            ₹{(metrics?.totalRevenue || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-stone-500 mt-1 flex items-center gap-1">
            <span className="font-bold text-emerald-700">100% verified</span>
            <span>via Razorpay webhook/signature</span>
          </div>
        </div>

        {/* Successful Orders */}
        <div className="p-5 bg-white border border-stone-200/80 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-medium">Verified Paid Orders</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif-editorial text-indigo-700">
            {metrics?.totalOrders || 0}
          </div>
          <div className="text-[11px] text-stone-500 mt-1 flex items-center gap-1">
            <span>Avg Order:</span>
            <span className="font-mono font-bold text-stone-700">
              ₹{(metrics?.averageOrderValue || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Active Paid Users */}
        <div className="p-5 bg-white border border-stone-200/80 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-medium">Active Subscribed Learners</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif-editorial text-amber-800">
            {metrics?.activePaidUsers || 0}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            Holding active, unexpired course passes
          </div>
        </div>

        {/* Total Discounts Granted */}
        <div className="p-5 bg-white border border-stone-200/80 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-medium">Total Coupon Discounts</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif-editorial text-stone-800">
            ₹{(metrics?.totalDiscountGiven || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-stone-500 mt-1 flex items-center gap-1">
            <span className="font-bold text-amber-800">{metrics?.activeCouponsCount || 0}</span>
            <span>active promotional offers in market</span>
          </div>
        </div>
      </div>

      {/* SUBSCRIPTION HEALTH & LIFECYCLE BAR */}
      <div className="p-4 bg-gradient-to-r from-amber-50/70 via-stone-50 to-stone-50 border border-amber-200/80 rounded-2xl shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-bold text-xs text-amber-950 font-serif-editorial">
              <Clock className="w-4 h-4 text-amber-700" />
              <span>SUBSCRIPTION RENEWAL & EXPIRY MONITOR</span>
            </div>
            <p className="text-[11px] text-stone-600 mt-0.5">
              Identifies active learners nearing expiry so team can extend access or launch renewal offers.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-amber-200 shadow-2xs">
              <span className="text-stone-500 font-medium">Expiring in 7 Days:</span>
              <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                {metrics?.expiringNext7Days || 0} learners
              </span>
            </div>

            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-amber-200 shadow-2xs">
              <span className="text-stone-500 font-medium">Expiring in 30 Days:</span>
              <span className="font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full">
                {metrics?.expiringNext30Days || 0} learners
              </span>
            </div>

            <button
              onClick={() => setActiveSection('admin-entitlements')}
              className="text-xs font-bold text-amber-900 hover:text-amber-950 underline flex items-center gap-1 cursor-pointer"
            >
              <span>View Access List</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* TIME RANGE CONTROLS & REVENUE TREND CHART */}
      <div className="p-6 bg-white border border-stone-200/80 rounded-2xl shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div>
            <h2 className="text-base font-bold font-serif-editorial text-stone-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-700" />
              <span>Revenue Trend & Velocity</span>
            </h2>
            <p className="text-xs text-stone-400">
              Daily realized receipts and transaction volume over selected timeframe
            </p>
          </div>

          {/* Timeframe Selector */}
          <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl text-xs font-bold">
            {(['today', '7days', '30days', '90days', 'all'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  timeRange === range
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {range === 'today'
                  ? 'Today'
                  : range === '7days'
                  ? '7D'
                  : range === '30days'
                  ? '30D'
                  : range === '90days'
                  ? '90D'
                  : 'All Time'}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Filter if needed */}
        <div className="flex items-center gap-3 text-xs text-stone-500">
          <Calendar className="w-3.5 h-3.5 text-stone-400" />
          <span>Custom Interval:</span>
          <input
            type="date"
            value={customStart}
            onChange={e => setCustomStart(e.target.value)}
            className="bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-stone-800 text-xs focus:outline-none"
          />
          <span>to</span>
          <input
            type="date"
            value={customEnd}
            onChange={e => setCustomEnd(e.target.value)}
            className="bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-stone-800 text-xs focus:outline-none"
          />
          <button
            onClick={handleApplyCustomDates}
            disabled={!customStart || !customEnd}
            className="px-3 py-1 bg-stone-800 hover:bg-stone-900 text-white rounded-lg font-bold text-xs cursor-pointer disabled:opacity-50"
          >
            Apply Dates
          </button>
        </div>

        {/* Trend Area Chart */}
        <div className="h-64 w-full pt-2">
          {analytics?.dailyBreakdown && analytics.dailyBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.dailyBreakdown} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D97706" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#D97706" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                <XAxis
                  dataKey="date"
                  tickFormatter={str => {
                    const d = new Date(str);
                    return `${d.getDate()}/${d.getMonth() + 1}`;
                  }}
                  stroke="#a8a29e"
                  fontSize={10}
                />
                <YAxis
                  stroke="#a8a29e"
                  fontSize={10}
                  tickFormatter={val => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                  labelFormatter={label => `Date: ${new Date(label).toLocaleDateString()}`}
                  contentStyle={{
                    backgroundColor: '#1C1917',
                    borderColor: '#44403C',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#D97706"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#revenueGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-stone-400 text-xs">
              No revenue transactions recorded in this selected time range.
            </div>
          )}
        </div>
      </div>

      {/* COURSE SALES PERFORMANCE TABLE */}
      <div className="bg-white border border-stone-200/80 rounded-2xl shadow-2xs overflow-hidden space-y-0">
        <div className="p-4 border-b border-stone-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold font-serif-editorial text-stone-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-700" />
              <span>Course Sales & Revenue Breakdown</span>
            </h2>
            <p className="text-xs text-stone-400">
              Units purchased, gross volume, promotional discount write-downs, and net collected revenue per course
            </p>
          </div>
          <div className="text-xs text-stone-500 font-mono font-bold">
            Total Courses: {courseSales.length}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/70 text-[11px] font-mono uppercase text-stone-500 tracking-wider">
                <th className="py-3 px-4">Course Product & Exam</th>
                <th className="py-3 px-3 text-right">Units Sold</th>
                <th className="py-3 px-3 text-right">Gross Sales</th>
                <th className="py-3 px-3 text-right">Discounts</th>
                <th className="py-3 px-3 text-right">Net Revenue</th>
                <th className="py-3 px-4 text-right">Active Passes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-stone-400" />
                    Loading course sales performance...
                  </td>
                </tr>
              ) : courseSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-500">
                    No course sales data found for the specified period.
                  </td>
                </tr>
              ) : (
                courseSales.map(course => (
                  <tr key={course.courseId} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-stone-900">{course.courseName}</div>
                      <div className="text-[11px] text-stone-500 flex items-center gap-1.5">
                        <span className="font-mono uppercase font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                          {course.exam}
                        </span>
                        <span>•</span>
                        <span>{course.courseType}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-stone-800">
                      {course.unitsSold}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-stone-600">
                      ₹{course.grossRevenue.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-rose-600">
                      {course.totalDiscount > 0
                        ? `-₹${course.totalDiscount.toLocaleString('en-IN')}`
                        : '₹0'}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800 text-sm">
                      ₹{course.netRevenue.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <span className="inline-block px-2.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-900 font-mono font-bold text-xs rounded-full">
                        {course.activeEntitlementsCount} Active
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
