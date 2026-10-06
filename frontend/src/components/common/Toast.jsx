import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ message, type = 'info', onClose, duration = 4000 }) {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const configs = {
    success: { icon: CheckCircle2, bg: 'bg-white border-emerald-500/30 text-emerald-700' },
    error: { icon: AlertCircle, bg: 'bg-white border-rose-500/30 text-rose-700' },
    warning: { icon: AlertTriangle, bg: 'bg-white border-amber-500/30 text-amber-700' },
    info: { icon: Info, bg: 'bg-white border-blue-500/30 text-blue-700' },
  };

  const config = configs[type] || configs.info;
  const Icon = config.icon;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fadeIn">
      <div className={`flex items-center space-x-3 px-4 py-3 rounded-2xl border shadow-2xl ${config.bg}`}>
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="text-xs font-semibold">{message}</span>
        <button onClick={onClose} className="p-1 text-slate-600 hover:text-slate-900 transition">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
