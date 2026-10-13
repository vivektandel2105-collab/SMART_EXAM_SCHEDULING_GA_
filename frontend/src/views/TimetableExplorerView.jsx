import React, { useState, useEffect } from 'react';
import api, { formatApiError } from '../services/api';
import { 
  Calendar, 
  Download, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Activity, 
  Clock, 
  FileSpreadsheet, 
  Sliders, 
  Filter,
  ShieldCheck,
  RotateCcw,
  Zap,
  Info
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export default function TimetableExplorerView() {
  const [timetables, setTimetables] = useState([]);
  const [selectedTimetableId, setSelectedTimetableId] = useState(null);
  const [timetableDetail, setTimetableDetail] = useState(null);
  const [selectedVersionId, setSelectedVersionId] = useState(null);
  const [versionDetail, setVersionDetail] = useState(null);
  const [validationReport, setValidationReport] = useState(null);
  const [metricsHistory, setMetricsHistory] = useState([]);

  // Filter & Search
  const [dateFilter, setDateFilter] = useState('ALL');
  const [roomFilter, setRoomFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Generation Panel State
  const [showConfig, setShowConfig] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gaConfig, setGaConfig] = useState({
    timetable_name: 'Main Examination Timetable',
    academic_year: '2026-2027',
    population_size: 50,
    max_generations: 100,
    crossover_rate: 0.80,
    mutation_rate: 0.10,
    elite_count: 5,
    tournament_size: 5,
    random_seed: 42,
  });

  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchTimetables();
  }, []);

  useEffect(() => {
    if (selectedTimetableId) {
      fetchTimetableDetail(selectedTimetableId);
    }
  }, [selectedTimetableId]);

  useEffect(() => {
    if (selectedVersionId) {
      fetchVersionDetail(selectedVersionId);
      fetchValidationReport(selectedVersionId);
    }
  }, [selectedVersionId]);

  const fetchTimetables = async () => {
    setLoading(true);
    try {
      const res = await api.get('/timetables');
      const list = Array.isArray(res.data) ? res.data : [];
      setTimetables(list);
      if (list.length > 0 && !selectedTimetableId) {
        setSelectedTimetableId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch timetables:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimetableDetail = async (id) => {
    try {
      const res = await api.get(`/timetables/${id}`);
      setTimetableDetail(res.data);
      if (res.data.versions && res.data.versions.length > 0) {
        setSelectedVersionId(res.data.versions[0].id);
      } else {
        setSelectedVersionId(null);
        setVersionDetail(null);
        setValidationReport(null);
      }
    } catch (err) {
      console.error('Failed to fetch timetable detail:', err);
    }
  };

  const fetchVersionDetail = async (vId) => {
    try {
      const res = await api.get(`/timetables/versions/${vId}`);
      setVersionDetail(res.data);
    } catch (err) {
      console.error('Failed to fetch version detail:', err);
    }
  };

  const fetchValidationReport = async (vId) => {
    try {
      const res = await api.get(`/timetables/versions/${vId}/validate`);
      setValidationReport(res.data);
    } catch (err) {
      console.error('Failed to validate version:', err);
    }
  };

  const handleRunAlgorithm = async () => {
    setGenerating(true);
    setNotification(null);
    try {
      const res = await api.post('/scheduler/generate-sync', {
        ...gaConfig,
        timetable_id: selectedTimetableId || undefined,
      });

      setNotification({
        type: res.data.is_valid ? 'success' : 'warning',
        message: res.data.is_valid 
          ? `Valid timetable generated! Fitness: ${res.data.best_fitness.toFixed(2)}, Generations: ${res.data.generation}, Runtime: ${res.data.execution_time_ms}ms`
          : `Algorithm terminated. Final hard violations: ${res.data.hard_violations}. Runtime: ${res.data.execution_time_ms}ms`,
      });

      // Fetch run metrics for chart
      if (res.data.scheduler_run_id) {
        try {
          const mRes = await api.get(`/scheduler/runs/${res.data.scheduler_run_id}/metrics`);
          setMetricsHistory(mRes.data || []);
        } catch (_) {}
      }

      await fetchTimetables();
      if (res.data.timetable_id) {
        setSelectedTimetableId(res.data.timetable_id);
        await fetchTimetableDetail(res.data.timetable_id);
      }
      if (res.data.timetable_version_id) {
        setSelectedVersionId(res.data.timetable_version_id);
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: formatApiError(err) || 'Genetic algorithm scheduling failed.',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleExportCSV = () => {
    if (!selectedVersionId) {
      alert('No generated timetable version available to export.');
      return;
    }
    const token = localStorage.getItem('smartexam_token');
    // Direct browser fetch and trigger blob download to preserve auth and guarantee instant file download
    fetch(`/api/timetables/versions/${selectedVersionId}/export-csv`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(res => {
        if (!res.ok) throw new Error('CSV download request failed.');
        return res.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Exam_Timetable_${selectedVersionId.slice(0, 8)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch(err => {
        alert('Failed to download CSV: ' + err.message);
      });
  };

  // Assignments filter logic
  const rawAssignments = versionDetail?.assignments || [];
  const uniqueDates = Array.from(new Set(rawAssignments.map(a => a.exam_date).filter(Boolean))).sort();
  const uniqueRooms = Array.from(new Set(rawAssignments.map(a => a.room_number).filter(Boolean))).sort();

  const filteredAssignments = rawAssignments.filter(a => {
    if (dateFilter !== 'ALL' && a.exam_date !== dateFilter) return false;
    if (roomFilter !== 'ALL' && a.room_number !== roomFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const code = (a.subject_code || '').toLowerCase();
      const name = (a.subject_name || '').toLowerCase();
      const room = (a.room_number || '').toLowerCase();
      return code.includes(q) || name.includes(q) || room.includes(q);
    }
    return true;
  });

  // Sort assignments by Date then Start Time
  filteredAssignments.sort((a, b) => {
    const da = a.exam_date || '';
    const db = b.exam_date || '';
    if (da !== db) return da.localeCompare(db);
    return (a.start_time || a.session_name || '').localeCompare(b.start_time || b.session_name || '');
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-semibold ${
          notification.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : notification.type === 'warning'
            ? 'bg-amber-50 text-amber-800 border-amber-200'
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-4 underline font-bold">Dismiss</button>
        </div>
      )}

      {/* Top Bar: Action Buttons & Version Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Examination Timetable & Results</h1>
          <p className="text-xs text-slate-600">Inspect the Genetic Algorithm timetable, independent validation report, and export clash-free schedules</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {timetableDetail?.versions?.length > 1 && (
            <select
              value={selectedVersionId || ''}
              onChange={e => setSelectedVersionId(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
            >
              {timetableDetail.versions.map(v => (
                <option key={v.id} value={v.id}>
                  Version {v.version_number} (Hard Violations: {v.hard_violations})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => setShowConfig(!showConfig)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>GA Parameters</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={!selectedVersionId}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleRunAlgorithm}
            disabled={generating}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition active:scale-95"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${generating ? 'animate-spin' : ''}`} />
            <span>{generating ? 'Running GA...' : 'Run Genetic Algorithm'}</span>
          </button>
        </div>
      </div>

      {/* GA Parameter Panel */}
      {showConfig && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 animate-fadeIn text-xs">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-blue-600" /> Genetic Algorithm Parameters
            </h3>
            <span className="text-[11px] text-slate-500">Fine-tune population dynamics & stopping criteria</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-600 mb-1">Population Size</label>
              <input
                type="number"
                value={gaConfig.population_size}
                onChange={e => setGaConfig({ ...gaConfig, population_size: parseInt(e.target.value) || 50 })}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-semibold"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Max Generations</label>
              <input
                type="number"
                value={gaConfig.max_generations}
                onChange={e => setGaConfig({ ...gaConfig, max_generations: parseInt(e.target.value) || 100 })}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-semibold"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Crossover Rate</label>
              <input
                type="number"
                step="0.05"
                value={gaConfig.crossover_rate}
                onChange={e => setGaConfig({ ...gaConfig, crossover_rate: parseFloat(e.target.value) || 0.8 })}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-semibold"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Mutation Rate</label>
              <input
                type="number"
                step="0.01"
                value={gaConfig.mutation_rate}
                onChange={e => setGaConfig({ ...gaConfig, mutation_rate: parseFloat(e.target.value) || 0.1 })}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-semibold"
              />
            </div>
          </div>
        </div>
      )}

      {/* Independent Constraint Validation Badge & Summary Card */}
      {validationReport && (
        <div className={`p-5 rounded-2xl border ${
          validationReport.is_valid
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
            : 'bg-rose-50/80 border-rose-200 text-rose-950'
        } space-y-3 shadow-sm`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              {validationReport.is_valid ? (
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold">
                  <XCircle className="w-5 h-5" />
                </div>
              )}
              <div>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                  validationReport.is_valid ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
                }`}>
                  {validationReport.is_valid ? 'TIMETABLE VALID' : 'TIMETABLE INVALID'}
                </span>
                <h3 className="text-base font-bold tracking-tight">Independent Constraint Validator Output</h3>
              </div>
            </div>

            <div className="text-xs font-mono font-bold">
              Hard Violations: <span className={validationReport.is_valid ? 'text-emerald-700' : 'text-rose-700'}>{validationReport.total_hard_violations}</span>
            </div>
          </div>

          <p className="text-xs leading-relaxed font-medium">{validationReport.summary_message}</p>

          {/* Constraint Violation Breakdown Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-xs">
            <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/60">
              <div className="text-slate-500 text-[10px] uppercase font-bold">Student Conflicts</div>
              <div className="text-lg font-black text-slate-900">{validationReport.student_conflict_count}</div>
            </div>
            <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/60">
              <div className="text-slate-500 text-[10px] uppercase font-bold">Room Conflicts</div>
              <div className="text-lg font-black text-slate-900">{validationReport.room_conflict_count}</div>
            </div>
            <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/60">
              <div className="text-slate-500 text-[10px] uppercase font-bold">Capacity Deficits</div>
              <div className="text-lg font-black text-slate-900">{validationReport.capacity_violation_count}</div>
            </div>
            <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/60">
              <div className="text-slate-500 text-[10px] uppercase font-bold">Missing Exams</div>
              <div className="text-lg font-black text-slate-900">{validationReport.missing_exam_count}</div>
            </div>
            <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/60">
              <div className="text-slate-500 text-[10px] uppercase font-bold">Invalid Resources</div>
              <div className="text-lg font-black text-slate-900">{validationReport.invalid_assignment_count}</div>
            </div>
          </div>

          {/* Detailed Violation Log (if any) */}
          {validationReport.conflicts && validationReport.conflicts.length > 0 && (
            <div className="bg-white/90 rounded-xl p-3 border border-rose-200 space-y-1.5 text-xs max-h-36 overflow-y-auto">
              <div className="font-bold text-rose-800 text-[11px] uppercase tracking-wide">Specific Conflict Details:</div>
              {validationReport.conflicts.map((c, i) => (
                <div key={i} className="text-rose-700 flex items-start gap-1.5 text-[11px]">
                  <span className="font-mono font-bold">• [{c.constraint_type}]</span>
                  <span>{c.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Real GA Performance Metrics Banner */}
      {versionDetail && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" /> Genetic Algorithm Real Execution Performance
            </h3>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
              Status: {versionDetail.status}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
              <span className="text-slate-500 block text-[10px] font-bold uppercase">Scheduled Examinations</span>
              <span className="text-xl font-black text-slate-900">{filteredAssignments.length}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
              <span className="text-slate-500 block text-[10px] font-bold uppercase">Final Fitness / Cost</span>
              <span className="text-xl font-black text-slate-900">
                {versionDetail.fitness_score != null ? versionDetail.fitness_score.toFixed(2) : '0.00'}
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
              <span className="text-slate-500 block text-[10px] font-bold uppercase">Hard Violations</span>
              <span className={`text-xl font-black ${versionDetail.hard_violations === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {versionDetail.hard_violations}
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
              <span className="text-slate-500 block text-[10px] font-bold uppercase">Soft Penalty</span>
              <span className="text-xl font-black text-slate-900">{versionDetail.soft_violations}</span>
            </div>
          </div>
        </div>
      )}

      {/* Fitness Convergence Chart (if metrics available) */}
      {metricsHistory.length > 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" /> Fitness Convergence History (Per Generation)
            </h3>
            <span className="text-[11px] text-slate-500">Real algorithmic progression curve</span>
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metricsHistory} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="generation" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12, backgroundColor: '#ffffff', borderColor: '#e2e8f0' }} />
                <Line type="monotone" dataKey="best_fitness" stroke="#2563eb" strokeWidth={2} dot={false} name="Best Fitness" />
                <Line type="monotone" dataKey="hard_violations" stroke="#e11d48" strokeWidth={2} dot={false} name="Hard Violations" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-bold text-slate-700">Filter By:</span>
        </div>

        {/* Date Filter */}
        <select
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
        >
          <option value="ALL">All Exam Dates</option>
          {uniqueDates.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        {/* Room Filter */}
        <select
          value={roomFilter}
          onChange={e => setRoomFilter(e.target.value)}
          className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
        >
          <option value="ALL">All Rooms</option>
          {uniqueRooms.map(r => (
            <option key={r} value={r}>Room {r}</option>
          ))}
        </select>

        {/* Search */}
        <input
          type="text"
          placeholder="Search subject or room..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="ml-auto p-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 max-w-xs focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Generated Timetable Grid Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading timetable data...</div>
        ) : filteredAssignments.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-2">
            <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="font-bold text-slate-700 text-sm">No Timetable Generated Yet</div>
            <p>Click <strong>Run Genetic Algorithm</strong> above to optimize and generate a clash-free exam schedule.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-bold">Exam Date</th>
                  <th className="py-3 px-4 font-bold">Session & Time</th>
                  <th className="py-3 px-4 font-bold">Subject Code</th>
                  <th className="py-3 px-4 font-bold">Subject Name</th>
                  <th className="py-3 px-4 font-bold">Assigned Room</th>
                  <th className="py-3 px-4 font-bold text-right">Schedule Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAssignments.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                      {a.exam_date || 'TBD'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 mr-2">
                        {a.session_name || 'MORNING'}
                      </span>
                      <span className="text-slate-600 text-[11px] font-mono">
                        {a.start_time ? `${a.start_time} - ${a.end_time}` : ''}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                      {a.subject_code || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {a.subject_name || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-bold text-slate-900">Room {a.room_number || 'Unassigned'}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        validationReport?.is_valid
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {validationReport?.is_valid ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        <span>{validationReport?.is_valid ? 'Clash Free' : 'Violation'}</span>
                      </span>
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
