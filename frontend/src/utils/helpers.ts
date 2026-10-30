import type { WorkflowStatus, TaskStatus, ApprovalStatus } from '../types';

// Status badge text + class
export function statusBadgeClass(status: WorkflowStatus | TaskStatus | ApprovalStatus | string): string {
  const map: Record<string, string> = {
    pending: 'badge-pending',
    planning: 'badge-planning',
    running: 'badge-running',
    paused: 'badge-paused',
    completed: 'badge-completed',
    failed: 'badge-failed',
    cancelled: 'badge-cancelled',
    blocked: 'badge-blocked',
    approved: 'badge-approved',
    rejected: 'badge-rejected',
    awaiting_approval: 'badge-awaiting',
    ready: 'badge-ready',
    skipped: 'badge-cancelled',
  };
  return map[status] || 'badge-pending';
}

export function statusDotClass(status: string): string {
  return `status-dot ${status}`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

export function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function agentColor(agent: string | null): string {
  const colors: Record<string, string> = {
    planner: 'text-blue-400',
    executor: 'text-emerald-400',
    monitor: 'text-cyan-400',
    recovery: 'text-amber-400',
  };
  return colors[agent || ''] || 'text-gray-400';
}

export function agentBgColor(agent: string | null): string {
  const colors: Record<string, string> = {
    planner: 'bg-blue-500/20 border-blue-500/30 text-blue-300',
    executor: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300',
    monitor: 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300',
    recovery: 'bg-amber-500/20 border-amber-500/30 text-amber-300',
  };
  return colors[agent || ''] || 'bg-gray-500/20 border-gray-500/30 text-gray-300';
}
