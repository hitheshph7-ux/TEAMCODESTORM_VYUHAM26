import React, { useState } from 'react';
import {
  GitBranch,
  PlusCircle,
  Play,
  Pause,
  RotateCcw,
  Search,
  FileText,
  FolderKanban,
  CheckCircle2,
  Clock,
  Upload,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { Workflow, UseCaseType } from '../types/orchestrator.ts';
import { api } from '../services/api.ts';

interface WorkflowsPageProps {
  workflows: Workflow[];
  onSelectWorkflow: (wf: Workflow) => void;
  onNewWorkflow: () => void;
  onRefresh: () => void;
}

export const WorkflowsPage: React.FC<WorkflowsPageProps> = ({
  workflows,
  onSelectWorkflow,
  onNewWorkflow,
  onRefresh,
}) => {
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [docUploadStatus, setDocUploadStatus] = useState<string | null>(null);

  const filteredWorkflows = workflows.filter((wf) => {
    if (filter === 'active') {
      if (wf.status !== 'in_progress' && wf.status !== 'planning' && wf.status !== 'waiting_approval' && wf.status !== 'recovering')
        return false;
    } else if (filter === 'completed') {
      if (wf.status !== 'completed') return false;
    } else if (filter === 'approvals') {
      if (wf.status !== 'waiting_approval') return false;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        wf.title.toLowerCase().includes(q) ||
        wf.objective.toLowerCase().includes(q) ||
        wf.useCase.toLowerCase().includes(q)
      );
    }
    return true;
  });

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

  const getUseCaseIcon = (useCase: UseCaseType) => {
    switch (useCase) {
      case 'research':
        return <Search className="w-4 h-4 text-blue-400" />;
      case 'document':
        return <FileText className="w-4 h-4 text-purple-400" />;
      default:
        return <FolderKanban className="w-4 h-4 text-emerald-400" />;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocUploadStatus(`Parsing ${file.name}...`);
    try {
      const text = await file.text();
      const res = await api.uploadDocument(file.name, text, file.type || 'TXT');
      setDocUploadStatus(`Ingested: ${res.fileName} (~${res.wordCount} words). Ready for workflow creation.`);
      setTimeout(() => setDocUploadStatus(null), 4000);
      onRefresh();
    } catch (err: any) {
      setDocUploadStatus(`Upload failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-blue-400" />
            <span>Workflow Orchestration Hub</span>
          </h2>
          <p className="text-xs text-slate-400">
            Create, monitor, and govern autonomous multi-agent pipelines
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Document Ingestion input button */}
          <label className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium cursor-pointer transition">
            <Upload className="w-3.5 h-3.5 text-purple-400" />
            <span>Ingest Document (PDF/DOCX/TXT)</span>
            <input
              type="file"
              accept=".txt,.doc,.docx,.pdf,.md"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={onNewWorkflow}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Workflow</span>
          </button>
        </div>
      </div>

      {docUploadStatus && (
        <div className="p-3 bg-purple-950/20 border border-purple-500/30 rounded-xl text-xs text-purple-300 flex items-center justify-between">
          <span>{docUploadStatus}</span>
          <button
            onClick={() => setDocUploadStatus(null)}
            className="text-purple-400 hover:text-purple-200 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
        <div className="flex items-center space-x-1 w-full sm:w-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'active', label: 'In-Flight' },
            { id: 'approvals', label: 'Waiting Approval' },
            { id: 'completed', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filter === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search workflows..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
          />
        </div>
      </div>

      {/* Workflows Grid */}
      <div className="space-y-3">
        {filteredWorkflows.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl space-y-2">
            <GitBranch className="w-8 h-8 text-slate-600 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-300">No workflows found</h4>
            <p className="text-xs text-slate-500">
              Create a workflow or adjust your search filter to see pipelines.
            </p>
          </div>
        ) : (
          filteredWorkflows.map((wf) => {
            const completedTasks = wf.tasks.filter((t) => t.status === 'completed').length;
            const progressPct = wf.tasks.length > 0 ? Math.round((completedTasks / wf.tasks.length) * 100) : 0;

            return (
              <div
                key={wf.id}
                onClick={() => onSelectWorkflow(wf)}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                      {getUseCaseIcon(wf.useCase)}
                    </div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition truncate">
                      {wf.title}
                    </h3>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase border font-semibold shrink-0 ${getStatusBadge(
                        wf.status
                      )}`}
                    >
                      {wf.status.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-1">{wf.objective}</p>

                  <div className="flex items-center space-x-4 text-[11px] text-slate-500 pt-1">
                    <span>Domain: <strong className="text-slate-400 uppercase font-mono">{wf.useCase}</strong></span>
                    <span>•</span>
                    <span>Created {new Date(wf.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{wf.tasks.length} Total Milestones</span>
                  </div>
                </div>

                {/* Progress & Quick Actions */}
                <div className="flex items-center space-x-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-800/80 pt-3 md:pt-0 shrink-0">
                  <div className="w-32 space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>Progress</span>
                      <span>{progressPct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          progressPct === 100
                            ? 'bg-emerald-500'
                            : wf.status === 'waiting_approval'
                            ? 'bg-amber-500'
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-slate-400">
                    <span className="text-xs text-blue-400 font-medium group-hover:translate-x-0.5 transition-transform flex items-center">
                      <span>Inspect</span>
                      <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
