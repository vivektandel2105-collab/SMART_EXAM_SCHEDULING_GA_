import React, { useState, useEffect } from 'react';
import api, { formatApiError } from '../services/api';
import { 
  BookOpen, 
  DoorOpen, 
  CalendarDays, 
  Users, 
  Play, 
  DatabaseZap, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Activity, 
  ArrowRight,
  RefreshCw,
  Sliders,
  ShieldCheck,
  Calendar,
  Trash2
} from 'lucide-react';

export default function DashboardView({ setActiveView }) {
  const [stats, setStats] = useState({
    totalExams: 0,
    totalRooms: 0,
    totalSlots: 0,
    totalStudents: 0,
    totalEnrollments: 0,
    maxRoomCapacity: 0,
  });

  const [validationReport, setValidationReport] = useState(null);
  const [recentRuns, setRecentRuns] = useState([]);
  const [latestRun, setLatestRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [valRes, subsRes, rmsRes, slotsRes, stdsRes, runsRes, enrRes] = await Promise.allSettled([
        api.post('/scheduler/validate'),
        api.get('/subjects'),
        api.get('/rooms'),
        api.get('/exam-slots'),
        api.get('/students'),
        api.get('/scheduler/runs?limit=5'),
        api.get('/students/enrollments/all'),
      ]);

      const valData = valRes.status === 'fulfilled' ? valRes.value.data : null;
      setValidationReport(valData);

      const subjects = subsRes.status === 'fulfilled' ? subsRes.value.data : [];
      const rooms = rmsRes.status === 'fulfilled' ? rmsRes.value.data : [];
      const slots = slotsRes.status === 'fulfilled' ? slotsRes.value.data : [];
      const students = stdsRes.status === 'fulfilled' ? stdsRes.value.data : [];
      const runs = runsRes.status === 'fulfilled' ? runsRes.value.data : [];
      const enrollments = enrRes.status === 'fulfilled' ? enrRes.value.data : [];

      setStats({
        totalExams: valData?.total_exams ?? (Array.isArray(subjects) ? subjects.length : 0),
        totalRooms: valData?.total_available_rooms ?? (Array.isArray(rooms) ? rooms.length : 0),
        totalSlots: valData?.total_available_slots ?? (Array.isArray(slots) ? slots.length : 0),
        totalStudents: Array.isArray(students) ? students.length : 0,
        totalEnrollments: Array.isArray(enrollments) ? enrollments.length : 0,
        maxRoomCapacity: valData?.max_room_capacity ?? 0,
      });

      if (Array.isArray(runs) && runs.length > 0) {
        setRecentRuns(runs);
        setLatestRun(runs[0]);
      } else {
        setRecentRuns([]);
        setLatestRun(null);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSampleData = async () => {
    if (!window.confirm('Load sample problem data? This will populate 10 subjects, 5 rooms, 200 students, and 5 examination days.')) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.post('/scheduler/sample-data');
      setNotification({
        type: 'success',
        message: 'Sample dataset loaded successfully! (10 Subjects, 5 Rooms, 200 Students, 10 Slots)',
      });
      await fetchDashboardData();
    } catch (err) {
      setNotification({
        type: 'error',
        message: formatApiError(err) || 'Failed to seed sample dataset.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearAllData = async () => {
    if (!window.confirm('Delete ALL loaded academic data (subjects, exams, rooms, slots, students, and timetables)? This will clear the scheduling dataset.')) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.post('/scheduler/clear-data');
      setNotification({
        type: 'success',
        message: res.data.message || 'All loaded academic scheduling data has been deleted.',
      });
      await fetchDashboardData();
    } catch (err) {
      setNotification({
        type: 'error',
        message: formatApiError(err) || 'Failed to clear scheduling data.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuickGenerate = () => {
    setActiveView('timetables');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-semibold ${
          notification.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-4 underline font-bold">Dismiss</button>
        </div>
      )}

      {/* Top Banner: Workflow Overview & Fast Actions */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-bold tracking-wide uppercase">
            <Activity className="w-3.5 h-3.5" /> AI Genetic Algorithm Engine
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Automated Exam Timetable Scheduling
          </h1>
          <p className="text-sm md:text-base text-slate-300 leading-relaxed">
            Eliminate student exam clashes, room overbooking, and capacity bottlenecks using an optimized Genetic Algorithm with independent constraint verification.
          </p>

          <div className="pt-3 flex flex-wrap items-center gap-3">
            <button
              onClick={handleQuickGenerate}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/20 transition-transform active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Generate Timetable</span>
            </button>

            <button
              onClick={handleLoadSampleData}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 backdrop-blur-md transition active:scale-95"
            >
              <DatabaseZap className="w-4 h-4 text-emerald-400" />
              <span>{actionLoading ? 'Loading Sample...' : 'Load Sample Data'}</span>
            </button>

            <button
              onClick={handleClearAllData}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-bold text-sm border border-rose-400/30 backdrop-blur-md transition active:scale-95"
              title="Delete all loaded academic data"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Delete All Data</span>
            </button>

            <button
              onClick={fetchDashboardData}
              className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition"
              title="Refresh Stats"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Cards: Real Input Data Counts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Examinations */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Examinations</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{stats.totalExams}</div>
          <div className="text-xs text-slate-500 mt-1">Required exam subjects</div>
        </div>

        {/* Available Rooms */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Exam Rooms</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <DoorOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{stats.totalRooms}</div>
          <div className="text-xs text-slate-500 mt-1">Max capacity: {stats.maxRoomCapacity} seats</div>
        </div>

        {/* Available Time Slots */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Time Slots</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{stats.totalSlots}</div>
          <div className="text-xs text-slate-500 mt-1">Configured exam sessions</div>
        </div>

        {/* Students Enrolled */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Students</span>
            <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{stats.totalStudents}</div>
          <div className="text-xs text-slate-500 mt-1">{stats.totalEnrollments} subject enrollments</div>
        </div>
      </div>

      {/* Dataset Readiness Banner */}
      {validationReport && (
        <div className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          validationReport.is_valid
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
            : 'bg-amber-50/70 border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-start gap-3">
            {validationReport.is_valid ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <div className="text-sm font-bold">
                {validationReport.is_valid
                  ? 'Dataset Readiness Verified — Capacity & Resources Ready'
                  : 'Scheduling Readiness Warning'}
              </div>
              <div className="text-xs text-slate-600 mt-1">
                {validationReport.is_valid
                  ? `Total scheduling slots: ${validationReport.total_capacity_slots} room-slots available for ${validationReport.total_exams} examinations.`
                  : validationReport.errors?.join('; ') || validationReport.warnings?.join('; ')}
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveView('data')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-bold shadow-sm hover:bg-slate-50 self-start md:self-auto"
          >
            <span>Manage Input Data</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Scheduling Status & Recent History */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent Genetic Algorithm Runs</h2>
            <p className="text-xs text-slate-500">History of optimization runs and convergence states</p>
          </div>
          <button
            onClick={() => setActiveView('timetables')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>View Full Timetable</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentRuns.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-xs">
            No algorithm runs recorded yet. Click <strong>Generate Timetable</strong> above to start optimization.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Run ID</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                  <th className="py-2.5 px-3 font-semibold">Random Seed</th>
                  <th className="py-2.5 px-3 font-semibold">Started</th>
                  <th className="py-2.5 px-3 font-semibold">Completed</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentRuns.map((run) => (
                  <tr key={run.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                      {run.id.slice(0, 8)}...
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        run.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : run.status === 'RUNNING'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse'
                          : run.status === 'CANCELLED'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {run.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{run.random_seed ?? 'Auto'}</td>
                    <td className="py-2.5 px-3 text-slate-500">{run.started_at ? new Date(run.started_at).toLocaleTimeString() : 'N/A'}</td>
                    <td className="py-2.5 px-3 text-slate-500">{run.completed_at ? new Date(run.completed_at).toLocaleTimeString() : 'In Progress'}</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => setActiveView('timetables')}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px]"
                      >
                        Inspect
                      </button>
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
