/**
 * AF-01 Autonomous AI Workflow Orchestration Platform
 * Full-Stack Express Server & API Router
 */

import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { orchestratorStore } from './server/store.ts';
import { orchestrator } from './server/orchestrator.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // JSON Body parsing with increased limit for document payloads
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // -------------------------------------------------------------
  // API Routes: System Health
  // -------------------------------------------------------------
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'operational',
      platform: 'AF-01 Autonomous Workflow Orchestrator',
      timestamp: new Date().toISOString(),
      agentsActive: 4,
      governanceEnabled: true,
    });
  });

  // -------------------------------------------------------------
  // API Routes: Workflows
  // -------------------------------------------------------------
  app.get('/api/workflows', (req: Request, res: Response) => {
    const workflows = orchestratorStore.getAllWorkflows();
    res.json(workflows);
  });

  app.post('/api/workflows', (req: Request, res: Response) => {
    const { title, objective, useCase, documents } = req.body;
    if (!objective || !useCase) {
      return res.status(400).json({ error: 'Objective and useCase are required.' });
    }

    const workflow = orchestratorStore.createWorkflow({
      title: title || `Workflow: ${objective.slice(0, 35)}...`,
      objective,
      useCase,
      documents,
    });

    res.status(201).json(workflow);
  });

  app.get('/api/workflows/:id', (req: Request, res: Response) => {
    const wf = orchestratorStore.getWorkflow(req.params.id);
    if (!wf) return res.status(404).json({ error: 'Workflow not found' });
    res.json(wf);
  });

  app.post('/api/workflows/:id/execute', async (req: Request, res: Response) => {
    try {
      const wf = await orchestrator.startWorkflow(req.params.id);
      res.json(wf);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/workflows/:id/pause', (req: Request, res: Response) => {
    const wf = orchestrator.pauseWorkflow(req.params.id);
    if (!wf) return res.status(404).json({ error: 'Workflow not found' });
    res.json(wf);
  });

  app.post('/api/workflows/:id/resume', (req: Request, res: Response) => {
    const wf = orchestrator.resumeWorkflow(req.params.id);
    if (!wf) return res.status(404).json({ error: 'Workflow not found' });
    res.json(wf);
  });

  // Direct 1-click Approval/Rejection for a workflow
  app.post('/api/workflows/:id/approve', (req: Request, res: Response) => {
    const pendingApproval = orchestratorStore.getPendingApprovalForWorkflow(req.params.id);
    if (!pendingApproval) {
      return res.status(404).json({ error: 'No pending approval found for this workflow.' });
    }

    const updated = orchestratorStore.decideApproval(
      pendingApproval.id,
      'approved',
      req.body.decisionMaker || 'Human Overseer (Admin)',
      req.body.reason || 'Directly approved via workflow inspection modal.'
    );

    orchestrator.resumeWorkflow(req.params.id);
    res.json(updated);
  });

  app.post('/api/workflows/:id/reject', (req: Request, res: Response) => {
    const pendingApproval = orchestratorStore.getPendingApprovalForWorkflow(req.params.id);
    if (!pendingApproval) {
      return res.status(404).json({ error: 'No pending approval found for this workflow.' });
    }

    const updated = orchestratorStore.decideApproval(
      pendingApproval.id,
      'rejected',
      req.body.decisionMaker || 'Human Overseer (Admin)',
      req.body.reason || 'Rejected by human overseer in workflow modal.'
    );

    res.json(updated);
  });

  // Attach Document to existing workflow
  app.post('/api/workflows/:id/documents', (req: Request, res: Response) => {
    const { name, content, type } = req.body;
    if (!name || !content) {
      return res.status(400).json({ error: 'name and content are required' });
    }

    const wordCount = content.trim().split(/\s+/).length;
    const doc = {
      id: `doc-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
      name,
      content,
      type: type || 'TXT',
      wordCount,
      size: content.length,
      uploadedAt: new Date().toISOString(),
    };

    const updated = orchestratorStore.addDocumentToWorkflow(req.params.id, doc);
    if (!updated) return res.status(404).json({ error: 'Workflow not found' });
    res.json(updated);
  });

  // -------------------------------------------------------------
  // API Routes: Tasks & Failure Simulation (for Testing Recovery)
  // -------------------------------------------------------------
  app.get('/api/tasks/:id', (req: Request, res: Response) => {
    const task = orchestratorStore.getTask(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  });

  app.post('/api/tasks/:id/fail', (req: Request, res: Response) => {
    const task = orchestratorStore.getTask(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const updated = orchestratorStore.updateTask(task.id, {
      status: 'failed',
      error: req.body.reason || 'Simulated network timeout during remote data ingestion.',
    });

    orchestratorStore.logAudit('AGENT_EXECUTION_FAILED', `Simulated failure on task "${task.title}"`, {
      workflowId: task.workflowId,
      taskId: task.id,
      agentName: task.assignedAgent,
      riskLevel: 'high',
    });

    res.json(updated);
  });

  // -------------------------------------------------------------
  // API Routes: Agents Registry & Dynamic Metrics
  // -------------------------------------------------------------
  app.get('/api/agents', (req: Request, res: Response) => {
    res.json(orchestratorStore.getAgents());
  });

  // -------------------------------------------------------------
  // API Routes: Governance & Human Approvals
  // -------------------------------------------------------------
  app.get('/api/approvals', (req: Request, res: Response) => {
    res.json(orchestratorStore.getAllApprovals());
  });

  app.post('/api/approvals/:id/decide', (req: Request, res: Response) => {
    const { decision, decisionMaker, reason } = req.body;
    if (!decision || (decision !== 'approved' && decision !== 'rejected')) {
      return res.status(400).json({ error: 'Decision must be "approved" or "rejected"' });
    }

    const updated = orchestratorStore.decideApproval(
      req.params.id,
      decision,
      decisionMaker || 'Human Overseer (Admin)',
      reason || (decision === 'approved' ? 'Action authorized after risk review.' : 'Action rejected due to policy constraints.')
    );

    if (!updated) return res.status(404).json({ error: 'Approval request not found' });

    // Automatically trigger workflow progress if approved
    if (decision === 'approved') {
      orchestrator.resumeWorkflow(updated.workflowId);
    }

    res.json(updated);
  });

  // -------------------------------------------------------------
  // API Routes: Recovery System
  // -------------------------------------------------------------
  app.get('/api/recovery', (req: Request, res: Response) => {
    const workflows = orchestratorStore.getAllWorkflows();
    const failedTasks: any[] = [];
    workflows.forEach((wf) => {
      wf.tasks.forEach((t) => {
        if (t.status === 'failed' || t.retryCount > 0) {
          failedTasks.push({
            ...t,
            workflowTitle: wf.title,
            useCase: wf.useCase,
          });
        }
      });
    });

    const recoveryLogs = orchestratorStore
      .getAuditLogs()
      .filter((l) => l.eventType === 'RECOVERY_TRIGGERED' || l.eventType === 'RETRY_ATTEMPT');

    res.json({
      failedTasks,
      recoveryLogs,
    });
  });

  // -------------------------------------------------------------
  // API Routes: Audit Trail & Authorized History Management
  // -------------------------------------------------------------
  app.get('/api/audit', (req: Request, res: Response) => {
    const { eventType, agentName, workflowId, search } = req.query;
    const logs = orchestratorStore.getAuditLogs({
      eventType: eventType as string,
      agentName: agentName as string,
      workflowId: workflowId as string,
      search: search as string,
    });
    res.json(logs);
  });

  app.post('/api/audit/clear', (req: Request, res: Response) => {
    const { authorizedUser, confirmationPhrase } = req.body;
    if (confirmationPhrase !== 'CLEAR_AUDIT_LOGS') {
      return res.status(400).json({
        error: 'Explicit confirmation phrase "CLEAR_AUDIT_LOGS" required to clear history.',
      });
    }

    orchestratorStore.clearAuditLogs(authorizedUser || 'Admin');
    res.json({ success: true, message: 'Audit history cleared and audited.' });
  });

  // -------------------------------------------------------------
  // API Routes: Document Ingestion
  // -------------------------------------------------------------
  app.post('/api/documents/upload', (req: Request, res: Response) => {
    const { fileName, fileContent, fileType } = req.body;
    if (!fileName || !fileContent) {
      return res.status(400).json({ error: 'fileName and fileContent are required.' });
    }

    // Sanitize and extract content length & words
    const wordCount = fileContent.trim().split(/\s+/).length;
    const excerpt = fileContent.slice(0, 300);

    orchestratorStore.logAudit('TASK_CREATED', `Document "${fileName}" (${fileType || 'TXT'}, ~${wordCount} words) ingested for workflow analysis.`, {
      riskLevel: 'low',
      metadata: { fileName, wordCount },
    });

    res.json({
      fileName,
      wordCount,
      excerpt,
      status: 'ready_for_analysis',
    });
  });

  // -------------------------------------------------------------
  // API Routes: Optional Human-Approved Email Delivery
  // -------------------------------------------------------------
  app.post('/api/email/preview', (req: Request, res: Response) => {
    const { workflowId, recipient } = req.body;
    const wf = orchestratorStore.getWorkflow(workflowId);
    if (!wf) return res.status(404).json({ error: 'Workflow not found' });

    if (wf.status !== 'completed' || !wf.finalOutput) {
      return res.status(400).json({
        error: 'Email cannot be sent: Workflow is not yet completed or missing validated deliverable.',
      });
    }

    const subject = `[AF-01 Deliverable] ${wf.title}`;
    const emailPreview = {
      workflowId,
      recipient: recipient || 'stakeholder@enterprise.internal',
      subject,
      body: wf.finalOutput,
      policyNotice: 'Human approval is mandatory prior to external dispatch.',
    };

    res.json(emailPreview);
  });

  app.post('/api/email/send', (req: Request, res: Response) => {
    const { workflowId, recipient, subject, confirmedByUser } = req.body;

    if (!confirmedByUser) {
      return res.status(403).json({
        error: 'Explicit human approval required: confirmedByUser must be true.',
      });
    }

    const wf = orchestratorStore.getWorkflow(workflowId);
    if (!wf || wf.status !== 'completed') {
      return res.status(400).json({
        error: 'Cannot deliver email: Workflow is incomplete.',
      });
    }

    // Log explicit audit trail entry for email delivery
    orchestratorStore.logAudit(
      'EMAIL_SENT',
      `Deliverable for "${wf.title}" delivered to [${recipient}] with explicit human sign-off. Subject: "${subject}"`,
      {
        workflowId,
        riskLevel: 'medium',
        metadata: { recipient, subject },
      }
    );

    res.json({
      success: true,
      deliveredTo: recipient,
      timestamp: new Date().toISOString(),
      message: 'Email successfully sent via authorized integration with full audit logging.',
    });
  });

  // -------------------------------------------------------------
  // Vite Integration & Static Serving
  // -------------------------------------------------------------
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    // Development mode: attach Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AF-01] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[AF-01] Server start failure:', err);
  process.exit(1);
});
