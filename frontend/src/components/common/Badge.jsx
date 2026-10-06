import React from 'react';

export default function Badge({ children, variant = 'default', size = 'md', pulse = false }) {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-300',
    success: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
    danger: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
    info: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    violet: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider',
    md: 'text-xs px-2.5 py-1 font-semibold',
  };

  // Auto detect variant from status string if variant === 'auto'
  let activeVariant = variants[variant] || variants.default;
  if (typeof children === 'string') {
    const val = children.toUpperCase();
    if (['COMPLETED', 'READY', 'PUBLISHED', 'ACTIVE', 'VALID'].includes(val)) {
      activeVariant = variants.success;
    } else if (['RUNNING', 'QUEUED', 'UNDER_REVIEW', 'DRAFT', 'WARNING'].includes(val)) {
      activeVariant = variants.warning;
    } else if (['FAILED', 'CANCELLED', 'ERROR', 'INACTIVE'].includes(val)) {
      activeVariant = variants.danger;
    } else if (['SUPER_ADMIN', 'ADMIN'].includes(val)) {
      activeVariant = variants.violet;
    } else if (['EXAM_ADMIN', 'APPROVED'].includes(val)) {
      activeVariant = variants.info;
    }
  }

  return (
    <span className={`inline-flex items-center rounded-md border ${activeVariant} ${sizes[size]}`}>
      {pulse && <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />}
      <span>{children}</span>
    </span>
  );
}
