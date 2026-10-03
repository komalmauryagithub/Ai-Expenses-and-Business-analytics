import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import NotificationBell from '../../components/NotificationBell';
import {
  Shield, Users, Search, Filter, RefreshCw, AlertCircle, CheckCircle,
  TrendingUp, UserCheck, UserX, ChevronLeft, ChevronRight, ShieldAlert
} from 'lucide-react';

const AdminUsersPage = () => {
  const { user: currentUser, logout } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setApiError('');
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('per_page', 10);
      if (search) params.append('search', search);
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await api.get(`/admin/users?${params.toString()}`);
      if (res.data.success) {
        const rawData = res.data.data;
        const userList = Array.isArray(rawData) ? rawData : (rawData?.data || rawData?.items || []);
        setUsers(userList);
        if (res.data.meta) {
          setPagination(res.data.meta);
        }
      } else {
        setApiError('Failed to load user list.');
      }
    } catch (err) {
      console.error('Fetch admin users error:', err);
      setApiError(err.response?.data?.message || 'Failed to fetch users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleToggleRole = async (targetUser) => {
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
    setActionLoadingId(targetUser.id);
    setApiError('');
    try {
      const res = await api.patch(`/admin/users/${targetUser.id}/role`, { role: newRole });
      if (res.data.success) {
        setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, role: newRole } : u));
        showSuccess(`User role updated to ${newRole.toUpperCase()}`);
      }
    } catch (err) {
      console.error('Toggle role error:', err);
      const msg = err.response?.data?.message || err.response?.data?.errors?.role?.[0] || 'Role update failed.';
      setApiError(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleStatus = async (targetUser) => {
    const newStatus = targetUser.status === 'active' ? 'inactive' : 'active';
    setActionLoadingId(targetUser.id);
    setApiError('');
    try {
      const res = await api.patch(`/admin/users/${targetUser.id}/status`, { status: newStatus });
      if (res.data.success) {
        setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, status: newStatus } : u));
        showSuccess(`User account set to ${newStatus.toUpperCase()}`);
      }
    } catch (err) {
      console.error('Toggle status error:', err);
      const msg = err.response?.data?.message || err.response?.data?.errors?.status?.[0] || 'Status update failed.';
      setApiError(msg);
    } finally {
      setActionLoadingId(null);
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
              <span className="text-xs text-amber-400 font-mono">User Management</span>
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            <Link to="/admin/dashboard" className="text-xs text-slate-300 hover:text-white transition">Admin Dashboard</Link>
            <Link to="/admin/users" className="text-xs font-semibold text-amber-400 border-b-2 border-amber-400 pb-1">Users</Link>
            <Link to="/admin/audit-logs" className="text-xs text-slate-300 hover:text-white transition">Audit Logs</Link>
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
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">User Management</h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Admin controls for user roles, account activation, status toggle, and security guards.
              </p>
            </div>
          </div>

          <button
            onClick={fetchUsers}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition flex items-center gap-2 text-xs font-semibold"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            Refresh List
          </button>
        </div>

        {/* Feedback Banners */}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center space-x-2 text-xs font-semibold animate-fade-in shadow-lg">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {apiError && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center justify-between text-xs shadow-lg">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <span className="font-semibold">{apiError}</span>
            </div>
          </div>
        )}

        {/* Filters & Search Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-lg">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-grow max-w-md">
            <div className="relative flex-grow">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <button
              type="submit"
              className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs px-4 py-2 rounded-xl transition"
            >
              Search
            </button>
          </form>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Filter className="w-3.5 h-3.5 text-amber-400" />
              <span>Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin Only</option>
                <option value="user">User Only</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(n => (
                <div key={n} className="h-14 bg-slate-800/50 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : (!Array.isArray(users) || users.length === 0) ? (
            <div className="py-16 text-center text-xs text-slate-500">
              No users matching search filters found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Joined Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(Array.isArray(users) ? users : []).map((u) => {
                    const isSelf = u.id === currentUser?.id;
                    const isLoadingThis = actionLoadingId === u.id;
                    return (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4 font-mono text-slate-500">{u.id}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{u.name}</span>
                            {isSelf && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-slate-400 text-[11px] font-mono">{u.email}</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${u.role === 'admin' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${u.status === 'active' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border-rose-500/40'}`}>
                            {u.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-400 font-mono">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-2">
                            {/* Toggle Role Button */}
                            <button
                              disabled={isLoadingThis}
                              onClick={() => handleToggleRole(u)}
                              title={u.role === 'admin' ? 'Downgrade to User' : 'Promote to Admin'}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition disabled:opacity-50"
                            >
                              {u.role === 'admin' ? 'Make User' : 'Make Admin'}
                            </button>

                            {/* Toggle Status Button */}
                            <button
                              disabled={isLoadingThis}
                              onClick={() => handleToggleStatus(u)}
                              title={u.status === 'active' ? 'Deactivate Account' : 'Activate Account'}
                              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition disabled:opacity-50 ${u.status === 'active' ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'}`}
                            >
                              {u.status === 'active' ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
        AI Expense & Business Analytics SaaS &bull; Admin User Management &bull; Last-Admin Security Guard Enabled
      </footer>
    </div>
  );
};

export default AdminUsersPage;
