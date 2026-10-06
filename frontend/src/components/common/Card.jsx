import React from 'react';

export default function Card({
  children,
  title,
  subtitle,
  icon: Icon,
  action,
  className = '',
  bodyClassName = '',
  hoverable = false,
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-slate-200 rounded-3xl shadow-sm transition-all duration-200 ${
        hoverable ? 'hover:bg-blue-50 hover:border-blue-300 hover:shadow-md cursor-pointer' : ''
      } ${className}`}
    >
      {(title || action || Icon) && (
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {Icon && (
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4" />
              </div>
            )}
            <div>
              {title && <h3 className="text-sm font-bold text-slate-900 font-manrope">{title}</h3>}
              {subtitle && <p className="text-xs text-slate-600 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={`p-6 ${bodyClassName}`}>{children}</div>
    </div>
  );
}
