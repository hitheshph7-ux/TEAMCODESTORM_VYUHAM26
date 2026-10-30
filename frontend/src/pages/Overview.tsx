
function Overview() {
  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Overview</h1>
          <p>Monitor your autonomous workflow platform.</p>
        </div>
        <span className="system-status">
          <span className="status-dot"></span>
          System Operational
        </span>
      </div>

      <section className="stats-grid">
        <div className="stat-card">
          <p>Total Workflows</p>
          <h2>12</h2>
          <span>All registered workflows</span>
        </div>

        <div className="stat-card">
          <p>Active Workflows</p>
          <h2>4</h2>
          <span>Currently executing</span>
        </div>

        <div className="stat-card">
          <p>Pending Approvals</p>
          <h2>3</h2>
          <span>Awaiting Agnal's decision</span>
        </div>

        <div className="stat-card">
          <p>Failed Tasks</p>
          <h2>2</h2>
          <span>Require recovery checks</span>
        </div>
      </section>

      <section className="content-section">
        <div className="section-heading">
          <h2>AI Agent Status</h2>
          <span>4 Specialized Agents</span>
        </div>

        <div className="agent-grid">
          <div className="agent-card">
            <h3>Planner Agent</h3>
            <p>Breaks objectives into tasks and creates execution plans.</p>
            <span className="agent-status">Ready</span>
          </div>

          <div className="agent-card">
            <h3>Executor Agent</h3>
            <p>Executes assigned tasks using authorized tools.</p>
            <span className="agent-status">Ready</span>
          </div>

          <div className="agent-card">
            <h3>Monitor Agent</h3>
            <p>Tracks execution and validates task results.</p>
            <span className="agent-status">Ready</span>
          </div>

          <div className="agent-card">
            <h3>Recover Agent</h3>
            <p>Handles failures, retries, and alternative execution paths.</p>
            <span className="agent-status">Ready</span>
          </div>
        </div>
      </section>

      <section className="content-section">
        <div className="section-heading">
          <h2>Governance Center</h2>
          <span>Agnal · Governance Engine</span>
        </div>

        <div className="governance-card">
          <h3>Risk Evaluation and Human Approval</h3>
          <p>
            Agnal evaluates workflow risks, enforces permissions, and
            requests human approval before restricted actions.
          </p>
          <div className="governance-features">
            <span>Risk Evaluation</span>
            <span>Approve / Reject</span>
            <span>Pause / Resume</span>
            <span>Audit Trail</span>
          </div>
        </div>
      </section>

      <section className="content-section">
        <div className="section-heading">
          <h2>Supported Use Cases</h2>
          <span>3 Categories</span>
        </div>

        <div className="use-case-grid">
          <div className="use-case-card">
            <h3>Research & Intelligence</h3>
            <p>Research, compare information, and generate reports.</p>
          </div>

          <div className="use-case-card">
            <h3>Document Management</h3>
            <p>Read, summarize, compare, and generate documents.</p>
          </div>

          <div className="use-case-card">
            <h3>Project Management</h3>
            <p>Plan tasks, monitor progress, and identify delays.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Overview;
