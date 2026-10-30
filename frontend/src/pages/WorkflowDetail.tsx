import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, RefreshCw, Play, XCircle, GitBranch, AlertTriangle,
  Clock, RotateCcw, CheckCircle2, Network
} from 'lucide-react';
import { workflowsApi, approvalsApi } from '../services/api';
import type { WorkflowDetail, WorkflowStatus_, Task, Approval } from '../types';
import StatusBadge from '../components/StatusBadge';
import { formatDate, agentBgColor } from '../utils/helpers';

function TaskCard({ task }: { task: Task }) {
  const statusColors: Record<string, string> = {
    pending: 'border-gray-600/40',
    ready: 'border-cyan-600/40',
    running: 'border-primary-600/40 shadow-glow-sm',
    completed: 'border-emerald-600/40',
    failed: 'border-red-600/40',
    blocked: 'border-orange-600/40',
    awaiting_approval: 'border-amber-600/40',
    skipped: 'border-gray-600/20',
  };

  return (
    <div className={`card border ${statusColors[task.status] || 'border-surface-600'} space-y-3`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-500 font-mono">#{task.order_index + 1}</span>
            <h3 className="font-semibold text-white text-sm">{task.name}</h3>
          </div>
          <p className="text-xs text-gray-400">{task.description}</p>
        </div>
        <StatusBadge status={task.status} />
      </div>

      <div className="flex flex-wrap gap-2">
        {task.assigned_agent && (
          <span className={`text-xs px-2 py-1 rounded border font-medium ${agentBgColor(task.assigned_agent)}`}>
            🤖 {task.assigned_agent}
          </span>
        )}
        {task.tool_name && (
          <span className="text-xs px-2 py-1 rounded border bg-surface-600 border-surface-500 text-gray-300 font-mono">
            🔧 {task.tool_name}
          </span>
        )}
        {task.requires_approval && (
          <span className="text-xs px-2 py-1 rounded border bg-amber-500/20 border-amber-500/40 text-amber-300">
            ⚠ Requires Approval
          </span>
        )}
      </div>

      {task.retry_count > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-amber-400">
          <RotateCcw size={12} />
          Retried {task.retry_count} / {task.max_retries} times
        </div>
      )}

      {task.error_message && (
        <div className="p-2.5 bg-red-900/20 border border-red-600/30 rounded-lg">
          <p className="text-xs text-red-300 font-mono">{task.error_message}</p>
        </div>
      )}
    </div>
  );
}

export default function WorkflowDetail() {
  const { id } = useParams<{ id: string }>();
  const [workflow, setWorkflow] = useState<WorkflowDetail | null>(null);
  const [wfStatus, setWfStatus] = useState<WorkflowStatus_ | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);

  const fetchAll = async () => {
    if (!id) return;
    try {
      const [wf, status, approvals] = await Promise.all([
        workflowsApi.get(id),
        workflowsApi.status(id),
        approvalsApi.list(true),
      ]);
      setWorkflow(wf);
      setWfStatus(status);
      setPendingApprovals(approvals.filter(a => a.workflow_id === id));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 3000);
    return () => clearInterval(interval);
  }, [id]);

  const handleCancel = async () => {
    if (!id || !confirm('Cancel this workflow?')) return;
    setCancelLoading(true);
    await workflowsApi.cancel(id);
    fetchAll();
    setCancelLoading(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <RefreshCw size={28} className="animate-spin text-primary-400" />
    </div>
  );

  if (!workflow) return (
    <div className="p-6">
      <p className="text-red-400">Workflow not found</p>
    </div>
  );

  const tasks = workflow.tasks || [];
  const taskGroups = {
    completed: tasks.filter(t => t.status === 'completed'),
    running: tasks.filter(t => t.status === 'running'),
    failed: tasks.filter(t => t.status === 'failed'),
    pending: tasks.filter(t => ['pending', 'ready', 'blocked'].includes(t.status)),
    awaiting: tasks.filter(t => t.status === 'awaiting_approval'),
  };

  const progressPct = tasks.length > 0
    ? Math.round((taskGroups.completed.length / tasks.length) * 100)
    : 0;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link to="/workflows" className="btn-secondary !px-3 !py-2.5 mt-0.5">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-white">Workflow Details</h1>
              <StatusBadge status={workflow.status} />
            </div>
            <p className="text-gray-400 text-sm max-w-2xl">{workflow.objective}</p>
            <p className="text-xs text-gray-500 mt-1 font-mono">{workflow.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link to={`/visualize?wf=${id}`} className="btn-secondary">
            <Network size={16} />
            View Graph
          </Link>
          <button onClick={fetchAll} className="btn-secondary !px-3">
            <RefreshCw size={16} />
          </button>
          {['pending', 'planning', 'running', 'paused'].includes(workflow.status) && (
            <button onClick={handleCancel} disabled={cancelLoading} className="btn-danger">
              <XCircle size={16} />
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Stats Row */}
      {wfStatus && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Tasks', value: wfStatus.total_tasks, color: 'text-white' },
            { label: 'Completed', value: wfStatus.completed_tasks, color: 'text-emerald-400' },
            { label: 'Failed', value: wfStatus.failed_tasks, color: 'text-red-400' },
            { label: 'Approvals Pending', value: wfStatus.pending_approvals, color: 'text-amber-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card text-center py-4">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Progress bar */}
      {tasks.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-300">Execution Progress</span>
            <span className="text-sm font-bold text-white">{progressPct}%</span>
          </div>
          <div className="h-2 bg-surface-600 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-600 to-accent-cyan rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex gap-4 mt-3 text-xs text-gray-400">
            <span>✅ {taskGroups.completed.length} done</span>
            <span>🔵 {taskGroups.running.length} running</span>
            <span>❌ {taskGroups.failed.length} failed</span>
            <span>⏳ {taskGroups.pending.length} pending</span>
            {taskGroups.awaiting.length > 0 && <span>⏸ {taskGroups.awaiting.length} awaiting approval</span>}
          </div>
        </div>
      )}

      {/* Pending Approvals */}
      {pendingApprovals.length > 0 && (
        <div className="card border-amber-600/40 bg-amber-900/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-400" />
              <h2 className="font-semibold text-amber-300">Pending Approvals</h2>
            </div>
            <Link to="/approvals" className="text-sm text-amber-400 hover:text-amber-300">
              Go to Approval Center →
            </Link>
          </div>
          <p className="text-sm text-gray-400">
            This workflow is paused waiting for {pendingApprovals.length} approval{pendingApprovals.length > 1 ? 's' : ''}.
          </p>
        </div>
      )}

      {/* Task List */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <GitBranch size={18} className="text-primary-400" />
          Task Execution Pipeline
        </h2>
        {tasks.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-gray-400">No tasks generated yet. Start the workflow first.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {tasks.map(task => <TaskCard key={task.id} task={task} />)}
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="card">
        <h3 className="font-medium text-gray-300 mb-3 text-sm">Workflow Metadata</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500">Created:</span>
            <span className="text-gray-300 ml-2">{formatDate(workflow.created_at)}</span>
          </div>
          <div>
            <span className="text-gray-500">Updated:</span>
            <span className="text-gray-300 ml-2">{formatDate(workflow.updated_at)}</span>
          </div>
          <div>
            <span className="text-gray-500">Mode:</span>
            <span className="text-gray-300 ml-2 uppercase font-mono">{workflow.execution_mode}</span>
          </div>
          <div>
            <span className="text-gray-500">ID:</span>
            <span className="text-gray-300 ml-2 font-mono text-xs">{workflow.id}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
