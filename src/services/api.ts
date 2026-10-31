/**
 * AF-01 Autonomous Workflow Orchestrator
 * Frontend REST Client
 */

import {
  Workflow,
  Task,
  AgentMetrics,
  Approval,
  AuditLog,
  UseCaseType,
} from '../types/orchestrator.ts';

const BASE_URL = '/api';

export const api = {
  // System Health
  async getHealth() {
    const res = await fetch(`${BASE_URL}/health`);
    return res.json();
  },

  // Workflows
  async getWorkflows(): Promise<Workflow[]> {
    const res = await fetch(`${BASE_URL}/workflows`);
    return res.json();
  },

  async getWorkflow(id: string): Promise<Workflow> {
    const res = await fetch(`${BASE_URL}/workflows/${id}`);
    return res.json();
  },

  async createWorkflow(payload: {
    title?: string;
    objective: string;
    useCase: UseCaseType;
    documents?: any[];
  }): Promise<Workflow> {
    const res = await fetch(`${BASE_URL}/workflows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async executeWorkflow(id: string): Promise<Workflow> {
    const res = await fetch(`${BASE_URL}/workflows/${id}/execute`, {
      method: 'POST',
    });
    return res.json();
  },

  async pauseWorkflow(id: string): Promise<Workflow> {
    const res = await fetch(`${BASE_URL}/workflows/${id}/pause`, {
      method: 'POST',
    });
    return res.json();
  },

  async resumeWorkflow(id: string): Promise<Workflow> {
    const res = await fetch(`${BASE_URL}/workflows/${id}/resume`, {
      method: 'POST',
    });
    return res.json();
  },

  async approveWorkflow(id: string, reason?: string): Promise<Approval> {
    const res = await fetch(`${BASE_URL}/workflows/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    return res.json();
  },

  async rejectWorkflow(id: string, reason?: string): Promise<Approval> {
    const res = await fetch(`${BASE_URL}/workflows/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    return res.json();
  },

  async attachDocumentToWorkflow(id: string, doc: { name: string; content: string; type?: string }): Promise<Workflow> {
    const res = await fetch(`${BASE_URL}/workflows/${id}/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc),
    });
    return res.json();
  },


  // Tasks & Failure simulation for recovery testing
  async simulateTaskFailure(taskId: string, reason?: string): Promise<Task> {
    const res = await fetch(`${BASE_URL}/tasks/${taskId}/fail`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    return res.json();
  },

  // Agents
  async getAgents(): Promise<AgentMetrics[]> {
    const res = await fetch(`${BASE_URL}/agents`);
    return res.json();
  },

  // Approvals
  async getApprovals(): Promise<Approval[]> {
    const res = await fetch(`${BASE_URL}/approvals`);
    return res.json();
  },

  async decideApproval(
    id: string,
    decision: 'approved' | 'rejected',
    decisionMaker: string,
    reason: string
  ): Promise<Approval> {
    const res = await fetch(`${BASE_URL}/approvals/${id}/decide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, decisionMaker, reason }),
    });
    return res.json();
  },

  // Recovery
  async getRecoveryData(): Promise<{
    failedTasks: (Task & { workflowTitle: string; useCase: UseCaseType })[];
    recoveryLogs: AuditLog[];
  }> {
    const res = await fetch(`${BASE_URL}/recovery`);
    return res.json();
  },

  // Audit Logs
  async getAuditLogs(filters?: {
    eventType?: string;
    agentName?: string;
    workflowId?: string;
    search?: string;
  }): Promise<AuditLog[]> {
    const params = new URLSearchParams();
    if (filters?.eventType) params.set('eventType', filters.eventType);
    if (filters?.agentName) params.set('agentName', filters.agentName);
    if (filters?.workflowId) params.set('workflowId', filters.workflowId);
    if (filters?.search) params.set('search', filters.search);

    const res = await fetch(`${BASE_URL}/audit?${params.toString()}`);
    return res.json();
  },

  async clearAuditLogs(authorizedUser: string, confirmationPhrase: string) {
    const res = await fetch(`${BASE_URL}/audit/clear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authorizedUser, confirmationPhrase }),
    });
    return res.json();
  },

  // Document Upload
  async uploadDocument(fileName: string, fileContent: string, fileType?: string) {
    const res = await fetch(`${BASE_URL}/documents/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName, fileContent, fileType }),
    });
    return res.json();
  },

  // Email Preview & Send
  async getEmailPreview(workflowId: string, recipient?: string) {
    const res = await fetch(`${BASE_URL}/email/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workflowId, recipient }),
    });
    return res.json();
  },

  async sendApprovedEmail(payload: {
    workflowId: string;
    recipient: string;
    subject: string;
    confirmedByUser: boolean;
  }) {
    const res = await fetch(`${BASE_URL}/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
};
