import { useEffect, useState } from 'react';
import { logsApi, workflowsApi } from '../services/api';
import type { ExecutionLog, Workflow } from '../types';
import { formatDate } from '../utils/helpers';
import { RefreshCw, Search, Filter, AlertCircle, CheckCircle2, Info, RotateCcw, Clock } from 'lucide-react';

const STATUS_ICONS: Record<string, JSX.Element> = {
  success: <CheckCircle2 size={14} className="text-emerald-400" />,
  error: <AlertCircle size={14} className="text-red-400" />,
  warning: <AlertCircle size={14} className="text-amber-400" />,
  info: <Info size={14} className="text-blue-400" />,
  retry: <RotateCcw size={14} className="text-amber-400" />,
  approval_request: <Clock size={14} className="text-amber-400" />,
  approval_decision: <CheckCircle2 size={14} className="text-cyan-400" />,
};

const AGENT_COLORS: Record<string, string> = {
  planner: 'text-blue-400',
  executor: 'text-emerald-400',
  monitor: 'text-cyan-400',
  recovery: 'text-amber-400',
  orchestrator: 'text-purple-400',
};

export default function AuditLogs() {
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    workflow_id: '',
    agent_name: '',
    status: '',
    search: '',
  });

  const fetchLogs = async () => {
    const params: any = {};
    if (filters.workflow_id) params.workflow_id = filters.workflow_id;
    if (filters.agent_name) params.agent_name = filters.agent_name;
    if (filters.status) params.status = filters.status;
    params.limit = 200;

    const data = await logsApi.list(params);
    setLogs(data);
    setLoading(false);
  };

  useEffect(() => {
    workflowsApi.list().then(setWorkflows);
  }, []);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 4000);
    return () => clearInterval(interval);
  }, [filters.workflow_id, filters.agent_name, filters.status]);

  const filtered = logs.filter(log => {
    if (!filters.search) return true;
    const s = filters.search.toLowerCase();
    return (
      log.action.toLowerCase().includes(s) ||
      (log.agent_name || '').toLowerCase().includes(s) ||
      (log.error_message || '').toLowerCase().includes(s)
    );
  });

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
          <p className="text-gray-400 mt-1">Complete immutable record of all workflow operations</p>
        </div>
        <button onClick={fetchLogs} className="btn-secondary">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={15} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-300">Filters</span>
          <span className="text-xs text-gray-500">({filtered.length} entries)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              placeholder="Search actions..."
              className="input pl-8 text-sm"
            />
          </div>

          <select
            value={filters.workflow_id}
            onChange={e => setFilters(f => ({ ...f, workflow_id: e.target.value }))}
            className="input text-sm"
          >
            <option value="">All Workflows</option>
            {workflows.map(wf => (
              <option key={wf.id} value={wf.id}>
                {wf.id.slice(0, 8)}... – {wf.objective.slice(0, 30)}
              </option>
            ))}
          </select>

          <select
            value={filters.agent_name}
            onChange={e => setFilters(f => ({ ...f, agent_name: e.target.value }))}
            className="input text-sm"
          >
            <option value="">All Agents</option>
            {['planner', 'executor', 'monitor', 'recovery', 'orchestrator'].map(a => (
              <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
            className="input text-sm"
          >
            <option value="">All Statuses</option>
            {['info', 'success', 'warning', 'error', 'retry', 'approval_request', 'approval_decision'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Log Table */}
      {loading && filtered.length === 0 ? (
        <div className="text-center py-16">
          <RefreshCw size={28} className="animate-spin text-primary-400 mx-auto mb-3" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <Info size={36} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No audit logs found</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Workflow ID</th>
                <th>Agent</th>
                <th>Action</th>
                <th>Status</th>
                <th>Attempt</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => (
                <tr key={log.id}>
                  <td className="text-xs whitespace-nowrap text-gray-400">
                    {formatDate(log.created_at)}
                  </td>
                  <td className="font-mono text-xs text-gray-500">
                    {log.workflow_id?.slice(0, 8)}...
                  </td>
                  <td>
                    <span className={`text-xs font-medium ${AGENT_COLORS[log.agent_name || ''] || 'text-gray-400'}`}>
                      {log.agent_name || '—'}
                    </span>
                  </td>
                  <td className="max-w-xs">
                    <p className="text-sm text-white truncate">{log.action}</p>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      {STATUS_ICONS[log.status] || <Info size={14} className="text-gray-400" />}
                      <span className="text-xs text-gray-300">{log.status}</span>
                    </div>
                  </td>
                  <td className="text-center text-gray-400 text-sm">{log.attempt_number}</td>
                  <td className="max-w-xs">
                    {log.error_message ? (
                      <p className="text-xs text-red-400 truncate font-mono">{log.error_message}</p>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
