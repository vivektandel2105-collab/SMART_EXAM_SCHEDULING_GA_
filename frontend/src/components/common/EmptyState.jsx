import React from 'react';
import Button from './Button';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) {
  return (
    <div className="py-12 px-6 text-center bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center space-y-3">
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 flex items-center justify-center mb-1">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h3 className="text-base font-bold text-slate-900 font-manrope">{title}</h3>
      {description && <p className="text-xs text-slate-600 max-w-sm leading-relaxed">{description}</p>}
      {actionLabel && onAction && (
        <div className="pt-2">
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
