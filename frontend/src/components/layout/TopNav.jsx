import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, BookOpen, UserCheck, DoorOpen, Building, CalendarDays, Cpu, Sliders,
  Calendar, FileSpreadsheet, BarChart2, FileText, ShieldAlert, GraduationCap, ChevronDown, Menu, X,
  User, Info, Bell, LogOut, Dna,
} from 'lucide-react';

const adminMenu = [
  { id: 'overview', label: 'Overview', items: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, tint: 'blue' },
  ]},
  { id: 'data', label: 'Academic Data', items: [
    { id: 'data-students', label: 'Students', icon: Users, category: 'students', tint: 'blue' },
    { id: 'data-subjects', label: 'Subjects', icon: BookOpen, category: 'subjects', tint: 'emerald' },
    { id: 'data-faculty', label: 'Faculty', icon: UserCheck, category: 'faculty', tint: 'violet' },
    { id: 'data-rooms', label: 'Rooms', icon: DoorOpen, category: 'rooms', tint: 'orange' },
    { id: 'data-departments', label: 'Departments', icon: Building, category: 'departments', tint: 'sky' },
    { id: 'data-slots', label: 'Exam Slots', icon: CalendarDays, category: 'slots', tint: 'rose' },
  ]},
  { id: 'sched', label: 'GA Scheduling', items: [
    { id: 'scheduler', label: 'GA Scheduler', icon: Cpu, tint: 'blue' },
    { id: 'constraints', label: 'Constraints Engine', icon: Sliders, tint: 'violet' },
    { id: 'timetables', label: 'Timetable Explorer', icon: Calendar, tint: 'emerald' },
    { id: 'conflicts', label: 'Conflict Report', icon: ShieldAlert, tint: 'rose' },
  ]},
  { id: 'portals', label: 'Reports & Portals', items: [
    { id: 'reports', label: 'Reports Center', icon: FileSpreadsheet, tint: 'orange' },
    { id: 'portal-student', label: 'Student Portal', icon: GraduationCap, tint: 'blue' },
    { id: 'portal-faculty', label: 'Faculty Portal', icon: UserCheck, tint: 'violet' },
  ]},
  { id: 'system', label: 'System', items: [
    { id: 'import', label: 'Excel / CSV Import', icon: FileText, tint: 'emerald' },
    { id: 'audit', label: 'Audit Logs', icon: BarChart2, tint: 'sky' },
  ]},
];

const studentMenu = [
  { id: 'home', label: 'My Space', items: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, tint: 'blue' },
    { id: 'profile', label: 'My Profile', icon: User, tint: 'violet' },
    { id: 'subjects', label: 'My Subjects', icon: BookOpen, tint: 'emerald' },
  ]},
  { id: 'exams', label: 'Examinations', items: [
    { id: 'timetable', label: 'My Timetable', icon: Calendar, tint: 'blue' },
    { id: 'exams', label: 'Exam Schedule', icon: CalendarDays, tint: 'orange' },
    { id: 'hall-ticket', label: 'Hall Ticket', icon: FileText, tint: 'rose' },
  ]},
  { id: 'help', label: 'Help & Alerts', items: [
    { id: 'instructions', label: 'Exam Instructions', icon: Info, tint: 'sky' },
    { id: 'notifications', label: 'Notifications', icon: Bell, tint: 'violet' },
  ]},
];

const tints = {
  blue: 'bg-blue-50 text-blue-600', emerald: 'bg-emerald-50 text-emerald-600', violet: 'bg-violet-50 text-violet-600',
  orange: 'bg-orange-50 text-orange-600', sky: 'bg-sky-50 text-sky-600', rose: 'bg-rose-50 text-rose-600',
};

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-sky-400 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
        <Dna className="w-5 h-5" />
      </div>
      <div className="leading-none">
        <div className="text-[22px] font-extrabold text-blue-600 tracking-tight">Smart</div>
        <div className="text-[15px] font-bold text-slate-900 -mt-0.5">Exam</div>
      </div>
    </div>
  );
}

export default function TopNav({ menu: menuOverride, activeView, setActiveView, isStudent }) {
  const { user, logout } = useAuth();
  const groups = menuOverride || (isStudent ? studentMenu : adminMenu);
  const [open, setOpen] = useState(false);          // mega menu
  const [activeGroup, setActiveGroup] = useState(groups[0].id);
  const [mobile, setMobile] = useState(false);
  const [profile, setProfile] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setProfile(false); } };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const go = (item) => { setActiveView(item.id, item.category); setOpen(false); setMobile(false); };
  const group = groups.find((g) => g.id === activeGroup) || groups[0];
  const currentGroup = groups.find((g) => g.items.some((i) => i.id === activeView || (activeView.startsWith('data') && i.id.startsWith('data'))));

  return (
    <header ref={ref} className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-[1500px] mx-auto h-[72px] px-5 lg:px-10 flex items-center justify-between gap-6">
        <button onClick={() => setActiveView('dashboard')} className="flex-shrink-0"><Logo /></button>

        <nav className="hidden lg:flex items-center gap-1 text-[15px] font-medium text-slate-800">
          <button
            onClick={() => { setOpen(!open); }}
            className={`px-4 py-2 rounded-lg flex items-center gap-1.5 hover:text-blue-600 transition ${open ? 'text-blue-600' : ''}`}
          >
            {isStudent ? 'Student Menu' : 'Features'}
            <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
          {groups.filter((g) => g.items.length > 0).slice(0, 4).map((g) => (
            <button key={g.id}
              onClick={() => { setActiveGroup(g.id); setOpen(true); }}
              className={`px-4 py-2 rounded-lg hover:text-blue-600 transition ${currentGroup?.id === g.id ? 'text-blue-600' : ''}`}>
              {g.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button onClick={() => setActiveView(isStudent ? 'exams' : 'scheduler')}
            className="hidden sm:inline-flex px-6 py-3 rounded-full bg-[#F59E0B] hover:bg-amber-500 text-slate-900 font-bold text-sm shadow-sm transition">
            {isStudent ? 'View Exams' : 'Run Scheduler'}
          </button>
          {user && (
            <div className="relative">
              <button onClick={() => setProfile(!profile)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-blue-600 text-blue-600 font-semibold text-sm hover:bg-blue-50 transition">
                <User className="w-4 h-4" />
                <span className="hidden md:inline max-w-[110px] truncate">{user.name}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {profile && (
                <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 text-sm animate-fadeIn">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <div className="font-bold text-slate-900">{user.name}</div>
                    <div className="text-xs text-slate-500 truncate">{user.email}</div>
                    <span className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{user.role}</span>
                  </div>
                  <button onClick={logout} className="w-full mt-1 flex items-center gap-2 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-semibold">
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          )}
          <button className="lg:hidden p-2 rounded-lg text-slate-700 hover:bg-blue-50" onClick={() => setMobile(!mobile)}>
            {mobile ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mega menu — Browse by category */}
      {open && (
        <div className="hidden lg:block absolute left-0 right-0 top-full bg-white border-b border-slate-200 shadow-xl animate-fadeIn">
          <div className="max-w-[1500px] mx-auto flex min-h-[300px]">
            <aside className="w-[300px] border-r border-slate-200 py-6">
              <div className="px-8 pb-3 text-sm font-extrabold tracking-wide text-slate-900">BROWSE BY CATEGORY</div>
              {groups.map((g) => (
                <button key={g.id} onMouseEnter={() => setActiveGroup(g.id)} onClick={() => setActiveGroup(g.id)}
                  className={`w-full flex items-center justify-between px-8 py-3 text-[15px] border-l-4 transition ${
                    activeGroup === g.id ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold' : 'border-transparent text-slate-800 hover:bg-slate-50'}`}>
                  <span>{g.label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${activeGroup === g.id ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>{g.items.length}</span>
                </button>
              ))}
            </aside>
            <section className="flex-1 p-8">
              <div className="flex justify-between items-baseline mb-6">
                <h3 className="text-2xl text-slate-900 font-medium">{group.label}</h3>
                <span className="text-sm text-slate-600">{group.items.length} {group.items.length === 1 ? 'feature' : 'features'}</span>
              </div>
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-x-10 gap-y-5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button key={item.id} onClick={() => go(item)}
                      className={`flex items-center gap-4 p-2 rounded-xl text-left hover:bg-blue-50 transition ${activeView === item.id ? 'bg-blue-50' : ''}`}>
                      <span className={`w-12 h-12 rounded-xl flex items-center justify-center ${tints[item.tint]}`}><Icon className="w-6 h-6" /></span>
                      <span className="font-bold text-[15px] text-slate-900">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* Mobile drawer */}
      {mobile && (
        <div className="lg:hidden border-t border-slate-200 bg-white max-h-[75vh] overflow-y-auto px-5 py-4 space-y-4">
          {groups.map((g) => (
            <div key={g.id}>
              <div className="text-xs font-extrabold text-slate-500 tracking-wide mb-1.5">{g.label.toUpperCase()}</div>
              {g.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.id} onClick={() => go(item)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold ${activeView === item.id ? 'bg-blue-50 text-blue-700' : 'text-slate-800'}`}>
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${tints[item.tint]}`}><Icon className="w-4 h-4" /></span>
                    {item.label}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </header>
  );
}
