import React, { useState, Component } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import TopNav from './components/layout/TopNav';

// Core 3 Workflow Views
import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';
import DataManagementView from './views/DataManagementView';
import TimetableExplorerView from './views/TimetableExplorerView';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("SmartExam Runtime Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 p-8 rounded-3xl text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-500 border border-rose-500/30 flex items-center justify-center mx-auto text-xl font-bold">
              !
            </div>
            <h2 className="text-xl font-bold text-white">SmartExam Application Exception</h2>
            <p className="text-xs text-slate-300 font-mono bg-slate-950 p-3 rounded-xl border border-slate-700 text-left overflow-x-auto">
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
  const [activeCategory, setActiveCategory] = useState('subjects');

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

  const heroDetails = {
    dashboard: {
      pill: 'Overview Dashboard',
      title: 'Automated Examination Scheduling',
      sub: 'Monitor scheduling readiness, input counts, and execute the Genetic Algorithm optimizer.',
    },
    data: {
      pill: 'Academic Data Management',
      title: 'Manage Scheduling Master Records',
      sub: 'Configure subjects, exam durations, classrooms, available slots, and student enrollments.',
    },
    timetables: {
      pill: 'Timetable & Results',
      title: 'Generated Timetable & Verification',
      sub: 'Inspect timetable assignments, independent constraint audit reports, and export to CSV.',
    },
  };

  const currentHero = heroDetails[activeView] || (activeView.startsWith('data') ? heroDetails.data : heroDetails.timetables);

  return (
    <div className="min-h-screen bg-[#F3F7FE] text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-200 selection:text-blue-900">
      <TopNav
        activeView={activeView}
        setActiveView={handleSelectView}
      />

      {/* Hero band */}
      <section className="bg-gradient-to-b from-[#EEF4FF] to-[#F3F7FE] border-b border-blue-100 px-5 pt-8 pb-12 text-center">
        <span className="inline-block px-4 py-1.5 rounded-full bg-blue-100/90 text-blue-700 text-xs font-bold tracking-wide uppercase">
          {currentHero.pill}
        </span>
        <h1 className="mt-3 text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
          {currentHero.title}
        </h1>
        <p className="mt-2.5 mx-auto max-w-2xl text-sm md:text-base text-slate-600 leading-relaxed font-medium">
          {currentHero.sub}
        </p>
      </section>

      {/* Main Content Container */}
      <main className="flex-1 w-full max-w-[1500px] mx-auto px-4 lg:px-8 -mt-6 pb-16">
        <div className="bg-white border border-slate-200 rounded-[28px] shadow-sm p-5 md:p-8 space-y-6">
          {activeView === 'dashboard' && (
            <DashboardView setActiveView={handleSelectView} />
          )}

          {(activeView === 'data' || activeView.startsWith('data')) && (
            <DataManagementView initialCategory={activeCategory || 'subjects'} />
          )}

          {(activeView === 'timetables' || activeView === 'scheduler') && (
            <TimetableExplorerView />
          )}
        </div>
      </main>

      <footer className="text-center text-xs text-slate-500 pb-8">
        SmartExam · Exam Scheduling Using Genetic Algorithm · AI Mini Project
      </footer>
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
