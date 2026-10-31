/**
 * AF-01 Autonomous Workflow Orchestration Platform
 * Central State Store & Governance Database Layer
 */

import {
  Workflow,
  Task,
  AgentExecution,
  Approval,
  AuditLog,
  AgentMetrics,
  AgentName,
  AgentStatus,
  RiskLevel,
  UseCaseType,
  WorkflowStatus,
  AttachedDocument,
} from '../src/types/orchestrator.ts';

export class OrchestrationStore {
  private workflows: Map<string, Workflow> = new Map();
  private tasks: Map<string, Task> = new Map();
  private executions: Map<string, AgentExecution> = new Map();
  private approvals: Map<string, Approval> = new Map();
  private auditLogs: AuditLog[] = [];
  private agentRegistry: Map<AgentName, AgentMetrics> = new Map();

  constructor() {
    this.initializeAgentRegistry();
    this.seedInitialWorkflows();
  }

  // -------------------------------------------------------------
  // Agent Registry & Lifecycle
  // -------------------------------------------------------------
  private initializeAgentRegistry() {
    const agents: AgentMetrics[] = [
      {
        name: 'Planner',
        responsibility:
          'Analyzes objectives, decomposes tasks, creates execution graphs, maps dependencies, and assesses risk.',
        status: 'Idle',
        totalExecutions: 4,
        successfulExecutions: 4,
        failedExecutions: 0,
        recoveryAssists: 1,
        lastExecution: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        name: 'Executor',
        responsibility:
          'Executes authorized actions, runs market research, extracts document text, and generates structured deliverables.',
        status: 'Idle',
        totalExecutions: 12,
        successfulExecutions: 11,
        failedExecutions: 1,
        recoveryAssists: 0,
        lastExecution: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        name: 'Monitor',
        responsibility:
          'Validates task quality, verifies dependency satisfaction, detects anomalies, and enforces milestone completion.',
        status: 'Idle',
        totalExecutions: 11,
        successfulExecutions: 11,
        failedExecutions: 0,
        recoveryAssists: 2,
        lastExecution: new Date(Date.now() - 1200000).toISOString(),
      },
      {
        name: 'Recover',
        responsibility:
          'Handles task exceptions, performs bounded retries with exponential backoff, adjusts parameters, or initiates replanning.',
        status: 'Idle',
        totalExecutions: 2,
        successfulExecutions: 2,
        failedExecutions: 0,
        recoveryAssists: 2,
        lastExecution: new Date(Date.now() - 900000).toISOString(),
      },
    ];

    agents.forEach((agent) => this.agentRegistry.set(agent.name, agent));
  }

  public getAgents(): AgentMetrics[] {
    return Array.from(this.agentRegistry.values());
  }

  public updateAgentStatus(name: AgentName, status: AgentStatus, taskId?: string, workflowId?: string) {
    const agent = this.agentRegistry.get(name);
    if (agent) {
      agent.status = status;
      agent.currentTaskId = taskId;
      agent.currentWorkflowId = workflowId;
      if (status === 'Working') {
        agent.totalExecutions += 1;
        agent.lastExecution = new Date().toISOString();
      } else if (status === 'Completed') {
        agent.successfulExecutions += 1;
      } else if (status === 'Failed') {
        agent.failedExecutions += 1;
      }
      this.agentRegistry.set(name, agent);
    }
  }

  // -------------------------------------------------------------
  // Audit Trail Engine
  // -------------------------------------------------------------
  public logAudit(
    eventType: AuditLog['eventType'],
    details: string,
    options?: {
      workflowId?: string;
      taskId?: string;
      agentName?: AgentName;
      riskLevel?: RiskLevel;
      metadata?: Record<string, any>;
    }
  ): AuditLog {
    const log: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      eventType,
      details,
      workflowId: options?.workflowId,
      taskId: options?.taskId,
      agentName: options?.agentName,
      riskLevel: options?.riskLevel,
      metadata: options?.metadata,
    };
    this.auditLogs.unshift(log);
    return log;
  }

  public getAuditLogs(filters?: {
    eventType?: string;
    agentName?: string;
    workflowId?: string;
    search?: string;
  }): AuditLog[] {
    let logs = [...this.auditLogs];
    if (!filters) return logs;

    if (filters.eventType && filters.eventType !== 'ALL') {
      logs = logs.filter((l) => l.eventType === filters.eventType);
    }
    if (filters.agentName && filters.agentName !== 'ALL') {
      logs = logs.filter((l) => l.agentName === filters.agentName);
    }
    if (filters.workflowId) {
      logs = logs.filter((l) => l.workflowId === filters.workflowId);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      logs = logs.filter(
        (l) =>
          l.details.toLowerCase().includes(q) ||
          l.eventType.toLowerCase().includes(q) ||
          (l.workflowId && l.workflowId.toLowerCase().includes(q))
      );
    }
    return logs;
  }

  public clearAuditLogs(authorizedUser: string): boolean {
    const priorCount = this.auditLogs.length;
    this.auditLogs = [];
    this.logAudit(
      'HISTORY_CLEARED',
      `Audit logs cleared by authorized user [${authorizedUser}]. Prior record count: ${priorCount}.`,
      { riskLevel: 'high' }
    );
    return true;
  }

  // -------------------------------------------------------------
  // Workflows CRUD
  // -------------------------------------------------------------
  public createWorkflow(data: {
    title: string;
    objective: string;
    useCase: UseCaseType;
    documents?: AttachedDocument[];
  }): Workflow {
    const id = `wf-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`;
    const now = new Date().toISOString();
    const workflow: Workflow = {
      id,
      title: data.title || `Workflow: ${data.objective.slice(0, 40)}...`,
      objective: data.objective,
      useCase: data.useCase,
      status: 'pending',
      tasks: [],
      documents: data.documents || [],
      createdAt: now,
      updatedAt: now,
    };

    this.workflows.set(id, workflow);
    this.logAudit('WORKFLOW_CREATED', `New workflow created: "${workflow.title}" for use case [${workflow.useCase}] with ${workflow.documents?.length || 0} attached document(s)`, {
      workflowId: id,
      riskLevel: 'low',
    });

    return workflow;
  }

  public addDocumentToWorkflow(workflowId: string, doc: AttachedDocument): Workflow | undefined {
    const wf = this.workflows.get(workflowId);
    if (!wf) return undefined;

    if (!wf.documents) wf.documents = [];
    wf.documents.push(doc);
    wf.updatedAt = new Date().toISOString();
    this.workflows.set(workflowId, wf);

    this.logAudit('TASK_CREATED', `Document "${doc.name}" (~${doc.wordCount} words) added to workflow [${wf.title}].`, {
      workflowId,
      riskLevel: 'low',
      metadata: { documentName: doc.name, wordCount: doc.wordCount },
    });

    return wf;
  }

  public getWorkflow(id: string): Workflow | undefined {
    return this.workflows.get(id);
  }

  public getAllWorkflows(): Workflow[] {
    return Array.from(this.workflows.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public updateWorkflow(id: string, updates: Partial<Workflow>): Workflow | undefined {
    const wf = this.workflows.get(id);
    if (!wf) return undefined;

    const updated: Workflow = {
      ...wf,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (updates.status && updates.status !== wf.status) {
      if (updates.status === 'completed') {
        updated.completedAt = new Date().toISOString();
        this.logAudit('FINAL_OUTPUT_GENERATED', `Workflow [${id}] marked completed with final validated output.`, {
          workflowId: id,
          riskLevel: 'low',
        });
      } else if (updates.status === 'paused') {
        this.logAudit('WORKFLOW_PAUSED', `Workflow [${id}] was paused.`, { workflowId: id, riskLevel: 'medium' });
      } else if (updates.status === 'in_progress' && wf.status === 'paused') {
        this.logAudit('WORKFLOW_RESUMED', `Workflow [${id}] was resumed.`, { workflowId: id, riskLevel: 'low' });
      }
    }

    this.workflows.set(id, updated);
    return updated;
  }

  // -------------------------------------------------------------
  // Tasks CRUD
  // -------------------------------------------------------------
  public createTask(data: Omit<Task, 'id' | 'createdAt' | 'retryCount' | 'executionLogs'>): Task {
    const id = `task-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`;
    const task: Task = {
      ...data,
      id,
      retryCount: 0,
      executionLogs: [`Task created at ${new Date().toISOString()}`],
      createdAt: new Date().toISOString(),
    };

    this.tasks.set(id, task);

    // Link to workflow
    const wf = this.workflows.get(data.workflowId);
    if (wf) {
      wf.tasks.push(task);
      wf.updatedAt = new Date().toISOString();
      this.workflows.set(wf.id, wf);
    }

    this.logAudit('TASK_CREATED', `Task created: "${task.title}" assigned to [${task.assignedAgent}]`, {
      workflowId: task.workflowId,
      taskId: task.id,
      agentName: task.assignedAgent,
      riskLevel: task.riskLevel,
    });

    return task;
  }

  public getTask(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  public updateTask(id: string, updates: Partial<Task>): Task | undefined {
    const task = this.tasks.get(id);
    if (!task) return undefined;

    const updatedTask: Task = { ...task, ...updates };
    if (updates.status === 'completed' && !updatedTask.completedAt) {
      updatedTask.completedAt = new Date().toISOString();
    }

    this.tasks.set(id, updatedTask);

    // Sync in parent workflow
    const wf = this.workflows.get(updatedTask.workflowId);
    if (wf) {
      wf.tasks = wf.tasks.map((t) => (t.id === id ? updatedTask : t));
      wf.updatedAt = new Date().toISOString();
      this.workflows.set(wf.id, wf);
    }

    return updatedTask;
  }

  // -------------------------------------------------------------
  // Governance & Human Approval Gatekeeper
  // -------------------------------------------------------------
  public requestApproval(data: {
    workflowId: string;
    taskId: string;
    taskTitle: string;
    requestedAction: string;
    riskLevel: RiskLevel;
  }): Approval {
    const id = `appr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`;
    const approval: Approval = {
      id,
      workflowId: data.workflowId,
      taskId: data.taskId,
      taskTitle: data.taskTitle,
      requestedAction: data.requestedAction,
      riskLevel: data.riskLevel,
      status: 'pending',
      requestTimestamp: new Date().toISOString(),
    };

    this.approvals.set(id, approval);

    // Link approval to task
    const task = this.tasks.get(data.taskId);
    if (task) {
      task.requiresApproval = true;
      task.approvalId = id;
      task.status = 'pending';
      this.updateTask(task.id, task);
    }

    // Set workflow status to waiting_approval
    this.updateWorkflow(data.workflowId, { status: 'waiting_approval' });

    this.logAudit(
      'APPROVAL_REQUESTED',
      `Approval required for high-risk action "${data.requestedAction}" on task [${data.taskTitle}]`,
      {
        workflowId: data.workflowId,
        taskId: data.taskId,
        riskLevel: data.riskLevel,
      }
    );

    return approval;
  }

  public decideApproval(
    approvalId: string,
    decision: 'approved' | 'rejected',
    decisionMaker: string,
    reason: string
  ): Approval | undefined {
    const approval = this.approvals.get(approvalId);
    if (!approval) return undefined;

    approval.status = decision;
    approval.decisionMaker = decisionMaker;
    approval.decisionReason = reason;
    approval.decisionTimestamp = new Date().toISOString();
    this.approvals.set(approvalId, approval);

    const task = this.tasks.get(approval.taskId);
    if (task) {
      if (decision === 'approved') {
        task.requiresApproval = false;
        task.executionLogs.push(`Approved by ${decisionMaker} at ${approval.decisionTimestamp}: "${reason}"`);
        this.updateTask(task.id, task);
      } else {
        task.status = 'failed';
        task.error = `Execution rejected by human overseer: ${reason}`;
        task.executionLogs.push(`Rejected by ${decisionMaker} at ${approval.decisionTimestamp}: "${reason}"`);
        this.updateTask(task.id, task);
      }
    }

    this.logAudit(
      'APPROVAL_DECIDED',
      `Action "${approval.requestedAction}" was [${decision.toUpperCase()}] by ${decisionMaker}. Reason: ${reason}`,
      {
        workflowId: approval.workflowId,
        taskId: approval.taskId,
        riskLevel: approval.riskLevel,
      }
    );

    return approval;
  }

  public getApproval(id: string): Approval | undefined {
    return this.approvals.get(id);
  }

  public getPendingApprovalForWorkflow(workflowId: string): Approval | undefined {
    return Array.from(this.approvals.values()).find(
      (a) => a.workflowId === workflowId && a.status === 'pending'
    );
  }

  public getApprovalByTaskId(taskId: string): Approval | undefined {
    return Array.from(this.approvals.values()).find((a) => a.taskId === taskId);
  }

  public getPendingApprovals(): Approval[] {
    return Array.from(this.approvals.values()).filter((a) => a.status === 'pending');
  }

  public getAllApprovals(): Approval[] {
    return Array.from(this.approvals.values()).sort(
      (a, b) => new Date(b.requestTimestamp).getTime() - new Date(a.requestTimestamp).getTime()
    );
  }

  // -------------------------------------------------------------
  // Seed Initial Hackathon Demonstrable Data
  // -------------------------------------------------------------
  private seedInitialWorkflows() {
    // 1. Research Workflow
    const wf1 = this.createWorkflow({
      title: 'Global EV Market Competitor Intelligence',
      objective: 'Research top 3 competitors in the Electric Vehicle battery technology domain and prepare an executive comparative analysis.',
      useCase: 'research',
    });

    const t1 = this.createTask({
      workflowId: wf1.id,
      title: 'Analyze market objective & decompose research questions',
      description: 'Identify primary technical metrics (energy density, cycle life, production costs) for Tesla, BYD, and CATL.',
      status: 'completed',
      assignedAgent: 'Planner',
      priority: 'high',
      dependencies: [],
      maxRetries: 3,
      riskLevel: 'low',
      requiresApproval: false,
      result: 'Research parameters established: 3 targets identified, 4 performance indices defined.',
    });

    const t2 = this.createTask({
      workflowId: wf1.id,
      title: 'Gather EV battery patent and production data',
      description: 'Synthesize verified public filing data for BYD Blade, CATL Shenxing, and Tesla 4680 cell lines.',
      status: 'completed',
      assignedAgent: 'Executor',
      priority: 'high',
      dependencies: [t1.id],
      maxRetries: 3,
      riskLevel: 'low',
      requiresApproval: false,
      result: 'Collected comprehensive telemetry: CATL 1000km LFP fast-charging, BYD CTP cell-to-pack integration, Tesla structural battery pack.',
    });

    const t3 = this.createTask({
      workflowId: wf1.id,
      title: 'Validate citations and cross-verify production claims',
      description: 'Inspect extracted production metrics against certified Q3 disclosures to prevent model hallucination.',
      status: 'completed',
      assignedAgent: 'Monitor',
      priority: 'medium',
      dependencies: [t2.id],
      maxRetries: 2,
      riskLevel: 'low',
      requiresApproval: false,
      result: 'Output verified. 100% compliance with stated source benchmarks.',
    });

    this.updateWorkflow(wf1.id, {
      status: 'completed',
      finalOutput: `# Global EV Market Competitor Intelligence: Battery Technology

## Executive Summary
This comparative report evaluates the current technological positioning of CATL, BYD, and Tesla in next-generation lithium battery architectures.

### Key Comparative Metrics
1. **CATL (Shenxing LFP)**: 4C ultra-fast charging yielding 400km range in 10 minutes. Dominates commercial OEM supply chains with over 36% global market share.
2. **BYD (Blade Battery)**: Structural cell-to-body integration with unmatched thermal stability under nail-penetration safety tests; cost leadership through vertical integration.
3. **Tesla (4680 Tabless Design)**: Focus on dry battery electrode manufacturing simplification, yield ramping, and structural load-bearing integration.

### Strategic Recommendations
- Prioritize high-silicon anode blends for premium long-range tiers.
- Form joint-venture alliances for localized European and North American cathode refining to satisfy IRA/CRMA subsidies.`,
      sources: [
        'CATL Tech Day 2025 Disclosures',
        'BYD Financial and R&D Annual Filing',
        'Tesla Cybercell Production Updates',
      ],
    });

    // 2. Document Proposal Review Workflow (demonstrating governance approval)
    const wf2 = this.createWorkflow({
      title: 'Enterprise ERP Vendor Proposal Comparison',
      objective: 'Ingest 3 enterprise proposals, compare budget line items, and request approval before finalizing procurement selection.',
      useCase: 'document',
    });

    const t2_1 = this.createTask({
      workflowId: wf2.id,
      title: 'Extract financial figures and SLA commitments',
      description: 'Parse RFP submissions from SAP, Oracle, and Microsoft Dynamics 365.',
      status: 'completed',
      assignedAgent: 'Planner',
      priority: 'medium',
      dependencies: [],
      maxRetries: 2,
      riskLevel: 'low',
      requiresApproval: false,
      result: 'Parsed 3 proposals: Total 5-year TCO calculated for each bidder.',
    });

    const t2_2 = this.createTask({
      workflowId: wf2.id,
      title: 'Execute procurement vendor shortlisting & contractual commitment',
      description: 'Issue preliminary vendor selection binding $1,250,000 deployment tranche.',
      status: 'pending',
      assignedAgent: 'Executor',
      priority: 'high',
      dependencies: [t2_1.id],
      maxRetries: 1,
      riskLevel: 'high',
      requiresApproval: true,
    });

    // Register governance approval request
    this.requestApproval({
      workflowId: wf2.id,
      taskId: t2_2.id,
      taskTitle: t2_2.title,
      requestedAction: 'Authorize procurement vendor shortlisting committing >$1M cloud ERP deployment budget',
      riskLevel: 'high',
    });

    // 3. Project Management Workflow (demonstrating Recovery Agent handling a failed dependency)
    const wf3 = this.createWorkflow({
      title: 'Employee Management Portal Sprint Roadmap',
      objective: 'Break down milestone deliverables for HR Portal v2, evaluate API rate-limit failure, and trigger bounded recovery.',
      useCase: 'project_management',
    });

    const t3_1 = this.createTask({
      workflowId: wf3.id,
      title: 'Generate WBS & Sprint Dependency Graph',
      description: 'Decompose authentication, payroll microservice, and employee directory into milestones.',
      status: 'completed',
      assignedAgent: 'Planner',
      priority: 'medium',
      dependencies: [],
      maxRetries: 3,
      riskLevel: 'low',
      requiresApproval: false,
      result: 'WBS created: 4 Epics, 12 Stories with dependency chains established.',
    });

    const t3_2 = this.createTask({
      workflowId: wf3.id,
      title: 'Sync schema specs with Legacy Payroll Gateway',
      description: 'Query remote legacy payroll SOAP endpoint for employee schema validation.',
      status: 'running',
      assignedAgent: 'Executor',
      priority: 'high',
      dependencies: [t3_1.id],
      maxRetries: 3,
      riskLevel: 'medium',
      requiresApproval: false,
    });

    // Simulate recovery event for auditing
    this.logAudit(
      'RETRY_ATTEMPT',
      'Recover Agent initiated exponential backoff retry 1/3 for Legacy Payroll Gateway sync.',
      {
        workflowId: wf3.id,
        taskId: t3_2.id,
        agentName: 'Recover',
        riskLevel: 'medium',
      }
    );

    this.updateWorkflow(wf3.id, { status: 'in_progress' });
  }
}

// Singleton global store instance for backend
export const orchestratorStore = new OrchestrationStore();
