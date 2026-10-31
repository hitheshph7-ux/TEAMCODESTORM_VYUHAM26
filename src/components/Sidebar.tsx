import React from 'react';
import {
  LayoutDashboard,
  GitBranch,
  Bot,
  ShieldAlert,
  RotateCcw,
  History,
  Cpu,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingApprovalsCount: number;
  activeWorkflowsCount: number;
  failedTasksCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  pendingApprovalsCount,
  activeWorkflowsCount,
  failedTasksCount,
}) => {
  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'workflows',
      label: 'Workflows',
      icon: GitBranch,
      badge: activeWorkflowsCount > 0 ? `${activeWorkflowsCount} active` : null,
      badgeColor: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    },
    {
      id: 'agents',
      label: 'Agents (4)',
      icon: Bot,
      badge: '4 live',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    },
    {
      id: 'approvals',
      label: 'Approvals',
      icon: ShieldAlert,
      badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount} req` : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse',
    },
    {
      id: 'recovery',
      label: 'Recovery',
      icon: RotateCcw,
      badge: failedTasksCount > 0 ? `${failedTasksCount} issue` : null,
      badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
    },
    {
      id: 'audit',
      label: 'Audit Trail',
      icon: History,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950/70 flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-950/50">
            <Cpu className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="font-bold text-sm tracking-wide text-white uppercase flex items-center gap-1.5">
              <span>AF-01</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50">
                PRO
              </span>
            </div>
            <div className="text-xs text-slate-400">Autonomous Orchestrator</div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="p-3 space-y-1">
          <div className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
            Platform Engine
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Governance Status Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/40">
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-mono text-slate-300 text-[11px]">Governance Engine Active</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">
          Risk Policy: Mandatory Sign-off
        </div>
      </div>
    </aside>
  );
};
