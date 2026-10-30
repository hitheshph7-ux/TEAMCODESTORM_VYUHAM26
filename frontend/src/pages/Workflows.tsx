
function Workflows() {
  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Workflows</h1>
          <p>Create, manage, and monitor autonomous workflows.</p>
        </div>
        <button className="primary-button">+ New Workflow</button>
      </div>

      <section className="content-section">
        <div className="section-heading">
          <h2>Workflow Categories</h2>
          <span>3 Supported Categories</span>
        </div>

        <div className="use-case-grid">
          <div className="use-case-card">
            <h3>Research & Intelligence</h3>
            <p>
              Conduct research, gather information, compare findings,
              and generate intelligence reports.
            </p>
          </div>

          <div className="use-case-card">
            <h3>Document Management</h3>
            <p>
              Analyze uploaded documents, extract information,
              summarize content, and generate reports.
            </p>
          </div>

          <div className="use-case-card">
            <h3>Project Management</h3>
            <p>
              Break projects into tasks, manage dependencies,
              monitor progress, and identify delays.
            </p>
          </div>
        </div>
      </section>

      <section className="content-section">
        <div className="section-heading">
          <h2>Recent Workflows</h2>
          <span>Sample workflow records</span>
        </div>

        <div className="workflow-list">
          <div className="workflow-item">
            <div>
              <h3>Competitor Research</h3>
              <p>Research & Intelligence</p>
            </div>
            <span className="workflow-status running">Running</span>
          </div>

          <div className="workflow-item">
            <div>
              <h3>Document Analysis</h3>
              <p>Document Management</p>
            </div>
            <span className="workflow-status completed">Completed</span>
          </div>

          <div className="workflow-item">
            <div>
              <h3>Project Planning</h3>
              <p>Project Management</p>
            </div>
            <span className="workflow-status pending">Pending Approval</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Workflows;
