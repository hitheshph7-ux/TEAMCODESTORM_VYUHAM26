import React, { useState } from 'react';
import {
  X,
  Sparkles,
  FileText,
  Search,
  FolderKanban,
  ShieldAlert,
  Upload,
  FileCheck,
  Trash2,
  FilePlus,
} from 'lucide-react';
import { UseCaseType, AttachedDocument } from '../types/orchestrator.ts';

interface CreateWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    objective: string;
    useCase: UseCaseType;
    documents?: AttachedDocument[];
  }) => Promise<void>;
}

export const CreateWorkflowModal: React.FC<CreateWorkflowModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [objective, setObjective] = useState('');
  const [useCase, setUseCase] = useState<UseCaseType>('research');
  const [documents, setDocuments] = useState<AttachedDocument[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Close on Escape key press (declared unconditionally before any return)
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);


  const templates: Record<
    UseCaseType,
    { title: string; prompt: string; label: string; icon: any; riskBadge: string }
  > = {
    research: {
      title: 'Global EV Market Competitor Analysis',
      prompt: 'Research top 3 competitors in the electric vehicle market, compare their battery technologies, manufacturing costs, and prepare an executive comparative report.',
      label: 'Research and Intelligence',
      icon: Search,
      riskBadge: 'Standard Research (Low Risk)',
    },
    document: {
      title: 'Enterprise Vendor Proposals & Budget Variance Comparison',
      prompt: 'Read these 3 enterprise software project proposals, compare their 5-year budget line items, highlight cost overruns, and prepare an executive procurement summary.',
      label: 'Document Management',
      icon: FileText,
      riskBadge: 'Sensitive Procurement (Requires Approval)',
    },
    project_management: {
      title: 'Employee Management Portal Sprint Roadmap',
      prompt: 'Create a comprehensive project plan for developing an employee management system with tasks, dependencies, milestones, and contingency buffers.',
      label: 'Project Management',
      icon: FolderKanban,
      riskBadge: 'Operational WBS (Medium Risk)',
    },
  };

  const applyTemplate = (type: UseCaseType) => {
    setUseCase(type);
    setTitle(templates[type].title);
    setObjective(templates[type].prompt);
    if (type === 'document' && documents.length === 0) {
      loadSampleProposals();
    }
  };

  const loadSampleProposals = () => {
    const sampleDocs: AttachedDocument[] = [
      {
        id: 'doc-sap-1',
        name: 'SAP_S4HANA_Cloud_Proposal.pdf',
        size: 14200,
        type: 'application/pdf',
        wordCount: 1250,
        content: `PROPOSAL: SAP S/4HANA Cloud ERP Migration.
Total 5-Year TCO: $1,450,000.
Implementation Schedule: 14 Months.
Annual Cloud Subscription: $185,000/yr.
Professional Services: $525,000.
SLA Uptime: 99.9%. Data residency: EU & US AWS regions.`,
        uploadedAt: new Date().toISOString(),
      },
      {
        id: 'doc-oracle-2',
        name: 'Oracle_NetSuite_Enterprise_RFP.docx',
        size: 11800,
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        wordCount: 980,
        content: `PROPOSAL: Oracle NetSuite Enterprise ERP.
Total 5-Year TCO: $1,180,000.
Implementation Schedule: 9 Months.
Annual Subscription: $140,000/yr.
Integration & Data Migration: $480,000.
SLA Uptime: 99.95%. Includes 24/7 Priority Support.`,
        uploadedAt: new Date().toISOString(),
      },
      {
        id: 'doc-ms-3',
        name: 'MS_Dynamics365_Finance_Bid.txt',
        size: 9600,
        type: 'text/plain',
        wordCount: 820,
        content: `PROPOSAL: Microsoft Dynamics 365 Finance & Operations.
Total 5-Year TCO: $1,290,000.
Implementation Schedule: 11 Months.
Annual Cloud License: $160,000/yr.
Consulting Partner Fees: $490,000.
Native Microsoft 365 and PowerBI Integration included.`,
        uploadedAt: new Date().toISOString(),
      },
    ];

    setDocuments(sampleDocs);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newDocs: AttachedDocument[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const text = await file.text();
      const wordCount = text.trim().split(/\s+/).length;
      newDocs.push({
        id: `doc-${Date.now()}-${i}`,
        name: file.name,
        size: file.size,
        type: file.type || 'text/plain',
        wordCount,
        content: text,
        uploadedAt: new Date().toISOString(),
      });
    }

    setDocuments((prev) => [...prev, ...newDocs]);
  };

  const removeDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!objective.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim() || `Workflow: ${objective.slice(0, 35)}...`,
        objective: objective.trim(),
        useCase,
        documents: documents.length > 0 ? documents : undefined,
      });
      setTitle('');
      setObjective('');
      setDocuments([]);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Create Autonomous Workflow</h2>
              <p className="text-xs text-slate-400">Autonomous decomposition & 4-agent coordination</p>
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

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* Use Case Selection Tabs */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Select Use Case Domain
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['research', 'document', 'project_management'] as UseCaseType[]).map((type) => {
                const item = templates[type];
                const Icon = item.icon;
                const isSelected = useCase === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => applyTemplate(type)}
                    className={`p-3 rounded-xl border text-left transition relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-500 bg-blue-600/10 text-white shadow-sm'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-slate-500'}`} />
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                        )}
                      </div>
                      <div className="text-xs font-medium leading-snug">{item.label}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Workflow Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Workflow Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Enterprise Proposal Cost Audit"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            />
          </div>

          {/* Objective Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Primary Objective Brief
              </label>
              <button
                type="button"
                onClick={() => applyTemplate(useCase)}
                className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline"
              >
                Use Recommended Template
              </button>
            </div>
            <textarea
              rows={3}
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Describe your objective in detail..."
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition resize-none"
            />
          </div>

          {/* Document Ingestion & Attachment Section */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Attach Documents ({documents.length})
                </span>
              </div>
              <button
                type="button"
                onClick={loadSampleProposals}
                className="text-[11px] text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 hover:underline"
              >
                <FilePlus className="w-3.5 h-3.5" />
                <span>Load 3 Sample Proposals (SAP, Oracle, MS)</span>
              </button>
            </div>

            {/* Document Upload Input */}
            <div className="border border-dashed border-slate-800 hover:border-purple-500/50 rounded-xl p-3 text-center transition bg-slate-900/40">
              <label className="flex flex-col items-center justify-center cursor-pointer space-y-1">
                <Upload className="w-5 h-5 text-slate-400" />
                <span className="text-xs text-slate-300 font-medium">
                  Upload PDF, DOCX, TXT documents
                </span>
                <span className="text-[10px] text-slate-500">
                  Click or drag files here to attach
                </span>
                <input
                  type="file"
                  multiple
                  accept=".txt,.doc,.docx,.pdf,.md"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* List of Attached Documents */}
            {documents.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
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
                    <button
                      type="button"
                      onClick={() => removeDocument(doc.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded transition"
                      title="Remove document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Governance Notice */}
          <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex items-start space-x-3 text-xs text-slate-400">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-300">Governance Engine Note:</span> Planner
              will assess risk. Any tasks requiring financial commitment, data publishing, or vendor contracts
              will automatically require human approval before execution.
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !objective.trim()}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition disabled:opacity-50 cursor-pointer flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Initializing...</span>
                </>
              ) : (
                <span>Launch Autonomous Orchestrator</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
