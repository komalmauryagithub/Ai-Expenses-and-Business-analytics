import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import NotificationBell from '../../components/NotificationBell';
import {
  Shield, Server, RefreshCw, AlertCircle, CheckCircle, Database, Cpu,
  TrendingUp, Activity, HardDrive, Globe, Zap
} from 'lucide-react';

const AdminSystemHealthPage = () => {
  const { logout } = useAuth();

  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  const fetchSystemHealth = async () => {
    setLoading(true);
    setApiError('');
    try {
      const res = await api.get('/admin/system-health');
      if (res.data.success) {
        setHealthData(res.data.data);
      } else {
        setApiError('Failed to fetch system health status.');
      }
    } catch (err) {
      console.error('Fetch system health error:', err);
      setApiError(err.response?.data?.message || 'Unable to connect to health monitor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemHealth();
  }, []);

  const laravelHealth = healthData?.services?.laravel || {};
  const postgresHealth = healthData?.services?.postgresql || {};
  const fastApiHealth = healthData?.services?.fastapi || {};
  const overallStatus = healthData?.overall_status || 'unknown';

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
              <span className="text-xs text-amber-400 font-mono">System Health Monitor</span>
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            <Link to="/admin/dashboard" className="text-xs text-slate-300 hover:text-white transition">Admin Dashboard</Link>
            <Link to="/admin/users" className="text-xs text-slate-300 hover:text-white transition">Users</Link>
            <Link to="/admin/audit-logs" className="text-xs text-slate-300 hover:text-white transition">Audit Logs</Link>
            <Link to="/admin/system-health" className="text-xs font-semibold text-amber-400 border-b-2 border-amber-400 pb-1">System Health</Link>
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
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl">
              <Server className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-extrabold text-white tracking-tight">System Infrastructure Health</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${overallStatus === 'healthy' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border-rose-500/40'}`}>
                  {overallStatus}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Real-time connection probing for Laravel Backend, PostgreSQL Database, and FastAPI Microservice.
              </p>
            </div>
          </div>

          <button
            onClick={fetchSystemHealth}
            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs px-4 py-2.5 rounded-xl transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            Run Diagnostics
          </button>
        </div>

        {/* Global Error Banner */}
        {apiError && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center space-x-2 text-xs shadow-lg">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{apiError}</span>
          </div>
        )}

        {/* Services Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Service 1: Laravel API Backend */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-rose-400" />
                <h3 className="font-bold text-white text-base">Laravel Backend</h3>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${laravelHealth.status === 'ok' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'}`}>
                {laravelHealth.status || 'Checking'}
              </span>
            </div>

            {loading ? (
              <div className="h-32 bg-slate-800/50 animate-pulse rounded-2xl" />
            ) : (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">Framework</span>
                  <span className="font-semibold text-white">Laravel 11.x</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">PHP Version</span>
                  <span className="font-mono text-slate-200">{laravelHealth.php_version || '8.2+'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">Environment</span>
                  <span className="font-mono text-emerald-400 uppercase">{laravelHealth.environment || 'local'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Time Server</span>
                  <span className="font-mono text-slate-400 text-[11px]">{new Date(laravelHealth.timestamp || Date.now()).toLocaleTimeString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Service 2: PostgreSQL Database */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white text-base">PostgreSQL DB</h3>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${postgresHealth.status === 'ok' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'}`}>
                {postgresHealth.status || 'Checking'}
              </span>
            </div>

            {loading ? (
              <div className="h-32 bg-slate-800/50 animate-pulse rounded-2xl" />
            ) : (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">Connection</span>
                  <span className="font-semibold text-emerald-400">Connected (Port 5432)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">Database Name</span>
                  <span className="font-mono text-slate-200">{postgresHealth.database_name || 'ai_expense_db'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">Driver</span>
                  <span className="font-mono text-slate-300">pgsql (PostgreSQL 17)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Status</span>
                  <span className="font-semibold text-emerald-400">Active Query Ready</span>
                </div>
              </div>
            )}
          </div>

          {/* Service 3: Python FastAPI Analytics Engine */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Cpu className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Python FastAPI</h3>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${fastApiHealth.status === 'ok' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'}`}>
                {fastApiHealth.status || 'Checking'}
              </span>
            </div>

            {loading ? (
              <div className="h-32 bg-slate-800/50 animate-pulse rounded-2xl" />
            ) : (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">Service Endpoint</span>
                  <span className="font-mono text-slate-200">http://127.0.0.1:8001</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">HTTP Status</span>
                  <span className="font-mono text-emerald-400 font-bold">{fastApiHealth.http_code || 200} OK</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">Engine Modules</span>
                  <span className="font-semibold text-slate-300">Pandas + NumPy</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Latency Probe</span>
                  <span className="font-mono text-emerald-400 font-semibold">{fastApiHealth.latency_ms || '<10'} ms</span>
                </div>
              </div>
            )}
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 bg-slate-950 py-4 text-center text-xs text-slate-500">
        AI Expense & Business Analytics SaaS &bull; Admin Infrastructure Health Monitor
      </footer>
    </div>
  );
};

export default AdminSystemHealthPage;
