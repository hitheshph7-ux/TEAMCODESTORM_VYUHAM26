/**
 * AF-01 Autonomous Workflow Orchestration Platform
 * Core Domain Models & Schemas
 */

export type UseCaseType = 'research' | 'document' | 'project_management';

export type WorkflowStatus = 
  | 'pending'
  | 'planning'
  | 'in_progress'
  | 'waiting_approval'
  | 'recovering'
  | 'completed'
  | 'failed'
  | 'paused';

export type TaskStatus =
  | 'pending'
  | 'assigned'
  | 'running'
  | 'validating'
  | 'completed'
  | 'failed'
  | 'skipped';

export type AgentName = 'Planner' | 'Executor' | 'Monitor' | 'Recover';

export type AgentStatus = 'Idle' | 'Working' | 'Completed' | 'Failed' | 'Paused';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface AttachedDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  wordCount: number;
  content: string;
  uploadedAt: string;
}

export interface Workflow {
  id: string;
  title: string;
  objective: string;
  useCase: UseCaseType;
  status: WorkflowStatus;
  tasks: Task[];
  finalOutput?: string;
  sources?: string[];
  documents?: AttachedDocument[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface Task {
  id: string;
  workflowId: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignedAgent: AgentName;
  priority: 'low' | 'medium' | 'high';
  dependencies: string[]; // task IDs
  retryCount: number;
  maxRetries: number;
  riskLevel: RiskLevel;
  requiresApproval: boolean;
  approvalId?: string;
  result?: string;
  error?: string;
  executionLogs: string[];
  createdAt: string;
  completedAt?: string;
}

export interface AgentExecution {
  id: string;
  agentName: AgentName;
  taskId: string;
  workflowId: string;
  executionStatus: 'success' | 'failure' | 'in_progress';
  startTime: string;
  finishTime?: string;
  result?: string;
  error?: string;
}

export interface Approval {
  id: string;
  workflowId: string;
  taskId: string;
  taskTitle: string;
  requestedAction: string;
  riskLevel: RiskLevel;
  status: ApprovalStatus;
  requestTimestamp: string;
  decisionMaker?: string;
  decisionReason?: string;
  decisionTimestamp?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  eventType: 
    | 'WORKFLOW_CREATED'
    | 'TASK_CREATED'
    | 'AGENT_ASSIGNED'
    | 'AGENT_EXECUTION_START'
    | 'AGENT_EXECUTION_COMPLETED'
    | 'AGENT_EXECUTION_FAILED'
    | 'RETRY_ATTEMPT'
    | 'RECOVERY_TRIGGERED'
    | 'RISK_EVALUATION'
    | 'APPROVAL_REQUESTED'
    | 'APPROVAL_DECIDED'
    | 'WORKFLOW_PAUSED'
    | 'WORKFLOW_RESUMED'
    | 'FINAL_OUTPUT_GENERATED'
    | 'EMAIL_SEND_REQUESTED'
    | 'EMAIL_SENT'
    | 'HISTORY_CLEARED';
  workflowId?: string;
  taskId?: string;
  agentName?: AgentName;
  details: string;
  riskLevel?: RiskLevel;
  metadata?: Record<string, any>;
}

export interface AgentMetrics {
  name: AgentName;
  responsibility: string;
  status: AgentStatus;
  currentTaskId?: string;
  currentWorkflowId?: string;
  lastExecution?: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  recoveryAssists: number;
}

export interface EmailDeliveryPayload {
  workflowId: string;
  recipient: string;
  subject: string;
  content: string;
  confirmedByUser: boolean;
}
