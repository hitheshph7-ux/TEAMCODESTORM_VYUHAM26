import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2, XCircle, Clock, AlertTriangle, UserCheck } from 'lucide-react';
import { Approval } from '../types/orchestrator.ts';
import { api } from '../services/api.ts';

interface ApprovalsPageProps {
  approvals: Approval[];
  onRefresh: () => void;
}

export const ApprovalsPage: React.FC<ApprovalsPageProps> = ({ approvals, onRefresh }) => {
  const [actingId, setActingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<{ [id: string]: string }>({});
  const [activeRejectId, setActiveRejectId] = useState<string | null>(null);

  const pendingApprovals = approvals.filter((a) => a.status === 'pending');
  const pastApprovals = approvals.filter((a) => a.status !== 'pending');

  const handleDecision = async (id: string, decision: 'approved' | 'rejected') => {
    setActingId(id);
    const reason =
      decision === 'approved'
        ? 'Risk verified and authorized by human overseer for hackathon demo.'
        : rejectReason[id] || 'Rejected due to risk policy enforcement.';

    try {
      await api.decideApproval(id, decision, 'Human Overseer (Admin)', reason);
      setActiveRejectId(null);
      onRefresh();
    } finally {
      setActingId(null);
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'critical':
      case 'high':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'medium':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      default:
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <span>Governance Engine: Risk & Approvals</span>
        </h2>
        <p className="text-xs text-slate-400">
          Enforces human-in-the-loop oversight. Workflows automatically pause until sensitive actions are approved or rejected.
        </p>
      </div>

      {/* Pending Approvals Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <span>Pending Authorization Requests</span>
            <span className="text-xs font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
              {pendingApprovals.length} Action(s) Waiting
            </span>
          </h3>
        </div>

        {pendingApprovals.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-2xl space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h4 className="text-sm font-medium text-slate-300">No Pending Approvals</h4>
            <p className="text-xs text-slate-500">
              All active workflows comply with autonomous risk policies.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingApprovals.map((req) => (
              <div
                key={req.id}
                className="bg-slate-900 border border-amber-500/30 rounded-2xl p-5 space-y-4 shadow-lg shadow-amber-950/10"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2.5">
                    <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <AlertTriangle className="w-5 h-5" />
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white">{req.taskTitle}</h4>
                      <p className="text-xs text-slate-400 font-mono">
                        Workflow: {req.workflowId} | Request ID: {req.id}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-mono px-3 py-1 rounded-full uppercase border font-semibold shrink-0 ${getRiskBadge(
                      req.riskLevel
                    )}`}
                  >
                    Risk Level: {req.riskLevel}
                  </span>
                </div>

                {/* Requested Action Box */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs">
                  <span className="text-slate-400 font-semibold block mb-1">
                    Requested Sensitive Action:
                  </span>
                  <p className="text-slate-200 font-mono">{req.requestedAction}</p>
                </div>

                {/* Decision Form or Buttons */}
                {activeRejectId === req.id ? (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <label className="text-xs text-slate-400 block font-medium">
                      Enter Reason for Rejection (Audit Requirement):
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Budget ceiling exceeded / Unauthorized vendor"
                      value={rejectReason[req.id] || ''}
                      onChange={(e) =>
                        setRejectReason({ ...rejectReason, [req.id]: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
                    />
                    <div className="flex items-center justify-end space-x-2 pt-1">
                      <button
                        onClick={() => setActiveRejectId(null)}
                        className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDecision(req.id, 'rejected')}
                        disabled={actingId === req.id}
                        className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
                      >
                        Confirm Rejection
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => setActiveRejectId(req.id)}
                      disabled={actingId === req.id}
                      className="px-4 py-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 text-xs font-semibold transition"
                    >
                      Reject Action
                    </button>
                    <button
                      onClick={() => handleDecision(req.id, 'approved')}
                      disabled={actingId === req.id}
                      className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition flex items-center space-x-1.5"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Approve & Resume Execution</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Decision History */}
      <div className="space-y-3 pt-4">
        <h3 className="text-sm font-semibold text-slate-300">Approval Decision History</h3>
        {pastApprovals.length === 0 ? (
          <div className="text-xs text-slate-500 p-4 border border-dashed border-slate-800 rounded-xl text-center">
            No historical decisions recorded yet.
          </div>
        ) : (
          <div className="space-y-2">
            {pastApprovals.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase border font-semibold ${
                        item.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {item.status}
                    </span>
                    <span className="text-slate-200 font-medium">{item.taskTitle}</span>
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Decision by <strong className="text-slate-300">{item.decisionMaker}</strong>: "{item.decisionReason}"
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 font-mono shrink-0">
                  {item.decisionTimestamp ? new Date(item.decisionTimestamp).toLocaleString() : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
