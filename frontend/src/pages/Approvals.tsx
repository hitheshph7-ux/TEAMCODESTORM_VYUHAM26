
const approvalRequests = [
  {
    id: "APR-001",
    workflow: "Competitor Research",
    action: "Access external research sources",
    risk: "Medium",
    status: "Pending",
  },
  {
    id: "APR-002",
    workflow: "Document Management",
    action: "Share generated report externally",
    risk: "High",
    status: "Pending",
  },
  {
    id: "APR-003",
    workflow: "Project Management",
    action: "Modify project task assignments",
    risk: "Medium",
    status: "Pending",
  },
];

function Approvals() {
  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Human Approvals</h1>
          <p>Review actions requiring governance approval from Agnal.</p>
        </div>
        <span className="system-status">Agnal Governance</span>
      </div>

      <section className="stats-grid">
        <div className="stat-card">
          <p>Pending Requests</p>
          <h2>3</h2>
          <span>Awaiting human decisions</span>
        </div>

        <div className="stat-card">
          <p>Approved</p>
          <h2>0</h2>
          <span>Sample records</span>
        </div>

        <div className="stat-card">
          <p>Rejected</p>
          <h2>0</h2>
          <span>Sample records</span>
        </div>
      </section>

      <section className="content-section">
        <div className="section-heading">
          <h2>Approval Requests</h2>
          <span>Review before taking action</span>
        </div>

        <div className="workflow-list">
          {approvalRequests.map((request) => (
            <div className="workflow-item" key={request.id}>
              <div>
                <h3>{request.workflow}</h3>
                <p>{request.id} · {request.action}</p>
                <p>Risk Level: {request.risk}</p>
              </div>

              <span className="workflow-status pending">
                {request.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="content-section">
        <div className="governance-card">
          <h3>Human-in-the-Loop Control</h3>
          <p>
            Agnal evaluates risk and requests human approval when an
            action requires authorization. Approved actions can proceed;
            rejected actions must not execute.
          </p>
          <div className="governance-features">
            <span>Approve</span>
            <span>Reject</span>
            <span>Pause</span>
            <span>Resume</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Approvals;
