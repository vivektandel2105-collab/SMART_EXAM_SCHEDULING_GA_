import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  UserCheck, 
  DoorOpen, 
  Building, 
  CalendarDays, 
  Cpu, 
  Sliders, 
  Calendar, 
  FileSpreadsheet, 
  BarChart2, 
  FileText, 
  ShieldAlert,
  GraduationCap,
  Sparkles,
  ChevronRight
} from 'lucide-react';

export default function Sidebar({ activeView, setActiveView, isOpen, onCloseMobile, userRole }) {
  const sections = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'DATA MANAGEMENT',
      items: [
        { id: 'data-students', label: 'Students', icon: Users, category: 'students' },
        { id: 'data-subjects', label: 'Subjects', icon: BookOpen, category: 'subjects' },
        { id: 'data-faculty', label: 'Faculty', icon: UserCheck, category: 'faculty' },
        { id: 'data-rooms', label: 'Rooms', icon: DoorOpen, category: 'rooms' },
        { id: 'data-departments', label: 'Departments', icon: Building, category: 'departments' },
        { id: 'data-slots', label: 'Exam Slots', icon: CalendarDays, category: 'slots' },
      ],
    },
    {
      title: 'SCHEDULING',
      items: [
        { id: 'scheduler', label: 'GA Scheduler', icon: Cpu, badge: 'GA' },
        { id: 'constraints', label: 'Constraints Engine', icon: Sliders },
        { id: 'timetables', label: 'Timetable Explorer', icon: Calendar },
        { id: 'conflicts', label: 'Conflict Report', icon: ShieldAlert },
      ],
    },
    {
      title: 'REPORTS & PORTALS',
      items: [
        { id: 'reports', label: 'Reports Center', icon: FileSpreadsheet },
        { id: 'portal-student', label: 'Student Portal', icon: GraduationCap },
        { id: 'portal-faculty', label: 'Faculty Portal', icon: UserCheck },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { id: 'import', label: 'Excel/CSV Import', icon: FileText },
        { id: 'audit', label: 'Audit Logs', icon: BarChart2 },
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
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-100 font-manrope tracking-tight flex items-center">
              Smart<span className="text-blue-500">Exam</span>
            </h2>
            <p className="text-[10px] text-slate-400 font-medium">Exam Management Platform</p>
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
                      setActiveView(item.id, item.category);
                      if (onCloseMobile) onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-[#172338] text-white border-l-4 border-blue-500 shadow-md font-bold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-[#111A2A]'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge ? (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        {item.badge}
                      </span>
                    ) : (
                      <ChevronRight className={`w-3.5 h-3.5 opacity-0 ${isActive ? 'opacity-100 text-blue-400' : ''}`} />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer Info */}
        <div className="p-4 border-t border-[#162238] bg-[#070B14]/50 text-xs">
          <div className="flex items-center space-x-2 text-slate-300 font-semibold mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>GA Solver Active</span>
          </div>
          <p className="text-[10px] text-slate-400">Zero Hard-Violation Constraint Optimization Engine</p>
        </div>
      </aside>
    </>
  );
}
