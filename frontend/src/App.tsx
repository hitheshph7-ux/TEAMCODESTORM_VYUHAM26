import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import CreateWorkflow from './pages/CreateWorkflow';
import WorkflowList from './pages/WorkflowList';
import WorkflowDetail from './pages/WorkflowDetail';
import AgentMonitor from './pages/AgentMonitor';
import ApprovalCenter from './pages/ApprovalCenter';
import WorkflowVisualization from './pages/WorkflowVisualization';
import AuditLogs from './pages/AuditLogs';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 ml-64 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create" element={<CreateWorkflow />} />
            <Route path="/workflows" element={<WorkflowList />} />
            <Route path="/workflows/:id" element={<WorkflowDetail />} />
            <Route path="/agents" element={<AgentMonitor />} />
            <Route path="/approvals" element={<ApprovalCenter />} />
            <Route path="/visualize" element={<WorkflowVisualization />} />
            <Route path="/logs" element={<AuditLogs />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
