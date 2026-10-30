
const agents = [
  {
    name: "Planner Agent",
    role: "Planning & Task Decomposition",
    description:
      "Understands objectives, creates execution plans, breaks work into tasks, and defines dependencies.",
    responsibility: "Creates workflow plans",
  },
  {
    name: "Executor Agent",
    role: "Task Execution",
    description:
      "Performs assigned tasks using authorized tools across research, documents, and project management.",
    responsibility: "Executes assigned tasks",
  },
  {
    name: "Monitor Agent",
    role: "Monitoring & Validation",
    description:
      "Tracks task execution, checks results, detects errors, and validates completion.",
    responsibility: "Validates task results",
  },
  {
    name: "Recover Agent",
    role: "Failure Recovery",
    description:
      "Handles failed tasks through bounded retries, alternative methods, and replanning when necessary.",
    responsibility: "Recovers failed tasks",
  },
];

function Agents() {
  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>AI Agents</h1>
          <p>Manage and monitor the specialized agents in AF-01.</p>
        </div>
        <span className="system-status">
          4 Specialized Agents
        </span>
      </div>

      <section className="content-section">
        <div className="agent-grid">
          {agents.map((agent) => (
            <div className="agent-card" key={agent.name}>
              <h3>{agent.name}</h3>
              <p className="agent-role">{agent.role}</p>
              <p>{agent.description}</p>

              <div className="agent-responsibility">
                {agent.responsibility}
              </div>

              <span className="agent-status">Registered</span>
            </div>
          ))}
        </div>
      </section>

      <section className="content-section">
        <div className="governance-card">
          <h3>Governance & Security</h3>
          <p>
            The governance layer manages risk, enforces permissions,
            controls approvals, and maintains audit logs.
          </p>
        </div>
      </section>
    </div>
  );
}

export default Agents;
