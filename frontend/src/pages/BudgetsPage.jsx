import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import {
  PieChart, Plus, Edit2, Trash2, Search, Filter, Calendar, DollarSign,
  Loader2, AlertCircle, CheckCircle2, RefreshCw, X, Layers, AlertTriangle,
  ArrowUpRight, TrendingUp, PiggyBank, Target
} from 'lucide-react';

const BudgetsPage = () => {
  const { logout } = useAuth();

  // Data State
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [periodFilter, setPeriodFilter] = useState('all'); // all, active, upcoming, past
  const [categoryId, setCategoryId] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [formName, setFormName] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [formEndDate, setFormEndDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
  );
  const [formThreshold, setFormThreshold] = useState('80');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete State
  const [deletingBudget, setDeletingBudget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories?type=expense');
      setCategories(res.data.data.categories || []);
    } catch (err) {
      console.error('Fetch categories error:', err);
    }
  };

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      if (periodFilter !== 'all') params.append('period', periodFilter);
      if (categoryId) params.append('category_id', categoryId);
      if (search) params.append('search', search);

      const res = await api.get(`/budgets?${params.toString()}`);
      setBudgets(res.data.data.items || []);
      setPagination(res.data.data.pagination || {});
      setApiError('');
    } catch (err) {
      console.error('Fetch budgets error:', err);
      setApiError('Failed to load budget records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchBudgets();
  }, [page, periodFilter, categoryId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchBudgets();
  };

  const handleResetFilters = () => {
    setPeriodFilter('all');
    setCategoryId('');
    setSearch('');
    setPage(1);
  };

  const openAddModal = () => {
    setEditingBudget(null);
    setFormName('');
    setFormAmount('');
    setFormCategory('');
    setFormStartDate(new Date().toISOString().split('T')[0]);
    setFormEndDate(
      new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
    );
    setFormThreshold('80');
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (b) => {
    setEditingBudget(b);
    setFormName(b.name || '');
    setFormAmount(b.amount || '');
    setFormCategory(b.category_id || '');
    setFormStartDate(b.start_date || '');
    setFormEndDate(b.end_date || '');
    setFormThreshold(b.alert_threshold ? b.alert_threshold.toString() : '80');
    setFormError('');
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formName.trim()) {
      setFormError('Budget name is required.');
      return;
    }
    if (!formAmount || parseFloat(formAmount) <= 0) {
      setFormError('Please enter a valid positive budget amount.');
      return;
    }
    if (!formStartDate || !formEndDate) {
      setFormError('Start date and end date are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formName.trim(),
        amount: parseFloat(formAmount),
        start_date: formStartDate,
        end_date: formEndDate,
        alert_threshold: parseFloat(formThreshold) || 80,
        category_id: formCategory ? parseInt(formCategory, 10) : null,
      };

      if (editingBudget) {
        await api.patch(`/budgets/${editingBudget.id}`, payload);
        setSuccessMsg('Budget updated successfully.');
      } else {
        await api.post('/budgets', payload);
        setSuccessMsg('Budget created successfully.');
      }

      setShowModal(false);
      fetchBudgets();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Save budget error:', err);
      const msg = err.response?.data?.message || 'Failed to save budget.';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingBudget) return;
    setIsDeleting(true);
    try {
      await api.delete(`/budgets/${deletingBudget.id}`);
      setSuccessMsg('Budget deleted successfully.');
      setDeletingBudget(null);
      fetchBudgets();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Delete budget error:', err);
      setApiError('Failed to delete budget.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatRupee = (val) => {
    const num = parseFloat(val);
    return isNaN(num) ? '₹0.00' : `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'over_budget':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">Over Budget</span>;
      case 'near_limit':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">Near Limit</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">Under Budget</span>;
    }
  };

  // Aggregated Summary
  const totalBudgeted = budgets.reduce((acc, b) => acc + parseFloat(b.amount || 0), 0);
  const totalSpent = budgets.reduce((acc, b) => acc + parseFloat(b.spent || 0), 0);
  const nearOrOverCount = budgets.filter(b => b.status === 'near_limit' || b.status === 'over_budget').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-amber-600/20 p-2 rounded-xl border border-amber-500/30 text-amber-400">
              <PieChart className="w-6 h-6" />
            </div>
            <span className="font-bold text-lg text-white tracking-tight">AI Expense SaaS</span>
            <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">Budget Planning</span>
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/dashboard" className="text-sm text-slate-300 hover:text-white transition">Dashboard</Link>
            <Link to="/expenses" className="text-sm text-slate-300 hover:text-white transition">Expenses</Link>
            <Link to="/income" className="text-sm text-slate-300 hover:text-white transition">Income</Link>
            <Link to="/categories" className="text-sm text-slate-300 hover:text-white transition">Categories</Link>
            <Link to="/budgets" className="text-sm font-semibold text-amber-400 border-b-2 border-amber-400 pb-1">Budgets</Link>
            <Link to="/goals" className="text-sm text-slate-300 hover:text-white transition">Goals</Link>
            <Link to="/profile" className="text-sm text-slate-300 hover:text-white transition">Profile</Link>
            <button
              onClick={logout}
              className="text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 px-3 py-1.5 rounded-xl transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <PieChart className="w-7 h-7 text-amber-400" />
              Budget Management
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Set spending limits for overall expenses or category-specific targets with automated alerts.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-medium text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-amber-600/20 transition transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Create Budget
          </button>
        </div>

        {/* Global Alerts */}
        {apiError && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{apiError}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Allocated Budget</span>
              <DollarSign className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">
              {formatRupee(totalBudgeted)}
            </div>
            <p className="text-xs text-slate-400 mt-1">Combined limits in current view</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Actual Spent</span>
              <TrendingUp className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">
              {formatRupee(totalSpent)}
            </div>
            <p className="text-xs text-slate-400 mt-1">Calculated from PostgreSQL expenses</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Budget Health Alerts</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">
              {nearOrOverCount}
            </div>
            <p className="text-xs text-slate-400 mt-1">Budgets near limit or exceeded</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Filter className="w-4 h-4 text-amber-400" />
              <span>Filter Budgets</span>
            </div>
            <button
              onClick={handleResetFilters}
              className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search budget name..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
              />
            </form>

            {/* Period Filter */}
            <select
              value={periodFilter}
              onChange={(e) => { setPeriodFilter(e.target.value); setPage(1); }}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500 transition"
            >
              <option value="all">All Budget Periods</option>
              <option value="active">Active Budgets</option>
              <option value="upcoming">Upcoming Budgets</option>
              <option value="past">Past / Expired Budgets</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryId}
              onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500 transition"
            >
              <option value="">All Categories (Overall & Specific)</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Budgets Grid */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3 bg-slate-900 border border-slate-800 rounded-2xl">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
            <p className="text-sm">Calculating budget usage from PostgreSQL...</p>
          </div>
        ) : budgets.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-4">
            <PieChart className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-semibold text-slate-200">No budgets created yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You haven't set up any spending budgets for this period filter. Create a monthly or category budget to keep expenses on track!
            </p>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs px-4 py-2 rounded-xl transition"
            >
              <Plus className="w-4 h-4" />
              Create First Budget
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {budgets.map((b) => {
              const remainingNum = parseFloat(b.remaining);
              const isOver = b.status === 'over_budget';
              const isNear = b.status === 'near_limit';

              return (
                <div key={b.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg relative flex flex-col justify-between hover:border-slate-700 transition">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-white text-lg leading-tight">{b.name}</h3>
                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>{b.start_date} &rarr; {b.end_date}</span>
                        </div>
                      </div>
                      {getStatusBadge(b.status)}
                    </div>

                    <div className="flex items-center gap-2">
                      {b.category ? (
                        <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-md">
                          Category: {b.category.name}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-md">
                          Overall Budget
                        </span>
                      )}
                      <span className="text-xs text-slate-500">Alert at {b.alert_threshold}%</span>
                    </div>

                    {/* Financial Figures */}
                    <div className="grid grid-cols-3 gap-2 pt-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                      <div>
                        <span className="block text-[11px] text-slate-400 font-medium">Budget</span>
                        <span className="font-extrabold text-white text-sm">{formatRupee(b.amount)}</span>
                      </div>
                      <div>
                        <span className="block text-[11px] text-slate-400 font-medium">Spent</span>
                        <span className="font-extrabold text-slate-200 text-sm">{formatRupee(b.spent)}</span>
                      </div>
                      <div>
                        <span className="block text-[11px] text-slate-400 font-medium">Remaining</span>
                        <span className={`font-extrabold text-sm ${remainingNum < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {formatRupee(b.remaining)}
                        </span>
                      </div>
                    </div>

                    {/* Usage Progress Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Spending Progress</span>
                        <span className="font-bold text-white font-mono">{b.usage_percentage}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden relative">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isOver ? 'bg-rose-500' : isNear ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(b.usage_percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800/80">
                    <button
                      onClick={() => openEditModal(b)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                      title="Edit Budget"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingBudget(b)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition"
                      title="Delete Budget"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              Showing page <span className="font-semibold text-slate-200">{pagination.current_page}</span> of <span className="font-semibold text-slate-200">{pagination.last_page}</span> ({pagination.total} budgets)
            </div>
            <div className="flex items-center space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-800 text-slate-300 disabled:opacity-50 hover:bg-slate-700 transition"
              >
                Previous
              </button>
              <button
                disabled={page >= pagination.last_page}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-800 text-slate-300 disabled:opacity-50 hover:bg-slate-700 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <PieChart className="w-5 h-5 text-amber-400" />
                {editingBudget ? 'Edit Budget' : 'Create New Budget'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Budget Name */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Budget Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monthly Food & Dining, October Overall"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              {/* Amount & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Amount (₹) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="15000.00"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Scope / Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500 transition"
                  >
                    <option value="">Overall (All Expenses)</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Start & End Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Start Date <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    End Date <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              {/* Alert Threshold */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Alert Threshold Percentage (%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  placeholder="80"
                  value={formThreshold}
                  onChange={(e) => setFormThreshold(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Triggers "Near Limit" warning status when spending reaches this percentage.
                </span>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-medium text-xs px-4 py-2 rounded-xl shadow-lg transition"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingBudget ? 'Save Changes' : 'Create Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <Trash2 className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-base font-bold text-white">Delete Budget</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete budget <span className="font-semibold text-white">"{deletingBudget.name}"</span>? Expense records will remain intact.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingBudget(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-medium text-xs px-4 py-2 rounded-xl transition"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Delete Budget
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetsPage;
