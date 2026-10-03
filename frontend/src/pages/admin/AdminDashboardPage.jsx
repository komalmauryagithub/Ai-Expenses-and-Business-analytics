import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import NotificationBell from '../../components/NotificationBell';
import {
  Shield, Users, Activity, FileText, Bell, Server, RefreshCw, AlertCircle,
  TrendingUp, UserCheck, UserX, CheckCircle, ArrowRight, Database, Cpu, Layers
} from 'lucide-react';

const AdminDashboardPage = () => {
  const { user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  const fetchAdminDashboard = async () => {
    setLoading(true);
    setApiError('');
    try {
      const res = await api.get('/admin/dashboard');
      if (res.data.success) {
        setData(res.data.data);
      } else {
        setApiError('Failed to fetch admin metrics.');
      }
    } catch (err) {
      console.error('Fetch admin dashboard error:', err);
      setApiError(err.response?.data?.message || 'Access denied or server error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminDashboard();
  }, []);

  const metrics = data?.metrics || {
    total_users: 0,
    active_users: 0,
    inactive_users: 0,
    admin_users: 0,
    active_budgets: 0,
    active_goals: 0,
  };

  const recentUsers = data?.recent_users || [];
  const recentAuditLogs = data?.recent_audit_logs || [];
  const systemHealth = data?.system_health || {};

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Admin Navbar */}
      <nav className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-30 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-xl text-white shadow-md shadow-amber-500/20">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-white text-base sm:text-lg leading-none">Admin Portal</h1>
              <span className="text-xs text-amber-400 font-mono">System Control & Management</span>
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            <Link to="/admin/dashboard" className="text-xs font-semibold text-amber-400 border-b-2 border-amber-400 pb-1">Admin Dashboard</Link>
            <Link to="/admin/users" className="text-xs text-slate-300 hover:text-white transition">Users</Link>
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
        
        {/* Banner Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-2">
              <Shield className="w-3.5 h-3.5" />
              <span>Role-Based Administration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Admin Control Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Logged in as <span className="text-amber-400 font-semibold">{user?.email}</span> (Administrator)
            </p>
          </div>

          <button
            onClick={fetchAdminDashboard}
            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs px-4 py-2.5 rounded-xl transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            Refresh Admin Data
          </button>
        </div>

        {/* Global Error Banner */}
        {apiError && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>{apiError}</span>
            </div>
            <button
              onClick={fetchAdminDashboard}
              className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold rounded-lg border border-rose-500/40 transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Total Users */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Registered Users</span>
              <Users className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-3xl font-black text-white">{metrics.total_users}</div>
            <div className="text-xs text-slate-400 flex items-center gap-2 pt-1">
              <span className="text-emerald-400 font-semibold">{metrics.active_users} Active</span>
              <span>&bull;</span>
              <span className="text-rose-400 font-semibold">{metrics.inactive_users} Inactive</span>
            </div>
          </div>

          {/* Card 2: System Admins */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">System Administrators</span>
              <Shield className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-3xl font-black text-white">{metrics.admin_users}</div>
            <div className="text-xs text-amber-400 font-medium pt-1">
              Last-Admin Deactivation Protected
            </div>
          </div>

          {/* Card 3: Active Financial Structures */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Financial Operations</span>
              <Layers className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-3xl font-black text-white">
              {metrics.active_budgets + metrics.active_goals}
            </div>
            <div className="text-xs text-slate-400 pt-1">
              {metrics.active_budgets} Budgets &bull; {metrics.active_goals} Goals
            </div>
          </div>

          {/* Card 4: System Health Status */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">System Status</span>
              <Server className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-emerald-400 capitalize">
              {systemHealth.overall_status || 'Operational'}
            </div>
            <div className="text-xs text-slate-400 pt-1">
              PostgreSQL &bull; Laravel &bull; FastAPI
            </div>
          </div>
        </div>

        {/* Quick Admin Navigation Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/admin/users"
            className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 transition group space-y-2"
          >
            <div className="flex items-center justify-between">
              <Users className="w-6 h-6 text-amber-400" />
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition" />
            </div>
            <h3 className="font-bold text-white text-base">User Management</h3>
            <p className="text-xs text-slate-400">Manage user roles, activate/deactivate accounts.</p>
          </Link>

          <Link
            to="/admin/audit-logs"
            className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/50 transition group space-y-2"
          >
            <div className="flex items-center justify-between">
              <Activity className="w-6 h-6 text-blue-400" />
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition" />
            </div>
            <h3 className="font-bold text-white text-base">Security Audit Logs</h3>
            <p className="text-xs text-slate-400">View real-time user authentication and system events.</p>
          </Link>

          <Link
            to="/admin/system-health"
            className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 transition group space-y-2"
          >
            <div className="flex items-center justify-between">
              <Server className="w-6 h-6 text-emerald-400" />
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition" />
            </div>
            <h3 className="font-bold text-white text-base">System Health</h3>
            <p className="text-xs text-slate-400">Check Laravel, PostgreSQL, and FastAPI analytics status.</p>
          </Link>

          <Link
            to="/admin/notifications"
            className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/50 transition group space-y-2"
          >
            <div className="flex items-center justify-between">
              <Bell className="w-6 h-6 text-purple-400" />
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition" />
            </div>
            <h3 className="font-bold text-white text-base">System Notifications</h3>
            <p className="text-xs text-slate-400">Monitor automated system alerts dispatched across accounts.</p>
          </Link>
        </div>

        {/* Data Tables Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Registrations Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Recent Registrations</h3>
              </div>
              <Link to="/admin/users" className="text-xs text-amber-400 hover:underline">View All</Link>
            </div>

            {loading ? (
              <div className="h-48 bg-slate-800/50 animate-pulse rounded-2xl" />
            ) : recentUsers.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">No recent users.</div>
            ) : (
              <div className="space-y-2.5">
                {recentUsers.map(u => (
                  <div key={u.id} className="p-3 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white">{u.name}</div>
                      <div className="text-slate-400 text-[11px]">{u.email}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${u.role === 'admin' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-700 text-slate-300'}`}>
                        {u.role}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${u.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                        {u.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Audit Activity Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white text-base">Recent Audit Logs</h3>
              </div>
              <Link to="/admin/audit-logs" className="text-xs text-blue-400 hover:underline">View All</Link>
            </div>

            {loading ? (
              <div className="h-48 bg-slate-800/50 animate-pulse rounded-2xl" />
            ) : recentAuditLogs.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">No audit logs recorded.</div>
            ) : (
              <div className="space-y-2.5">
                {recentAuditLogs.map(log => (
                  <div key={log.id} className="p-3 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-200 font-mono">{log.action}</div>
                      <div className="text-slate-400 text-[11px]">{log.user ? `${log.user.name} (${log.user.email})` : 'System Event'}</div>
                    </div>
                    <div className="text-right text-[10px] text-slate-500 font-mono">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 bg-slate-950 py-4 text-center text-xs text-slate-500">
        AI Expense & Business Analytics SaaS &bull; Phase 10 Admin Panel
      </footer>
    </div>
  );
};

export default AdminDashboardPage;
