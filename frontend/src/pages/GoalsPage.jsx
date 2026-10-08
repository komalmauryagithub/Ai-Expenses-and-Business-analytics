import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import {
  Target, Plus, Edit2, Trash2, Search, Filter, Calendar, DollarSign,
  Loader2, AlertCircle, CheckCircle2, RefreshCw, X, History, Clock,
  CheckCircle, AlertTriangle, ArrowRight, PiggyBank
} from 'lucide-react';
import Navbar from '../components/Navbar';

const GoalsPage = () => {
  const { logout } = useAuth();

  // Data State
  const [goals, setGoals] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, completed, overdue
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Goal Modal (Add / Edit)
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [formName, setFormName] = useState('');
  const [formTargetAmount, setFormTargetAmount] = useState('');
  const [formTargetDate, setFormTargetDate] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmittingGoal, setIsSubmittingGoal] = useState(false);

  // Delete Goal Modal
  const [deletingGoal, setDeletingGoal] = useState(null);
  const [isDeletingGoal, setIsDeletingGoal] = useState(false);

  // Contribution Modal (Add Contribution)
  const [contributingGoal, setContributingGoal] = useState(null);
  const [contribAmount, setContribAmount] = useState('');
  const [contribDate, setContribDate] = useState(new Date().toISOString().split('T')[0]);
  const [contribNotes, setContribNotes] = useState('');
  const [contribError, setContribError] = useState('');
  const [isSubmittingContrib, setIsSubmittingContrib] = useState(false);

  // Contribution History Drawer / Modal
  const [viewingHistoryGoal, setViewingHistoryGoal] = useState(null);
  const [historyItems, setHistoryItems] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Edit / Delete Contribution state inside History
  const [editingContrib, setEditingContrib] = useState(null);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (search) params.append('search', search);

      const res = await api.get(`/goals?${params.toString()}`);
      setGoals(res.data.data.items || []);
      setPagination(res.data.data.pagination || {});
      setApiError('');
    } catch (err) {
      console.error('Fetch goals error:', err);
      setApiError('Failed to load financial goals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchGoals();
  };

  const handleResetFilters = () => {
    setStatusFilter('all');
    setSearch('');
    setPage(1);
  };

  // Goal Handlers
  const openAddGoalModal = () => {
    setEditingGoal(null);
    setFormName('');
    setFormTargetAmount('');
    setFormTargetDate(new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split('T')[0]);
    setFormDescription('');
    setFormError('');
    setShowGoalModal(true);
  };

  const openEditGoalModal = (g) => {
    setEditingGoal(g);
    setFormName(g.name || '');
    setFormTargetAmount(g.target_amount || '');
    setFormTargetDate(g.target_date || '');
    setFormDescription(g.description || '');
    setFormError('');
    setShowGoalModal(true);
  };

  const handleGoalFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formName.trim()) {
      setFormError('Goal name is required.');
      return;
    }
    if (!formTargetAmount || parseFloat(formTargetAmount) <= 0) {
      setFormError('Please enter a valid target amount.');
      return;
    }
    if (!formTargetDate) {
      setFormError('Target date is required.');
      return;
    }

    setIsSubmittingGoal(true);
    try {
      const payload = {
        name: formName.trim(),
        target_amount: parseFloat(formTargetAmount),
        target_date: formTargetDate,
        description: formDescription.trim() || null,
      };

      if (editingGoal) {
        await api.patch(`/goals/${editingGoal.id}`, payload);
        setSuccessMsg('Financial goal updated successfully.');
      } else {
        await api.post('/goals', payload);
        setSuccessMsg('Financial goal created successfully.');
      }

      setShowGoalModal(false);
      fetchGoals();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Save goal error:', err);
      const msg = err.response?.data?.message || 'Failed to save financial goal.';
      setFormError(msg);
    } finally {
      setIsSubmittingGoal(false);
    }
  };

  const handleDeleteGoal = async () => {
    if (!deletingGoal) return;
    setIsDeletingGoal(true);
    try {
      await api.delete(`/goals/${deletingGoal.id}`);
      setSuccessMsg('Financial goal deleted successfully.');
      setDeletingGoal(null);
      fetchGoals();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Delete goal error:', err);
      setApiError('Failed to delete goal.');
    } finally {
      setIsDeletingGoal(false);
    }
  };

  // Contribution Handlers
  const openContribModal = (g) => {
    setContributingGoal(g);
    setEditingContrib(null);
    setContribAmount('');
    setContribDate(new Date().toISOString().split('T')[0]);
    setContribNotes('');
    setContribError('');
  };

  const handleContribSubmit = async (e) => {
    e.preventDefault();
    setContribError('');

    if (!contribAmount || parseFloat(contribAmount) <= 0) {
      setContribError('Please enter a valid contribution amount.');
      return;
    }
    if (!contribDate) {
      setContribError('Contribution date is required.');
      return;
    }

    setIsSubmittingContrib(true);
    try {
      const payload = {
        amount: parseFloat(contribAmount),
        contribution_date: contribDate,
        notes: contribNotes.trim() || null,
      };

      if (editingContrib) {
        await api.patch(`/goals/${contributingGoal.id}/contributions/${editingContrib.id}`, payload);
        setSuccessMsg('Contribution updated successfully.');
      } else {
        await api.post(`/goals/${contributingGoal.id}/contributions`, payload);
        setSuccessMsg('Contribution added successfully!');
      }

      setContributingGoal(null);
      setEditingContrib(null);
      fetchGoals();
      if (viewingHistoryGoal && viewingHistoryGoal.id === contributingGoal.id) {
        fetchHistory(contributingGoal.id);
      }
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Save contribution error:', err);
      const msg = err.response?.data?.message || 'Failed to add contribution.';
      setContribError(msg);
    } finally {
      setIsSubmittingContrib(false);
    }
  };

  // Contribution History
  const fetchHistory = async (goalId) => {
    setLoadingHistory(true);
    try {
      const res = await api.get(`/goals/${goalId}/contributions`);
      setHistoryItems(res.data.data.contributions || []);
    } catch (err) {
      console.error('Fetch history error:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const openHistoryModal = (g) => {
    setViewingHistoryGoal(g);
    fetchHistory(g.id);
  };

  const handleDeleteContribution = async (contribId) => {
    if (!viewingHistoryGoal) return;
    try {
      await api.delete(`/goals/${viewingHistoryGoal.id}/contributions/${contribId}`);
      setSuccessMsg('Contribution deleted.');
      fetchHistory(viewingHistoryGoal.id);
      fetchGoals();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Delete contribution error:', err);
    }
  };

  const formatRupee = (val) => {
    const num = parseFloat(val);
    return isNaN(num) ? '₹0.00' : `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Completed</span>;
      case 'overdue':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Overdue</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center gap-1"><Clock className="w-3 h-3" /> Active</span>;
    }
  };

  // Aggregated Summary
  const totalTarget = goals.reduce((acc, g) => acc + parseFloat(g.target_amount || 0), 0);
  const totalSaved = goals.reduce((acc, g) => acc + parseFloat(g.current_amount || 0), 0);
  const completedCount = goals.filter(g => g.status === 'completed').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans w-full overflow-x-hidden">
      <Navbar />

      {/* Main Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Target className="w-6 h-6 sm:w-7 sm:h-7 text-teal-400 flex-shrink-0" />
              <span>Financial Goals & Targets</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Create savings targets, track deposit progress, and manage contribution history.
            </p>
          </div>
          <button
            onClick={openAddGoalModal}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-teal-600/20 transition transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Create Goal
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
              <span className="text-xs font-semibold uppercase tracking-wider">Total Goal Targets</span>
              <Target className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">
              {formatRupee(totalTarget)}
            </div>
            <p className="text-xs text-slate-400 mt-1">Combined target savings goal</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Contributed</span>
              <PiggyBank className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">
              {formatRupee(totalSaved)}
            </div>
            <p className="text-xs text-slate-400 mt-1">Synced from goal contributions</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Achieved Goals</span>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">
              {completedCount} / {goals.length}
            </div>
            <p className="text-xs text-slate-400 mt-1">Goals fully funded</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Filter className="w-4 h-4 text-teal-400" />
              <span>Filter Goals</span>
            </div>
            <button
              onClick={handleResetFilters}
              className="text-xs text-slate-400 hover:text-teal-400 flex items-center gap-1 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search goal name..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
              />
            </form>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
            >
              <option value="all">All Goal Statuses</option>
              <option value="active">Active Goals</option>
              <option value="completed">Completed Goals</option>
              <option value="overdue">Overdue Goals</option>
            </select>
          </div>
        </div>

        {/* Goals Grid */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3 bg-slate-900 border border-slate-800 rounded-2xl">
            <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
            <p className="text-sm">Loading financial goals and calculating deposit progress...</p>
          </div>
        ) : goals.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-4">
            <Target className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-semibold text-slate-200">No financial goals created yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Start building your emergency fund, vehicle purchase target, or vacation savings by creating a financial goal!
            </p>
            <button
              onClick={openAddGoalModal}
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs px-4 py-2 rounded-xl transition"
            >
              <Plus className="w-4 h-4" />
              Create First Financial Goal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((g) => {
              const isCompleted = g.status === 'completed';
              const isOverdue = g.status === 'overdue';

              return (
                <div key={g.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg flex flex-col justify-between hover:border-slate-700 transition">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-white text-lg leading-tight">{g.name}</h3>
                        {g.description && (
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{g.description}</p>
                        )}
                      </div>
                      {getStatusBadge(g.status)}
                    </div>

                    <div className="text-xs text-slate-400 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>Target: {g.target_date}</span>
                      </div>
                      <span className={`font-medium ${isOverdue ? 'text-rose-400' : 'text-slate-400'}`}>
                        {g.days_remaining > 0 ? `${g.days_remaining} days left` : isCompleted ? 'Target Reached' : 'Passed Target Date'}
                      </span>
                    </div>

                    {/* Figures */}
                    <div className="grid grid-cols-2 gap-2 pt-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                      <div>
                        <span className="block text-[11px] text-slate-400 font-medium">Contributed</span>
                        <span className="font-extrabold text-emerald-400 text-sm">{formatRupee(g.current_amount)}</span>
                      </div>
                      <div>
                        <span className="block text-[11px] text-slate-400 font-medium">Target Amount</span>
                        <span className="font-extrabold text-white text-sm">{formatRupee(g.target_amount)}</span>
                      </div>
                    </div>

                    {/* Completion Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Savings Goal Progress</span>
                        <span className="font-bold text-white font-mono">{g.completion_percentage}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isCompleted ? 'bg-emerald-500' : isOverdue ? 'bg-rose-500' : 'bg-teal-500'
                          }`}
                          style={{ width: `${Math.min(g.completion_percentage, 100)}%` }}
                        />
                      </div>
                      <div className="text-[11px] text-slate-500 text-right">
                        Remaining: <span className="text-slate-300 font-semibold">{formatRupee(g.remaining_amount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => openContribModal(g)}
                        className="flex-grow inline-flex items-center justify-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs px-3 py-2 rounded-xl shadow transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Deposit
                      </button>

                      <button
                        onClick={() => openHistoryModal(g)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                        title="Contribution History"
                      >
                        <History className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => openEditGoalModal(g)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                        title="Edit Goal"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setDeletingGoal(g)}
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                        title="Delete Goal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
              Page <span className="font-semibold text-slate-200">{pagination.current_page}</span> of <span className="font-semibold text-slate-200">{pagination.last_page}</span> ({pagination.total} goals)
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

      {/* Goal Add / Edit Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-teal-400" />
                {editingGoal ? 'Edit Financial Goal' : 'Create New Financial Goal'}
              </h3>
              <button onClick={() => setShowGoalModal(false)} className="text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleGoalFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Goal Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Emergency Reserve, Vehicle Down Payment"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Target Amount (₹) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="100000.00"
                    value={formTargetAmount}
                    onChange={(e) => setFormTargetAmount(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Target Date <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formTargetDate}
                    onChange={(e) => setFormTargetDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description / Purpose</label>
                <textarea
                  rows={2}
                  placeholder="Optional context regarding this financial goal..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingGoal}
                  className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-medium text-xs px-4 py-2 rounded-xl shadow-lg transition"
                >
                  {isSubmittingGoal && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingGoal ? 'Save Goal' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Contribution Modal */}
      {contributingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <PiggyBank className="w-5 h-5 text-emerald-400" />
                  Deposit to "{contributingGoal.name}"
                </h3>
                <span className="text-xs text-slate-400">Target: {formatRupee(contributingGoal.target_amount)}</span>
              </div>
              <button onClick={() => setContributingGoal(null)} className="text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {contribError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{contribError}</span>
              </div>
            )}

            <form onSubmit={handleContribSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Deposit Amount (₹) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="5000.00"
                    value={contribAmount}
                    onChange={(e) => setContribAmount(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Deposit Date <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={contribDate}
                    onChange={(e) => setContribDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Notes / Source</label>
                <input
                  type="text"
                  placeholder="e.g. Deposit from salary bonus"
                  value={contribNotes}
                  onChange={(e) => setContribNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setContributingGoal(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingContrib}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-xs px-4 py-2 rounded-xl shadow-lg transition"
                >
                  {isSubmittingContrib && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirm Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contribution History Modal */}
      {viewingHistoryGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-teal-400" />
                  Deposit History: {viewingHistoryGoal.name}
                </h3>
                <span className="text-xs text-slate-400">Total Saved: {formatRupee(viewingHistoryGoal.current_amount)}</span>
              </div>
              <button onClick={() => setViewingHistoryGoal(null)} className="text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingHistory ? (
              <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
                <span className="text-xs">Fetching deposits...</span>
              </div>
            ) : historyItems.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No deposits logged for this goal yet.
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {historyItems.map((item) => (
                  <div key={item.id} className="bg-slate-800/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-emerald-400 text-sm">+{formatRupee(item.amount)}</div>
                      <div className="text-[11px] text-slate-400">{item.contribution_date} {item.notes && `&bull; ${item.notes}`}</div>
                    </div>
                    <button
                      onClick={() => handleDeleteContribution(item.id)}
                      className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                      title="Delete Deposit"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingHistoryGoal(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Goal Modal */}
      {deletingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <Trash2 className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-base font-bold text-white">Delete Financial Goal</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-white">"{deletingGoal.name}"</span>? All associated contribution records will be removed.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingGoal(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteGoal}
                disabled={isDeletingGoal}
                className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-medium text-xs px-4 py-2 rounded-xl transition"
              >
                {isDeletingGoal && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Delete Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalsPage;
