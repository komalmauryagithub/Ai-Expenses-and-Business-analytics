import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import NotificationBell from '../../components/NotificationBell';
import {
  Shield, Activity, Search, RefreshCw, AlertCircle, ChevronLeft, ChevronRight,
  TrendingUp, Terminal, Code, User, FileText
} from 'lucide-react';

const AdminAuditLogsPage = () => {
  const { logout } = useAuth();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [actionSearch, setActionSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [selectedMeta, setSelectedMeta] = useState(null);

  const fetchAuditLogs = async () => {
    setLoading(true);
    setApiError('');
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('per_page', 15);
      if (actionSearch) params.append('action', actionSearch);

      const res = await api.get(`/admin/audit-logs?${params.toString()}`);
      if (res.data.success) {
        const rawData = res.data.data;
        const logList = Array.isArray(rawData) ? rawData : (rawData?.data || rawData?.items || []);
        setLogs(logList);
        if (res.data.meta) {
          setPagination(res.data.meta);
        }
      } else {
        setApiError('Failed to load audit logs.');
      }
    } catch (err) {
      console.error('Fetch audit logs error:', err);
      setApiError(err.response?.data?.message || 'Unable to fetch audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchAuditLogs();
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
              <span className="text-xs text-amber-400 font-mono">Security Audit Trail</span>
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            <Link to="/admin/dashboard" className="text-xs text-slate-300 hover:text-white transition">Admin Dashboard</Link>
            <Link to="/admin/users" className="text-xs text-slate-300 hover:text-white transition">Users</Link>
            <Link to="/admin/audit-logs" className="text-xs font-semibold text-amber-400 border-b-2 border-amber-400 pb-1">Audit Logs</Link>
            <Link to="/admin/system-health" className="text-xs text-slate-300 hover:text-white transition">System Health</Link>
            <Link to="/admin/notifications" className="text-xs text-slate-300 hover:text-white transition">System Alerts</Link>

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
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl">
              <Activity className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Security Audit Logs</h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Immutable record of authentication, permission changes, financial data mutations, and administrative events.
              </p>
            </div>
          </div>

          <button
            onClick={fetchAuditLogs}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition flex items-center gap-2 text-xs font-semibold"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
            Refresh Logs
          </button>
        </div>

        {/* Global Error Banner */}
        {apiError && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center space-x-2 text-xs shadow-lg">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{apiError}</span>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full max-w-md">
            <div className="relative flex-grow">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filter by action name (e.g., user_logged_in)..."
                value={actionSearch}
                onChange={(e) => setActionSearch(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2 rounded-xl transition"
            >
              Filter
            </button>
          </form>
          <div className="text-xs text-slate-400 font-mono">
            Total Logged Events: <span className="text-blue-400 font-bold">{pagination.total}</span>
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6].map(n => (
                <div key={n} className="h-12 bg-slate-800/50 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : (!Array.isArray(logs) || logs.length === 0) ? (
            <div className="py-16 text-center text-xs text-slate-500">
              No audit logs found matching criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Action Event</th>
                    <th className="py-3 px-4">Performed By</th>
                    <th className="py-3 px-4">IP Address</th>
                    <th className="py-3 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(Array.isArray(logs) ? logs : []).map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono text-slate-500">{log.id}</td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-400 font-mono">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-semibold text-blue-400 font-mono">
                        {log.action}
                      </td>
                      <td className="py-3 px-4">
                        {log.user ? (
                          <div>
                            <div className="font-bold text-white">{log.user.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{log.user.email}</div>
                          </div>
                        ) : (
                          <span className="text-slate-500 font-mono">System / Guest</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-400">
                        {log.ip_address || '127.0.0.1'}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {log.meta && Object.keys(log.meta).length > 0 ? (
                          <button
                            onClick={() => setSelectedMeta(log)}
                            className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-mono transition inline-flex items-center gap-1"
                          >
                            <Code className="w-3 h-3 text-blue-400" /> View JSON
                          </button>
                        ) : (
                          <span className="text-slate-600 font-mono text-[11px]">&mdash;</span>
                        )}
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

        {/* Modal for JSON details */}
        {selectedMeta && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-5 h-5 text-blue-400" />
                  <h3 className="font-bold text-white text-base">Audit Log Metadata #{selectedMeta.id}</h3>
                </div>
                <span className="font-mono text-xs text-blue-400">{selectedMeta.action}</span>
              </div>
              <pre className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto max-h-64">
                {JSON.stringify(selectedMeta.meta, null, 2)}
              </pre>
              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedMeta(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 bg-slate-950 py-4 text-center text-xs text-slate-500">
        AI Expense & Business Analytics SaaS &bull; Admin Security Audit Trail
      </footer>
    </div>
  );
};

export default AdminAuditLogsPage;
