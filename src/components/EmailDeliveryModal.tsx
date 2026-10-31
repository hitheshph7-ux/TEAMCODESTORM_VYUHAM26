import React, { useState } from 'react';
import { X, Mail, ShieldAlert, CheckCircle2, Send } from 'lucide-react';
import { Workflow } from '../types/orchestrator.ts';
import { api } from '../services/api.ts';

interface EmailDeliveryModalProps {
  workflow: Workflow | null;
  isOpen: boolean;
  onClose: () => void;
  onDelivered: () => void;
}

export const EmailDeliveryModal: React.FC<EmailDeliveryModalProps> = ({
  workflow,
  isOpen,
  onClose,
  onDelivered,
}) => {
  const [recipient, setRecipient] = useState('executive.stakeholder@enterprise.internal');
  const [subject, setSubject] = useState(workflow ? `[AF-01 Deliverable] ${workflow.title}` : '');
  const [confirmed, setConfirmed] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Close on Escape key press (declared unconditionally at top of component)
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workflow) return;
    if (!confirmed) {
      setError('You must explicitly confirm human approval before sending.');
      return;
    }

    setIsSending(true);
    setError(null);
    try {
      const res = await api.sendApprovedEmail({
        workflowId: workflow.id,
        recipient,
        subject: subject || `[AF-01 Deliverable] ${workflow.title}`,
        confirmedByUser: true,
      });

      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          onDelivered();
          onClose();
          setSuccess(false);
          setConfirmed(false);
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch email.');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen || !workflow) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Human-Approved Email Delivery</h2>
              <p className="text-xs text-slate-400">Strict Governance Protocol (Section 7)</p>
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

        {success ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h3 className="text-base font-semibold text-white">Deliverable Dispatched Successfully</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Sent to <span className="text-slate-200 font-mono">{recipient}</span>. This delivery event has been permanently recorded in the Audit Trail.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="p-6 space-y-4">
            {/* Recipient */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Authorized Recipient
              </label>
              <input
                type="email"
                required
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="recipient@company.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Subject Line
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            {/* Body Preview */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Validated Final Deliverable Preview
              </label>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 max-h-40 overflow-y-auto font-mono whitespace-pre-wrap">
                {workflow.finalOutput || 'No deliverable content generated.'}
              </div>
            </div>

            {/* Explicit Human Confirmation Gate */}
            <div className="p-3.5 bg-amber-950/20 border border-amber-500/30 rounded-xl space-y-2">
              <div className="flex items-start space-x-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-200/90 font-medium">
                  Autonomous email transmission is strictly prohibited by governance policy.
                </div>
              </div>
              <label className="flex items-center space-x-2.5 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4 bg-slate-900"
                />
                <span className="text-xs text-slate-300 font-medium">
                  I, as the human overseer, explicitly verify and authorize dispatch of this report.
                </span>
              </label>
            </div>

            {error && (
              <div className="text-xs text-rose-400 bg-rose-950/30 border border-rose-900/50 p-2.5 rounded-lg">
                {error}
              </div>
            )}

            {/* Actions */}
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
                disabled={!confirmed || isSending}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition disabled:opacity-40 flex items-center space-x-2 cursor-pointer"
              >
                {isSending ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Transmitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Authorize & Dispatch</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
