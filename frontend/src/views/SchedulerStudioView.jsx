import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { 
  Play, 
  Square, 
  Save, 
  CheckCircle, 
  AlertCircle, 
  Sliders, 
  Activity, 
  Cpu,
  RotateCcw
} from 'lucide-react';

export default function SchedulerStudioView() {
  const [config, setConfig] = useState({
    timetable_name: 'Fall 2026 Examination Schedule',
    academic_year: '2026-2027',
    population_size: 50,
    max_generations: 100,
    crossover_rate: 0.80,
    mutation_rate: 0.10,
    elite_count: 5,
    tournament_size: 5,
    random_seed: 42,
    time_limit_seconds: 60,
  });

  const [validationReport, setValidationReport] = useState(null);
  const [activeRunId, setActiveRunId] = useState(null);
  const [runStatus, setRunStatus] = useState('IDLE'); // IDLE, RUNNING, COMPLETED, CANCELLED, FAILED
  const [metricsHistory, setMetricsHistory] = useState([]);
  const [savedVersion, setSavedVersion] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    runPreValidation();
  }, []);

  // Poll status while running
  useEffect(() => {
    let interval = null;
    if (activeRunId && runStatus === 'RUNNING') {
      interval = setInterval(() => {
        pollRunMetrics(activeRunId);
      }, 500);
    }
    return () => clearInterval(interval);
  }, [activeRunId, runStatus]);

  const runPreValidation = async () => {
    try {
      const res = await api.post('/scheduler/validate');
      setValidationReport(res.data);
    } catch (err) {
      console.error('Validation check failed:', err);
    }
  };

  const handleStartGeneration = async () => {
    setLoading(true);
    setRunStatus('RUNNING');
    setMetricsHistory([]);
    setSavedVersion(null);

    try {
      const res = await api.post('/scheduler/generate', config);
      setActiveRunId(res.data.scheduler_run_id);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to start scheduler job.');
      setRunStatus('IDLE');
    } finally {
      setLoading(false);
    }
  };

  const pollRunMetrics = async (runId) => {
    try {
      const statusRes = await api.get(`/scheduler/runs/${runId}`);
      const metricsRes = await api.get(`/scheduler/runs/${runId}/metrics`);

      setRunStatus(statusRes.data.status);
      setMetricsHistory(metricsRes.data);
    } catch (err) {
      console.error('Metrics polling error:', err);
    }
  };

  const handleCancelRun = async () => {
    if (!activeRunId) return;
    try {
      await api.post(`/scheduler/runs/${activeRunId}/cancel`);
      setRunStatus('CANCELLED');
    } catch (err) {
      console.error('Cancel request failed:', err);
    }
  };

  const handleSaveTimetableVersion = async () => {
    if (!activeRunId) return;
    try {
      const res = await api.post(`/scheduler/runs/${activeRunId}/save-timetable`);
      setSavedVersion(res.data);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save timetable version.');
    }
  };

  const latestMetric = metricsHistory.length > 0 ? metricsHistory[metricsHistory.length - 1] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">GA Scheduler & Optimization Studio</h1>
        <p className="text-xs text-slate-600">Configure hyper-parameters, validate seating capacities, and monitor real-time convergence</p>
      </div>

      {/* Pre-scheduling Data Readiness Banner */}
      {validationReport && (
        <div className={`p-4 rounded-2xl border ${validationReport.is_valid ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'} flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
          <div className="flex items-center space-x-3">
            {validationReport.is_valid ? (
              <CheckCircle className="w-6 h-6 text-emerald-700 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-6 h-6 text-rose-600 flex-shrink-0" />
            )}
            <div className="text-xs">
              <div className={`font-bold ${validationReport.is_valid ? 'text-emerald-700' : 'text-rose-700'}`}>
                {validationReport.is_valid ? 'Dataset Capacity Validated & Ready for GA Scheduling' : 'Data Readiness Issues Detected'}
              </div>
              <div className="text-slate-600 mt-0.5">
                {validationReport.total_exams} Exams | {validationReport.total_available_slots} Slots | {validationReport.total_available_rooms} Rooms | Max Capacity: {validationReport.total_capacity_slots} Seats
              </div>
            </div>
          </div>
          <button
            onClick={runPreValidation}
            className="px-3 py-1.5 rounded-lg bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-semibold self-start sm:self-auto"
          >
            Re-validate Data
          </button>
        </div>
      )}

      {/* Main Grid: Config Panel + Real-Time Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Config Panel */}
        <div className="p-6 rounded-2xl glass-panel space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center">
            <Sliders className="w-5 h-5 mr-2 text-indigo-600" /> Hyper-Parameter Setup
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 mb-1">Timetable Name</label>
              <input
                type="text"
                value={config.timetable_name}
                onChange={e => setConfig({ ...config, timetable_name: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-600 mb-1">Population Size</label>
                <input
                  type="number"
                  value={config.population_size}
                  onChange={e => setConfig({ ...config, population_size: parseInt(e.target.value) || 50 })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Max Generations</label>
                <input
                  type="number"
                  value={config.max_generations}
                  onChange={e => setConfig({ ...config, max_generations: parseInt(e.target.value) || 100 })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-600 mb-1">Crossover Rate</label>
                <input
                  type="number"
                  step="0.05"
                  value={config.crossover_rate}
                  onChange={e => setConfig({ ...config, crossover_rate: parseFloat(e.target.value) || 0.80 })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Mutation Rate</label>
                <input
                  type="number"
                  step="0.01"
                  value={config.mutation_rate}
                  onChange={e => setConfig({ ...config, mutation_rate: parseFloat(e.target.value) || 0.10 })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-600 mb-1">Random Seed</label>
                <input
                  type="number"
                  value={config.random_seed ?? ''}
                  onChange={e => setConfig({ ...config, random_seed: parseInt(e.target.value) || undefined })}
                  placeholder="Auto"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Time Limit (s)</label>
                <input
                  type="number"
                  value={config.time_limit_seconds}
                  onChange={e => setConfig({ ...config, time_limit_seconds: parseInt(e.target.value) || 60 })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 space-y-2">
            {runStatus === 'RUNNING' ? (
              <button
                onClick={handleCancelRun}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-lg flex items-center justify-center space-x-2"
              >
                <Square className="w-4 h-4" />
                <span>Cancel Optimization Run</span>
              </button>
            ) : (
              <button
                onClick={handleStartGeneration}
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 flex items-center justify-center space-x-2 transition disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Launch GA Optimization</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Real-Time Charts & Diagnostics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress & Diagnostics Header */}
          <div className="p-6 rounded-2xl glass-panel">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-indigo-600" /> Optimization Diagnostics
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                runStatus === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20' :
                runStatus === 'RUNNING' ? 'bg-amber-500/10 text-amber-700 border border-amber-500/20 animate-pulse' :
                'bg-slate-500/10 text-slate-600'
              }`}>
                Status: {runStatus}
              </span>
            </div>

            {/* Metrics Live Stat Cards */}
            <div className="grid grid-cols-3 gap-4 text-center font-mono text-xs mb-6">
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200">
                <div className="text-slate-600">Generations</div>
                <div className="text-xl font-extrabold text-slate-900">{latestMetric ? latestMetric.generation : 0}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200">
                <div className="text-slate-600">Hard Violations</div>
                <div className={`text-xl font-extrabold ${latestMetric && latestMetric.hard_violations === 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {latestMetric ? latestMetric.hard_violations : 0}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200">
                <div className="text-slate-600">Soft Penalty</div>
                <div className="text-xl font-extrabold text-indigo-700">
                  {latestMetric ? latestMetric.soft_penalty : 0}
                </div>
              </div>
            </div>

            {/* Convergence Graph */}
            <div className="h-64 w-full">
              {metricsHistory.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                  Launch a run to view live generation convergence curves.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metricsHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />
                    <XAxis dataKey="generation" stroke="#64748B" fontSize={10} />
                    <YAxis stroke="#64748B" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', borderRadius: '8px', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line type="monotone" dataKey="hard_violations" name="Hard Violations" stroke="#f43f5e" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="soft_penalty" name="Soft Penalty Cost" stroke="#818cf8" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Save Version Bar */}
            {runStatus === 'COMPLETED' && (
              <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
                <div className="text-xs text-emerald-700 font-semibold flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1.5" /> Zero Hard-Constraint Violations Achieved!
                </div>

                <button
                  onClick={handleSaveTimetableVersion}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-500/25 flex items-center space-x-2 transition"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Timetable Version</span>
                </button>
              </div>
            )}

            {savedVersion && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-mono">
                Saved as Timetable Version v{savedVersion.version_number} (ID: {savedVersion.timetable_version_id.substring(0, 8)}...) with {savedVersion.total_assignments} assignments.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
