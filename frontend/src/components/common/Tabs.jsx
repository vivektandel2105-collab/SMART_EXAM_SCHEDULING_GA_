import React from 'react';

export default function Tabs({ tabs = [], activeTab, onChange }) {
  return (
    <div className="flex items-center space-x-1.5 p-1.5 bg-white border border-slate-200 rounded-2xl overflow-x-auto">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === (tab.id ?? tab.value);
        return (
          <button
            key={tab.id ?? tab.value}
            onClick={() => onChange(tab.id ?? tab.value)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
              isActive
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-blue-50'
            }`}
          >
            {Icon && <Icon className={`w-4 h-4 ${isActive ? 'text-slate-900' : 'text-slate-600'}`} />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-white/30 text-current' : 'bg-[#E2E8F0] text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
