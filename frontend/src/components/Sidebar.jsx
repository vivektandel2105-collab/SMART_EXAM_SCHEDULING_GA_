import React from 'react';
import { 
  LayoutDashboard, 
  Database, 
  Upload, 
  Cpu, 
  Calendar, 
  Sliders, 
  ChevronRight 
} from 'lucide-react';

export default function Sidebar({ activeView, setActiveView, isOpen }) {
  const menuItems = [
    { id: 'dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'data', label: 'Data Management', icon: Database },
    { id: 'import', label: 'Excel/CSV Import', icon: Upload },
    { id: 'scheduler', label: 'GA Scheduler Studio', icon: Cpu, badge: 'Live' },
    { id: 'timetables', label: 'Timetable Explorer', icon: Calendar },
    { id: 'constraints', label: 'Constraint Engine', icon: Sliders },
  ];

  return (
    <aside className={`w-64 border-r border-slate-200 bg-white/60 backdrop-blur-md flex flex-col justify-between transition-all duration-300 ${isOpen ? 'block' : 'hidden lg:flex'}`}>
      <div className="p-4 space-y-1">
        <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Navigation
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-900' : 'text-slate-600'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge ? (
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 border border-emerald-500/30">
                  {item.badge}
                </span>
              ) : (
                <ChevronRight className={`w-3.5 h-3.5 opacity-0 ${isActive ? 'opacity-100' : ''}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Info Box */}
      <div className="p-4 m-4 rounded-xl bg-slate-50/80 border border-slate-200 text-xs text-slate-600">
        <div className="font-semibold text-slate-800 mb-1">Genetic Algorithm Engine</div>
        <p className="text-[11px] leading-relaxed text-slate-600">
          Zero Hard-Constraint Violations & Multi-Objective Soft Weight Tuning.
        </p>
      </div>
    </aside>
  );
}
