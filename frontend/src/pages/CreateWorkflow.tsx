import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Zap, Bot, Lightbulb, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import { workflowsApi } from '../services/api';

const EXAMPLE_OBJECTIVES = [
  {
    title: '👤 Employee Onboarding',
    text: 'Onboard a new employee named Rahul. Create an employee record, prepare an onboarding email, request manager approval before sending it, and assign mandatory training.',
  },
  {
    title: '🔄 Failure Recovery Demo',
    text: 'Create an employee record for Sarah and assign training with retry simulation to demonstrate automatic failure detection and recovery.',
  },
  {
    title: '📧 Communication Workflow',
    text: 'Onboard a new employee named Alex. Set up employee profile, draft welcome email, get approval from HR manager, and enroll in orientation training.',
  },
];

export default function CreateWorkflow() {
  const navigate = useNavigate();
  const [objective, setObjective] = useState('');
  const [mode, setMode] = useState<'demo' | 'ai'>('demo');
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!objective.trim() || objective.trim().length < 10) {
      setError('Please enter a more detailed objective (at least 10 characters).');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const wf = await workflowsApi.create(objective.trim(), mode);
      await workflowsApi.start(wf.id, simulateFailure);
      navigate(`/workflows/${wf.id}`);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to create workflow. Is the backend running?');
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Create Workflow</h1>
        <p className="text-gray-400 mt-1">
          Describe your objective in plain language. The AI will plan and execute it automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="card space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Workflow Objective
              </label>
              <textarea
                id="objective-input"
                value={objective}
                onChange={e => setObjective(e.target.value)}
                placeholder="Describe what you want to accomplish in natural language..."
                rows={6}
                className="input resize-none text-sm"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                {objective.length} characters | Min 10 required
              </p>
            </div>

            {/* Execution Mode */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Execution Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMode('demo')}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    mode === 'demo'
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-surface-500 hover:border-surface-400'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Bot size={16} className={mode === 'demo' ? 'text-primary-400' : 'text-gray-500'} />
                    <span className="font-semibold text-sm text-white">Demo Mode</span>
                  </div>
                  <p className="text-xs text-gray-400">Deterministic templates. No API key required.</p>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('ai')}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    mode === 'ai'
                      ? 'border-accent-purple/70 bg-purple-500/10'
                      : 'border-surface-500 hover:border-surface-400'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Zap size={16} className={mode === 'ai' ? 'text-purple-400' : 'text-gray-500'} />
                    <span className="font-semibold text-sm text-white">AI Mode</span>
                  </div>
                  <p className="text-xs text-gray-400">Claude-powered planning. API key required.</p>
                </button>
              </div>
            </div>

            {/* Demo options */}
            <div className="flex items-center gap-3 p-3 bg-surface-700 rounded-lg border border-surface-600">
              <input
                id="simulate-failure"
                type="checkbox"
                checked={simulateFailure}
                onChange={e => setSimulateFailure(e.target.checked)}
                className="w-4 h-4 rounded accent-primary-500"
                disabled={loading}
              />
              <label htmlFor="simulate-failure" className="text-sm text-gray-300 cursor-pointer">
                Simulate task failure (demonstrates retry & recovery mechanism)
              </label>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-900/20 border border-red-600/30 rounded-lg">
                <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <button
              id="create-workflow-btn"
              type="submit"
              disabled={loading || objective.trim().length < 10}
              className="btn-primary w-full justify-center py-3"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating & Starting Workflow...
                </>
              ) : (
                <>
                  <Play size={18} />
                  Create & Start Workflow
                </>
              )}
            </button>
          </form>
        </div>

        {/* Example Suggestions */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-300">
            <Lightbulb size={16} className="text-amber-400" />
            Example Objectives
          </div>

          {EXAMPLE_OBJECTIVES.map((ex, i) => (
            <button
              key={i}
              onClick={() => setObjective(ex.text)}
              className="w-full text-left card-hover p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">{ex.title}</span>
                <ChevronRight size={14} className="text-gray-500" />
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{ex.text.slice(0, 100)}...</p>
            </button>
          ))}

          <div className="card border-surface-500 p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              How it works
            </h3>
            <ol className="space-y-2">
              {[
                'Planner Agent understands your objective',
                'Tasks are generated with dependencies',
                'Executor runs each task in order',
                'Approvals pause execution for review',
                'Recovery agent handles failures',
                'Complete audit trail maintained',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                  <span className="flex-shrink-0 w-4 h-4 rounded-full bg-primary-600/30 text-primary-400 flex items-center justify-center text-xs font-bold mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
