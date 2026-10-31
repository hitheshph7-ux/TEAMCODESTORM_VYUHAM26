import React, { useState, useEffect } from 'react';
import { RotateCcw, AlertOctagon, CheckCircle2, RefreshCw, Cpu, Activity } from 'lucide-react';
import { api } from '../services/api.ts';
import { AuditLog, Task } from '../types/orchestrator.ts';

interface RecoveryPageProps {
  onRefresh: () => void;
}

export const RecoveryPage: React.FC<RecoveryPageProps> = ({ onRefresh }) => {
  const [data, setData] = useState<{
    failedTasks: any[];
    recoveryLogs: AuditLog[];
  }>({ failedTasks: [], recoveryLogs: [] });
  const [loading, setLoading] = useState(true);

  const fetchRecovery = async () => {
    try {
      setLoading(true);
      const res = await api.getRecoveryData();
      setData(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecovery();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-cyan-400" />
            <span>Autonomous Failure Recovery Center</span>
          </h2>
          <p className="text-xs text-slate-400">
            Recover Agent manages bounded retries, parameter backoff, and adaptive replanning when tasks fail.
          </p>
        </div>

        <button
          onClick={fetchRecovery}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:bg-slate-800"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Recover Agent Specification Card */}
      <div className="bg-gradient-to-r from-cyan-950/30 to-slate-900 border border-cyan-500/30 rounded-2xl p-5 flex items-start space-x-4">
        <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400 border border-cyan-500/20 shrink-0">
          <Cpu className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-white">Bounded Retry Policy (Section 4.4)</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            The Recover Agent applies an exponential backoff heuristic with a strict ceiling of{' '}
            <strong className="text-cyan-400">3 retries max</strong> per task. Infinite retry loops are prohibited.
            If retries fail, the workflow is marked incomplete to prevent false positive outputs.
          </p>
        </div>
      </div>

      {/* Active Issues / Retried Tasks */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <span>Tracked Task Exceptions & Retries</span>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
            {data.failedTasks.length} Tracked
          </span>
        </h3>

        {data.failedTasks.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-2xl space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h4 className="text-sm font-medium text-slate-300">All Tasks Running Nominal</h4>
            <p className="text-xs text-slate-500">
              No failed tasks or active recovery retries in progress.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.failedTasks.map((task) => (
              <div
                key={task.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-semibold text-white">{task.title}</h4>
                    <p className="text-xs text-slate-400">
                      Workflow: {task.workflowTitle} ({task.workflowId})
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                      Retry Count: {task.retryCount}/{task.maxRetries}
                    </span>
                    <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {task.status}
                    </span>
                  </div>
                </div>

                {task.error && (
                  <div className="p-3 bg-rose-950/20 border border-rose-900/40 rounded-lg text-xs font-mono text-rose-300">
                    <span className="font-semibold block mb-0.5">Reported Failure Cause:</span>
                    {task.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recovery Log Events */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span>Recover Agent Event Timeline</span>
        </h3>

        <div className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800/80 overflow-hidden">
          {data.recoveryLogs.length === 0 ? (
            <div className="p-4 text-xs text-slate-500 text-center">
              No recovery events registered yet.
            </div>
          ) : (
            data.recoveryLogs.map((log) => (
              <div key={log.id} className="p-3 text-xs flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-[10px] text-cyan-400 font-semibold">
                      {log.eventType}
                    </span>
                    <span className="text-slate-500 text-[10px]">•</span>
                    <span className="text-slate-400 text-[11px]">
                      Workflow: {log.workflowId || 'N/A'}
                    </span>
                  </div>
                  <p className="text-slate-200">{log.details}</p>
                </div>
                <span className="text-[10px] text-slate-500 font-mono shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
