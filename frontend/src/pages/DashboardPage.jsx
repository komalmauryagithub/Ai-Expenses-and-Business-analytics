import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  TrendingUp, TrendingDown, DollarSign, Wallet, PiggyBank, Calendar,
  Plus, ArrowUpRight, ArrowDownRight, Filter, RefreshCw, AlertCircle,
  Loader2, Layers, Briefcase, CreditCard, PieChart as PieChartIcon, BarChart3,
  Shield, User, LogOut, ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

import Navbar from '../components/Navbar';

const CHART_COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#6366F1', '#14B8A6', '#64748B'];

const DashboardPage = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  // State Management
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [period, setPeriod] = useState('current_month');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [dashboardData, setDashboardData] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setApiError('');
    try {
      const params = new URLSearchParams();
      params.append('period', period);
      if (period === 'custom') {
        if (fromDate) params.append('from_date', fromDate);
        if (toDate) params.append('to_date', toDate);
      }

      const res = await api.get(`/dashboard?${params.toString()}`);
      if (res.data.success) {
        setDashboardData(res.data.data);
      } else {
        setApiError('Failed to fetch financial summary.');
      }
    } catch (err) {
      console.error('Fetch dashboard error:', err);
      const msg = err.response?.data?.message || 'Unable to connect to financial analytics service.';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const handleCustomDateSubmit = (e) => {
    e.preventDefault();
    if (period === 'custom') {
      fetchDashboardData();
    }
  };

  const formatRupee = (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return '₹0.00';
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const summary = dashboardData?.summary || {
    total_income: '0.00',
    total_expenses: '0.00',
    balance: '0.00',
    savings: '0.00',
    savings_rate: 0,
    expense_count: 0,
    income_count: 0,
  };

  const comparison = dashboardData?.comparison || {
    income_change_percentage: 0,
    expense_change_percentage: 0,
    balance_change_percentage: 0,
  };

  const periodInfo = dashboardData?.period || {};
  const expenseBreakdown = dashboardData?.expense_breakdown || [];
  const incomeBreakdown = dashboardData?.income_breakdown || [];
  const monthlyTrends = (dashboardData?.monthly_trends || []).map(item => ({
    ...item,
    incomeNum: parseFloat(item.income),
    expensesNum: parseFloat(item.expenses),
    balanceNum: parseFloat(item.balance),
  }));
  const recentTransactions = dashboardData?.recent_transactions || [];

  const isEmptyDashboard = parseFloat(summary.total_income) === 0 && parseFloat(summary.total_expenses) === 0 && recentTransactions.length === 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans w-full overflow-x-hidden">
      <Navbar />

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6 flex-grow">
        
        {/* Header & Date Selector */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 bg-slate-900/60 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] sm:text-xs font-semibold mb-1.5 sm:mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Financial Overview</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">{user?.name}</span>!
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5 sm:mt-1">
              {periodInfo.from && periodInfo.to ? `Showing financial figures for ${periodInfo.from} to ${periodInfo.to}` : 'Real-time database aggregated financial metrics.'}
            </p>
          </div>

          {/* Period Filter Selector */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs">
              <Calendar className="w-4 h-4 text-emerald-400 flex-shrink-0" />
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
                  className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-xs text-slate-500">to</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-xl font-medium transition"
                >
                  Apply
                </button>
              </form>
            )}

            <button
              onClick={fetchDashboardData}
              title="Refresh Dashboard Data"
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition flex items-center justify-center"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Global Error Banner with Retry */}
        {apiError && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center justify-between text-sm shadow-lg">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <span>{apiError}</span>
            </div>
            <button
              onClick={fetchDashboardData}
              className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-semibold rounded-xl border border-rose-500/40 transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          
          {/* Card 1: Total Income */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Total Income</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            {loading ? (
              <div className="h-7 sm:h-8 bg-slate-800 animate-pulse rounded-lg w-2/3 mb-2" />
            ) : (
              <div className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight truncate">
                {formatRupee(summary.total_income)}
              </div>
            )}
            <div className="mt-2.5 flex items-center justify-between text-[11px] sm:text-xs">
              <span className="text-slate-400 truncate">{summary.income_count} Transactions</span>
              {!loading && (
                <span className={`inline-flex items-center font-medium ${comparison.income_change_percentage >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {comparison.income_change_percentage >= 0 ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                  {Math.abs(comparison.income_change_percentage)}%
                </span>
              )}
            </div>
          </div>

          {/* Card 2: Total Expenses */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Total Expenses</span>
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            {loading ? (
              <div className="h-7 sm:h-8 bg-slate-800 animate-pulse rounded-lg w-2/3 mb-2" />
            ) : (
              <div className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight truncate">
                {formatRupee(summary.total_expenses)}
              </div>
            )}
            <div className="mt-2.5 flex items-center justify-between text-[11px] sm:text-xs">
              <span className="text-slate-400 truncate">{summary.expense_count} Transactions</span>
              {!loading && (
                <span className={`inline-flex items-center font-medium ${comparison.expense_change_percentage <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {comparison.expense_change_percentage <= 0 ? <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />}
                  {Math.abs(comparison.expense_change_percentage)}%
                </span>
              )}
            </div>
          </div>

          {/* Card 3: Net Balance */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Net Balance</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            {loading ? (
              <div className="h-7 sm:h-8 bg-slate-800 animate-pulse rounded-lg w-2/3 mb-2" />
            ) : (
              <div className={`text-xl sm:text-2xl lg:text-3xl font-black tracking-tight truncate ${parseFloat(summary.balance) >= 0 ? 'text-white' : 'text-rose-400'}`}>
                {formatRupee(summary.balance)}
              </div>
            )}
            <div className="mt-2.5 flex items-center justify-between text-[11px] sm:text-xs">
              <span className="text-slate-400 truncate">Income - Expenses</span>
              {!loading && (
                <span className={`inline-flex items-center font-medium ${comparison.balance_change_percentage >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {comparison.balance_change_percentage >= 0 ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                  {Math.abs(comparison.balance_change_percentage)}%
                </span>
              )}
            </div>
          </div>

          {/* Card 4: Savings Rate */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Savings Rate</span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <PiggyBank className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            {loading ? (
              <div className="h-7 sm:h-8 bg-slate-800 animate-pulse rounded-lg w-2/3 mb-2" />
            ) : (
              <div className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight truncate">
                {summary.savings_rate}%
              </div>
            )}
            <div className="mt-2.5 flex items-center justify-between text-[11px] sm:text-xs">
              <span className="text-slate-400 truncate">Savings: {formatRupee(summary.savings)}</span>
              <span className="text-purple-400 font-semibold truncate ml-1">
                {summary.savings_rate >= 20 ? 'Optimal' : 'Needs boost'}
              </span>
            </div>
          </div>
        </div>

        {/* Empty State Callout if user has no transactions */}
        {isEmptyDashboard && !loading && (
          <div className="bg-slate-900/80 border border-emerald-500/30 rounded-3xl p-8 text-center space-y-4 shadow-xl">
            <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl w-fit mx-auto border border-emerald-500/20">
              <Wallet className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-white">No Financial Data Yet</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              Your financial dashboard is currently empty for the selected period. Start adding your income sources and daily expenses to generate real-time charts and analytics!
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                to="/income"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 transition"
              >
                <Plus className="w-4 h-4" />
                Add First Income
              </Link>
              <Link
                to="/expenses"
                className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs px-4 py-2.5 rounded-xl transition"
              >
                <Plus className="w-4 h-4" />
                Add First Expense
              </Link>
            </div>
          </div>
        )}

        {/* Quick Actions Bar */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Quick Actions:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/expenses"
              className="inline-flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1.5 rounded-xl text-xs font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Expense
            </Link>
            <Link
              to="/income"
              className="inline-flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Income
            </Link>
            <Link
              to="/categories"
              className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-medium transition"
            >
              Manage Categories
            </Link>
            <Link
              to="/expenses"
              className="inline-flex items-center gap-1 text-slate-400 hover:text-white px-2.5 py-1.5 text-xs transition"
            >
              View All Expenses <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Chart 1: Monthly Financial Trend (2 Columns wide on Desktop) */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Monthly Income vs. Expense Trend</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">Last 6 Months</span>
            </div>

            {loading ? (
              <div className="h-64 bg-slate-800/50 animate-pulse rounded-2xl flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              </div>
            ) : monthlyTrends.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-xs">
                <span>No monthly trend data available yet.</span>
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
                    <Bar dataKey="incomeNum" name="Income" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expensesNum" name="Expenses" fill="#F43F5E" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Chart 2: Expense Category Breakdown (1 Column wide) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <PieChartIcon className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-white text-base">Expense Categories</h3>
              </div>
              <span className="text-xs text-slate-400">Share %</span>
            </div>

            {loading ? (
              <div className="h-64 bg-slate-800/50 animate-pulse rounded-2xl flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              </div>
            ) : expenseBreakdown.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-xs text-center space-y-2">
                <PieChartIcon className="w-10 h-10 text-slate-700" />
                <span>No expense records found for this period.</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseBreakdown}
                        dataKey="percentage"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={4}
                      >
                        {expenseBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '0.75rem', color: '#F8FAFC' }}
                        formatter={(value, name, item) => [`${value}% (${formatRupee(item.payload.amount)})`, item.payload.category]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* List Ranking of Top Expense Categories */}
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {expenseBreakdown.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/50">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                        <span className="text-slate-200 font-medium truncate max-w-[120px]">{item.category}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-white">{formatRupee(item.amount)}</span>
                        <span className="text-slate-400 ml-1 font-mono">({item.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lower Grid: Income Breakdown & Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Income Breakdown by Type (1 Column) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Briefcase className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Income Sources</h3>
              </div>
              <span className="text-xs text-slate-400">By Type</span>
            </div>

            {loading ? (
              <div className="h-56 bg-slate-800/50 animate-pulse rounded-2xl" />
            ) : incomeBreakdown.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-slate-500 text-xs text-center">
                <span>No income entries logged for this period.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {incomeBreakdown.map((item, idx) => (
                  <div key={idx} className="bg-slate-800/50 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white capitalize">{item.type}</span>
                      <span className="text-emerald-400 font-bold">{formatRupee(item.amount)}</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-700/50 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(item.percentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{item.count} Transactions</span>
                      <span className="font-mono">{item.percentage}% of total</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Transactions List (2 Columns wide) */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white text-base">Recent Transactions</h3>
              </div>
              <div className="flex items-center space-x-3">
                <Link to="/expenses" className="text-xs text-rose-400 hover:underline">Expenses</Link>
                <Link to="/income" className="text-xs text-emerald-400 hover:underline">Income</Link>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="h-14 bg-slate-800/50 animate-pulse rounded-2xl" />
                ))}
              </div>
            ) : recentTransactions.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-slate-500 text-xs text-center">
                <span>No recent financial activity recorded.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Title / Source</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Method / Type</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {recentTransactions.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-3 whitespace-nowrap text-slate-400 font-mono">
                          {item.date}
                        </td>
                        <td className="py-3 px-3 font-semibold text-white">
                          {item.title}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 font-medium">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-slate-400 capitalize">
                          {item.source_or_method}
                        </td>
                        <td className={`py-3 px-3 whitespace-nowrap text-right font-bold ${item.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {item.type === 'income' ? '+' : '-'}{formatRupee(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 bg-slate-950 py-4 text-center text-xs text-slate-500">
        AI Expense & Business Analytics SaaS &bull; Phase 4 Dashboard &bull; Currency: INR (₹)
      </footer>
    </div>
  );
};

export default DashboardPage;
