import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import {
  TrendingUp, Bell, Check, CheckCheck, Trash2, Filter, RefreshCw,
  AlertTriangle, Info, AlertCircle, Shield, User, ChevronLeft, ChevronRight, CheckCircle
} from 'lucide-react';

const NotificationsPage = () => {
  const { user, logout, isAdmin } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, unread, read
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [unreadCount, setUnreadCount] = useState(0);
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchNotifications = async () => {
    setLoading(true);
    setApiError('');
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('per_page', 15);
      if (filterStatus === 'unread') params.append('unread_only', '1');
      if (filterStatus === 'read') params.append('read_only', '1');
      if (filterType !== 'all') params.append('type', filterType);
      if (filterPriority !== 'all') params.append('priority', filterPriority);

      const res = await api.get(`/notifications?${params.toString()}`);
      if (res.data.success) {
        const rawData = res.data.data;
        const items = Array.isArray(rawData) ? rawData : (rawData?.data || rawData?.items || []);
        setNotifications(items);
        setUnreadCount(res.data.unread_count || 0);

        const pageData = rawData?.last_page ? rawData : (res.data.meta || {});
        setPagination({
          current_page: pageData.current_page || 1,
          last_page: pageData.last_page || 1,
          total: pageData.total || 0,
        });
      } else {
        setApiError('Failed to load notifications.');
      }
    } catch (err) {
      console.error('Fetch notifications error:', err);
      setApiError(err.response?.data?.message || 'Unable to connect to notification service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [page, filterStatus, filterType, filterPriority]);

  const showFeedback = (msg) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(''), 3000);
  };

  const handleMarkAsRead = async (id) => {
    try {
      const res = await api.post('/notifications/mark-read', { ids: [id] });
      if (res.data.success) {
        setNotifications(prev => Array.isArray(prev) ? prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n) : []);
        setUnreadCount(prev => Math.max(0, prev - 1));
        showFeedback('Notification marked as read');
      }
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await api.post('/notifications/mark-all-read');
      if (res.data.success) {
        setNotifications(prev => Array.isArray(prev) ? prev.map(n => ({ ...n, read_at: new Date().toISOString() })) : []);
        setUnreadCount(0);
        showFeedback('All notifications marked as read');
      }
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await api.delete(`/notifications/${id}`);
      if (res.data.success) {
        setNotifications(prev => Array.isArray(prev) ? prev.filter(n => n.id !== id) : []);
        showFeedback('Notification deleted');
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'critical':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'warning':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'info':
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-400 flex-shrink-0" />;
    }
  };

  const notifList = Array.isArray(notifications) ? notifications : [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans w-full overflow-x-hidden">
      <Navbar />

      {/* Main Container */}
      <main className="max-w-5xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6 flex-grow">
        
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl">
              <Bell className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-extrabold text-white tracking-tight">Notification Center</h1>
                {unreadCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold">
                    {unreadCount} Unread
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Real-time financial budget thresholds, goal milestones, and system security alerts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-md transition"
              >
                <CheckCheck className="w-4 h-4" />
                Mark All as Read
              </button>
            )}
            <button
              onClick={fetchNotifications}
              title="Refresh Notifications"
              className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Action Feedback Banner */}
        {actionSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center space-x-2 text-xs font-medium animate-fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Global Error Banner */}
        {apiError && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>{apiError}</span>
            </div>
            <button
              onClick={fetchNotifications}
              className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold rounded-lg border border-rose-500/40 transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Filters Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => { setFilterStatus('all'); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filterStatus === 'all' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              All
            </button>
            <button
              onClick={() => { setFilterStatus('unread'); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filterStatus === 'unread' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Unread
            </button>
            <button
              onClick={() => { setFilterStatus('read'); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filterStatus === 'read' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Read
            </button>
          </div>

          {/* Category & Priority Selectors */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Filter className="w-3.5 h-3.5 text-emerald-400" />
              <span>Type:</span>
              <select
                value={filterType}
                onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="budget_alert">Budget Alerts</option>
                <option value="goal_milestone">Goal Milestones</option>
                <option value="security">Security</option>
                <option value="system">System</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>Priority:</span>
              <select
                value={filterPriority}
                onChange={(e) => { setFilterPriority(e.target.value); setPage(1); }}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer"
              >
                <option value="all">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(n => (
                <div key={n} className="h-20 bg-slate-800/50 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : notifList.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <Bell className="w-12 h-12 text-slate-700 mx-auto" />
              <h3 className="text-base font-bold text-white">No Notifications Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {filterStatus === 'unread'
                  ? "You've read all your notifications!"
                  : "No notifications match your selected filters."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {notifList.map((item) => {
                const isUnread = !item.read_at;
                return (
                  <div
                    key={item.id}
                    className={`py-4 px-3 sm:px-4 rounded-2xl transition flex items-start justify-between gap-4 ${isUnread ? 'bg-slate-800/40 border border-slate-700/50' : 'hover:bg-slate-800/20'}`}
                  >
                    <div className="flex items-start space-x-3.5">
                      <div className="mt-0.5">{getPriorityIcon(item.priority || item.type)}</div>
                      <div className="space-y-1">
                        <div className="flex items-center flex-wrap gap-2">
                          <h4 className="font-bold text-white text-sm">{item.title}</h4>
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                          )}
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getPriorityBadge(item.priority || 'info')}`}>
                            {item.priority || 'info'}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 border border-slate-700 text-slate-400 uppercase">
                            {(item.type || 'system').replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">{item.message}</p>
                        <div className="text-[11px] text-slate-500 font-mono pt-1">
                          {new Date(item.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      {isUnread && (
                        <button
                          onClick={() => handleMarkAsRead(item.id)}
                          title="Mark as Read"
                          className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition text-xs font-semibold flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Mark Read</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(item.id)}
                        title="Delete Notification"
                        className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/30 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {pagination.last_page > 1 && (
            <div className="flex items-center justify-between border-t border-slate-800 pt-4 text-xs">
              <span className="text-slate-400">
                Page {pagination.current_page} of {pagination.last_page} ({pagination.total} total)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 transition flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </button>
                <button
                  disabled={page >= pagination.last_page}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 transition flex items-center gap-1"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 bg-slate-950 py-4 text-center text-xs text-slate-500">
        AI Expense & Business Analytics SaaS &bull; Notification Center
      </footer>
    </div>
  );
};

export default NotificationsPage;
