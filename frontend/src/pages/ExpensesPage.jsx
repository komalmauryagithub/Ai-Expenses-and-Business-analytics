import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { 
  DollarSign, Plus, Edit2, Trash2, Search, Filter, Calendar, CreditCard, 
  Loader2, AlertCircle, CheckCircle2, ArrowUpDown, Layers, RefreshCw, X
} from 'lucide-react';
import NotificationBell from '../components/NotificationBell';
import ThemeToggle from '../components/ThemeToggle';

const ExpensesPage = () => {
  const { logout } = useAuth();

  // Data & Pagination
  const [expenses, setExpenses] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [summary, setSummary] = useState({ total_amount: '0.00', count: 0 });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [sortBy, setSortBy] = useState('expense_date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);

  // Add / Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [formCategory, setFormCategory] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formPaymentMethod, setFormPaymentMethod] = useState('upi');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Modal
  const [deletingExpense, setDeletingExpense] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories?type=expense');
      setCategories(res.data.data.categories || []);
    } catch (err) {
      console.error('Fetch categories error:', err);
    }
  };

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      if (search) params.append('search', search);
      if (categoryId) params.append('category_id', categoryId);
      if (paymentMethod) params.append('payment_method', paymentMethod);
      if (fromDate) params.append('from_date', fromDate);
      if (toDate) params.append('to_date', toDate);
      if (minAmount) params.append('min_amount', minAmount);
      if (maxAmount) params.append('max_amount', maxAmount);
      params.append('sort_by', sortBy);
      params.append('sort_order', sortOrder);

      const res = await api.get(`/expenses?${params.toString()}`);
      setExpenses(res.data.data.items || []);
      setPagination(res.data.data.pagination || {});
      setSummary(res.data.data.summary || { total_amount: '0.00', count: 0 });
      setApiError('');
    } catch (err) {
      console.error('Fetch expenses error:', err);
      setApiError('Failed to load expenses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [page, categoryId, paymentMethod, fromDate, toDate, sortBy, sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchExpenses();
  };

  const clearFilters = () => {
    setSearch('');
    setCategoryId('');
    setPaymentMethod('');
    setFromDate('');
    setToDate('');
    setMinAmount('');
    setMaxAmount('');
    setSortBy('expense_date');
    setSortOrder('desc');
    setPage(1);
  };

  const openAddModal = () => {
    setEditingExpense(null);
    setFormCategory(categories.length > 0 ? categories[0].id : '');
    setFormAmount('');
    setFormDescription('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormPaymentMethod('upi');
    setFormNotes('');
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (exp) => {
    setEditingExpense(exp);
    setFormCategory(exp.category_id);
    setFormAmount(exp.amount);
    setFormDescription(exp.description);
    setFormDate(exp.expense_date);
    setFormPaymentMethod(exp.payment_method);
    setFormNotes(exp.notes || '');
    setFormError('');
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formCategory) return setFormError('Please select a category.');
    if (!formAmount || parseFloat(formAmount) <= 0) return setFormError('Please enter a valid amount greater than 0.');
    if (!formDescription.trim()) return setFormError('Description is required.');
    if (!formDate) return setFormError('Expense date is required.');

    setIsSubmitting(true);
    try {
      const payload = {
        category_id: parseInt(formCategory),
        amount: parseFloat(formAmount),
        description: formDescription,
        expense_date: formDate,
        payment_method: formPaymentMethod,
        notes: formNotes,
      };

      if (editingExpense) {
        await api.patch(`/expenses/${editingExpense.id}`, payload);
        setSuccessMsg('Expense record updated successfully.');
      } else {
        await api.post('/expenses', payload);
        setSuccessMsg('New expense recorded successfully.');
      }

      setShowModal(false);
      fetchExpenses();
    } catch (err) {
      console.error('Save expense error:', err);
      if (err.response && err.response.data) {
        setFormError(err.response.data.message || 'Failed to save expense.');
      } else {
        setFormError('Network error.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingExpense) return;
    setIsDeleting(true);

    try {
      await api.delete(`/expenses/${deletingExpense.id}`);
      setSuccessMsg('Expense record deleted successfully.');
      setDeletingExpense(null);
      fetchExpenses();
    } catch (err) {
      console.error('Delete expense error:', err);
      setApiError('Failed to delete expense.');
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
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Navbar */}
      <nav className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link to="/dashboard" className="p-2 bg-gradient-to-tr from-rose-500 to-indigo-600 rounded-xl text-white shadow-md">
              <DollarSign className="w-5 h-5" />
            </Link>
            <h1 className="font-bold text-white text-lg">Expense Management</h1>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <Link to="/dashboard" className="text-slate-300 hover:text-white transition">Dashboard</Link>
            <Link to="/expenses" className="font-semibold text-rose-400 border-b-2 border-rose-400 pb-1">Expenses</Link>
            <Link to="/income" className="text-slate-300 hover:text-white transition">Income</Link>
            <Link to="/categories" className="text-slate-300 hover:text-white transition">Categories</Link>
            <Link to="/budgets" className="text-slate-300 hover:text-white transition">Budgets</Link>
            <Link to="/goals" className="text-slate-300 hover:text-white transition">Goals</Link>
            <Link to="/analytics" className="text-slate-300 hover:text-white transition">Analytics</Link>
            <Link to="/ai-assistant" className="text-slate-300 hover:text-white transition">AI Assistant</Link>
            <Link to="/reports" className="text-slate-300 hover:text-white transition">Reports</Link>
            <Link to="/notifications" className="text-slate-300 hover:text-white transition">Notifications</Link>

            <NotificationBell />
            <ThemeToggle />

            <Link to="/profile" className="text-slate-300 hover:text-white transition">Profile</Link>
            <button onClick={logout} className="text-rose-400 hover:text-rose-300 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 font-medium">Sign Out</button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Success Alert */}
        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-emerald-300 text-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg('')} className="text-xs text-emerald-400 font-bold hover:underline">Dismiss</button>
          </div>
        )}

        {/* API Error Alert */}
        {apiError && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center space-x-2 text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-400" />
            <span>{apiError}</span>
          </div>
        )}

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Filtered Expenses</p>
              <h3 className="text-2xl font-black text-rose-400 mt-1">₹{summary.total_amount}</h3>
            </div>
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Expense Records</p>
              <h3 className="text-2xl font-black text-white mt-1">{summary.count}</h3>
            </div>
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <Layers className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Average Per Record</p>
              <h3 className="text-2xl font-black text-sky-400 mt-1">
                ₹{summary.count > 0 ? (parseFloat(summary.total_amount) / summary.count).toFixed(2) : '0.00'}
              </h3>
            </div>
            <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
              <RefreshCw className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-4 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <form onSubmit={handleSearchSubmit} className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search expense description or notes..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </form>

            <div className="flex items-center space-x-2">
              <button
                onClick={clearFilters}
                className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center"
              >
                <X className="w-3.5 h-3.5 mr-1" /> Clear
              </button>
              <button
                onClick={openAddModal}
                className="px-4 py-2.5 bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-400 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-rose-500/20 transition flex items-center"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Record Expense
              </button>
            </div>
          </div>

          {/* Filter Dropdowns Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-2 border-t border-slate-800/80">
            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">Category</label>
              <select
                value={categoryId}
                onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => { setPaymentMethod(e.target.value); setPage(1); }}
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
              >
                <option value="">All Methods</option>
                <option value="upi">UPI / GPay</option>
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
                <option value="net_banking">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => { setToDate(e.target.value); setPage(1); }}
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">Min Amount (₹)</label>
              <input
                type="number"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                onBlur={() => { setPage(1); fetchExpenses(); }}
                placeholder="0"
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">Max Amount (₹)</label>
              <input
                type="number"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                onBlur={() => { setPage(1); fetchExpenses(); }}
                placeholder="100000"
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
          </div>
        </div>

        {/* Expenses Data Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-rose-500 mb-3" />
              <p className="text-sm font-medium">Fetching expense records from PostgreSQL...</p>
            </div>
          ) : expenses.length === 0 ? (
            <div className="py-16 px-4 text-center text-slate-400">
              <DollarSign className="w-12 h-12 mx-auto text-slate-600 mb-3" />
              <p className="text-base font-semibold text-white">No Expense Records Found</p>
              <p className="text-xs mt-1">Start tracking your spending by adding your first expense record.</p>
              <button
                onClick={openAddModal}
                className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl"
              >
                + Record Expense Now
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4 cursor-pointer hover:text-white" onClick={() => toggleSort('expense_date')}>
                      <div className="flex items-center space-x-1">
                        <span>Date</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Description</th>
                    <th className="py-3.5 px-4">Payment Method</th>
                    <th className="py-3.5 px-4 text-right cursor-pointer hover:text-white" onClick={() => toggleSort('amount')}>
                      <div className="flex items-center justify-end space-x-1">
                        <span>Amount (₹)</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-mono text-slate-300 whitespace-nowrap">{exp.expense_date}</td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20">
                          {exp.category?.name || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-white max-w-xs truncate">
                        {exp.description}
                        {exp.notes ? <p className="text-[10px] text-slate-500 truncate">{exp.notes}</p> : null}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {exp.payment_method?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-rose-400 font-mono text-sm whitespace-nowrap">
                        - ₹{exp.amount}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => openEditModal(exp)}
                            className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded-lg transition"
                            title="Edit Expense"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingExpense(exp)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                            title="Delete Expense"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          {pagination.total > 0 && (
            <div className="bg-slate-900 border-t border-slate-800 px-4 py-3 flex items-center justify-between text-xs text-slate-400">
              <div>
                Showing <span className="font-semibold text-white">{pagination.from || 0}</span> to <span className="font-semibold text-white">{pagination.to || 0}</span> of <span className="font-semibold text-white">{pagination.total}</span> records
              </div>

              <div className="flex items-center space-x-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed font-medium transition"
                >
                  Previous
                </button>
                <span className="px-2 font-mono text-slate-300">
                  Page {pagination.current_page} of {pagination.last_page}
                </span>
                <button
                  disabled={page >= pagination.last_page}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed font-medium transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Add/Edit Expense Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <h2 className="text-xl font-bold text-white">
                {editingExpense ? 'Edit Expense Record' : 'Record New Expense'}
              </h2>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <div>{formError}</div>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                      Category *
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                      Amount (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      placeholder="850.50"
                      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Description *
                  </label>
                  <input
                    type="text"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="e.g. Dinner with team, Grocery shopping"
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                      Expense Date *
                    </label>
                    <input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                      Payment Method *
                    </label>
                    <select
                      value={formPaymentMethod}
                      onChange={(e) => setFormPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="upi">UPI / GPay</option>
                      <option value="credit_card">Credit Card</option>
                      <option value="debit_card">Debit Card</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cash">Cash</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Notes (Optional)
                  </label>
                  <textarea
                    rows="2"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Additional details, tax reference..."
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl disabled:opacity-50 flex items-center"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                    Save Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingExpense && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <h2 className="text-xl font-bold text-white">Delete Expense Record</h2>
              <p className="text-xs text-slate-300">
                Are you sure you want to delete expense <span className="font-bold text-white">"{deletingExpense.description}" (₹{deletingExpense.amount})</span>?
              </p>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingExpense(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl disabled:opacity-50 flex items-center"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                  Confirm Soft Delete
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default ExpensesPage;
