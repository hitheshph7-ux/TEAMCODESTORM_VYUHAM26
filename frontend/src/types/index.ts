// ── Workflow ──────────────────────────────────────────────────────────────────
export type WorkflowStatus =
  | 'pending' | 'planning' | 'running' | 'paused'
  | 'completed' | 'failed' | 'cancelled';

export interface Workflow {
  id: string;
  objective: string;
  status: WorkflowStatus;
  execution_mode: 'ai' | 'demo';
  created_at: string;
  updated_at: string;
}

export interface WorkflowDetail extends Workflow {
  tasks: Task[];
}

export interface WorkflowStatus_ {
  workflow_id: string;
  status: WorkflowStatus;
  total_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  pending_tasks: number;
  running_tasks: number;
  pending_approvals: number;
}

export interface DashboardStats {
  total_workflows: number;
  running_workflows: number;
  completed_workflows: number;
  failed_workflows: number;
  paused_workflows: number;
  pending_approvals: number;
  recent_workflows: Workflow[];
}

// ── Task ──────────────────────────────────────────────────────────────────────
export type TaskStatus =
  | 'pending' | 'ready' | 'running' | 'completed'
  | 'failed' | 'blocked' | 'skipped' | 'awaiting_approval';

export interface Task {
  id: string;
  workflow_id: string;
  name: string;
  description: string | null;
  assigned_agent: string | null;
  tool_name: string | null;
  status: TaskStatus;
  requires_approval: boolean;
  retry_count: number;
  max_retries: number;
  error_message: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

// ── Approval ──────────────────────────────────────────────────────────────────
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface Approval {
  id: string;
  task_id: string;
  workflow_id: string;
  status: ApprovalStatus;
  requested_by: string;
  decided_by: string | null;
  decision_reason: string | null;
  action_description: string | null;
  task_name: string | null;
  workflow_objective: string | null;
  created_at: string;
  decided_at: string | null;
}

// ── Execution Log ─────────────────────────────────────────────────────────────
export interface ExecutionLog {
  id: string;
  workflow_id: string;
  task_id: string | null;
  agent_name: string | null;
  action: string;
  status: string;
  attempt_number: number;
  input_data: string | null;
  output_data: string | null;
  error_message: string | null;
  created_at: string;
}

// ── Graph Data ────────────────────────────────────────────────────────────────
export interface GraphNode {
  id: string;
  type: string;
  data: {
    label: string;
    status: TaskStatus;
    agent: string | null;
    tool: string | null;
    requires_approval: boolean;
    retry_count: number;
    description: string | null;
  };
  position: { x: number; y: number };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  animated: boolean;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
