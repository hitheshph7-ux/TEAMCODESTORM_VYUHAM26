import React from 'react';
import { Bot, CheckCircle2, XCircle, Clock, ShieldCheck, Activity, Cpu } from 'lucide-react';
import { AgentMetrics } from '../types/orchestrator.ts';

interface AgentsPageProps {
  agents: AgentMetrics[];
}

export const AgentsPage: React.FC<AgentsPageProps> = ({ agents }) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Working':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse';
      case 'Completed':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Failed':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'Paused':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getAgentRoleSummary = (name: string) => {
    switch (name) {
      case 'Planner':
        return 'Decomposition, task scheduling, dependency resolution, and risk estimation.';
      case 'Executor':
        return 'Authorized tool execution, research gathering, text extraction, and reporting.';
      case 'Monitor':
        return 'Real-time output validation, citation checking, and milestone completion gating.';
      case 'Recover':
        return 'Task failure handling, bounded retries with backoff, and adaptive replanning.';
      default:
        return 'Specialized autonomous pipeline worker.';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-400" />
          <span>Agent Management & Live Registry</span>
        </h2>
        <p className="text-xs text-slate-400">
          Dynamic monitoring of all 4 specialized agents. Status updates in real-time based on backend executions.
        </p>
      </div>

      {/* Agents Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {agents.map((agent) => {
          const successRate =
            agent.totalExecutions > 0
              ? Math.round((agent.successfulExecutions / agent.totalExecutions) * 100)
              : 100;

          return (
            <div
              key={agent.name}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition space-y-4"
            >
              {/* Agent Title & Status */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{agent.name} Agent</h3>
                      <span className="text-[11px] font-mono text-slate-500">Autonomous Worker</span>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-mono px-2.5 py-1 rounded-full uppercase border font-semibold ${getStatusBadge(
                      agent.status
                    )}`}
                  >
                    {agent.status}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mt-3">
                  {agent.responsibility || getAgentRoleSummary(agent.name)}
                </p>
              </div>

              {/* Current Activity Status */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-blue-400" />
                    <span>Current Execution:</span>
                  </span>
                  <span className="font-mono text-slate-300">
                    {agent.currentTaskId ? `Task: ${agent.currentTaskId}` : 'Standing by in event queue'}
                  </span>
                </div>
                {agent.lastExecution && (
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1 border-t border-slate-900">
                    <span>Last Active:</span>
                    <span>{new Date(agent.lastExecution).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Dynamic Execution Metrics */}
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800/80 text-center">
                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/50">
                  <div className="text-[10px] text-slate-500 uppercase font-mono">Total Runs</div>
                  <div className="text-sm font-bold text-white font-mono mt-0.5">
                    {agent.totalExecutions}
                  </div>
                </div>

                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/50">
                  <div className="text-[10px] text-emerald-500 uppercase font-mono">Success</div>
                  <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                    {agent.successfulExecutions}
                  </div>
                </div>

                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/50">
                  <div className="text-[10px] text-blue-400 uppercase font-mono">Reliability</div>
                  <div className="text-sm font-bold text-blue-300 font-mono mt-0.5">
                    {successRate}%
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
