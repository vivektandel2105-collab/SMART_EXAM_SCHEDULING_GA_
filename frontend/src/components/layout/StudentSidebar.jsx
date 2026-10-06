import React from 'react';
import { 
  LayoutDashboard, 
  User, 
  BookOpen, 
  Calendar, 
  CalendarDays, 
  FileText, 
  Info, 
  Bell, 
  LogOut, 
  GraduationCap, 
  Sparkles,
  ChevronRight,
  Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function StudentSidebar({ activeView, setActiveView, isOpen, onCloseMobile }) {
  const { logout, user } = useAuth();

  const sections = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'ACADEMIC',
      items: [
        { id: 'profile', label: 'My Profile', icon: User },
        { id: 'subjects', label: 'My Subjects', icon: BookOpen },
        { id: 'timetable', label: 'My Timetable', icon: Calendar },
        { id: 'exams', label: 'Exam Schedule', icon: CalendarDays },
      ],
    },
    {
      title: 'EXAMINATION',
      items: [
        { id: 'hall-ticket', label: 'Hall Ticket', icon: FileText, badge: 'PDF' },
        { id: 'instructions', label: 'Exam Instructions', icon: Info },
      ],
    },
    {
      title: 'ACCOUNT',
      items: [
        { id: 'notifications', label: 'Notifications', icon: Bell, badge: 'New' },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#070B14]/80 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 left-0 z-40 h-full w-[255px] bg-[#0D1422] border-r border-[#1E2D4A] flex flex-col justify-between transition-all duration-300 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-[#162238] flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-100 font-manrope tracking-tight flex items-center">
              Smart<span className="text-cyan-400">Student</span>
            </h2>
            <p className="text-[10px] text-slate-400 font-medium">Student Examination Portal</p>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {sections.map((sec, secIdx) => (
            <div key={secIdx} className="space-y-1">
              <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {sec.title}
              </div>
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveView(item.id);
                      if (onCloseMobile) onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-[#172338] text-white border-l-4 border-cyan-400 shadow-md font-bold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-[#111A2A]'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge ? (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {item.badge}
                      </span>
                    ) : (
                      <ChevronRight className={`w-3.5 h-3.5 opacity-0 ${isActive ? 'opacity-100 text-cyan-400' : ''}`} />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer Info & Logout */}
        <div className="p-4 border-t border-[#162238] bg-[#070B14]/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-full bg-cyan-600/20 border border-cyan-400/40 text-cyan-300 flex items-center justify-center font-bold text-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div className="text-left leading-tight">
                <div className="text-xs font-bold text-slate-200 truncate max-w-[110px]">{user?.name || 'Student'}</div>
                <div className="text-[9px] text-cyan-400 font-mono font-semibold">STUDENT PORTAL</div>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
