import axios from 'axios';
import type {
  Workflow, WorkflowDetail, WorkflowStatus_, DashboardStats,
  Task, Approval, ExecutionLog, GraphData
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// ── Workflows ──────────────────────────────────────────────────────────────────
export const workflowsApi = {
  list: () => api.get<Workflow[]>('/workflows').then(r => r.data),
  get: (id: string) => api.get<WorkflowDetail>(`/workflows/${id}`).then(r => r.data),
  status: (id: string) => api.get<WorkflowStatus_>(`/workflows/${id}/status`).then(r => r.data),
  create: (objective: string, mode: 'ai' | 'demo' = 'demo') =>
    api.post<Workflow>('/workflows', { objective, execution_mode: mode }).then(r => r.data),
  start: (id: string, simulateFailure = false) =>
    api.post(`/workflows/${id}/start?simulate_failure=${simulateFailure}`).then(r => r.data),
  resume: (id: string) =>
    api.post(`/workflows/${id}/resume`).then(r => r.data),
  cancel: (id: string) =>
    api.post(`/workflows/${id}/cancel`).then(r => r.data),
  tasks: (id: string) => api.get<Task[]>(`/workflows/${id}/tasks`).then(r => r.data),
  logs: (id: string) => api.get<ExecutionLog[]>(`/workflows/${id}/logs`).then(r => r.data),
  graph: (id: string) => api.get<GraphData>(`/workflows/${id}/graph`).then(r => r.data),
  stats: () => api.get<DashboardStats>('/workflows/stats').then(r => r.data),
};

// ── Approvals ──────────────────────────────────────────────────────────────────
export const approvalsApi = {
  list: (pendingOnly = false) =>
    api.get<Approval[]>(`/approvals?pending_only=${pendingOnly}`).then(r => r.data),
  approve: (id: string, decided_by = 'admin', reason?: string) =>
    api.post<Approval>(`/approvals/${id}/approve`, { decided_by, reason }).then(r => r.data),
  reject: (id: string, decided_by = 'admin', reason?: string) =>
    api.post<Approval>(`/approvals/${id}/reject`, { decided_by, reason }).then(r => r.data),
};

// ── Logs ───────────────────────────────────────────────────────────────────────
export const logsApi = {
  list: (params?: { workflow_id?: string; agent_name?: string; status?: string; limit?: number }) =>
    api.get<ExecutionLog[]>('/logs', { params }).then(r => r.data),
};

// ── Health ─────────────────────────────────────────────────────────────────────
export const healthApi = {
  check: () => api.get('/health').then(r => r.data),
};

export default api;
