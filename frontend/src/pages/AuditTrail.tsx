
const auditRecords = [
  {
    id: "AUD-001",
    event: "Workflow Created",
    details: "Competitor Research workflow registered.",
    actor: "Hithesh - Orchestrator",
    status: "Success",
    time: "10:30 AM",
  },
  {
    id: "AUD-002",
    event: "Risk Evaluation",
    details: "External source access identified for review.",
    actor: "Agnal - Governance",
    status: "Review Required",
    time: "10:32 AM",
  },
  {
    id: "AUD-003",
    event: "Approval Requested",
    details: "Human approval requested for restricted action.",
    actor: "Agnal - Governance",
    status: "Pending",
    time: "10:33 AM",
  },
  {
    id: "AUD-004",
    event: "Task Failure",
    details: "External research source unavailable.",
    actor: "Executor Agent",
    status: "Failed",
    time: "10:35 AM",
  },
  {
    id: "AUD-005",
    event: "Recovery Initiated",
    details: "Recover Agent initiated a bounded retry.",
    actor: "Recover Agent",
    status: "In Progress",
    time: "10:36 AM",
  },
];

function AuditTrail() {
  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Audit Trail</h1>
          <p>Track decisions, executions, approvals, and recovery events.</p>
        </div>
        <span className="system-status">Governance Logs</span>
      </div>

      <section className="content-section">
        <div className="section-heading">
          <h2>Recent System Events</h2>
          <span>Sample audit records</span>
        </div>

        <div className="workflow-list">
          {auditRecords.map((record) => (
            <div className="workflow-item" key={record.id}>
              <div>
                <h3>{record.event}</h3>
                <p>{record.id} · {record.details}</p>
                <p>Actor: {record.actor}</p>
                <p>Time: {record.time}</p>
              </div>

              <span className="workflow-status pending">
                {record.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="content-section">
        <div className="governance-card">
          <h3>Audit and Accountability</h3>
          <p>
            Agnal records governance decisions, approval activities,
            execution events, failures, retries, and recovery outcomes.
            These records help maintain transparency and traceability.
          </p>

          <div className="governance-features">
            <span>Decision Logs</span>
            <span>Execution Logs</span>
            <span>Approval Logs</span>
            <span>Recovery Logs</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AuditTrail;
