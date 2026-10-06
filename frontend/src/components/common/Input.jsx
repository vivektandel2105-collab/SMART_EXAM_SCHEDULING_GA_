import React from 'react';

export default function Input({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  helpText,
  icon: Icon,
  required = false,
  className = '',
  ...props
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
          {label} {required && <span className="text-rose-600">*</span>}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <Icon className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500 group-focus-within:text-blue-400 transition" />
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 rounded-xl bg-white border ${
            error ? 'border-rose-500/80 focus:ring-rose-500' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/20'
          } text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 transition`}
          {...props}
        />
      </div>
      {error && <p className="text-[11px] text-rose-600 mt-1 font-medium">{error}</p>}
      {helpText && !error && <p className="text-[11px] text-slate-500 mt-1">{helpText}</p>}
    </div>
  );
}
