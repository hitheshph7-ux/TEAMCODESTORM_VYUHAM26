import React from 'react';
import { PlusCircle, RefreshCw, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  onNewWorkflow: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onNewWorkflow, onRefresh, isRefreshing }) => {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/80 px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center space-x-3">
        <h1 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <span>Workflow Orchestrator</span>
          <span className="text-xs font-normal text-slate-500 font-mono">v1.4.2</span>
        </h1>
        <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>4-Agent Consensus Protocol</span>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs font-medium transition disabled:opacity-50"
          title="Refresh real-time data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : 'text-slate-400'}`} />
          <span>Sync</span>
        </button>

        <button
          onClick={onNewWorkflow}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Workflow</span>
        </button>
      </div>
    </header>
  );
};
