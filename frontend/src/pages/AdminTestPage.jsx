import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { ShieldCheck, ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

const AdminTestPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const testAdmin = async () => {
      try {
        const response = await api.get('/admin/test');
        setData(response.data);
      } catch (err) {
        console.error('Admin test error:', err);
        if (err.response && err.response.data) {
          setError(err.response.data.message || 'Admin authorization failed.');
        } else {
          setError('Failed to reach server.');
        }
      } finally {
        setLoading(false);
      }
    };

    testAdmin();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link to="/dashboard" className="inline-flex items-center text-xs font-semibold text-sky-400 hover:text-sky-300 transition">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </Link>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/30">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Access Authorization Verification</h1>
              <p className="text-xs text-slate-400">Endpoint: GET /api/v1/admin/test (Protected by EnsureAdminRole middleware)</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-amber-400 mr-2" />
              Verifying admin privileges with backend...
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <div>{error}</div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center space-x-3 text-emerald-300 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div>Admin authorization successfully verified by PostgreSQL backend!</div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  API Response Data
                </label>
                <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTestPage;
