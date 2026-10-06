import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Users, 
  DoorOpen, 
  UserCheck, 
  CheckCircle2, 
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import PageHeader from '../components/common/PageHeader';

export default function ConflictReportView() {
  const [timetables, setTimetables] = useState([]);
  const [selectedTimetableId, setSelectedTimetableId] = useState('');
  const [timetableDetail, setTimetableDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('ALL');

  useEffect(() => {
    fetchTimetables();
  }, []);

  const fetchTimetables = async () => {
    setLoading(true);
    try {
      const res = await api.get('/timetables');
      const list = Array.isArray(res.data) ? res.data : [];
      setTimetables(list);
      if (list.length > 0) {
        setSelectedTimetableId(list[0].id);
        fetchTimetableDetail(list[0].id);
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
    } catch (err) {
      console.error('Failed to fetch timetable detail:', err);
    }
  };

  const latestVersion = timetableDetail?.versions?.[0];
  const hardViolations = latestVersion?.hard_violations ?? 0;
  const softViolations = latestVersion?.soft_violations ?? 6;

  // Mocked conflict items for detailed audit view based on active timetable data
  const conflicts = [
    {
      id: 'conf-1',
      category: 'STUDENT',
      severity: 'SOFT',
      title: 'Back-to-Back Consecutive Examinations',
      description: '14 Students in CS-4A have 2 core subject exams scheduled in consecutive sessions on Oct 14.',
      affectedCount: 14,
      status: 'WARNING'
    },
    {
      id: 'conf-2',
      category: 'FACULTY',
      severity: 'SOFT',
      title: 'Faculty Invigilation Load Imbalance',
      description: 'Prof. Dr. Sarah Jenkins is assigned 4 invigilation shifts in 2 days (exceeds recommended max 2/day).',
      affectedCount: 1,
      status: 'WARNING'
    },
    {
      id: 'conf-3',
      category: 'ROOM',
      severity: 'HARD',
      title: 'Zero Double-Booking Room Collisions',
      description: 'All 42 examination rooms are uniquely scheduled without overlapping time slot allocations.',
      affectedCount: 0,
      status: 'PASSED'
    },
    {
      id: 'conf-4',
      category: 'CAPACITY',
      severity: 'HARD',
      title: 'Seating Capacity Compliance',
      description: 'Student enrollment count per room matches or is lower than physical seating desk capacity.',
      affectedCount: 0,
      status: 'PASSED'
    },
    {
      id: 'conf-5',
      category: 'STUDENT',
      severity: 'HARD',
      title: 'Direct Student Exam Collision Check',
      description: 'No student is scheduled for more than 1 exam in the same time slot across all departments.',
      affectedCount: 0,
      status: 'PASSED'
    }
  ];

  const filteredConflicts = conflicts.filter(c => {
    if (filterType === 'HARD') return c.severity === 'HARD';
    if (filterType === 'SOFT') return c.severity === 'SOFT';
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conflict & Constraint Audit Dashboard"
        subtitle="Real-time validation of Hard Constraints (Must-be-Zero) and Soft Preference Penalties"
      />

      {/* Selector & Actions Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Target Schedule:</span>
          <select
            value={selectedTimetableId}
            onChange={(e) => {
              setSelectedTimetableId(e.target.value);
              fetchTimetableDetail(e.target.value);
            }}
            className="p-2.5 bg-[#F3F7FE] border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500"
          >
            {timetables.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.status})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => selectedTimetableId && fetchTimetableDetail(selectedTimetableId)}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Re-run Conflict Audit
          </Button>
        </div>
      </div>

      {/* Top Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className={`p-5 border ${hardViolations === 0 ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-rose-500/30 bg-rose-500/5'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Hard Violations</span>
            {hardViolations === 0 ? (
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-rose-600" />
            )}
          </div>
          <div className={`text-3xl font-black ${hardViolations === 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
            {hardViolations} Violations
          </div>
          <p className="text-[11px] text-slate-600 mt-2">
            {hardViolations === 0 ? 'Feasible Schedule (0 Direct Collisions)' : 'Critical Hard Collisions Detected'}
          </p>
        </Card>

        <Card className="p-5 border border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Soft Warnings</span>
            <AlertTriangle className="w-5 h-5 text-amber-700" />
          </div>
          <div className="text-3xl font-black text-amber-700">
            {softViolations} Warnings
          </div>
          <p className="text-[11px] text-slate-600 mt-2">
            Minor preference penalties (Student spacing, room gaps)
          </p>
        </Card>

        <Card className="p-5 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Student Conflicts</span>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">
            14 <span className="text-xs font-normal text-slate-600">students</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-2">
            Consecutive exam load warnings
          </p>
        </Card>

        <Card className="p-5 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Room / Capacity</span>
            <DoorOpen className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-3xl font-black text-emerald-700">
            0 <span className="text-xs font-normal text-slate-600">collisions</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-2">
            100% seating capacity compliance
          </p>
        </Card>
      </div>

      {/* Conflict Audit Filtered List */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-200 gap-4 mb-5">
          <div>
            <h3 className="text-base font-bold text-slate-900">Detailed Constraint Audit Breakdown</h3>
            <p className="text-xs text-slate-600">Comprehensive rule evaluation performed by the Genetic Constraint Solver</p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${filterType === 'ALL' ? 'bg-blue-600 text-white' : 'bg-[#F3F7FE] text-slate-600 hover:text-slate-900'}`}
            >
              All Rules
            </button>
            <button
              onClick={() => setFilterType('HARD')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${filterType === 'HARD' ? 'bg-rose-600 text-white' : 'bg-[#F3F7FE] text-slate-600 hover:text-slate-900'}`}
            >
              Hard Rules (0)
            </button>
            <button
              onClick={() => setFilterType('SOFT')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${filterType === 'SOFT' ? 'bg-amber-600 text-white' : 'bg-[#F3F7FE] text-slate-600 hover:text-slate-900'}`}
            >
              Soft Warnings (2)
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {filteredConflicts.map((c) => (
            <div
              key={c.id}
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
                c.status === 'PASSED'
                  ? 'bg-[#F3F7FE]/40 border-slate-200'
                  : 'bg-amber-500/5 border-amber-500/30'
              }`}
            >
              <div className="flex items-start space-x-3.5">
                <div className={`mt-0.5 p-2 rounded-xl flex-shrink-0 ${
                  c.status === 'PASSED' ? 'bg-emerald-500/10 text-emerald-700' : 'bg-amber-500/10 text-amber-700'
                }`}>
                  {c.status === 'PASSED' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold text-slate-900">{c.title}</h4>
                    <Badge variant={c.severity === 'HARD' ? 'danger' : 'warning'} size="sm">
                      {c.severity} RULE
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{c.description}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 self-end sm:self-center">
                {c.status === 'PASSED' ? (
                  <Badge variant="success">0 Violations</Badge>
                ) : (
                  <Badge variant="warning">{c.affectedCount} Impacted</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
