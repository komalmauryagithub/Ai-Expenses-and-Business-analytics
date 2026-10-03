import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import NotificationBell from '../../components/NotificationBell';
import {
  Shield, Bell, RefreshCw, AlertCircle, ChevronLeft, ChevronRight,
  TrendingUp, AlertTriangle, Info, Filter, Users
} from 'lucide-react';

const AdminNotificationsPage = () => {
  const { logout } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });

  const fetchAdminNotifications = async () => {
    setLoading(true);
    setApiError('');
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('per_page', 15);
      if (filterType !== 'all') params.append('type', filterType);

      const res = await api.get(`/admin/notifications?${params.toString()}`);
      if (res.data.success) {
        const rawData = res.data.data;
        const notifList = Array.isArray(rawData) ? rawData : (rawData?.data || rawData?.items || []);
        setNotifications(notifList);
        if (res.data.meta) {
          setPagination(res.data.meta);
        }
      } else {
        setApiError('Failed to load system notifications.');
      }
    } catch (err) {
      console.error('Fetch admin notifications error:', err);
      setApiError(err.response?.data?.message || 'Unable to fetch system notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminNotifications();
  }, [page, filterType]);

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <nav className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-30 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-xl text-white shadow-md shadow-amber-500/20">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-white text-base sm:text-lg leading-none">Admin Portal</h1>
              <span className="text-xs text-amber-400 font-mono">System Notification Monitor</span>
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            <Link to="/admin/dashboard" className="text-xs text-slate-300 hover:text-white transition">Admin Dashboard</Link>
            <Link to="/admin/users" className="text-xs text-slate-300 hover:text-white transition">Users</Link>
            <Link to="/admin/audit-logs" className="text-xs text-slate-300 hover:text-white transition">Audit Logs</Link>
            <Link to="/admin/system-health" className="text-xs text-slate-300 hover:text-white transition">System Health</Link>
            <Link to="/admin/notifications" className="text-xs font-semibold text-amber-400 border-b-2 border-amber-400 pb-1">System Alerts</Link>

            <NotificationBell />

            <Link
              to="/dashboard"
              className="hidden sm:flex items-center space-x-1.5 text-emerald-400 hover:text-emerald-300 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold transition"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>User App</span>
            </Link>

            <button
              onClick={logout}
              className="text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 px-3 py-1.5 rounded-xl transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 flex-grow">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-2xl">
              <Bell className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">System Notification Monitor</h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Monitor all automated budget alerts, goal milestone notifications, and security warnings dispatched across user accounts.
              </p>
            </div>
          </div>

          <button
            onClick={fetchAdminNotifications}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition flex items-center gap-2 text-xs font-semibold"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
            Refresh Feed
          </button>
        </div>

        {/* Global Error Banner */}
        {apiError && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center space-x-2 text-xs shadow-lg">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{apiError}</span>
          </div>
        )}

        {/* Filter Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5 text-purple-400" />
            <span>Filter Notification Type:</span>
            <select
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="budget_alert">Budget Alerts</option>
              <option value="goal_milestone">Goal Milestones</option>
              <option value="security">Security Alerts</option>
              <option value="system">System Notifications</option>
            </select>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            Total Dispatched: <span className="text-purple-400 font-bold">{pagination.total}</span>
          </div>
        </div>

        {/* System Notifications Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(n => (
                <div key={n} className="h-14 bg-slate-800/50 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : (!Array.isArray(notifications) || notifications.length === 0) ? (
            <div className="py-16 text-center text-xs text-slate-500">
              No notifications dispatched matching criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Target User</th>
                    <th className="py-3 px-4">Priority & Type</th>
                    <th className="py-3 px-4">Title & Message</th>
                    <th className="py-3 px-4">Read Status</th>
                    <th className="py-3 px-4 text-right">Dispatched At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(Array.isArray(notifications) ? notifications : []).map((n) => (
                    <tr key={n.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-mono text-slate-500">{n.id}</td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {n.user ? (
                          <div>
                            <div className="font-bold text-white">{n.user.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{n.user.email}</div>
                          </div>
                        ) : (
                          <span className="text-slate-500 font-mono">User #{n.user_id}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap space-y-1">
                        <div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getPriorityBadge(n.priority)}`}>
                            {n.priority}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase font-mono">{n.type.replace('_', ' ')}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-200">{n.title}</div>
                        <div className="text-[11px] text-slate-400 leading-snug max-w-md">{n.message}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${n.read_at ? 'bg-slate-800 text-slate-400' : 'bg-emerald-500/20 text-emerald-300 font-bold'}`}>
                          {n.read_at ? 'READ' : 'UNREAD'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono text-slate-400">
                        {new Date(n.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.last_page > 1 && (
            <div className="flex items-center justify-between border-t border-slate-800 pt-4 text-xs">
              <span className="text-slate-400">
                Page {pagination.current_page} of {pagination.last_page} ({pagination.total} total)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-40 hover:bg-slate-700 transition flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </button>
                <button
                  disabled={page >= pagination.last_page}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-40 hover:bg-slate-700 transition flex items-center gap-1"
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
        AI Expense & Business Analytics SaaS &bull; Admin System Notification Monitor
      </footer>
    </div>
  );
};

export default AdminNotificationsPage;
