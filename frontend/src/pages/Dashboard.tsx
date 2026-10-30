import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GitBranch, Play, CheckCircle2, XCircle, Clock, AlertTriangle,
  TrendingUp, ArrowRight, RefreshCw
} from 'lucide-react';
import { workflowsApi } from '../services/api';
import type { DashboardStats } from '../types';
import StatusBadge from '../components/StatusBadge';
import { formatRelativeTime } from '../utils/helpers';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setError(null);
      const data = await workflowsApi.stats();
      setStats(data);
    } catch (e) {
      setError('Failed to load dashboard data. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <RefreshCw size={32} className="animate-spin text-primary-400 mx-auto mb-3" />
        <p className="text-gray-400">Loading dashboard...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="p-6">
      <div className="card border-red-600/30 bg-red-900/10">
        <div className="flex items-center gap-3 text-red-400">
          <XCircle size={20} />
          <p>{error}</p>
        </div>
      </div>
    </div>
  );

  const statCards = [
    {
      label: 'Total Workflows',
      value: stats?.total_workflows ?? 0,
      icon: GitBranch,
      color: 'bg-primary-500/20 text-primary-300',
      border: 'border-primary-600/30',
    },
    {
      label: 'Running',
      value: stats?.running_workflows ?? 0,
      icon: Play,
      color: 'bg-blue-500/20 text-blue-300',
      border: 'border-blue-600/30',
    },
    {
      label: 'Completed',
      value: stats?.completed_workflows ?? 0,
      icon: CheckCircle2,
      color: 'bg-emerald-500/20 text-emerald-300',
      border: 'border-emerald-600/30',
    },
    {
      label: 'Failed',
      value: stats?.failed_workflows ?? 0,
      icon: XCircle,
      color: 'bg-red-500/20 text-red-300',
      border: 'border-red-600/30',
    },
    {
      label: 'Paused',
      value: stats?.paused_workflows ?? 0,
      icon: Clock,
      color: 'bg-amber-500/20 text-amber-300',
      border: 'border-amber-600/30',
    },
    {
      label: 'Pending Approvals',
      value: stats?.pending_approvals ?? 0,
      icon: AlertTriangle,
      color: 'bg-orange-500/20 text-orange-300',
      border: 'border-orange-600/30',
    },
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">Real-time overview of all workflows and agents</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchStats} className="btn-secondary">
            <RefreshCw size={16} />
            Refresh
          </button>
          <Link to="/create" className="btn-primary">
            <Play size={16} />
            New Workflow
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, border }) => (
          <div key={label} className={`card border ${border} flex flex-col gap-3`}>
            <div className={`stat-icon w-fit ${color} rounded-lg p-2.5`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pending Approvals Alert */}
      {(stats?.pending_approvals ?? 0) > 0 && (
        <div className="card border-amber-600/40 bg-amber-900/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <AlertTriangle size={20} className="text-amber-400" />
            </div>
            <div>
              <p className="font-semibold text-amber-300">
                {stats!.pending_approvals} workflow{stats!.pending_approvals > 1 ? 's' : ''} waiting for approval
              </p>
              <p className="text-sm text-gray-400">Review and approve or reject pending actions</p>
            </div>
          </div>
          <Link to="/approvals" className="btn-secondary text-amber-400 border-amber-600/40">
            Review Now <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {/* Recent Workflows */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <TrendingUp size={18} className="text-primary-400" />
            Recent Workflows
          </h2>
          <Link to="/workflows" className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {(!stats?.recent_workflows || stats.recent_workflows.length === 0) ? (
          <div className="card text-center py-12">
            <GitBranch size={40} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 mb-2">No workflows yet</p>
            <Link to="/create" className="btn-primary mx-auto">
              <Play size={16} />
              Create your first workflow
            </Link>
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
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {stats!.recent_workflows.map(wf => (
                  <tr key={wf.id}>
                    <td className="max-w-xs">
                      <p className="font-medium text-white truncate">{wf.objective.slice(0, 80)}
                        {wf.objective.length > 80 ? '...' : ''}
                      </p>
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
                    <td className="text-gray-400 text-xs">{formatRelativeTime(wf.created_at)}</td>
                    <td>
                      <Link
                        to={`/workflows/${wf.id}`}
                        className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1"
                      >
                        Details <ArrowRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
