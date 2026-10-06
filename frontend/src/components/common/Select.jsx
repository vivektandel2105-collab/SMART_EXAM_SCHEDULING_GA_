import React from 'react';
import { ChevronDown } from 'lucide-react';

export default function Select({
  label,
  options = [],
  value,
  onChange,
  error,
  helpText,
  required = false,
  className = '',
  placeholder = 'Select option...',
  ...props
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
          {label} {required && <span className="text-rose-600">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          required={required}
          className={`w-full appearance-none pl-4 pr-10 py-2.5 rounded-xl bg-white border ${
            error ? 'border-rose-500' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/20'
          } text-slate-900 text-xs focus:outline-none focus:ring-2 transition cursor-pointer`}
          {...props}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value ?? opt.id} value={opt.value ?? opt.id} className="bg-white text-slate-800">
              {opt.label ?? opt.name ?? opt.value}
            </option>
          ))}
        </select>
        <ChevronDown className="w-4 h-4 absolute right-3 top-3 text-slate-600 pointer-events-none" />
      </div>
      {error && <p className="text-[11px] text-rose-600 mt-1 font-medium">{error}</p>}
      {helpText && !error && <p className="text-[11px] text-slate-500 mt-1">{helpText}</p>}
    </div>
  );
}
