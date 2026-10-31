import React from 'react';
import {
  GitBranch,
  Bot,
  ShieldAlert,
  RotateCcw,
  Clock,
  ArrowRight,
  PlusCircle,
  FileText,
  Search,
  FolderKanban,
  CheckCircle2,
} from 'lucide-react';
import { Workflow, AgentMetrics, Approval, AuditLog } from '../types/orchestrator.ts';

interface OverviewPageProps {
  workflows: Workflow[];
  agents: AgentMetrics[];
  approvals: Approval[];
  auditLogs: AuditLog[];
  onSelectWorkflow: (wf: Workflow) => void;
  onNavigateTab: (tab: string) => void;
  onNewWorkflow: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  workflows,
  agents,
  approvals,
  auditLogs,
  onSelectWorkflow,
  onNavigateTab,
  onNewWorkflow,
}) => {
  const activeWorkflows = workflows.filter(
    (w) => w.status === 'in_progress' || w.status === 'planning' || w.status === 'waiting_approval' || w.status === 'recovering'
  );
  const pendingApprovals = approvals.filter((a) => a.status === 'pending');
  const failedTasksCount = workflows.reduce(
    (acc, wf) => acc + wf.tasks.filter((t) => t.status === 'failed').length,
    0
  );

  const getUseCaseIcon = (useCase: string) => {
    switch (useCase) {
      case 'research':
        return <Search className="w-3.5 h-3.5 text-blue-400" />;
      case 'document':
        return <FileText className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <FolderKanban className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse';
      case 'waiting_approval':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse';
      case 'recovering':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'failed':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900/30 via-slate-900/80 to-slate-900 border border-blue-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono uppercase tracking-wider text-blue-400 font-semibold">
              Hackathon Demonstration
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400">Autonomous 4-Agent Execution Grid</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Autonomous AI-Based Workflow Orchestration Platform
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Decomposes objectives into tasks, executes with authorized agents, enforces risk-based governance approvals, monitors milestones, and guarantees bounded recovery.
          </p>
        </div>
        <button
          onClick={onNewWorkflow}
          className="shrink-0 flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 transition cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Launch Workflow</span>
        </button>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Workflows */}
        <div
          onClick={() => onNavigateTab('workflows')}
          className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Workflows
            </span>
            <GitBranch className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2 font-mono">{workflows.length}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>{activeWorkflows.length} active now</span>
          </div>
        </div>

        {/* Active Workflows */}
        <div
          onClick={() => onNavigateTab('workflows')}
          className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Active In-Flight
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping"></span>
          </div>
          <div className="text-2xl font-bold text-blue-400 mt-2 font-mono">
            {activeWorkflows.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Coordinated across agents
          </div>
        </div>

        {/* Pending Approvals */}
        <div
          onClick={() => onNavigateTab('approvals')}
          className={`bg-slate-900/80 border rounded-xl p-4 transition cursor-pointer ${
            pendingApprovals.length > 0
              ? 'border-amber-500/50 bg-amber-950/10'
              : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Governance Gate
            </span>
            <ShieldAlert className={`w-4 h-4 ${pendingApprovals.length > 0 ? 'text-amber-400 animate-bounce' : 'text-slate-500'}`} />
          </div>
          <div className={`text-2xl font-bold mt-2 font-mono ${pendingApprovals.length > 0 ? 'text-amber-300' : 'text-white'}`}>
            {pendingApprovals.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {pendingApprovals.length > 0 ? 'Human approvals required' : 'All policies satisfied'}
          </div>
        </div>

        {/* Failed / Recovering Tasks */}
        <div
          onClick={() => onNavigateTab('recovery')}
          className={`bg-slate-900/80 border rounded-xl p-4 transition cursor-pointer ${
            failedTasksCount > 0 ? 'border-rose-500/40 bg-rose-950/10' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Recovery Ops
            </span>
            <RotateCcw className={`w-4 h-4 ${failedTasksCount > 0 ? 'text-rose-400' : 'text-slate-500'}`} />
          </div>
          <div className={`text-2xl font-bold mt-2 font-mono ${failedTasksCount > 0 ? 'text-rose-400' : 'text-white'}`}>
            {failedTasksCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Bounded retries & failover
          </div>
        </div>
      </div>

      {/* Agent Team Matrix */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Bot className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-slate-200">Autonomous Agent Team (4)</h3>
          </div>
          <button
            onClick={() => onNavigateTab('agents')}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1"
          >
            <span>View Full Agent Registry</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {agents.map((agent) => {
            const isWorking = agent.status === 'Working';
            return (
              <div
                key={agent.name}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm text-white">{agent.name} Agent</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase border font-semibold ${
                        isWorking
                          ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {agent.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-snug line-clamp-2">
                    {agent.responsibility}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>Executions:</span>
                  <span className="font-mono font-medium text-slate-200">
                    {agent.successfulExecutions}/{agent.totalExecutions}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dual Column: Recent Workflows & Live Audit Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Workflows */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-blue-400" />
              <span>Recent Workflows</span>
            </h3>
            <button
              onClick={() => onNavigateTab('workflows')}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            {workflows.slice(0, 4).map((wf) => (
              <div
                key={wf.id}
                onClick={() => onSelectWorkflow(wf)}
                className="p-3 bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 rounded-lg cursor-pointer transition flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    {getUseCaseIcon(wf.useCase)}
                    <span className="text-sm font-medium text-slate-200 truncate max-w-xs">
                      {wf.title}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center space-x-2">
                    <span>{wf.tasks.length} tasks planned</span>
                    <span>•</span>
                    <span>{new Date(wf.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase border font-semibold ${getStatusBadge(
                    wf.status
                  )}`}
                >
                  {wf.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Audit Stream */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Real-Time Audit Stream</span>
            </h3>
            <button
              onClick={() => onNavigateTab('audit')}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              Full Trail
            </button>
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {auditLogs.slice(0, 6).map((log) => (
              <div
                key={log.id}
                className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-lg text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-blue-400 font-semibold">
                    {log.eventType}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-slate-300 leading-snug line-clamp-2">{log.details}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
