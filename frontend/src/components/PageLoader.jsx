import React from 'react';
import { Loader2 } from 'lucide-react';

const PageLoader = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans text-slate-100">
      <div className="flex flex-col items-center space-y-4 bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl">
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <div className="text-center space-y-1">
          <h3 className="text-sm font-bold text-white">Loading Workspace</h3>
          <p className="text-xs text-slate-400 font-mono">AI Expense & Business Analytics</p>
        </div>
      </div>
    </div>
  );
};

export default PageLoader;
