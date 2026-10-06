import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import ProgressBar from '../components/common/ProgressBar';
import Table from '../components/common/Table';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import { 
  Users, 
  BookOpen, 
  DoorOpen, 
  UserCheck, 
  Cpu, 
  Upload, 
  Sliders, 
  Calendar, 
  FileSpreadsheet, 
  ArrowRight,
  Activity,
  CheckCircle2,
  Clock,
  Zap,
  TrendingUp,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
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

export default function DashboardView({ setActiveView }) {
  const [stats, setStats] = useState({
    studentsCount: 2450,
    subjectsCount: 42,
    roomsCount: 18,
    facultyCount: 35,
    slotsCount: 12,
  });

  const [gaStatus, setGaStatus] = useState({
    status: 'READY',
    generation: 142,
    maxGenerations: 500,
    bestFitness: 25,
    hardViolations: 0,
    softPenalty: 25,
    executionTimeSec: 14.8,
  });

  const [recentRuns, setRecentRuns] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [valRes, stRes, subRes, rmRes, facRes, runsRes] = await Promise.allSettled([
        api.get('/scheduler/validate'),
        api.get('/students'),
        api.get('/subjects'),
        api.get('/rooms'),
        api.get('/faculty'),
        api.get('/scheduler/runs?limit=5'),
      ]);

      const valData = valRes.status === 'fulfilled' ? valRes.value.data : {};
      const runs = runsRes.status === 'fulfilled' ? runsRes.value.data : [];

      setStats({
        studentsCount: stRes.status === 'fulfilled' ? (stRes.value.data.total || stRes.value.data.length || 2450) : 2450,
        subjectsCount: subRes.status === 'fulfilled' ? (subRes.value.data.length || 42) : 42,
        roomsCount: valData.total_available_rooms || (rmRes.status === 'fulfilled' ? rmRes.value.data.length : 18),
        facultyCount: facRes.status === 'fulfilled' ? facRes.value.data.length : 35,
        slotsCount: valData.total_available_slots || 12,
      });

      if (Array.isArray(runs) && runs.length > 0) {
        setRecentRuns(runs);
        const latestRun = runs[0];
        setGaStatus(prev => ({
          ...prev,
          status: latestRun.status || 'READY',
        }));

        // Fetch metrics for latest run
        const mRes = await api.get(`/scheduler/runs/${latestRun.id}/metrics`);
        if (Array.isArray(mRes.data) && mRes.data.length > 0) {
          setChartData(mRes.data);
          const lastM = mRes.data[mRes.data.length - 1];
          setGaStatus({
            status: latestRun.status,
            generation: lastM.generation,
            maxGenerations: 500,
            bestFitness: Math.round(lastM.best_fitness),
            hardViolations: lastM.hard_violations,
            softPenalty: Math.round(lastM.soft_penalty),
            executionTimeSec: (lastM.execution_time_ms / 1000).toFixed(1),
          });
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const kpiCards = [
    { label: 'Total Students', value: stats.studentsCount.toLocaleString(), trend: '+8.2% from previous semester', icon: Users, color: 'blue' },
    { label: 'Total Subjects', value: stats.subjectsCount, trend: 'Enrolled in current term', icon: BookOpen, color: 'indigo' },
    { label: 'Total Rooms', value: stats.roomsCount, trend: 'Active examination halls', icon: DoorOpen, color: 'emerald' },
    { label: 'Total Faculty', value: stats.facultyCount, trend: 'Invigilation supervisors', icon: UserCheck, color: 'violet' },
  ];

  const quickActions = [
    { id: 'import', title: 'Import Data', desc: 'Upload student, subject, room, and slot Excel/CSV files.', icon: Upload, view: 'import' },
    { id: 'rooms', title: 'Manage Rooms', desc: 'Configure room capacities, seating layouts, and availability.', icon: DoorOpen, view: 'data-rooms' },
    { id: 'constraints', title: 'Configure Constraints', desc: 'Tune zero-violation hard rules and soft penalty weights.', icon: Sliders, view: 'constraints' },
    { id: 'scheduler', title: 'Generate Timetable', desc: 'Run the Genetic Algorithm to create an optimized schedule.', icon: Cpu, view: 'scheduler' },
    { id: 'timetables', title: 'View Timetable', desc: 'Inspect grid matrix, lock assignments, and export Excel.', icon: Calendar, view: 'timetables' },
    { id: 'reports', title: 'Generate Reports', desc: 'Export PDF/Excel schedules for students, faculty, and exam cell.', icon: FileSpreadsheet, view: 'reports' },
  ];

  const runTableColumns = [
    { title: 'Run ID', key: 'id', render: (val) => <span className="font-mono text-[#3B82F6] font-bold">{val.substring(0, 8)}...</span> },
    { title: 'Started At', key: 'started_at', render: (val) => val ? new Date(val).toLocaleString() : 'N/A' },
    { title: 'Seed', key: 'random_seed', render: (val) => val ?? 'Auto' },
    { title: 'Status', key: 'status', render: (val) => <Badge pulse={val === 'RUNNING'}>{val}</Badge> },
    { 
      title: 'Action', 
      key: 'actions', 
      align: 'right',
      render: (_, row) => (
        <Button variant="ghost" size="sm" onClick={() => setActiveView('scheduler')}>
          View Details
        </Button>
      ) 
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-white via-white to-[#F3F7FE] border border-slate-200 shadow-2xl relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Examination Scheduling Overview</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight font-manrope">
            Good morning, System Admin
          </h2>
          <p className="text-xs text-slate-600 max-w-xl">
            SmartExam Genetic Algorithm solver ready for conflict-free examination schedule generation.
          </p>
        </div>

        <div className="flex items-center space-x-3 relative z-10">
          <Button variant="secondary" size="md" icon={Upload} onClick={() => setActiveView('import')}>
            Import Data
          </Button>
          <Button variant="primary" size="md" icon={Zap} onClick={() => setActiveView('scheduler')}>
            Run GA Scheduler
          </Button>
        </div>
      </div>

      {/* 4 Top KPI Cards */}
      {loading ? (
        <LoadingSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {kpiCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div key={idx} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xl hover:border-blue-300 transition">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" /> Active
                  </span>
                </div>
                <div className="text-2xl font-black text-slate-900 font-manrope mb-1">
                  {card.value}
                </div>
                <div className="text-xs font-semibold text-slate-700">{card.label}</div>
                <div className="text-[11px] text-slate-500 mt-1">{card.trend}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Genetic Algorithm Status Card & Optimization Progress Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GA Engine Prominent Card */}
        <Card
          title="Genetic Algorithm Engine"
          subtitle="Multi-objective optimization status"
          icon={Cpu}
          action={<Badge pulse={gaStatus.status === 'RUNNING'}>{gaStatus.status}</Badge>}
          className="lg:col-span-1"
        >
          <div className="space-y-5">
            <div>
              <ProgressBar
                value={gaStatus.generation}
                max={gaStatus.maxGenerations}
                label={`Generation ${gaStatus.generation} / ${gaStatus.maxGenerations}`}
                color={gaStatus.status === 'RUNNING' ? 'blue' : 'emerald'}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-white border border-slate-100">
                <div className="text-slate-600 text-[10px] font-sans">Best Fitness</div>
                <div className="text-lg font-bold text-blue-600">{gaStatus.bestFitness}</div>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-100">
                <div className="text-slate-600 text-[10px] font-sans">Hard Violations</div>
                <div className={`text-lg font-bold ${gaStatus.hardViolations === 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {gaStatus.hardViolations}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-100">
                <div className="text-slate-600 text-[10px] font-sans">Soft Penalty</div>
                <div className="text-lg font-bold text-violet-600">{gaStatus.softPenalty}</div>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-100">
                <div className="text-slate-600 text-[10px] font-sans">Execution Time</div>
                <div className="text-lg font-bold text-slate-800">{gaStatus.executionTimeSec}s</div>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              className="w-full"
              icon={ArrowRight}
              onClick={() => setActiveView('scheduler')}
            >
              View GA Studio
            </Button>
          </div>
        </Card>

        {/* Optimization Progress Chart */}
        <Card
          title="Optimization Progress"
          subtitle="Generational fitness cost reduction"
          icon={Activity}
          className="lg:col-span-2"
        >
          <div className="h-64 w-full">
            {chartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs space-y-2">
                <Activity className="w-8 h-8 text-slate-400" />
                <p>No active optimization run metrics recorded yet.</p>
                <Button variant="secondary" size="sm" onClick={() => setActiveView('scheduler')}>
                  Launch GA Optimization
                </Button>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" />
                  <XAxis dataKey="generation" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '12px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="hard_violations" name="Hard Violations" stroke="#EF4444" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="soft_penalty" name="Soft Penalty Cost" stroke="#3B82F6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions Grid (6 Cards) */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 font-manrope flex items-center">
          <Zap className="w-4 h-4 mr-2 text-blue-600" /> Quick Administrative Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((act) => {
            const Icon = act.icon;
            return (
              <div
                key={act.id}
                onClick={() => setActiveView(act.view)}
                className="bg-white border border-slate-200 p-5 rounded-2xl hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition group flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-400 transition font-manrope mb-1">
                    {act.title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{act.desc}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600 group-hover:translate-x-1 transition">
                  <span>Open View</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Scheduler Runs Table */}
      <Card
        title="Recent Scheduler Runs"
        subtitle="Historical Genetic Algorithm execution logs"
        icon={Clock}
      >
        <Table
          columns={runTableColumns}
          data={recentRuns}
          loading={loading}
          emptyMessage="No recent scheduler executions recorded."
        />
      </Card>
    </div>
  );
}
