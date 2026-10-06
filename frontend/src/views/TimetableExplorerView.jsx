import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Calendar, 
  Lock, 
  Unlock, 
  GitCompare, 
  UserCheck, 
  Download, 
  CheckCircle, 
  Send, 
  Globe, 
  Filter,
  Eye,
  FileSpreadsheet
} from 'lucide-react';

export default function TimetableExplorerView() {
  const [timetables, setTimetables] = useState([]);
  const [selectedTimetableId, setSelectedTimetableId] = useState(null);
  const [timetableDetail, setTimetableDetail] = useState(null);
  const [selectedVersionId, setSelectedVersionId] = useState(null);
  const [versionDetail, setVersionDetail] = useState(null);

  // Version compare state
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareV1, setCompareV1] = useState('');
  const [compareV2, setCompareV2] = useState('');
  const [compareResult, setCompareResult] = useState(null);

  const [loading, setLoading] = useState(false);

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

  const handleToggleLock = async (assignmentId, currentLocked) => {
    try {
      await api.post(`/timetables/assignments/${assignmentId}/lock`, { is_locked: !currentLocked });
      if (selectedVersionId) fetchVersionDetail(selectedVersionId);
    } catch (err) {
      alert(err.response?.data?.detail || 'Lock toggle failed.');
    }
  };

  const handleAutoInvigilate = async () => {
    if (!selectedVersionId) return;
    try {
      const res = await api.post(`/timetables/versions/${selectedVersionId}/auto-invigilate`);
      alert(res.data.message);
      fetchVersionDetail(selectedVersionId);
    } catch (err) {
      alert(err.response?.data?.detail || 'Auto-invigilation failed.');
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedTimetableId) return;
    try {
      await api.post(`/timetables/${selectedTimetableId}/status`, { status: newStatus });
      fetchTimetables();
      fetchTimetableDetail(selectedTimetableId);
    } catch (err) {
      alert(err.response?.data?.detail || 'Status update failed.');
    }
  };

  const handleRunCompare = async () => {
    if (!compareV1 || !compareV2) return alert('Select two versions to compare.');
    try {
      const res = await api.get(`/timetables/versions/compare?v1_id=${compareV1}&v2_id=${compareV2}`);
      setCompareResult(res.data);
    } catch (err) {
      alert(err.response?.data?.detail || 'Comparison failed.');
    }
  };

  const handleExportExcel = () => {
    if (!selectedVersionId) return;
    window.open(`/api/timetables/versions/${selectedVersionId}/export`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Timetable Explorer & Version Manager</h1>
          <p className="text-xs text-slate-600">View matrix grids, lock manual assignments, compare versions, and publish</p>
        </div>

        {timetableDetail && (
          <div className="flex items-center space-x-2">
            {timetableDetail.status === 'DRAFT' && (
              <button
                onClick={() => handleStatusChange('UNDER_REVIEW')}
                className="px-3 py-2 rounded-xl bg-amber-600/20 text-amber-700 border border-amber-500/30 text-xs font-semibold flex items-center"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" /> Submit for Review
              </button>
            )}
            {['DRAFT', 'UNDER_REVIEW'].includes(timetableDetail.status) && (
              <button
                onClick={() => handleStatusChange('APPROVED')}
                className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center"
              >
                <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Approve Timetable
              </button>
            )}
            {timetableDetail.status === 'APPROVED' && (
              <button
                onClick={() => handleStatusChange('PUBLISHED')}
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center shadow-lg shadow-emerald-500/20"
              >
                <Globe className="w-3.5 h-3.5 mr-1.5" /> Publish Timetable
              </button>
            )}
          </div>
        )}
      </div>

      {/* Selectors Bar */}
      <div className="p-4 rounded-2xl glass-panel flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <span className="text-xs text-slate-600 font-semibold uppercase tracking-wider">Timetable:</span>
          <select
            value={selectedTimetableId || ''}
            onChange={(e) => setSelectedTimetableId(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none"
          >
            {timetables.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.status})
              </option>
            ))}
          </select>
        </div>

        {timetableDetail && timetableDetail.versions && timetableDetail.versions.length > 0 && (
          <div className="flex items-center space-x-3">
            <span className="text-xs text-slate-600 font-semibold uppercase tracking-wider">Version:</span>
            <select
              value={selectedVersionId || ''}
              onChange={(e) => setSelectedVersionId(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-indigo-700 font-bold focus:outline-none"
            >
              {timetableDetail.versions.map((v) => (
                <option key={v.id} value={v.id}>
                  v{v.version_number} (Fitness: {v.fitness_score ?? 'N/A'}, HC: {v.hard_violations})
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                setShowCompareModal(true);
                setCompareV1(timetableDetail.versions[0]?.id || '');
                setCompareV2(timetableDetail.versions[1]?.id || '');
              }}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center"
            >
              <GitCompare className="w-3.5 h-3.5 mr-1.5 text-indigo-600" /> Compare Diffs
            </button>

            <button
              onClick={handleAutoInvigilate}
              className="px-3 py-2 rounded-xl bg-purple-600/20 text-purple-700 border border-purple-500/30 text-xs font-semibold flex items-center"
            >
              <UserCheck className="w-3.5 h-3.5 mr-1.5" /> Auto-Invigilate
            </button>

            <button
              onClick={handleExportExcel}
              className="px-3 py-2 rounded-xl bg-emerald-600/20 text-emerald-700 border border-emerald-500/30 text-xs font-semibold flex items-center"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" /> Export Excel
            </button>
          </div>
        )}
      </div>

      {/* Main Grid View */}
      <div className="p-6 rounded-2xl glass-panel">
        {!versionDetail ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No timetable version selected. Create or generate a timetable run first.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900">
                Exam Assignment Grid ({versionDetail.assignments.length} Total Exams)
              </span>
              <span className="text-slate-600">
                Click lock icon to preserve assignment in future optimization runs
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-600 uppercase tracking-wider bg-slate-50/80 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Lock</th>
                    <th className="px-4 py-3">Subject Code</th>
                    <th className="px-4 py-3">Subject Name</th>
                    <th className="px-4 py-3">Exam Date</th>
                    <th className="px-4 py-3">Session</th>
                    <th className="px-4 py-3">Assigned Room</th>
                    <th className="px-4 py-3">Invigilator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 font-mono">
                  {versionDetail.assignments.map((a) => (
                    <tr key={a.id} className={a.is_locked ? 'bg-amber-500/5' : 'hover:bg-slate-800/40'}>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleLock(a.id, a.is_locked)}
                          className={`p-1.5 rounded-lg transition ${
                            a.is_locked
                              ? 'bg-amber-500/20 text-amber-700 border border-amber-500/30'
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                          title={a.is_locked ? 'Locked assignment' : 'Click to lock'}
                        >
                          {a.is_locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-semibold text-indigo-700">{a.subject_code || 'N/A'}</td>
                      <td className="px-4 py-3 text-slate-900 font-sans">{a.subject_name || 'N/A'}</td>
                      <td className="px-4 py-3 text-slate-700">{a.exam_date || 'Unassigned'}</td>
                      <td className="px-4 py-3 text-purple-700">{a.session_name || 'N/A'}</td>
                      <td className="px-4 py-3 text-emerald-700 font-semibold">{a.room_number || 'Unassigned'}</td>
                      <td className="px-4 py-3 text-slate-700 font-sans">{a.faculty_name || 'Unassigned'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Version Comparison Modal */}
      {showCompareModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 w-full max-w-2xl shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center">
              <GitCompare className="w-5 h-5 mr-2 text-indigo-600" /> Compare Timetable Version Diffs
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-600 mb-1">Version A (Baseline)</label>
                <select
                  value={compareV1}
                  onChange={(e) => setCompareV1(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold"
                >
                  {timetableDetail.versions.map((v) => (
                    <option key={v.id} value={v.id}>
                      v{v.version_number}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Version B (Target)</label>
                <select
                  value={compareV2}
                  onChange={(e) => setCompareV2(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold"
                >
                  {timetableDetail.versions.map((v) => (
                    <option key={v.id} value={v.id}>
                      v{v.version_number}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleRunCompare}
              className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md"
            >
              Analyze Version Differences
            </button>

            {compareResult && (
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 font-mono text-xs">
                <div className="font-bold text-indigo-700">Diff Summary:</div>
                <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                  <div className="p-2 rounded bg-emerald-500/10 text-emerald-700">Added: {compareResult.summary.total_added}</div>
                  <div className="p-2 rounded bg-rose-500/10 text-rose-600">Removed: {compareResult.summary.total_removed}</div>
                  <div className="p-2 rounded bg-amber-500/10 text-amber-700">Modified: {compareResult.summary.total_modified}</div>
                  <div className="p-2 rounded bg-slate-100 text-slate-600">Unchanged: {compareResult.summary.total_unchanged}</div>
                </div>

                {compareResult.modified.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-slate-600 font-semibold">Modified Assignments:</div>
                    {compareResult.modified.map((mod, idx) => (
                      <div key={idx} className="p-2 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-700">
                        Exam ID: {mod.exam_id.substring(0, 8)}... - Changes: {JSON.stringify(mod.changes)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  setShowCompareModal(false);
                  setCompareResult(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
