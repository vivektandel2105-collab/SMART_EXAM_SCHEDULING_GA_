import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Menu, 
  Search, 
  Bell, 
  HelpCircle, 
  LogOut, 
  User as UserIcon, 
  ChevronDown,
  Shield
} from 'lucide-react';
import Badge from '../common/Badge';

export default function TopHeader({ onToggleSidebar, activeViewTitle = 'Dashboard' }) {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="h-16 bg-[#0D1422] border-b border-[#1E2D4A] px-6 flex items-center justify-between sticky top-0 z-30 shadow-md">
      {/* Left: Mobile Menu & Breadcrumbs */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#172338] transition lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-medium">
            <span>SmartExam</span>
            <span>/</span>
            <span className="text-blue-400 font-semibold">{activeViewTitle}</span>
          </div>
          <h2 className="text-base font-bold text-slate-100 font-manrope hidden sm:block">
            {activeViewTitle}
          </h2>
        </div>
      </div>

      {/* Right: Search, Notifications, User Profile */}
      <div className="flex items-center space-x-3">
        {/* Search Input */}
        <div className="relative hidden md:block w-48 lg:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search exams, rooms..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#070B14] border border-[#1E2D4A] text-slate-200 text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        {/* Notifications & Help */}
        <button
          title="Notifications"
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#172338] transition relative"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-blue-500 absolute top-2 right-2 animate-pulse" />
        </button>

        <button
          title="Help & Documentation"
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#172338] transition hidden sm:block"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* User Profile Dropdown */}
        {user && (
          <div className="relative pl-3 border-l border-[#162238]">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-2.5 p-1 rounded-xl hover:bg-[#172338] transition"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 border border-blue-400/40 flex items-center justify-center text-white font-bold text-xs shadow-md">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="text-left hidden md:block">
                <div className="text-xs font-bold text-slate-200 leading-tight">{user.name}</div>
                <div className="text-[10px] text-slate-400 flex items-center space-x-1">
                  <Badge size="sm">{user.role}</Badge>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-48 rounded-2xl bg-[#0D1422] border border-[#1E2D4A] shadow-2xl p-2 z-50 text-xs space-y-1 animate-fadeIn"
                onClick={() => setDropdownOpen(false)}
              >
                <div className="px-3 py-2 border-b border-[#162238] text-slate-400">
                  <div className="font-bold text-slate-200">{user.name}</div>
                  <div className="text-[10px] text-slate-400">{user.email}</div>
                </div>

                <button
                  onClick={logout}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 font-semibold transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
