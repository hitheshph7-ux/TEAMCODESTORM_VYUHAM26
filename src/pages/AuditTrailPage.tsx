import React, { useState } from 'react';
import { History, Search, Filter, Trash2, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react';
import { AuditLog, AgentName } from '../types/orchestrator.ts';
import { api } from '../services/api.ts';

interface AuditTrailPageProps {
  auditLogs: AuditLog[];
  onRefresh: () => void;
}

export const AuditTrailPage: React.FC<AuditTrailPageProps> = ({ auditLogs, onRefresh }) => {
  const [eventTypeFilter, setEventTypeFilter] = useState('ALL');
  const [agentFilter, setAgentFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [showClearModal, setShowClearModal] = useState(false);
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [isClearing, setIsClearing] = useState(false);

  const filteredLogs = auditLogs.filter((log) => {
    if (eventTypeFilter !== 'ALL' && log.eventType !== eventTypeFilter) return false;
    if (agentFilter !== 'ALL' && log.agentName !== agentFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        log.details.toLowerCase().includes(q) ||
        log.eventType.toLowerCase().includes(q) ||
        (log.workflowId && log.workflowId.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleClearHistory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmPhrase !== 'CLEAR_AUDIT_LOGS') return;

    setIsClearing(true);
    try {
      await api.clearAuditLogs('Human Overseer (Admin)', confirmPhrase);
      setShowClearModal(false);
      setConfirmPhrase('');
      onRefresh();
    } finally {
      setIsClearing(false);
    }
  };

  const getEventBadge = (type: string) => {
    if (type.includes('FAIL') || type.includes('REJECT')) {
      return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    }
    if (type.includes('APPROVAL') || type.includes('RISK')) {
      return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    }
    if (type.includes('RECOVER') || type.includes('RETRY')) {
      return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
    }
    if (type.includes('EMAIL')) {
      return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
    }
    if (type.includes('COMPLETED') || type.includes('FINAL')) {
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    }
    return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-blue-400" />
            <span>Immutable Governance Audit Trail</span>
          </h2>
          <p className="text-xs text-slate-400">
            Chronological, verifiable system records of all agent actions, risk assessments, and approvals.
          </p>
        </div>

        <button
          onClick={() => setShowClearModal(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 border border-rose-800/40 text-xs font-semibold transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear History (Requires Authorization)</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search details or IDs..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Event Type Filter */}
        <div>
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Event Types</option>
            <option value="WORKFLOW_CREATED">WORKFLOW_CREATED</option>
            <option value="TASK_CREATED">TASK_CREATED</option>
            <option value="AGENT_EXECUTION_START">AGENT_EXECUTION_START</option>
            <option value="AGENT_EXECUTION_COMPLETED">AGENT_EXECUTION_COMPLETED</option>
            <option value="AGENT_EXECUTION_FAILED">AGENT_EXECUTION_FAILED</option>
            <option value="APPROVAL_REQUESTED">APPROVAL_REQUESTED</option>
            <option value="APPROVAL_DECIDED">APPROVAL_DECIDED</option>
            <option value="RECOVERY_TRIGGERED">RECOVERY_TRIGGERED</option>
            <option value="RETRY_ATTEMPT">RETRY_ATTEMPT</option>
            <option value="EMAIL_SENT">EMAIL_SENT</option>
            <option value="FINAL_OUTPUT_GENERATED">FINAL_OUTPUT_GENERATED</option>
          </select>
        </div>

        {/* Agent Filter */}
        <div>
          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Agents</option>
            <option value="Planner">Planner Agent</option>
            <option value="Executor">Executor Agent</option>
            <option value="Monitor">Monitor Agent</option>
            <option value="Recover">Recover Agent</option>
          </select>
        </div>
      </div>

      {/* Logs Table / List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/80">
        <div className="p-3 bg-slate-950/80 text-[11px] font-mono text-slate-400 flex items-center justify-between">
          <span>Displaying {filteredLogs.length} audit records</span>
          <span>Security Level: Tamper-Evident</span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No audit records match the selected filter.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="p-3.5 hover:bg-slate-900/40 transition space-y-1.5 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase border font-semibold ${getEventBadge(
                      log.eventType
                    )}`}
                  >
                    {log.eventType}
                  </span>
                  {log.agentName && (
                    <span className="text-[11px] font-medium text-slate-300">
                      [{log.agentName} Agent]
                    </span>
                  )}
                  {log.riskLevel && (
                    <span className="text-[10px] text-slate-500 font-mono">
                      Risk: {log.riskLevel.toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="text-[10px] text-slate-500 font-mono">
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>

              <p className="text-slate-200 leading-relaxed font-sans">{log.details}</p>

              {(log.workflowId || log.taskId) && (
                <div className="text-[10px] text-slate-500 font-mono flex items-center space-x-3 pt-0.5">
                  {log.workflowId && <span>Workflow: {log.workflowId}</span>}
                  {log.taskId && <span>Task: {log.taskId}</span>}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Clear History Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center space-x-2.5 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Authorized History Purge</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Clearing history requires explicit administrative verification. In accordance with Section 6C governance, a permanent <code className="text-rose-400 bg-rose-950/40 px-1 py-0.5 rounded">HISTORY_CLEARED</code> audit record will be generated immediately afterward.
            </p>

            <form onSubmit={handleClearHistory} className="space-y-3 pt-1">
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Type <span className="font-mono text-white font-bold">CLEAR_AUDIT_LOGS</span> to confirm:
                </label>
                <input
                  type="text"
                  required
                  value={confirmPhrase}
                  onChange={(e) => setConfirmPhrase(e.target.value)}
                  placeholder="CLEAR_AUDIT_LOGS"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white font-mono focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClearModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={confirmPhrase !== 'CLEAR_AUDIT_LOGS' || isClearing}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md transition disabled:opacity-40"
                >
                  {isClearing ? 'Clearing...' : 'Authorize & Purge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
