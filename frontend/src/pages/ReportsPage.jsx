import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import {
  FileText, Download, FileSpreadsheet, Filter, Calendar, Search, RefreshCw,
  Loader2, AlertCircle, CheckCircle2, Wallet, DollarSign, PiggyBank, BarChart3,
  Layers, Shield, ChevronLeft, ChevronRight, Activity, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import Navbar from '../components/Navbar';

const REPORT_TYPES = [
  { id: 'expense', name: 'Expense Report' },
  { id: 'income', name: 'Income Report' },
  { id: 'summary', name: 'Income vs Expense Summary' },
  { id: 'category', name: 'Category Spending Report' },
  { id: 'budget', name: 'Budget Performance Report' },
  { id: 'goal', name: 'Financial Goals Progress' },
  { id: 'transaction', name: 'Detailed Transaction Export' },
  { id: 'monthly', name: 'Monthly Financial Statement' },
  { id: 'analytics', name: 'Deterministic Analytics Report' },
];

const ReportsPage = () => {
  const { logout } = useAuth();

  // Filter States
  const [reportType, setReportType] = useState('expense');
  const [period, setPeriod] = useState('current_month');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [transactionType, setTransactionType] = useState('both');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [search, setSearch] = useState('');

  // Dropdown categories state
  const [categories, setCategories] = useState([]);

  // Report Data & Action States
  const [loading, setLoading] = useState(false);
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [apiError, setApiError] = useState('');
  const [reportData, setReportData] = useState(null);

  // Pagination state for preview table
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch categories for dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        if (res.data.success) {
          const catData = res.data.data;
          const catList = Array.isArray(catData) ? catData : (catData?.categories || catData?.items || []);
          setCategories(catList);
        }
      } catch (err) {
        console.error('Fetch categories error:', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch report preview
  const fetchReportPreview = async () => {
    setLoading(true);
    setApiError('');
    setCurrentPage(1);

    try {
      const payload = {
        report_type: reportType,
        period: period,
        from_date: period === 'custom' ? fromDate : undefined,
        to_date: period === 'custom' ? toDate : undefined,
        category_id: categoryId || undefined,
        payment_method: paymentMethod || undefined,
        transaction_type: transactionType || undefined,
        min_amount: minAmount ? parseFloat(minAmount) : undefined,
        max_amount: maxAmount ? parseFloat(maxAmount) : undefined,
        search: search || undefined,
      };

      const res = await api.post('/reports/preview', payload);
      if (res.data.success) {
        setReportData(res.data.data);
      } else {
        setApiError('Failed to generate report preview.');
      }
    } catch (err) {
      console.error('Report preview error:', err);
      const msg = err.response?.data?.message || 'Failed to generate report preview.';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportPreview();
  }, [reportType, period]);

  // Handle CSV Download
  const handleDownloadCsv = async () => {
    setDownloadingCsv(true);
    setApiError('');
    try {
      const payload = {
        report_type: reportType,
        period: period,
        from_date: period === 'custom' ? fromDate : undefined,
        to_date: period === 'custom' ? toDate : undefined,
        category_id: categoryId || undefined,
        payment_method: paymentMethod || undefined,
        transaction_type: transactionType || undefined,
        min_amount: minAmount ? parseFloat(minAmount) : undefined,
        max_amount: maxAmount ? parseFloat(maxAmount) : undefined,
        search: search || undefined,
      };

      const res = await api.post('/reports/export/csv', payload, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}-report-${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('CSV Download error:', err);
      setApiError('Failed to download CSV export.');
    } finally {
      setDownloadingCsv(false);
    }
  };

  // Handle PDF Download
  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    setApiError('');
    try {
      const payload = {
        report_type: reportType,
        period: period,
        from_date: period === 'custom' ? fromDate : undefined,
        to_date: period === 'custom' ? toDate : undefined,
        category_id: categoryId || undefined,
        payment_method: paymentMethod || undefined,
        transaction_type: transactionType || undefined,
        min_amount: minAmount ? parseFloat(minAmount) : undefined,
        max_amount: maxAmount ? parseFloat(maxAmount) : undefined,
        search: search || undefined,
      };

      const res = await api.post('/reports/export/pdf', payload, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}-report-${new Date().toISOString().slice(0,10)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('PDF Download error:', err);
      setApiError('Failed to download PDF export.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Helper formatting function
  const formatRupee = (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return '₹0.00';
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Pagination rows
  const allRows = reportData?.rows || [];
  const totalPages = Math.ceil(allRows.length / itemsPerPage);
  const paginatedRows = allRows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans w-full overflow-x-hidden">
      <Navbar />

      {/* Main Content Workspace */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">

        {/* Header Title Card */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] sm:text-xs font-semibold mb-1.5 sm:mb-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <span>Production Financial Export Suite</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-400 flex-shrink-0" />
              <span>SaaS Report Center & Financial Exports</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5 sm:mt-1">
              Generate, preview, and download real PostgreSQL financial statements in PDF or formula-injection protected CSV formats.
            </p>
          </div>

          {/* Export Actions Bar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={handleDownloadCsv}
              disabled={loading || downloadingCsv}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs px-4 py-2.5 rounded-2xl transition flex items-center gap-2 shadow-lg disabled:opacity-50"
            >
              {downloadingCsv ? <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> : <FileSpreadsheet className="w-4 h-4 text-emerald-400" />}
              <span>{downloadingCsv ? 'Preparing CSV...' : 'Download CSV'}</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={loading || downloadingPdf}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-2.5 rounded-2xl transition flex items-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
            >
              {downloadingPdf ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Download className="w-4 h-4" />}
              <span>{downloadingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>
          </div>
        </div>

        {/* Global Error Banner */}
        {apiError && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center justify-between text-sm shadow-lg">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <span>{apiError}</span>
            </div>
            <button
              onClick={fetchReportPreview}
              className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-semibold rounded-xl border border-rose-500/40 transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Report Selector & Filters Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-white text-base">Report Configuration & Dynamic Filters</h3>
            </div>
            <button
              onClick={fetchReportPreview}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Preview
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* 1. Report Type */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-medium focus:outline-none focus:border-indigo-500"
              >
                {REPORT_TYPES.map(rt => (
                  <option key={rt.id} value={rt.id} className="bg-slate-900">{rt.name}</option>
                ))}
              </select>
            </div>

            {/* 2. Date Range Period */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">Time Period</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-medium focus:outline-none focus:border-indigo-500"
              >
                <option value="current_month" className="bg-slate-900">Current Month</option>
                <option value="today" className="bg-slate-900">Today</option>
                <option value="last_7_days" className="bg-slate-900">Last 7 Days</option>
                <option value="last_30_days" className="bg-slate-900">Last 30 Days</option>
                <option value="previous_month" className="bg-slate-900">Previous Month</option>
                <option value="last_3_months" className="bg-slate-900">Last 3 Months</option>
                <option value="last_6_months" className="bg-slate-900">Last 6 Months</option>
                <option value="current_year" className="bg-slate-900">Current Year</option>
                <option value="previous_year" className="bg-slate-900">Previous Year</option>
                <option value="custom" className="bg-slate-900">Custom Date Range</option>
              </select>
            </div>

            {/* 3. Category Filter */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-medium focus:outline-none focus:border-indigo-500"
              >
                <option value="" className="bg-slate-900">All Categories</option>
                {(Array.isArray(categories) ? categories : []).map(c => (
                  <option key={c.id} value={c.id} className="bg-slate-900">{c.name} ({c.type})</option>
                ))}
              </select>
            </div>

            {/* 4. Payment Method */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-medium focus:outline-none focus:border-indigo-500"
              >
                <option value="" className="bg-slate-900">All Payment Methods</option>
                <option value="cash" className="bg-slate-900">Cash</option>
                <option value="credit_card" className="bg-slate-900">Credit Card</option>
                <option value="debit_card" className="bg-slate-900">Debit Card</option>
                <option value="upi" className="bg-slate-900">UPI</option>
                <option value="bank_transfer" className="bg-slate-900">Bank Transfer</option>
                <option value="other" className="bg-slate-900">Other</option>
              </select>
            </div>
          </div>

          {/* Custom Date Range & Search Row */}
          {period === 'custom' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">To Date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Search Bar & Apply Filter */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search description or source..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={fetchReportPreview}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition shadow-lg shadow-indigo-600/20"
            >
              Apply Filters & Preview
            </button>
          </div>
        </div>

        {/* Report Summary Cards */}
        {reportData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {reportData.summary_cards?.map((card, idx) => (
              <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{card.label}</div>
                <div className="text-2xl font-black text-white">{card.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Report Preview Data Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-white text-base">{reportData?.title || 'Report Preview'}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Period: {reportData?.period_label || 'Current Month'}</p>
            </div>
            <span className="text-xs bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-3 py-1 rounded-full font-mono">
              {allRows.length} Total Records
            </span>
          </div>

          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              <span className="text-xs text-slate-400">Generating report preview from PostgreSQL data...</span>
            </div>
          ) : allRows.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center space-y-2 text-slate-500 text-xs text-center">
              <FileText className="w-10 h-10 text-slate-600" />
              <span>No financial data found for the selected period and filters.</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/60 text-slate-400 font-semibold uppercase border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Date / Window</th>
                      <th className="py-3 px-4">Description / Goal</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Method / Status</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {paginatedRows.map((row, idx) => (
                      <tr key={row.id || idx} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-mono text-slate-400">{row.date}</td>
                        <td className="py-3 px-4 font-semibold text-white">{row.description}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-medium">
                            {row.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">{row.method_or_source}</td>
                        <td className={`py-3 px-4 text-right font-bold ${
                          row.amount_formatted?.startsWith('+') ? 'text-emerald-400' :
                          row.amount_formatted?.startsWith('-') ? 'text-rose-400' : 'text-slate-200'
                        }`}>
                          {row.amount_formatted}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-xs text-slate-400">
                  <span>Showing page <strong>{currentPage}</strong> of <strong>{totalPages}</strong></span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 disabled:opacity-40"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 disabled:opacity-40"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 bg-slate-950 py-4 text-center text-xs text-slate-500">
        AI Expense & Business Analytics SaaS &bull; Phase 9 Report Center Module
      </footer>
    </div>
  );
};

export default ReportsPage;
