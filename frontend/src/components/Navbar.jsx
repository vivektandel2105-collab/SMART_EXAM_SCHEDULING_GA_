import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Shield, User as UserIcon, Sparkles } from 'lucide-react';

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();

  const getRoleBadge = (role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'EXAM_ADMIN':
        return 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20';
      case 'FACULTY':
        return 'bg-cyan-500/10 text-cyan-700 border-cyan-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
    }
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center space-x-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-800 transition lg:hidden"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            SE
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-indigo-200">
                SmartExam
              </h1>
              <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-700 font-semibold border border-indigo-500/30">
                v1.0
              </span>
            </div>
            <p className="text-xs text-slate-600 hidden sm:block">Exam Scheduling & Genetic Algorithm Optimization</p>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="hidden sm:flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
          Backend Connected
        </div>

        {user && (
          <div className="flex items-center space-x-3 pl-4 border-l border-slate-200">
            <div className="text-right hidden md:block">
              <div className="text-sm font-semibold text-slate-800">{user.name}</div>
              <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full border ${getRoleBadge(user.role)}`}>
                {user.role}
              </span>
            </div>

            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 font-semibold text-xs">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>

            <button
              onClick={logout}
              title="Logout"
              className="p-2 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
