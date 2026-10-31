/**
 * AF-01 Autonomous AI-Based Workflow Orchestration Platform
 * Master Application Shell & Real-time State Hub
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar.tsx';
import { Navbar } from './components/Navbar.tsx';
import { OverviewPage } from './pages/OverviewPage.tsx';
import { WorkflowsPage } from './pages/WorkflowsPage.tsx';
import { AgentsPage } from './pages/AgentsPage.tsx';
import { ApprovalsPage } from './pages/ApprovalsPage.tsx';
import { RecoveryPage } from './pages/RecoveryPage.tsx';
import { AuditTrailPage } from './pages/AuditTrailPage.tsx';
import { CreateWorkflowModal } from './components/CreateWorkflowModal.tsx';
import { WorkflowDetailModal } from './components/WorkflowDetailModal.tsx';
import { EmailDeliveryModal } from './components/EmailDeliveryModal.tsx';
import { Workflow, AgentMetrics, Approval, AuditLog, UseCaseType, AttachedDocument } from './types/orchestrator.ts';
import { api } from './services/api.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [agents, setAgents] = useState<AgentMetrics[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [emailWorkflow, setEmailWorkflow] = useState<Workflow | null>(null);

  // Derived selected workflow from current workflows list
  const selectedWorkflow = workflows.find((w) => w.id === selectedWorkflowId) || null;

  // Load and refresh state from backend with clean empty dependency
  const fetchState = useCallback(async () => {
    try {
      const [wfs, ags, apps, logs] = await Promise.all([
        api.getWorkflows(),
        api.getAgents(),
        api.getApprovals(),
        api.getAuditLogs(),
      ]);

      setWorkflows(wfs || []);
      setAgents(ags || []);
      setApprovals(apps || []);
      setAuditLogs(logs || []);
    } catch (err) {
      console.error('Failed to sync backend state:', err);
    }
  }, []);

  // Initial fetch and automatic real-time polling
  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 2500); // Poll every 2.5 seconds
    return () => clearInterval(interval);
  }, [fetchState]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchState();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleCreateWorkflow = async (data: {
    title: string;
    objective: string;
    useCase: UseCaseType;
    documents?: AttachedDocument[];
  }) => {
    const created = await api.createWorkflow(data);
    await fetchState();
    // Automatically trigger execution of newly created workflow
    if (created && created.id) {
      api.executeWorkflow(created.id);
      setSelectedWorkflowId(created.id);
    }
  };

  const pendingApprovalsCount = approvals.filter((a) => a.status === 'pending').length;
  const activeWorkflowsCount = workflows.filter(
    (w) =>
      w.status === 'in_progress' ||
      w.status === 'planning' ||
      w.status === 'waiting_approval' ||
      w.status === 'recovering'
  ).length;

  const failedTasksCount = workflows.reduce(
    (acc, wf) => acc + wf.tasks.filter((t) => t.status === 'failed').length,
    0
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingApprovalsCount={pendingApprovalsCount}
        activeWorkflowsCount={activeWorkflowsCount}
        failedTasksCount={failedTasksCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          onNewWorkflow={() => setIsCreateModalOpen(true)}
          onRefresh={handleManualRefresh}
          isRefreshing={isRefreshing}
        />

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'overview' && (
              <OverviewPage
                workflows={workflows}
                agents={agents}
                approvals={approvals}
                auditLogs={auditLogs}
                onSelectWorkflow={(wf) => setSelectedWorkflowId(wf.id)}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onNewWorkflow={() => setIsCreateModalOpen(true)}
              />
            )}

            {activeTab === 'workflows' && (
              <WorkflowsPage
                workflows={workflows}
                onSelectWorkflow={(wf) => setSelectedWorkflowId(wf.id)}
                onNewWorkflow={() => setIsCreateModalOpen(true)}
                onRefresh={fetchState}
              />
            )}

            {activeTab === 'agents' && <AgentsPage agents={agents} />}

            {activeTab === 'approvals' && (
              <ApprovalsPage approvals={approvals} onRefresh={fetchState} />
            )}

            {activeTab === 'recovery' && <RecoveryPage onRefresh={fetchState} />}

            {activeTab === 'audit' && (
              <AuditTrailPage auditLogs={auditLogs} onRefresh={fetchState} />
            )}
          </div>
        </main>
      </div>

      {/* Workflow Creation Modal */}
      <CreateWorkflowModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateWorkflow}
      />

      {/* Workflow Detail & Execution Modal */}
      <WorkflowDetailModal
        workflow={selectedWorkflow}
        isOpen={!!selectedWorkflow}
        onClose={() => setSelectedWorkflowId(null)}
        onRefresh={fetchState}
        onOpenEmailModal={(wf) => setEmailWorkflow(wf)}
      />

      {/* Human-Approved Email Delivery Modal */}
      <EmailDeliveryModal
        workflow={emailWorkflow}
        isOpen={!!emailWorkflow}
        onClose={() => setEmailWorkflow(null)}
        onDelivered={fetchState}
      />
    </div>
  );
}
