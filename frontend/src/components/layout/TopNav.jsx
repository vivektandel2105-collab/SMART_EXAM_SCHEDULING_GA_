import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Database,
  Calendar,
  Play,
  DatabaseZap,
  LogOut,
  Dna,
  Menu,
  X,
  User,
  ChevronDown
} from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
        <Dna className="w-5 h-5" />
      </div>
      <div className="leading-none text-left">
        <div className="text-[20px] font-black text-blue-600 tracking-tight">SmartExam</div>
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">GA Scheduler</div>
      </div>
    </div>
  );
}

export default function TopNav({ activeView, setActiveView, onQuickGenerate, onLoadSampleData }) {
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'data', label: 'Manage Data', icon: Database },
    { id: 'timetables', label: 'Timetable & Results', icon: Calendar },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-[1500px] mx-auto h-[70px] px-4 lg:px-8 flex items-center justify-between gap-4">
        {/* Logo */}
        <button
          onClick={() => setActiveView('dashboard')}
          className="flex-shrink-0 hover:opacity-95 transition"
        >
          <Logo />
        </button>

        {/* 3 Core Workflow Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id || (item.id === 'data' && activeView.startsWith('data'));
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-white text-blue-600 shadow-sm shadow-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Action Controls & User Profile */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveView('timetables')}
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Generate Timetable</span>
          </button>

          {user && (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition"
              >
                <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                  {user.name ? user.name[0].toUpperCase() : 'A'}
                </div>
                <span className="hidden md:inline max-w-[100px] truncate">{user.name}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 text-xs z-50">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <div className="font-bold text-slate-900">{user.name}</div>
                    <div className="text-slate-500 truncate">{user.email}</div>
                    <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                      {user.role}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="w-full mt-1 flex items-center gap-2 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold transition"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Logout
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id || (item.id === 'data' && activeView.startsWith('data'));
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold ${
                  isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
