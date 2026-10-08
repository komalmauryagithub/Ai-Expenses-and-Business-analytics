import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { 
  TrendingUp, Plus, Edit2, Trash2, Search, Filter, Calendar, DollarSign, 
  Loader2, AlertCircle, CheckCircle2, ArrowUpDown, Layers, RefreshCw, X, Briefcase
} from 'lucide-react';
import Navbar from '../components/Navbar';

const IncomePage = () => {
  const { logout } = useAuth();

  // Data & Pagination
  const [incomeItems, setIncomeItems] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [summary, setSummary] = useState({ total_amount: '0.00', count: 0 });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [incomeType, setIncomeType] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [sortBy, setSortBy] = useState('income_date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);

  // Add / Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [formSource, setFormSource] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formType, setFormType] = useState('salary');
  const [formCategory, setFormCategory] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Modal
  const [deletingIncome, setDeletingIncome] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories?type=income');
      setCategories(res.data.data.categories || []);
    } catch (err) {
      console.error('Fetch categories error:', err);
    }
  };

  const fetchIncome = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      if (search) params.append('search', search);
      if (incomeType) params.append('type', incomeType);
      if (categoryId) params.append('category_id', categoryId);
      if (fromDate) params.append('from_date', fromDate);
      if (toDate) params.append('to_date', toDate);
      if (minAmount) params.append('min_amount', minAmount);
      if (maxAmount) params.append('max_amount', maxAmount);
      params.append('sort_by', sortBy);
      params.append('sort_order', sortOrder);

      const res = await api.get(`/income?${params.toString()}`);
      setIncomeItems(res.data.data.items || []);
      setPagination(res.data.data.pagination || {});
      setSummary(res.data.data.summary || { total_amount: '0.00', count: 0 });
      setApiError('');
    } catch (err) {
      console.error('Fetch income error:', err);
      setApiError('Failed to load income records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchIncome();
  }, [page, incomeType, categoryId, fromDate, toDate, sortBy, sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchIncome();
  };

  const handleResetFilters = () => {
    setSearch('');
    setIncomeType('');
    setCategoryId('');
    setFromDate('');
    setToDate('');
    setMinAmount('');
    setMaxAmount('');
    setSortBy('income_date');
    setSortOrder('desc');
    setPage(1);
  };

  const openAddModal = () => {
    setEditingIncome(null);
    setFormSource('');
    setFormAmount('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormType('salary');
    setFormCategory('');
    setFormDescription('');
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingIncome(item);
    setFormSource(item.source || '');
    setFormAmount(item.amount || '');
    setFormDate(item.income_date || new Date().toISOString().split('T')[0]);
    setFormType(item.type || 'salary');
    setFormCategory(item.category_id || '');
    setFormDescription(item.description || '');
    setFormError('');
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formSource.trim()) {
      setFormError('Income source is required.');
      return;
    }
    if (!formAmount || parseFloat(formAmount) <= 0) {
      setFormError('Please enter a valid positive amount.');
      return;
    }
    if (!formDate) {
      setFormError('Income date is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        source: formSource.trim(),
        amount: parseFloat(formAmount),
        income_date: formDate,
        type: formType,
        category_id: formCategory ? parseInt(formCategory, 10) : null,
        description: formDescription.trim() || null,
      };

      if (editingIncome) {
        await api.patch(`/income/${editingIncome.id}`, payload);
        setSuccessMsg('Income record updated successfully.');
      } else {
        await api.post('/income', payload);
        setSuccessMsg('Income record added successfully.');
      }

      setShowModal(false);
      fetchIncome();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Save income error:', err);
      const msg = err.response?.data?.message || 'Failed to save income record.';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingIncome) return;
    setIsDeleting(true);
    try {
      await api.delete(`/income/${deletingIncome.id}`);
      setSuccessMsg('Income record deleted successfully.');
      setDeletingIncome(null);
      fetchIncome();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Delete income error:', err);
      setApiError('Failed to delete income record.');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const formatCurrency = (val) => {
    const num = parseFloat(val);
    return isNaN(num) ? '$0.00' : `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getTypeBadgeClass = (type) => {
    switch (type) {
      case 'salary':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'freelance':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'business':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'investment':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'bonus':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      {/* Main Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400 flex-shrink-0" />
              <span>Income Management</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Track, organize, and analyze all income sources with category tags.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 transition transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Income
          </button>
        </div>

        {/* Global Notifications */}
        {apiError && (
          <div className="p-3.5 sm:p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-center gap-3">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span>{apiError}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5">
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Total Income</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white truncate">
              {formatCurrency(summary.total_amount)}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-1">Sum of filtered entries</p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Income Transactions</span>
              <Briefcase className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white truncate">
              {summary.count}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-1">Total count found</p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Average Income Entry</span>
              <TrendingUp className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white truncate">
              {formatCurrency(summary.count > 0 ? (parseFloat(summary.total_amount) / summary.count) : 0)}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-1">Per transaction average</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 sm:p-5 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700/50 pb-2.5">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-200">
              <Filter className="w-4 h-4 text-emerald-400" />
              <span>Search & Filter Income</span>
            </div>
            <button
              onClick={handleResetFilters}
              className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative sm:col-span-2 min-w-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search source or description..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </form>

            {/* Income Type Filter */}
            <div className="min-w-0">
              <select
                value={incomeType}
                onChange={(e) => { setIncomeType(e.target.value); setPage(1); }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition"
              >
                <option value="">All Types</option>
                <option value="salary">Salary</option>
                <option value="freelance">Freelance</option>
                <option value="business">Business</option>
                <option value="investment">Investment</option>
                <option value="bonus">Bonus</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="min-w-0">
              <select
                value={categoryId}
                onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition"
              >
                <option value="">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Date Range From */}
            <div className="min-w-0">
              <label className="block text-[10px] sm:text-xs text-slate-400 mb-1">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* Date Range To */}
            <div className="min-w-0">
              <label className="block text-[10px] sm:text-xs text-slate-400 mb-1">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => { setToDate(e.target.value); setPage(1); }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* Min Amount */}
            <div className="min-w-0">
              <label className="block text-[10px] sm:text-xs text-slate-400 mb-1">Min Amount ($)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={minAmount}
                onChange={(e) => { setMinAmount(e.target.value); setPage(1); }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* Max Amount */}
            <div className="min-w-0">
              <label className="block text-[10px] sm:text-xs text-slate-400 mb-1">Max Amount ($)</label>
              <input
                type="number"
                step="0.01"
                placeholder="10000.00"
                value={maxAmount}
                onChange={(e) => { setMaxAmount(e.target.value); setPage(1); }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Data Table & Mobile Cards */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
              <p className="text-xs sm:text-sm">Loading income records...</p>
            </div>
          ) : incomeItems.length === 0 ? (
            <div className="p-10 sm:p-12 text-center text-slate-400 space-y-3">
              <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 text-slate-600 mx-auto" />
              <h3 className="text-sm sm:text-base font-semibold text-slate-200">No income records found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No income transactions match your current search and filter criteria. Try clearing filters or create a new income entry.
              </p>
              <button
                onClick={openAddModal}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-3.5 py-2 rounded-lg transition"
              >
                <Plus className="w-4 h-4" />
                Add First Income Entry
              </button>
            </div>
          ) : (
            <>
              {/* Mobile Card View (< sm) */}
              <div className="block sm:hidden divide-y divide-slate-700/50">
                {incomeItems.map((item) => (
                  <div key={item.id} className="p-3.5 space-y-2 hover:bg-slate-700/20 transition">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-white text-sm truncate">{item.source}</div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                          <span className="font-mono">{item.income_date}</span>
                          <span>&bull;</span>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border capitalize ${getTypeBadgeClass(item.type)}`}>
                            {item.type}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="font-bold text-emerald-400 font-mono text-base block">
                          +{formatCurrency(item.amount)}
                        </span>
                        {item.category && (
                          <span className="inline-block mt-0.5 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                            {item.category.name}
                          </span>
                        )}
                      </div>
                    </div>

                    {item.description && (
                      <p className="text-[11px] text-slate-400 bg-slate-900/40 p-2 rounded-lg border border-slate-800 line-clamp-2">
                        {item.description}
                      </p>
                    )}

                    <div className="flex items-center justify-end space-x-2 pt-1 border-t border-slate-700/40">
                      <button
                        onClick={() => openEditModal(item)}
                        className="px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-700 rounded-lg border border-slate-700 transition flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3 text-sky-400" /> Edit
                      </button>
                      <button
                        onClick={() => setDeletingIncome(item)}
                        className="px-2.5 py-1 text-[11px] font-medium text-rose-400 hover:bg-slate-700 rounded-lg border border-slate-700 transition flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View (>= sm) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-900/80 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-700">
                    <tr>
                      <th
                        onClick={() => toggleSort('income_date')}
                        className="py-3.5 px-4 cursor-pointer hover:text-slate-200 transition"
                      >
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Date</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th className="py-3.5 px-4">Source</th>
                      <th className="py-3.5 px-4">Type</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th
                        onClick={() => toggleSort('amount')}
                        className="py-3.5 px-4 cursor-pointer hover:text-slate-200 text-right transition"
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Amount</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {incomeItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-700/30 transition">
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-200 font-medium">
                          {item.income_date}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white">{item.source}</div>
                          {item.description && (
                            <div className="text-xs text-slate-400 truncate max-w-xs">{item.description}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${getTypeBadgeClass(item.type)}`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {item.category ? (
                            <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                              {item.category.name}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500 italic">Uncategorized</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-right font-bold text-emerald-400">
                          +{formatCurrency(item.amount)}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-right space-x-2">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                            title="Edit Income"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingIncome(item)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition"
                            title="Delete Income"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Pagination Controls */}
          {pagination.last_page > 1 && (
            <div className="bg-slate-900/60 border-t border-slate-700/60 px-3 sm:px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <div className="text-xs text-slate-400 text-center sm:text-left">
                Showing page <span className="font-semibold text-slate-200">{pagination.current_page}</span> of <span className="font-semibold text-slate-200">{pagination.last_page}</span> ({pagination.total} entries)
              </div>
              <div className="flex items-center space-x-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-2.5 sm:px-3 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-800 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition"
                >
                  Previous
                </button>
                <button
                  disabled={page >= pagination.last_page}
                  onClick={() => setPage(page + 1)}
                  className="px-2.5 sm:px-3 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-800 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                {editingIncome ? 'Edit Income Record' : 'Add New Income'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white transition"
              >
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
              {/* Income Source */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Income Source <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corp Consulting, Monthly Salary"
                  value={formSource}
                  onChange={(e) => setFormSource(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Amount ($) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="2500.00"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Income Date <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              {/* Type & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Income Type <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition"
                  >
                    <option value="salary">Salary</option>
                    <option value="freelance">Freelance</option>
                    <option value="business">Business</option>
                    <option value="investment">Investment</option>
                    <option value="bonus">Bonus</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition"
                  >
                    <option value="">None (Uncategorized)</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Optional notes or context regarding this income..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                />
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
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-xs px-4 py-2 rounded-xl shadow-lg transition"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingIncome ? 'Save Changes' : 'Create Income'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingIncome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <Trash2 className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-base font-bold text-white">Delete Income Record</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-white">"{deletingIncome.source}"</span> ({formatCurrency(deletingIncome.amount)})? This record will be soft-deleted.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingIncome(null)}
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
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncomePage;
