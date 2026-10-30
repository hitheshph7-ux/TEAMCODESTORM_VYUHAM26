
const recoveryRecords = [
  {
    id: "REC-001",
    task: "Collect competitor information",
    workflow: "Competitor Research",
    issue: "External source unavailable",
    attempts: "1 / 3",
    status: "Retrying",
  },
  {
    id: "REC-002",
    task: "Extract document content",
    workflow: "Document Management",
    issue: "Document extraction failed",
    attempts: "3 / 3",
    status: "Needs Replanning",
  },
];

function Recovery() {
  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Failure Recovery</h1>
          <p>Monitor failed tasks and recovery activities.</p>
        </div>
        <span className="system-status">Recover Agent</span>
      </div>

      <section className="stats-grid">
        <div className="stat-card">
          <p>Failed Tasks</p>
          <h2>2</h2>
          <span>Sample records</span>
        </div>

        <div className="stat-card">
          <p>Retrying</p>
          <h2>1</h2>
          <span>Recovery in progress</span>
        </div>

        <div className="stat-card">
          <p>Needs Replanning</p>
          <h2>1</h2>
          <span>Alternative plan required</span>
        </div>
      </section>

      <section className="content-section">
        <div className="section-heading">
          <h2>Recovery Records</h2>
          <span>Bounded retry system</span>
        </div>

        <div className="workflow-list">
          {recoveryRecords.map((record) => (
            <div className="workflow-item" key={record.id}>
              <div>
                <h3>{record.task}</h3>
                <p>{record.id} · {record.workflow}</p>
                <p>Issue: {record.issue}</p>
                <p>Attempts: {record.attempts}</p>
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
          <h3>Recovery Strategy</h3>
          <p>
            The Recover Agent handles failures using controlled retries.
            When retry limits are reached, it can select an alternative
            method or request a new plan from the Planner Agent.
          </p>

          <div className="governance-features">
            <span>Retry</span>
            <span>Alternative Method</span>
            <span>Reassign</span>
            <span>Replan</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Recovery;
