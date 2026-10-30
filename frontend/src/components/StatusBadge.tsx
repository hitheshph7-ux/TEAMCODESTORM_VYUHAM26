import { statusBadgeClass } from '../utils/helpers';

interface StatusBadgeProps {
  status: string;
  showDot?: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  planning: 'Planning',
  running: 'Running',
  paused: 'Paused',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
  blocked: 'Blocked',
  approved: 'Approved',
  rejected: 'Rejected',
  awaiting_approval: 'Awaiting Approval',
  ready: 'Ready',
  skipped: 'Skipped',
  info: 'Info',
  success: 'Success',
  warning: 'Warning',
  error: 'Error',
  retry: 'Retry',
  approval_request: 'Approval Request',
  approval_decision: 'Decision',
};

const STATUS_DOTS: Record<string, string> = {
  running: '🔵',
  completed: '✅',
  failed: '❌',
  paused: '⏸',
  pending: '⏳',
  planning: '🔄',
  blocked: '🚫',
  awaiting_approval: '⏳',
  approved: '✅',
  rejected: '❌',
  ready: '🟢',
};

export default function StatusBadge({ status, showDot = true }: StatusBadgeProps) {
  return (
    <span className={statusBadgeClass(status)}>
      {showDot && STATUS_DOTS[status] && (
        <span className="text-xs">{STATUS_DOTS[status]}</span>
      )}
      {STATUS_LABELS[status] || status}
    </span>
  );
}
