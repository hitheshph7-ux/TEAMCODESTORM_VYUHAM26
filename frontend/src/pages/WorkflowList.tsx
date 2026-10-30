import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GitBranch, ArrowRight, RefreshCw, Search } from 'lucide-react';
import { workflowsApi } from '../services/api';
import type { Workflow } from '../types';
import StatusBadge from '../components/StatusBadge';
import { formatDate } from '../utils/helpers';

export default function WorkflowList() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetch = async () => {
      const data = await workflowsApi.list();
      setWorkflows(data);
      setLoading(false);
    };
    fetch();
    const interval = setInterval(fetch, 4000);
    return () => clearInterval(interval);
  }, []);

  const filtered = workflows.filter(wf =>
    wf.objective.toLowerCase().includes(search.toLowerCase()) ||
    wf.status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">All Workflows</h1>
          <p className="text-gray-400 mt-1">{workflows.length} total workflows</p>
        </div>
        <Link to="/create" className="btn-primary">
          <GitBranch size={16} />
          New Workflow
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search workflows..."
          className="input pl-9"
        />
      </div>

      {loading ? (
        <div className="text-center py-20">
          <RefreshCw size={28} className="animate-spin text-primary-400 mx-auto mb-3" />
          <p className="text-gray-400">Loading workflows...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <GitBranch size={40} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No workflows found</p>
          <Link to="/create" className="btn-primary mt-4 mx-auto">Create One</Link>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Objective</th>
                <th>Status</th>
                <th>Mode</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(wf => (
                <tr key={wf.id}>
                  <td className="max-w-sm">
                    <p className="text-white font-medium truncate">{wf.objective}</p>
                    <p className="text-gray-500 text-xs font-mono">{wf.id.slice(0, 8)}...</p>
                  </td>
                  <td><StatusBadge status={wf.status} /></td>
                  <td>
                    <span className={`text-xs px-2 py-1 rounded font-mono ${
                      wf.execution_mode === 'ai'
                        ? 'bg-purple-500/20 text-purple-300'
                        : 'bg-surface-600 text-gray-400'
                    }`}>
                      {wf.execution_mode.toUpperCase()}
                    </span>
                  </td>
                  <td className="text-xs text-gray-400">{formatDate(wf.created_at)}</td>
                  <td>
                    <div className="flex items-center gap-3">
                      <Link to={`/workflows/${wf.id}`}
                        className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1">
                        Details <ArrowRight size={12} />
                      </Link>
                      <Link to={`/visualize?wf=${wf.id}`}
                        className="text-cyan-400 hover:text-cyan-300 text-sm">
                        Graph
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
