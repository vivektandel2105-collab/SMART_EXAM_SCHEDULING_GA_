import React, { isValidElement, cloneElement } from 'react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading = false,
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-full transition transform active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:transform-none shadow-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#F3F7FE]';

  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 focus:ring-blue-500',
    secondary: 'bg-white hover:bg-blue-50 text-slate-800 border border-slate-200 hover:border-blue-300 focus:ring-slate-500',
    accent: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20 focus:ring-indigo-500',
    success: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 focus:ring-emerald-500',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20 focus:ring-rose-500',
    ghost: 'bg-transparent hover:bg-blue-50 text-slate-600 hover:text-slate-900 focus:ring-slate-500 shadow-none',
    outline: 'bg-transparent border border-blue-600 text-blue-600 hover:bg-blue-500/10 focus:ring-blue-500 shadow-none',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 space-x-1.5',
    md: 'text-xs px-4 py-2.5 space-x-2',
    lg: 'text-sm px-5 py-3 space-x-2.5',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin mr-1.5" />
      ) : isValidElement(Icon) ? (
        cloneElement(Icon, { className: `w-4 h-4 flex-shrink-0 ${Icon.props?.className || ''}` })
      ) : typeof Icon === 'function' || (Icon && typeof Icon === 'object') ? (
        <Icon className="w-4 h-4 flex-shrink-0" />
      ) : null}
      <span>{children}</span>
    </button>
  );
}
