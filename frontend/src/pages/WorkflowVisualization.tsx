import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ReactFlow,
  Background, Controls, MiniMap,
  type NodeTypes, type Node, type Edge,
  Position, Handle, BaseEdge, getStraightPath,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { workflowsApi } from '../services/api';
import type { Workflow, GraphData } from '../types';
import StatusBadge from '../components/StatusBadge';
import { RefreshCw, Network } from 'lucide-react';

// Custom node component
function TaskNode({ data }: { data: any }) {
  const statusColors: Record<string, string> = {
    pending: 'border-gray-600 bg-surface-700',
    ready: 'border-cyan-500 bg-cyan-900/20',
    running: 'border-primary-500 bg-primary-900/20 shadow-glow-sm',
    completed: 'border-emerald-500 bg-emerald-900/20',
    failed: 'border-red-500 bg-red-900/20',
    blocked: 'border-orange-500 bg-orange-900/20',
    awaiting_approval: 'border-amber-500 bg-amber-900/20',
    skipped: 'border-gray-700 bg-surface-800',
  };

  const colorClass = statusColors[data.status] || statusColors.pending;

  return (
    <div className={`border-2 rounded-xl p-3 min-w-[180px] max-w-[220px] ${colorClass}`}>
      <Handle type="target" position={Position.Left} className="!bg-primary-500" />

      <div className="text-xs font-semibold text-white mb-1 leading-tight">{data.label}</div>

      {data.agent && (
        <div className="text-xs text-gray-400 mb-1.5">
          🤖 {data.agent}
        </div>
      )}

      {data.tool && (
        <div className="text-xs text-gray-500 font-mono mb-1.5">
          🔧 {data.tool}
        </div>
      )}

      <div className="mt-2">
        <StatusBadge status={data.status} showDot={false} />
      </div>

      {data.retry_count > 0 && (
        <div className="text-xs text-amber-400 mt-1">
          🔄 {data.retry_count} retries
        </div>
      )}

      {data.requires_approval && (
        <div className="text-xs text-amber-300 mt-1">⚠ Approval required</div>
      )}

      <Handle type="source" position={Position.Right} className="!bg-primary-500" />
    </div>
  );
}

const nodeTypes: NodeTypes = { taskNode: TaskNode };

// Calculate hierarchical layout for nodes
function calculateLayout(nodes: any[], edges: any[]): any[] {
  if (nodes.length === 0) return nodes;

  // Build adjacency for ordering
  const inDegree: Record<string, number> = {};
  const children: Record<string, string[]> = {};

  nodes.forEach(n => {
    inDegree[n.id] = 0;
    children[n.id] = [];
  });

  edges.forEach(e => {
    inDegree[e.target] = (inDegree[e.target] || 0) + 1;
    children[e.source].push(e.target);
  });

  // BFS to assign levels
  const levels: Record<string, number> = {};
  const queue: string[] = nodes.filter(n => inDegree[n.id] === 0).map(n => n.id);
  queue.forEach(id => (levels[id] = 0));

  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    (children[cur] || []).forEach(child => {
      levels[child] = Math.max(levels[child] || 0, (levels[cur] || 0) + 1);
      queue.push(child);
    });
  }

  // Group by level
  const byLevel: Record<number, string[]> = {};
  Object.entries(levels).forEach(([id, level]) => {
    byLevel[level] = byLevel[level] || [];
    byLevel[level].push(id);
  });

  const HGAP = 280;
  const VGAP = 140;

  return nodes.map(node => {
    const level = levels[node.id] || 0;
    const levelNodes = byLevel[level] || [node.id];
    const rowIdx = levelNodes.indexOf(node.id);
    const rowCount = levelNodes.length;

    return {
      ...node,
      position: {
        x: level * HGAP + 40,
        y: (rowIdx - (rowCount - 1) / 2) * VGAP + 300,
      },
    };
  });
}

export default function WorkflowVisualization() {
  const [searchParams] = useSearchParams();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWf, setSelectedWf] = useState<string>(searchParams.get('wf') || '');
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    workflowsApi.list().then(setWorkflows);
  }, []);

  const fetchGraph = useCallback(async (wfId: string) => {
    if (!wfId) return;
    setLoading(true);
    try {
      const data = await workflowsApi.graph(wfId);
      setGraphData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedWf) fetchGraph(selectedWf);
  }, [selectedWf]);

  useEffect(() => {
    if (!selectedWf) return;
    const interval = setInterval(() => fetchGraph(selectedWf), 4000);
    return () => clearInterval(interval);
  }, [selectedWf, fetchGraph]);

  const nodes: Node[] = graphData
    ? calculateLayout(graphData.nodes, graphData.edges)
    : [];

  const edges: Edge[] = graphData
    ? graphData.edges.map(e => ({
        ...e,
        type: 'smoothstep',
        style: { stroke: '#6366f1', strokeWidth: 2 },
        markerEnd: { type: 'arrowclosed' as any, color: '#6366f1' },
      }))
    : [];

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Workflow Visualization</h1>
          <p className="text-gray-400 mt-1">Interactive task dependency graph</p>
        </div>
        {selectedWf && (
          <button onClick={() => fetchGraph(selectedWf)} className="btn-secondary">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        )}
      </div>

      {/* Workflow Selector */}
      <div className="card">
        <label className="block text-sm font-medium text-gray-300 mb-2">Select Workflow</label>
        <select
          value={selectedWf}
          onChange={e => setSelectedWf(e.target.value)}
          className="input max-w-lg"
        >
          <option value="">-- Choose a workflow --</option>
          {workflows.map(wf => (
            <option key={wf.id} value={wf.id}>
              [{wf.status.toUpperCase()}] {wf.objective.slice(0, 70)}...
            </option>
          ))}
        </select>
      </div>

      {/* Graph Canvas */}
      <div className="card h-[600px] p-0 overflow-hidden border-surface-600">
        {!selectedWf ? (
          <div className="h-full flex flex-col items-center justify-center gap-3">
            <Network size={48} className="text-gray-700" />
            <p className="text-gray-500">Select a workflow to visualize its task graph</p>
          </div>
        ) : loading && !graphData ? (
          <div className="h-full flex items-center justify-center">
            <RefreshCw size={28} className="animate-spin text-primary-400" />
          </div>
        ) : nodes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-3">
            <Network size={40} className="text-gray-700" />
            <p className="text-gray-500">No tasks found. Start the workflow to see the graph.</p>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            className="bg-surface-900"
          >
            <Background color="#22222f" gap={20} />
            <Controls className="!bg-surface-700 !border-surface-600" />
            <MiniMap
              className="!bg-surface-800 !border-surface-600"
              nodeColor={(n) => {
                const statusColors: Record<string, string> = {
                  completed: '#10b981',
                  running: '#6366f1',
                  failed: '#ef4444',
                  awaiting_approval: '#f59e0b',
                  blocked: '#f97316',
                };
                return statusColors[n.data?.status as string] || '#374151';
              }}
            />
          </ReactFlow>
        )}
      </div>

      {/* Legend */}
      {nodes.length > 0 && (
        <div className="card">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Legend</p>
          <div className="flex flex-wrap gap-3">
            {[
              { color: 'bg-gray-600', label: 'Pending' },
              { color: 'bg-cyan-500', label: 'Ready' },
              { color: 'bg-primary-500', label: 'Running' },
              { color: 'bg-emerald-500', label: 'Completed' },
              { color: 'bg-red-500', label: 'Failed' },
              { color: 'bg-amber-500', label: 'Awaiting Approval' },
              { color: 'bg-orange-500', label: 'Blocked' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2 text-xs text-gray-400">
                <div className={`w-3 h-3 rounded ${color}`} />
                {label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
