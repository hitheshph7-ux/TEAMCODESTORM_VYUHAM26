import { useEffect, useState } from 'react';
import {
  Bot, Brain, Cpu, Shield, Activity, RefreshCw,
  CheckCircle2, XCircle, Clock, Zap
} from 'lucide-react';
import { logsApi } from '../services/api';
import type { ExecutionLog } from '../types';
import { formatRelativeTime } from '../utils/helpers';

const AGENTS = [
  {
    id: 'planner',
    name: 'Planner Agent',
    icon: Brain,
    color: 'from-blue-600/20 to-blue-900/10 border-blue-600/30',
    iconColor: 'text-blue-400 bg-blue-500/20',
    description: 'Converts objectives to structured task plans using Claude API',
    capabilities: ['Natural language understanding', 'Task decomposition', 'Dependency mapping', 'Tool selection'],
  },
  {
    id: 'executor',
    name: 'Executor Agent',
    icon: Cpu,
    color: 'from-emerald-600/20 to-emerald-900/10 border-emerald-600/30',
    iconColor: 'text-emerald-400 bg-emerald-500/20',
    description: 'Runs registered business tools and updates task status',
    capabilities: ['Tool invocation', 'Input validation', 'Result recording', 'Status management'],
  },
  {
    id: 'monitor',
    name: 'Monitor Agent',
    icon: Activity,
    color: 'from-cyan-600/20 to-cyan-900/10 border-cyan-600/30',
    iconColor: 'text-cyan-400 bg-cyan-500/20',
    description: 'Tracks progress, evaluates dependencies and detects completion',
    capabilities: ['Dependency evaluation', 'Status tracking', 'Failure detection', 'Workflow routing'],
  },
  {
    id: 'recovery',
    name: 'Recovery Agent',
    icon: Shield,
    color: 'from-amber-600/20 to-amber-900/10 border-amber-600/30',
    iconColor: 'text-amber-400 bg-amber-500/20',
    description: 'Handles failures with bounded retries and permanent failure marking',
    capabilities: ['Error classification', 'Retry scheduling', 'Recovery logging', 'Permanent failure marking'],
  },
];

export default function AgentMonitor() {
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const data = await logsApi.list({ limit: 100 });
      setLogs(data);
      setLoading(false);
    };
    fetch();
    const interval = setInterval(fetch, 3000);
    return () => clearInterval(interval);
  }, []);

  // Get recent actions per agent
  const getAgentLogs = (agentId: string) =>
    logs.filter(l => l.agent_name === agentId).slice(0, 5);

  const getAgentStatus = (agentId: string): 'active' | 'idle' => {
    const recent = logs.filter(l => l.agent_name === agentId);
    if (!recent.length) return 'idle';
    const lastLog = recent[0];
    const age = Date.now() - new Date(lastLog.created_at).getTime();
    return age < 30000 ? 'active' : 'idle';
  };

  const logStatusIcon = (status: string) => {
    if (['success', 'completed', 'approved'].includes(status)) return <CheckCircle2 size={12} className="text-emerald-400" />;
    if (['error', 'failed'].includes(status)) return <XCircle size={12} className="text-red-400" />;
    if (status === 'retry') return <RefreshCw size={12} className="text-amber-400" />;
    if (['approval_request', 'approval_decision'].includes(status)) return <Clock size={12} className="text-amber-400" />;
    return <Zap size={12} className="text-blue-400" />;
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Agent Monitor</h1>
          <p className="text-gray-400 mt-1">Real-time status of all specialized agents</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Live monitoring
        </div>
      </div>

      {/* Agent Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {AGENTS.map(agent => {
          const agentLogs = getAgentLogs(agent.id);
          const status = getAgentStatus(agent.id);
          const AgentIcon = agent.icon;

          return (
            <div key={agent.id} className={`card bg-gradient-to-br ${agent.color} border space-y-4`}>
              {/* Agent Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${agent.iconColor}`}>
                    <AgentIcon size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">{agent.name}</h3>
                      <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                        status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-surface-600 text-gray-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'
                        }`} />
                        {status === 'active' ? 'Active' : 'Idle'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{agent.description}</p>
                  </div>
                </div>
                <Bot size={16} className="text-gray-600" />
              </div>

              {/* Capabilities */}
              <div className="flex flex-wrap gap-1.5">
                {agent.capabilities.map(cap => (
                  <span key={cap} className="text-xs px-2 py-0.5 bg-surface-700/50 text-gray-400 rounded border border-surface-600/50">
                    {cap}
                  </span>
                ))}
              </div>

              {/* Recent Actions */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Recent Actions</p>
                {loading ? (
                  <p className="text-xs text-gray-500">Loading...</p>
                ) : agentLogs.length === 0 ? (
                  <p className="text-xs text-gray-600 italic">No recent activity</p>
                ) : (
                  <div className="space-y-1.5">
                    {agentLogs.map(log => (
                      <div key={log.id} className="flex items-start gap-2 p-2 rounded-lg bg-surface-800/60">
                        {logStatusIcon(log.status)}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-300 truncate">{log.action}</p>
                          <p className="text-xs text-gray-500">{formatRelativeTime(log.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Orchestration Flow */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
          LangGraph Orchestration Flow
        </h2>
        <div className="flex items-center flex-wrap gap-2 text-sm">
          {[
            { label: 'START', color: 'bg-surface-600 text-gray-300' },
            { label: '→' },
            { label: 'Planner', color: 'bg-blue-500/20 text-blue-300' },
            { label: '→' },
            { label: 'Executor', color: 'bg-emerald-500/20 text-emerald-300' },
            { label: '→' },
            { label: 'Monitor', color: 'bg-cyan-500/20 text-cyan-300' },
            { label: '→' },
            { label: 'Recovery', color: 'bg-amber-500/20 text-amber-300' },
            { label: '→' },
            { label: 'Audit', color: 'bg-purple-500/20 text-purple-300' },
            { label: '→' },
            { label: 'END', color: 'bg-surface-600 text-gray-300' },
          ].map((item, i) => (
            item.color ? (
              <span key={i} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border border-surface-500/50 ${item.color}`}>
                {item.label}
              </span>
            ) : (
              <span key={i} className="text-gray-600 font-bold">{item.label}</span>
            )
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Conditional routing: Monitor → Recovery (on failure) | Monitor → END (on approval wait) | Monitor → Audit (on completion)
        </p>
      </div>
    </div>
  );
}
