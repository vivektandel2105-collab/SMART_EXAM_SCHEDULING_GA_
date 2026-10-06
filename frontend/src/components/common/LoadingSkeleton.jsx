import React from 'react';

export default function LoadingSkeleton({ count = 3, type = 'card' }) {
  const items = Array.from({ length: count });

  if (type === 'table') {
    return (
      <div className="w-full space-y-3 bg-white border border-slate-200 rounded-2xl p-4 animate-pulse">
        <div className="h-8 bg-blue-50 rounded-xl w-full" />
        {items.map((_, i) => (
          <div key={i} className="h-10 bg-white rounded-xl w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {items.map((_, i) => (
        <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 animate-pulse">
          <div className="flex justify-between items-center">
            <div className="w-10 h-10 bg-blue-50 rounded-xl" />
            <div className="w-16 h-5 bg-blue-50 rounded-full" />
          </div>
          <div className="w-24 h-8 bg-blue-50 rounded-lg" />
          <div className="w-32 h-4 bg-blue-50 rounded-lg" />
        </div>
      ))}
    </div>
  );
}
