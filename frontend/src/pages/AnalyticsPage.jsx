import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import {
  LineChart, TrendingUp, TrendingDown, DollarSign, Wallet, PiggyBank, Calendar,
  Filter, RefreshCw, AlertCircle, Loader2, Layers, Briefcase, CreditCard,
  PieChart as PieChartIcon, BarChart3, Activity, ArrowUpRight, ArrowDownRight,
  Shield, User, Award, Percent, HelpCircle, AlertTriangle, Target, Scale,
  Clock, ArrowRightLeft, CheckCircle2, ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
  PieChart, Pie, Cell, LineChart as ReLineChart, Line
} from 'recharts';
import Navbar from '../components/Navbar';

const CHART_COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#6366F1', '#14B8A6', '#64748B'];

const AnalyticsPage = () => {
  const { logout } = useAuth();

  // Active Tab State
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'trends_patterns' | 'anomalies' | 'budgets_goals' | 'comparison'

  // Filter & State Management
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [period, setPeriod] = useState('current_month');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [analyticsData, setAnalyticsData] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setApiError('');
    try {
      const params = new URLSearchParams();
      params.append('period', period);
      if (period === 'custom') {
        if (fromDate) params.append('from_date', fromDate);
        if (toDate) params.append('to_date', toDate);
      }

      const res = await api.get(`/analytics/advanced-summary?${params.toString()}`);
      if (res.data.success) {
        setAnalyticsData(res.data.data);
      } else {
        setApiError('Failed to fetch advanced analytics data.');
      }
    } catch (err) {
      console.error('Fetch analytics error:', err);
      const msg = err.response?.data?.message || 'Analytics microservice is temporarily unavailable.';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const handleCustomDateSubmit = (e) => {
    e.preventDefault();
    if (period === 'custom') {
      fetchAnalytics();
    }
  };

  const formatRupee = (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return '₹0.00';
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const summary = analyticsData?.summary || {
    total_income: 0,
    total_expenses: 0,
    balance: 0,
    savings: 0,
    savings_rate: 0,
    average_expense: 0,
    median_expense: 0,
    largest_expense: 0,
    smallest_expense: 0,
    expense_count: 0,
    income_count: 0,
    descriptive_stats: { mean: 0, median: 0, std_dev: 0, p25: 0, p50: 0, p75: 0, max: 0, min: 0 }
  };

  const comparison = analyticsData?.comparison || {
    current_period: {}, previous_period: {},
    income: { current: 0, previous: 0, change: 0, percentage_change: 0 },
    expenses: { current: 0, previous: 0, change: 0, percentage_change: 0 },
    balance: { current: 0, previous: 0, change: 0, percentage_change: 0 },
    savings_rate: { current: 0, previous: 0, change: 0, percentage_change: 0 }
  };

  const expenseAnalytics = analyticsData?.expense_analytics || { categories: [], payment_methods: [], top_expenses: [] };
  const incomeAnalytics = analyticsData?.income_analytics || { types: [] };
  const monthlyTrends = analyticsData?.monthly_trends || [];
  const patterns = analyticsData?.patterns || { day_of_week: [], active_days_count: 0, avg_transactions_per_active_day: 0 };
  const anomalies = analyticsData?.anomalies || { available: false, anomalies: [], q1: 0, q3: 0, iqr: 0, upper_threshold: 0 };
  const budgetPerformance = analyticsData?.budget_performance || { total_budgeted: 0, total_spent: 0, utilization_rate: 0, budgets: [] };
  const goalPerformance = analyticsData?.goal_performance || { total_target_amount: 0, total_contributed: 0, average_completion_percentage: 0, goals: [] };

  const isEmptyAnalytics = summary.total_income === 0 && summary.total_expenses === 0 && summary.expense_count === 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans w-full overflow-x-hidden">
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">

        {/* Header & Filter Card */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[11px] sm:text-xs font-semibold mb-1.5 sm:mb-2">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span>Python FastAPI + Pandas + NumPy Microservice</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Activity className="w-6 h-6 sm:w-7 sm:h-7 text-purple-400 flex-shrink-0" />
              <span>Advanced Business Analytics & Insights</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5 sm:mt-1">
              Deterministic period comparisons, statistical outlier detection (IQR rule), day-of-week spending patterns, budget & goal progress.
            </p>
          </div>

          {/* Period Selection Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs">
              <Calendar className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="bg-transparent text-slate-100 font-medium focus:outline-none cursor-pointer"
              >
                <option value="current_month" className="bg-slate-900">Current Month</option>
                <option value="previous_month" className="bg-slate-900">Previous Month</option>
                <option value="last_7_days" className="bg-slate-900">Last 7 Days</option>
                <option value="last_30_days" className="bg-slate-900">Last 30 Days</option>
                <option value="last_90_days" className="bg-slate-900">Last 90 Days</option>
                <option value="current_year" className="bg-slate-900">Current Year</option>
                <option value="custom" className="bg-slate-900">Custom Date Range</option>
              </select>
            </div>

            {period === 'custom' && (
              <form onSubmit={handleCustomDateSubmit} className="flex items-center gap-2">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
                <span className="text-xs text-slate-500">to</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-500 text-white text-xs px-3 py-1.5 rounded-xl font-medium transition"
                >
                  Apply
                </button>
              </form>
            )}

            <button
              onClick={fetchAnalytics}
              title="Refresh Analytics Engine"
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition flex items-center justify-center"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 rounded-xl font-semibold text-xs transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            Executive Overview
          </button>

          <button
            onClick={() => setActiveTab('trends_patterns')}
            className={`px-4 py-2.5 rounded-xl font-semibold text-xs transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'trends_patterns'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Trends & Spending Patterns
          </button>

          <button
            onClick={() => setActiveTab('anomalies')}
            className={`px-4 py-2.5 rounded-xl font-semibold text-xs transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'anomalies'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Unusual Expenses (IQR Outliers)
            {anomalies.total_anomalies_found > 0 && (
              <span className="bg-amber-500/20 text-amber-300 text-[10px] px-1.5 py-0.5 rounded-full border border-amber-500/30">
                {anomalies.total_anomalies_found}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('budgets_goals')}
            className={`px-4 py-2.5 rounded-xl font-semibold text-xs transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'budgets_goals'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Target className="w-4 h-4" />
            Budgets & Goals Performance
          </button>

          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-4 py-2.5 rounded-xl font-semibold text-xs transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'comparison'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            Period Comparison
          </button>
        </div>

        {/* Global Error Banner */}
        {apiError && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center justify-between text-sm shadow-lg">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <span>{apiError}</span>
            </div>
            <button
              onClick={fetchAnalytics}
              className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-semibold rounded-xl border border-rose-500/40 transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* TAB 1: EXECUTIVE OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Metric Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Income Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Total Income</span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white">{formatRupee(summary.total_income)}</div>
                <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
                  <span>{summary.income_count} Entries</span>
                  <span className={`font-semibold ${comparison.income.percentage_change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {comparison.income.percentage_change >= 0 ? '+' : ''}{comparison.income.percentage_change}% vs prev
                  </span>
                </div>
              </div>

              {/* Expense Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Total Expenses</span>
                  <TrendingDown className="w-4 h-4 text-rose-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white">{formatRupee(summary.total_expenses)}</div>
                <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
                  <span>{summary.expense_count} Entries</span>
                  <span className={`font-semibold ${comparison.expenses.percentage_change <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {comparison.expenses.percentage_change >= 0 ? '+' : ''}{comparison.expenses.percentage_change}% vs prev
                  </span>
                </div>
              </div>

              {/* Mean & Median Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Mean Expense</span>
                  <BarChart3 className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white">{formatRupee(summary.average_expense)}</div>
                <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
                  <span>Median: <strong className="text-white">{formatRupee(summary.median_expense)}</strong></span>
                  <span className="text-purple-400 font-semibold">NumPy Stat</span>
                </div>
              </div>

              {/* Savings Rate Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Savings Rate</span>
                  <PiggyBank className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white">{summary.savings_rate}%</div>
                <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
                  <span>Balance: {formatRupee(summary.balance)}</span>
                  <span className="text-blue-400 font-semibold">{summary.savings_rate >= 20 ? 'Optimal' : 'Standard'}</span>
                </div>
              </div>
            </div>

            {/* Monthly Trend & NumPy Stats Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Monthly Trend Chart */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-purple-400" />
                    <h3 className="font-bold text-white text-base">Pandas Resampled Monthly Trends</h3>
                  </div>
                  <span className="text-xs text-slate-400">Income vs Expenses</span>
                </div>

                {loading ? (
                  <div className="h-64 bg-slate-800/50 animate-pulse rounded-2xl flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                  </div>
                ) : monthlyTrends.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-xs">
                    <span>No monthly trend data available.</span>
                  </div>
                ) : (
                  <div className="h-72 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                        <XAxis dataKey="month_label" stroke="#94A3B8" fontSize={12} tickLine={false} />
                        <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '0.75rem', color: '#F8FAFC' }}
                          formatter={(val) => [formatRupee(val), '']}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                        <Bar dataKey="income" name="Income" fill="#10B981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expenses" name="Expenses" fill="#F43F5E" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* NumPy Descriptive Statistics Box */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <Percent className="w-5 h-5 text-teal-400" />
                    <h3 className="font-bold text-white text-base">NumPy Descriptive Stats</h3>
                  </div>
                  <span className="text-xs text-slate-400">Statistical Distribution</span>
                </div>

                {loading ? (
                  <div className="h-64 bg-slate-800/50 animate-pulse rounded-2xl" />
                ) : (
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between p-2.5 rounded-xl bg-slate-800/50">
                      <span className="text-slate-400">Mean Expense</span>
                      <span className="font-bold text-white">{formatRupee(summary.descriptive_stats.mean)}</span>
                    </div>
                    <div className="flex justify-between p-2.5 rounded-xl bg-slate-800/50">
                      <span className="text-slate-400">Median Expense (P50)</span>
                      <span className="font-bold text-white">{formatRupee(summary.descriptive_stats.median)}</span>
                    </div>
                    <div className="flex justify-between p-2.5 rounded-xl bg-slate-800/50">
                      <span className="text-slate-400">Standard Deviation</span>
                      <span className="font-bold text-purple-400">{formatRupee(summary.descriptive_stats.std_dev)}</span>
                    </div>
                    <div className="flex justify-between p-2.5 rounded-xl bg-slate-800/50">
                      <span className="text-slate-400">25th Percentile (P25)</span>
                      <span className="font-bold text-white">{formatRupee(summary.descriptive_stats.p25)}</span>
                    </div>
                    <div className="flex justify-between p-2.5 rounded-xl bg-slate-800/50">
                      <span className="text-slate-400">75th Percentile (P75)</span>
                      <span className="font-bold text-white">{formatRupee(summary.descriptive_stats.p75)}</span>
                    </div>
                    <div className="flex justify-between p-2.5 rounded-xl bg-slate-800/50">
                      <span className="text-slate-400">Max / Min Spread</span>
                      <span className="font-bold text-emerald-400">{formatRupee(summary.descriptive_stats.max)} / {formatRupee(summary.descriptive_stats.min)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Methods & Top Expenses */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-5 h-5 text-blue-400" />
                    <h3 className="font-bold text-white text-base">Payment Methods</h3>
                  </div>
                  <span className="text-xs text-slate-400">Pandas Breakdown</span>
                </div>

                {expenseAnalytics.payment_methods.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-slate-500 text-xs">No payment methods recorded.</div>
                ) : (
                  <div className="space-y-3">
                    {expenseAnalytics.payment_methods.map((pm, idx) => (
                      <div key={idx} className="bg-slate-800/50 border border-slate-800 rounded-2xl p-3 space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-white">{pm.payment_method}</span>
                          <span className="font-bold text-blue-400">{formatRupee(pm.amount)}</span>
                        </div>
                        <div className="w-full bg-slate-700/50 h-2 rounded-full overflow-hidden">
                          <div className="bg-blue-500 h-full rounded-full" style={{ width: `${Math.min(pm.percentage, 100)}%` }} />
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-400">
                          <span>{pm.count} Transactions</span>
                          <span className="font-mono">{pm.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <Award className="w-5 h-5 text-amber-400" />
                    <h3 className="font-bold text-white text-base">Top 5 Expense Transactions</h3>
                  </div>
                  <span className="text-xs text-slate-400">Ranked by Amount</span>
                </div>

                {expenseAnalytics.top_expenses.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-slate-500 text-xs">No expense records found.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950/60 text-slate-400 font-semibold uppercase border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Description</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3">Method</th>
                          <th className="py-2.5 px-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {expenseAnalytics.top_expenses.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-800/40 transition">
                            <td className="py-3 px-3 font-mono text-slate-400">{item.date}</td>
                            <td className="py-3 px-3 font-semibold text-white">{item.description}</td>
                            <td className="py-3 px-3"><span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-medium">{item.category}</span></td>
                            <td className="py-3 px-3 text-slate-400">{item.payment_method}</td>
                            <td className="py-3 px-3 text-right font-bold text-rose-400">-{formatRupee(item.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TRENDS & SPENDING PATTERNS */}
        {activeTab === 'trends_patterns' && (
          <div className="space-y-6">
            {/* Day of Week Spending Bar Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  <h3 className="font-bold text-white text-base">Day-of-Week Spending Distribution</h3>
                </div>
                <div className="text-xs text-slate-400">
                  Active Days: <strong className="text-purple-300">{patterns.active_days_count}</strong> | Avg Txn/Day: <strong className="text-purple-300">{patterns.avg_transactions_per_active_day}</strong>
                </div>
              </div>

              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={patterns.day_of_week} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="day" stroke="#94A3B8" fontSize={12} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '0.75rem', color: '#F8FAFC' }}
                      formatter={(val) => [formatRupee(val), 'Total Outflow']}
                    />
                    <Bar dataKey="amount" name="Spending Amount" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Key Insights Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-slate-800/50 border border-slate-700/60 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-semibold">Peak Spending Day</span>
                    <div className="text-lg font-bold text-rose-400 mt-0.5">{patterns.highest_spending_day?.day || 'N/A'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-extrabold text-white">{formatRupee(patterns.highest_spending_day?.amount || 0)}</div>
                    <span className="text-[11px] text-slate-400">{patterns.highest_spending_day?.percentage || 0}% of weekly volume</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-800/50 border border-slate-700/60 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-semibold">Lowest Spending Day</span>
                    <div className="text-lg font-bold text-emerald-400 mt-0.5">{patterns.lowest_spending_day?.day || 'N/A'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-extrabold text-white">{formatRupee(patterns.lowest_spending_day?.amount || 0)}</div>
                    <span className="text-[11px] text-slate-400">{patterns.lowest_spending_day?.percentage || 0}% of weekly volume</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Income Type Breakdown Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-white text-base">Income Sources Distribution</h3>
                </div>
                <span className="text-xs text-slate-400">Total Income: {formatRupee(incomeAnalytics.total_income)}</span>
              </div>

              {incomeAnalytics.types.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-slate-500 text-xs">No income entries found for this period.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {incomeAnalytics.types.map((type, idx) => (
                    <div key={idx} className="p-4 bg-slate-800/40 border border-slate-800 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                        <div>
                          <div className="font-semibold text-white text-sm">{type.type}</div>
                          <div className="text-xs text-slate-400">{type.count} Transactions</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-emerald-400 text-sm">{formatRupee(type.amount)}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{type.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: UNUSUAL EXPENSES (IQR OUTLIERS) */}
        {activeTab === 'anomalies' && (
          <div className="space-y-6">
            {/* Outlier Detection Summary Header */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">Statistical Outlier Detection Engine</h3>
                    <p className="text-xs text-slate-400">Interquartile Range (IQR) Rule: Threshold = Q3 + 1.5 &times; IQR</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Upper Outlier Threshold</div>
                  <div className="text-xl font-black text-amber-400">{formatRupee(anomalies.upper_threshold)}</div>
                </div>
              </div>

              {/* Statistical Bounds Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-800/50 rounded-xl">
                  <span className="text-slate-400">Q1 (25th Percentile)</span>
                  <div className="font-bold text-white text-sm mt-0.5">{formatRupee(anomalies.q1)}</div>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-xl">
                  <span className="text-slate-400">Q3 (75th Percentile)</span>
                  <div className="font-bold text-white text-sm mt-0.5">{formatRupee(anomalies.q3)}</div>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-xl">
                  <span className="text-slate-400">IQR (Q3 - Q1)</span>
                  <div className="font-bold text-purple-400 text-sm mt-0.5">{formatRupee(anomalies.iqr)}</div>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-xl">
                  <span className="text-slate-400">Outliers Found</span>
                  <div className="font-bold text-amber-400 text-sm mt-0.5">{anomalies.total_anomalies_found || 0}</div>
                </div>
              </div>
            </div>

            {/* Outliers List or Disclaimer State */}
            {!anomalies.available ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 text-center space-y-3">
                <Shield className="w-10 h-10 text-slate-500 mx-auto" />
                <h4 className="font-bold text-white text-base">Insufficient Transaction Volume</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">{anomalies.reason}</p>
              </div>
            ) : anomalies.anomalies.length === 0 ? (
              <div className="bg-slate-900/60 border border-emerald-500/20 rounded-3xl p-8 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="font-bold text-white text-base">No Unusual Expenses Detected</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  All transaction amounts fall safely within the expected statistical range ($&le; {formatRupee(anomalies.upper_threshold)}$).
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm uppercase tracking-wider">Detected High-Value Outliers</h4>
                  <span className="text-xs bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2.5 py-1 rounded-full font-medium">
                    Disclaimer: Flagged via deterministic statistical rules, not machine learning predictions.
                  </span>
                </div>

                <div className="space-y-3">
                  {anomalies.anomalies.map((item) => (
                    <div key={item.id} className="p-4 bg-slate-900 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-lg">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20 flex-shrink-0 mt-0.5">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-white text-sm">{item.description}</span>
                            <span className="text-[10px] bg-slate-800 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-semibold uppercase">
                              {item.flag_type}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-1 flex items-center space-x-3">
                            <span>Date: <strong className="text-slate-300">{item.date}</strong></span>
                            <span>Category: <strong className="text-slate-300">{item.category}</strong></span>
                            <span>Method: <strong className="text-slate-300">{item.payment_method}</strong></span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0">
                        <div className="text-lg font-black text-rose-400">-{formatRupee(item.amount)}</div>
                        <div className="text-[11px] text-amber-300 font-mono">
                          +{formatRupee(item.deviation_above_threshold)} above IQR threshold
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: BUDGETS & GOALS PERFORMANCE */}
        {activeTab === 'budgets_goals' && (
          <div className="space-y-6">
            {/* Budget Utilization Grid */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Wallet className="w-5 h-5 text-purple-400" />
                  <h3 className="font-bold text-white text-base">Budget Performance & Utilization</h3>
                </div>
                <div className="text-xs text-slate-400">
                  Overall Utilization: <strong className="text-purple-300">{budgetPerformance.utilization_rate}%</strong>
                </div>
              </div>

              {budgetPerformance.budgets.length === 0 ? (
                <div className="h-32 flex items-center justify-center text-slate-500 text-xs">No active budgets found.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {budgetPerformance.budgets.map((b) => (
                    <div key={b.id} className="p-4 bg-slate-800/40 border border-slate-800 rounded-2xl space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-white text-sm">{b.category}</span>
                        <span className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                          b.status === 'over_budget' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                          b.status === 'near_limit' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {b.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="w-full bg-slate-700/50 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            b.status === 'over_budget' ? 'bg-rose-500' :
                            b.status === 'near_limit' ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(b.utilization_percentage, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Spent: <strong className="text-white">{formatRupee(b.amount_spent)}</strong></span>
                        <span>Budget: <strong className="text-slate-300">{formatRupee(b.budget_amount)}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Financial Goal Progress Grid */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-blue-400" />
                  <h3 className="font-bold text-white text-base">Financial Goal Completion Metrics</h3>
                </div>
                <div className="text-xs text-slate-400">
                  Avg Completion: <strong className="text-blue-300">{goalPerformance.average_completion_percentage}%</strong>
                </div>
              </div>

              {goalPerformance.goals.length === 0 ? (
                <div className="h-32 flex items-center justify-center text-slate-500 text-xs">No active financial goals found.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {goalPerformance.goals.map((g) => (
                    <div key={g.id} className="p-4 bg-slate-800/40 border border-slate-800 rounded-2xl space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-white text-sm">{g.name}</span>
                        <span className="font-mono text-blue-400 font-bold">{g.completion_percentage}%</span>
                      </div>
                      <div className="w-full bg-slate-700/50 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full" style={{ width: `${Math.min(g.completion_percentage, 100)}%` }} />
                      </div>
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Contributed: <strong className="text-emerald-400">{formatRupee(g.current_amount)}</strong></span>
                        <span>Target: <strong className="text-slate-300">{formatRupee(g.target_amount)}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: PERIOD COMPARISON */}
        {activeTab === 'comparison' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <ArrowRightLeft className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-white text-base">Period-over-Period Performance Comparison</h3>
              </div>
              <span className="text-xs text-slate-400">Comparing current selection vs previous timeframe</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Income Comparison */}
              <div className="p-4 bg-slate-800/50 border border-slate-800 rounded-2xl space-y-2">
                <div className="text-xs text-slate-400 uppercase font-semibold">Income Comparison</div>
                <div className="text-xl font-bold text-white">{formatRupee(comparison.income.current)}</div>
                <div className="text-xs text-slate-400">Previous: {formatRupee(comparison.income.previous)}</div>
                <div className={`text-xs font-bold ${comparison.income.percentage_change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {comparison.income.percentage_change >= 0 ? '+' : ''}{comparison.income.percentage_change}% ({formatRupee(comparison.income.change)})
                </div>
              </div>

              {/* Expense Comparison */}
              <div className="p-4 bg-slate-800/50 border border-slate-800 rounded-2xl space-y-2">
                <div className="text-xs text-slate-400 uppercase font-semibold">Expense Comparison</div>
                <div className="text-xl font-bold text-white">{formatRupee(comparison.expenses.current)}</div>
                <div className="text-xs text-slate-400">Previous: {formatRupee(comparison.expenses.previous)}</div>
                <div className={`text-xs font-bold ${comparison.expenses.percentage_change <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {comparison.expenses.percentage_change >= 0 ? '+' : ''}{comparison.expenses.percentage_change}% ({formatRupee(comparison.expenses.change)})
                </div>
              </div>

              {/* Net Balance Comparison */}
              <div className="p-4 bg-slate-800/50 border border-slate-800 rounded-2xl space-y-2">
                <div className="text-xs text-slate-400 uppercase font-semibold">Net Balance Comparison</div>
                <div className="text-xl font-bold text-white">{formatRupee(comparison.balance.current)}</div>
                <div className="text-xs text-slate-400">Previous: {formatRupee(comparison.balance.previous)}</div>
                <div className={`text-xs font-bold ${comparison.balance.percentage_change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {comparison.balance.percentage_change >= 0 ? '+' : ''}{comparison.balance.percentage_change}% ({formatRupee(comparison.balance.change)})
                </div>
              </div>

              {/* Savings Rate Comparison */}
              <div className="p-4 bg-slate-800/50 border border-slate-800 rounded-2xl space-y-2">
                <div className="text-xs text-slate-400 uppercase font-semibold">Savings Rate Comparison</div>
                <div className="text-xl font-bold text-white">{comparison.savings_rate.current}%</div>
                <div className="text-xs text-slate-400">Previous: {comparison.savings_rate.previous}%</div>
                <div className={`text-xs font-bold ${comparison.savings_rate.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {comparison.savings_rate.change >= 0 ? '+' : ''}{comparison.savings_rate.change}% points change
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 bg-slate-950 py-4 text-center text-xs text-slate-500">
        AI Expense & Business Analytics SaaS &bull; Phase 7 Advanced Analytics Microservice
      </footer>
    </div>
  );
};

export default AnalyticsPage;
