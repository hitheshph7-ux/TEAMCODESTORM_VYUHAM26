import React, { useState } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Bot,
  Mail,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  UserCheck,
  Upload,
  FileText,
  FileCheck,
} from 'lucide-react';
import { Workflow, Task, AttachedDocument } from '../types/orchestrator.ts';
import { api } from '../services/api.ts';

interface WorkflowDetailModalProps {
  workflow: Workflow | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  onOpenEmailModal: (wf: Workflow) => void;
}

export const WorkflowDetailModal: React.FC<WorkflowDetailModalProps> = ({
  workflow,
  isOpen,
  onClose,
  onRefresh,
  onOpenEmailModal,
}) => {
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [isActing, setIsActing] = useState(false);
  const [docUploadStatus, setDocUploadStatus] = useState<string | null>(null);

  // Close on Escape key press (declared unconditionally at top of component)
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleExecute = async () => {
    if (!workflow) return;
    setIsActing(true);
    try {
      await api.executeWorkflow(workflow.id);
      onRefresh();
    } finally {
      setIsActing(false);
    }
  };

  const handlePause = async () => {
    if (!workflow) return;
    setIsActing(true);
    try {
      await api.pauseWorkflow(workflow.id);
      onRefresh();
    } finally {
      setIsActing(false);
    }
  };

  const handleResume = async () => {
    if (!workflow) return;
    setIsActing(true);
    try {
      await api.resumeWorkflow(workflow.id);
      onRefresh();
    } finally {
      setIsActing(false);
    }
  };

  const handleApproveWorkflow = async () => {
    if (!workflow) return;
    setIsActing(true);
    try {
      await api.approveWorkflow(workflow.id, 'Authorized directly from workflow inspection modal.');
      onRefresh();
    } catch (err: any) {
      alert(`Approval error: ${err.message}`);
    } finally {
      setIsActing(false);
    }
  };

  const handleRejectWorkflow = async () => {
    if (!workflow) return;
    const reason = prompt('Please provide a reason for rejecting this action (Governance requirement):', 'Action rejected by human overseer.');
    if (!reason) return;

    setIsActing(true);
    try {
      await api.rejectWorkflow(workflow.id, reason);
      onRefresh();
    } catch (err: any) {
      alert(`Rejection error: ${err.message}`);
    } finally {
      setIsActing(false);
    }
  };

  const handleSimulateFailure = async (taskId: string) => {
    setIsActing(true);
    try {
      await api.simulateTaskFailure(taskId, 'Synthetic timeout to demonstrate Recover Agent');
      onRefresh();
    } finally {
      setIsActing(false);
    }
  };

  const handleAddDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!workflow) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setDocUploadStatus(`Parsing ${file.name}...`);
    try {
      const text = await file.text();
      await api.attachDocumentToWorkflow(workflow.id, {
        name: file.name,
        content: text,
        type: file.type || 'TXT',
      });
      setDocUploadStatus(`Document "${file.name}" attached successfully!`);
      setTimeout(() => setDocUploadStatus(null), 3500);
      onRefresh();
    } catch (err: any) {
      setDocUploadStatus(`Upload failed: ${err.message}`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'in_progress':
      case 'running':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse';
      case 'planning':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30 animate-pulse';
      case 'waiting_approval':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse';
      case 'recovering':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30 animate-pulse';
      case 'paused':
        return 'bg-slate-700 text-slate-300 border-slate-600';
      case 'failed':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical':
      case 'high':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'medium':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      default:
        return 'text-slate-400 bg-slate-800/40 border-slate-700/40';
    }
  };

  const hasPendingApproval = workflow?.status === 'waiting_approval' || (workflow?.tasks ? workflow.tasks.some((t) => t.requiresApproval) : false);

  if (!isOpen || !workflow) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <span
              className={`text-xs font-mono px-2.5 py-1 rounded-full uppercase border font-semibold ${getStatusBadge(
                workflow.status
              )}`}
            >
              {workflow.status.replace('_', ' ')}
            </span>
            <div>
              <h2 className="text-base font-semibold text-white">{workflow.title}</h2>
              <p className="text-xs text-slate-400">ID: {workflow.id} | Domain: {workflow.useCase.toUpperCase()}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer z-10"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls Bar */}
        <div className="px-6 py-3 border-b border-slate-800/80 bg-slate-900/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2 text-xs">
            {workflow.status !== 'completed' && workflow.status !== 'in_progress' && workflow.status !== 'waiting_approval' && (
              <button
                onClick={handleExecute}
                disabled={isActing}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Execute Workflow</span>
              </button>
            )}

            {workflow.status === 'in_progress' && (
              <button
                onClick={handlePause}
                disabled={isActing}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium transition disabled:opacity-50"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </button>
            )}

            {workflow.status === 'paused' && (
              <button
                onClick={handleResume}
                disabled={isActing}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Resume</span>
              </button>
            )}

            {/* Direct Approval Actions in Control Bar */}
            {hasPendingApproval && (
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-mono text-amber-300 bg-amber-950/50 px-2 py-1 rounded border border-amber-500/30 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>Approval Required</span>
                </span>
                <button
                  onClick={handleApproveWorkflow}
                  disabled={isActing}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/30 transition disabled:opacity-50"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Approve & Resume</span>
                </button>
                <button
                  onClick={handleRejectWorkflow}
                  disabled={isActing}
                  className="px-3 py-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 font-semibold text-xs transition disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Add document directly to this workflow */}
            <label className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-medium cursor-pointer transition">
              <Upload className="w-3.5 h-3.5 text-purple-400" />
              <span>Add Document</span>
              <input
                type="file"
                accept=".txt,.doc,.docx,.pdf,.md"
                onChange={handleAddDocument}
                className="hidden"
              />
            </label>

            {workflow.status === 'completed' && (
              <button
                onClick={() => onOpenEmailModal(workflow)}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Send Deliverable via Email</span>
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Prominent Governance Approval Banner */}
          {hasPendingApproval && (
            <div className="bg-amber-950/30 border border-amber-500/50 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-amber-950/20">
              <div className="flex items-start space-x-3">
                <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-400 border border-amber-500/30 shrink-0">
                  <ShieldAlert className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="text-sm font-bold text-amber-200">
                    Governance Approval Required (Workflow Paused)
                  </div>
                  <p className="text-xs text-amber-300/80 mt-0.5 leading-relaxed">
                    A task requested an action classified as high risk. You can approve or reject the action directly here to resume the workflow without leaving this window.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0 w-full sm:w-auto justify-end">
                <button
                  onClick={handleRejectWorkflow}
                  disabled={isActing}
                  className="px-3.5 py-2 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 text-xs font-semibold transition"
                >
                  Reject Action
                </button>
                <button
                  onClick={handleApproveWorkflow}
                  disabled={isActing}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 transition flex items-center space-x-1.5"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Approve & Resume</span>
                </button>
              </div>
            </div>
          )}

          {docUploadStatus && (
            <div className="p-3 bg-purple-950/30 border border-purple-500/40 rounded-xl text-xs text-purple-300 flex items-center justify-between">
              <span>{docUploadStatus}</span>
              <button
                onClick={() => setDocUploadStatus(null)}
                className="text-purple-400 hover:text-purple-200 text-xs"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Objective Statement */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Workflow Objective
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">{workflow.objective}</p>
          </div>

          {/* Attached Documents Section */}
          {workflow.documents && workflow.documents.length > 0 && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-purple-400" />
                  <span>Attached Ingested Documents ({workflow.documents.length})</span>
                </span>
                <span className="text-[11px] text-slate-500 font-mono">Available for Agent Analysis</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {workflow.documents.map((doc, idx) => (
                  <div
                    key={doc.id || idx}
                    className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div className="truncate">
                        <div className="text-slate-200 font-medium truncate">{doc.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          ~{doc.wordCount} words • {doc.type || 'TXT'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tasks & Multi-Agent Execution Graph */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <span>Execution Tasks</span>
                <span className="text-xs font-mono text-slate-500">
                  ({workflow.tasks.filter((t) => t.status === 'completed').length}/{workflow.tasks.length} Completed)
                </span>
              </h3>
              <span className="text-xs text-slate-500">Ordered by dependencies</span>
            </div>

            {workflow.tasks.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                No tasks planned yet. Click "Execute Workflow" to trigger the Planner Agent.
              </div>
            ) : (
              <div className="space-y-3">
                {workflow.tasks.map((task, idx) => {
                  const isExpanded = expandedTask === task.id;
                  const isApprovalTask = task.requiresApproval && task.status !== 'completed';

                  return (
                    <div
                      key={task.id}
                      className={`rounded-xl overflow-hidden transition border ${
                        isApprovalTask
                          ? 'bg-amber-950/20 border-amber-500/50 shadow-md shadow-amber-950/10'
                          : 'bg-slate-950/70 border-slate-800'
                      }`}
                    >
                      <div
                        onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                        className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-900/60 transition"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-mono text-slate-400 font-semibold">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="text-sm font-medium text-slate-200">{task.title}</div>
                            <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                              <span className="flex items-center gap-1 text-slate-300">
                                <Bot className="w-3 h-3 text-blue-400" />
                                <span>{task.assignedAgent} Agent</span>
                              </span>
                              <span>•</span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-mono border ${getRiskColor(task.riskLevel)}`}>
                                Risk: {task.riskLevel}
                              </span>
                              {task.requiresApproval && (
                                <span className="flex items-center gap-1 text-[10px] text-amber-300 bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-500/40">
                                  <ShieldAlert className="w-3 h-3 text-amber-400" />
                                  <span>Approval Gate</span>
                                </span>
                              )}
                              {task.retryCount > 0 && (
                                <span className="text-[10px] text-cyan-400 bg-cyan-950/30 px-1.5 py-0.5 rounded border border-cyan-800/40 font-mono">
                                  Retries: {task.retryCount}/{task.maxRetries}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <span
                            className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full uppercase border ${getStatusBadge(
                              task.status
                            )}`}
                          >
                            {task.status}
                          </span>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-500" />
                          )}
                        </div>
                      </div>

                      {/* Inline Task Approval Action Bar if this task requires approval */}
                      {isApprovalTask && (
                        <div className="px-4 py-2.5 bg-amber-950/30 border-t border-amber-500/30 flex items-center justify-between text-xs">
                          <span className="text-amber-300 font-medium flex items-center gap-1.5">
                            <ShieldAlert className="w-4 h-4 text-amber-400" />
                            <span>Action awaits human overseer authorization</span>
                          </span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRejectWorkflow();
                              }}
                              disabled={isActing}
                              className="px-2.5 py-1 rounded bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 text-xs font-semibold transition"
                            >
                              Reject
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApproveWorkflow();
                              }}
                              disabled={isActing}
                              className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition flex items-center space-x-1"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Approve & Resume</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-2 border-t border-slate-900 bg-slate-900/30 space-y-3 text-xs">
                          <div>
                            <span className="text-slate-400 font-semibold">Description: </span>
                            <span className="text-slate-300">{task.description}</span>
                          </div>

                          {task.result && (
                            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-slate-300 whitespace-pre-wrap">
                              <span className="text-emerald-400 font-semibold block mb-1">Execution Result:</span>
                              {task.result}
                            </div>
                          )}

                          {task.error && (
                            <div className="bg-rose-950/30 p-3 rounded-lg border border-rose-900/50 font-mono text-rose-300">
                              <span className="text-rose-400 font-semibold block mb-1">Execution Error:</span>
                              {task.error}
                            </div>
                          )}

                          {/* Quick failure simulation for hackathon demo */}
                          {task.status !== 'completed' && (
                            <div className="pt-2 flex items-center justify-between border-t border-slate-800/60">
                              <span className="text-slate-500 text-[11px]">Hackathon Testing Utility:</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSimulateFailure(task.id);
                                }}
                                className="px-2.5 py-1 rounded bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 text-[11px] transition"
                              >
                                Simulate Failure (Test Recovery)
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Final Validated Deliverable */}
          {workflow.finalOutput && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-white">Final Validated Output Report</h3>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  Monitor Certified
                </span>
              </div>
              <div className="text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap max-h-80 overflow-y-auto">
                {workflow.finalOutput}
              </div>

              {workflow.sources && workflow.sources.length > 0 && (
                <div className="pt-3 border-t border-slate-800/80">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Verified Sources & Citations
                  </span>
                  <ul className="list-disc list-inside text-xs text-slate-400 space-y-0.5">
                    {workflow.sources.map((src, idx) => (
                      <li key={idx}>{src}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
