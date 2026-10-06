import React, { useState, Component } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import TopNav from './components/layout/TopNav';

// Admin Views
import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';
import DataManagementView from './views/DataManagementView';
import ImportWizardView from './views/ImportWizardView';
import SchedulerStudioView from './views/SchedulerStudioView';
import TimetableExplorerView from './views/TimetableExplorerView';
import ConstraintConfigView from './views/ConstraintConfigView';
import ConflictReportView from './views/ConflictReportView';
import StudentPortalView from './views/StudentPortalView';
import FacultyPortalView from './views/FacultyPortalView';
import ReportsView from './views/ReportsView';
import AuditLogsView from './views/AuditLogsView';

// Student Views
import StudentDashboardView from './views/student/StudentDashboardView';
import StudentProfileView from './views/student/StudentProfileView';
import StudentSubjectsView from './views/student/StudentSubjectsView';
import StudentTimetableView from './views/student/StudentTimetableView';
import StudentExamScheduleView from './views/student/StudentExamScheduleView';
import StudentHallTicketView from './views/student/StudentHallTicketView';
import StudentInstructionsView from './views/student/StudentInstructionsView';
import StudentNotificationsView from './views/student/StudentNotificationsView';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("SmartExam Runtime Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050812] text-white flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-[#0b1424] border border-slate-700/70 p-8 rounded-3xl text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-600 border border-rose-500/30 flex items-center justify-center mx-auto text-xl font-bold">
              !
            </div>
            <h2 className="text-xl font-bold text-white">SmartExam Portal Runtime Exception</h2>
            <p className="text-xs text-slate-300 leading-relaxed font-mono bg-[#050812] p-3 rounded-xl border border-slate-700 text-left overflow-x-auto">
              {this.state.error?.message || 'A frontend rendering exception occurred.'}
            </p>
            <button
              onClick={() => {
                localStorage.removeItem('smartexam_token');
                window.location.reload();
              }}
              className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/25 transition"
            >
              Reset Session & Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function MainApp() {
  const { user, loading } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [activeCategory, setActiveCategory] = useState(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F7FE] text-slate-900 flex items-center justify-center font-sans">
        <div className="flex items-center space-x-3 text-slate-600">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-slate-700">Loading SmartExam Platform...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  const handleSelectView = (viewId, category) => {
    setActiveView(viewId);
    if (category) {
      setActiveCategory(category);
    }
  };

  const isStudent = user.role === 'STUDENT';

  // Human-readable titles for Admin & Student views
  const adminViewTitles = {
    dashboard: 'Executive Dashboard',
    'data-students': 'Student Enrollments',
    'data-subjects': 'Academic Subjects',
    'data-faculty': 'Faculty Directory',
    'data-rooms': 'Room Infrastructure',
    'data-departments': 'Departments & Programs',
    'data-slots': 'Examination Slots',
    data: 'Academic Data Management',
    scheduler: 'GA Optimization Studio',
    constraints: 'Constraint Weight Engine',
    timetables: 'Timetable Explorer & Matrix',
    conflicts: 'Conflict Audit Dashboard',
    reports: 'Reports & Export Center',
    'portal-student': 'Student Examination Portal',
    'portal-faculty': 'Faculty Invigilation Portal',
    import: 'Excel & CSV Import Wizard',
    audit: 'System Audit Logs',
  };

  const studentViewTitles = {
    dashboard: 'Student Dashboard',
    profile: 'My Student Profile',
    subjects: 'My Registered Subjects',
    timetable: 'My Exam Timetable Matrix',
    exams: 'Exam Schedule Roster',
    'hall-ticket': 'Official Hall Ticket',
    instructions: 'Exam Code of Conduct',
    notifications: 'Notifications & Alerts',
  };

  const currentTitle = isStudent 
    ? (studentViewTitles[activeView] || 'Student Dashboard')
    : (adminViewTitles[activeView] || 'Executive Dashboard');

  const heroInfo = {
    dashboard: ['Command Center', 'Track every GA run, conflict and exam slot at a glance.', ['Live Stats', 'GA Runs', 'Conflict Free']],
    scheduler: ['Genetic Algorithm', 'Tune population, generations and mutation, then evolve a clash-free exam timetable.', ['Auto Gap Days', 'Zero Hard Violations', 'Live Fitness']],
    constraints: ['For Examination Cells', 'Set hard and soft constraint weights that guide the optimizer.', ['Hard Rules', 'Soft Penalties', 'Weighted']],
    timetables: ['For Examination Cells', 'Browse generated timetables with a colour-coded date and slot matrix.', ['Color Coded', 'Mon-Sat', 'CSV Export']],
    conflicts: ['Quality Audit', 'Inspect hard and soft constraint violations for every run.', ['Hard', 'Soft', 'Filterable']],
    reports: ['Export Center', 'Download schedules, seating and invigilation reports.', ['CSV Export', 'PDF', 'Excel']],
    import: ['Bulk Upload', 'Import students, subjects and rooms from Excel or CSV in a few steps.', ['Excel', 'CSV', 'Validation']],
    audit: ['System', 'A trail of every important action in the platform.', ['Secure', 'Searchable']],
  };
  const [pill, sub, chips] = isStudent
    ? ['For Students', 'Your personal exam timetable, hall ticket and instructions in one place.', ['My Timetable', 'Hall Ticket', 'Alerts']]
    : (heroInfo[activeView] || (activeView.startsWith('data')
        ? ['Academic Data', 'Manage the master records the scheduler relies on.', ['Students', 'Subjects', 'Rooms', 'Faculty']]
        : ['For Examination Cells', 'Smart exam scheduling powered by a genetic algorithm.', ['Auto Gap Days', 'Color Coded', 'CSV Export']]));

  return (
    <div className="min-h-screen bg-[#F3F7FE] text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-200 selection:text-blue-900">
      <TopNav activeView={activeView} setActiveView={handleSelectView} isStudent={isStudent} />

      {/* Hero band */}
      <section className="bg-[#EEF4FF] border-b border-blue-100 px-5 pt-8 pb-14 text-center">
        <span className="inline-block px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">{pill}</span>
        <h1 className="mt-5 text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight">{currentTitle}</h1>
        <p className="mt-4 mx-auto max-w-2xl text-base md:text-lg text-slate-700 leading-relaxed">{sub}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {chips.map((c) => (
            <span key={c} className="px-5 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-bold">{c}</span>
          ))}
        </div>
      </section>

      {/* Content card overlapping hero, like the reference */}
      <main className="flex-1 w-full max-w-[1500px] mx-auto px-4 lg:px-10 -mt-8 pb-16">
        <div className="bg-white border border-slate-200 rounded-[28px] shadow-sm p-5 md:p-8 space-y-6">
            {/* STUDENT PORTAL ROUTING */}
            {isStudent && (
              <>
                {activeView === 'dashboard' && <StudentDashboardView setActiveView={handleSelectView} />}
                {activeView === 'profile' && <StudentProfileView />}
                {activeView === 'subjects' && <StudentSubjectsView />}
                {activeView === 'timetable' && <StudentTimetableView />}
                {activeView === 'exams' && <StudentExamScheduleView />}
                {activeView === 'hall-ticket' && <StudentHallTicketView />}
                {activeView === 'instructions' && <StudentInstructionsView />}
                {activeView === 'notifications' && <StudentNotificationsView />}
              </>
            )}

            {/* ADMIN / SUPER_ADMIN PORTAL ROUTING */}
            {!isStudent && (
              <>
                {activeView === 'dashboard' && <DashboardView setActiveView={handleSelectView} />}
                {activeView.startsWith('data') && (
                  <DataManagementView initialCategory={activeCategory || 'students'} />
                )}
                {activeView === 'scheduler' && <SchedulerStudioView />}
                {activeView === 'constraints' && <ConstraintConfigView />}
                {activeView === 'timetables' && <TimetableExplorerView />}
                {activeView === 'conflicts' && <ConflictReportView />}
                {activeView === 'reports' && <ReportsView />}
                {activeView === 'portal-student' && <StudentPortalView />}
                {activeView === 'portal-faculty' && <FacultyPortalView />}
                {activeView === 'import' && <ImportWizardView />}
                {activeView === 'audit' && <AuditLogsView />}
              </>
            )}
        </div>
      </main>

      <footer className="text-center text-xs text-slate-500 pb-8">SmartExam · Exam scheduling with Genetic Algorithm</footer>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ErrorBoundary>
  );
}
