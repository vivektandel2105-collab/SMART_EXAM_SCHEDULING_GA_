import React from 'react';

export default function ProgressBar({ value = 0, max = 100, label, color = 'blue' }) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const colors = {
    blue: 'bg-gradient-to-r from-blue-600 to-indigo-500',
    emerald: 'bg-gradient-to-r from-emerald-600 to-teal-400',
    amber: 'bg-gradient-to-r from-amber-500 to-orange-500',
    purple: 'bg-gradient-to-r from-purple-600 to-indigo-500',
  };

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
          <span>{label}</span>
          <span className="font-mono text-slate-600">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="w-full h-2.5 bg-[#F3F7FE] rounded-full overflow-hidden border border-slate-200 p-0.5">
        <div
          className={`h-full rounded-full transition-all duration-300 ${colors[color] || colors.blue}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
