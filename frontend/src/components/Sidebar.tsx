import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, PlusCircle, GitBranch, Bot,
  CheckCircle2, Network, ScrollText, Zap
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/create', icon: PlusCircle, label: 'New Workflow' },
  { to: '/workflows', icon: GitBranch, label: 'Workflows' },
  { to: '/agents', icon: Bot, label: 'Agent Monitor' },
  { to: '/approvals', icon: CheckCircle2, label: 'Approvals' },
  { to: '/visualize', icon: Network, label: 'Visualization' },
  { to: '/logs', icon: ScrollText, label: 'Audit Logs' },
];

export default function Sidebar() {
  return (
    <aside className="w-64 h-screen flex-shrink-0 flex flex-col bg-surface-800 border-r border-surface-600 fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="p-6 border-b border-surface-600">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-accent-purple flex items-center justify-center shadow-glow-sm">
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">VYUHAM</h1>
            <p className="text-xs text-gray-500">AI Workflow Engine</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-surface-600">
        <div className="flex items-center gap-2 px-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-gray-400">System Online</span>
        </div>
        <p className="text-xs text-gray-600 mt-1 px-2">CODESTORM 2026</p>
      </div>
    </aside>
  );
}
