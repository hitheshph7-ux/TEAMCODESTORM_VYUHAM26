import { useEffect, useState } from 'react';
import {
  CheckCircle2, XCircle, Clock, AlertTriangle, RefreshCw,
  User, FileText, Loader2
} from 'lucide-react';
import { approvalsApi } from '../services/api';
import type { Approval } from '../types';
import StatusBadge from '../components/StatusBadge';
import { formatDate, formatRelativeTime } from '../utils/helpers';

function ApprovalCard({ approval, onDecision }: {
  approval: Approval;
  onDecision: (id: string, decision: 'approve' | 'reject') => void;
}) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDecide = async (decision: 'approve' | 'reject') => {
    setLoading(true);
    await onDecision(approval.id, decision);
    setLoading(false);
  };

  const isPending = approval.status === 'pending';

  return (
    <div className={`card border transition-all ${
      isPending
        ? 'border-amber-600/40 bg-amber-900/5'
        : approval.status === 'approved'
          ? 'border-emerald-600/30 opacity-75'
          : 'border-red-600/30 opacity-75'
    }`}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-xl ${
            isPending ? 'bg-amber-500/20' :
            approval.status === 'approved' ? 'bg-emerald-500/20' : 'bg-red-500/20'
          }`}>
            {isPending ? (
              <Clock size={18} className="text-amber-400" />
            ) : approval.status === 'approved' ? (
              <CheckCircle2 size={18} className="text-emerald-400" />
            ) : (
              <XCircle size={18} className="text-red-400" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-white">{approval.task_name || 'Unknown Task'}</h3>
            <p className="text-xs text-gray-500 font-mono mt-0.5">
              Workflow: {approval.workflow_id?.slice(0, 8)}...
            </p>
          </div>
        </div>
        <StatusBadge status={approval.status} />
      </div>

      {/* Workflow Objective */}
      {approval.workflow_objective && (
        <div className="p-3 bg-surface-700 rounded-lg mb-3">
          <p className="text-xs text-gray-400 mb-1 font-semibold uppercase tracking-wider">Workflow Objective</p>
          <p className="text-sm text-gray-300">{approval.workflow_objective}</p>
        </div>
      )}

      {/* Action Description */}
      {approval.action_description && (
        <div className="p-3 bg-surface-700 rounded-lg mb-4">
          <div className="flex items-center gap-2 mb-1">
            <FileText size={12} className="text-gray-400" />
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Action to Approve</p>
          </div>
          <p className="text-sm text-gray-200 whitespace-pre-wrap">{approval.action_description}</p>
        </div>
      )}

      <div className="text-xs text-gray-500 mb-4">
        <span>Requested by: </span>
        <span className="text-gray-400">{approval.requested_by}</span>
        <span className="mx-2">•</span>
        <span>{formatRelativeTime(approval.created_at)}</span>
      </div>

      {/* Decision Section */}
      {isPending ? (
        <div className="space-y-3">
          <input
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Optional: Add a reason for your decision..."
            className="input text-sm"
            disabled={loading}
          />
          <div className="flex gap-3">
            <button
              id={`approve-btn-${approval.id}`}
              onClick={() => handleDecide('approve')}
              disabled={loading}
              className="btn-success flex-1 justify-center"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              Approve
            </button>
            <button
              id={`reject-btn-${approval.id}`}
              onClick={() => handleDecide('reject')}
              disabled={loading}
              className="btn-danger flex-1 justify-center"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
              Reject
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-lg bg-surface-700 text-sm">
          <div className="flex items-center gap-2 text-gray-400">
            <User size={14} />
            <span>Decided by: <span className="text-white">{approval.decided_by}</span></span>
            <span className="mx-1">•</span>
            <span>{approval.decided_at ? formatDate(approval.decided_at) : 'N/A'}</span>
          </div>
          {approval.decision_reason && (
            <p className="text-gray-400 mt-1">Reason: {approval.decision_reason}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function ApprovalCenter() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingOnly, setPendingOnly] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchApprovals = async () => {
    const data = await approvalsApi.list(pendingOnly);
    setApprovals(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchApprovals();
    const interval = setInterval(fetchApprovals, 3000);
    return () => clearInterval(interval);
  }, [pendingOnly]);

  const handleDecision = async (id: string, decision: 'approve' | 'reject') => {
    setActionLoading(id);
    try {
      if (decision === 'approve') {
        await approvalsApi.approve(id, 'admin');
      } else {
        await approvalsApi.reject(id, 'admin');
      }
      await fetchApprovals();
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = approvals.filter(a => a.status === 'pending').length;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Approval Center</h1>
          <p className="text-gray-400 mt-1">
            Human-in-the-loop control for consequential workflow actions
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <span className="badge bg-amber-500/20 text-amber-300 border border-amber-500/40">
              {pendingCount} pending
            </span>
          )}
          <button onClick={fetchApprovals} className="btn-secondary">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setPendingOnly(false)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            !pendingOnly ? 'bg-primary-600/20 text-primary-300 border border-primary-600/40' : 'text-gray-400 hover:text-white'
          }`}
        >
          All Approvals
        </button>
        <button
          onClick={() => setPendingOnly(true)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            pendingOnly ? 'bg-amber-600/20 text-amber-300 border border-amber-600/40' : 'text-gray-400 hover:text-white'
          }`}
        >
          Pending Only
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <RefreshCw size={28} className="animate-spin text-primary-400 mx-auto mb-3" />
        </div>
      ) : approvals.length === 0 ? (
        <div className="card text-center py-16">
          <CheckCircle2 size={40} className="text-emerald-600 mx-auto mb-3" />
          <p className="text-gray-400">
            {pendingOnly ? 'No pending approvals' : 'No approvals yet'}
          </p>
          <p className="text-gray-500 text-sm mt-1">
            Approvals appear when a workflow reaches a consequential action
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {approvals.map(approval => (
            <ApprovalCard
              key={approval.id}
              approval={approval}
              onDecision={handleDecision}
            />
          ))}
        </div>
      )}
    </div>
  );
}
