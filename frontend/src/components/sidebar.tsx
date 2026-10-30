import type { NavLinkRenderProps } from "react-router-dom";
import { NavLink } from "react-router-dom";

const menuItems = [
  { name: "Overview", path: "/" },
  { name: "Workflows", path: "/workflows" },
  { name: "Agents", path: "/agents" },
  { name: "Approvals", path: "/approvals" },
  { name: "Recovery", path: "/recovery" },
  { name: "Audit Trail", path: "/audit" },
];

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="logo-icon">A</div>
        <div>
          <h2>AF-01</h2>
          <span>Workflow Platform</span>
        </div>
      </div>

      <nav>
        <p className="menu-label">WORKSPACE</p>

        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }: NavLinkRenderProps) =>
              isActive ? "active" : ""
            }
          >
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="system-status">
          <span className="status-dot"></span>
          System Operational
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;