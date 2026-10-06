import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Sliders, 
  ShieldAlert, 
  Sparkles, 
  Check, 
  Save, 
  RefreshCw 
} from 'lucide-react';

export default function ConstraintConfigView() {
  const [constraints, setConstraints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchConstraints();
  }, []);

  const fetchConstraints = async () => {
    setLoading(true);
    try {
      const res = await api.get('/constraints');
      setConstraints(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch constraints:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnable = (id, currentEnabled) => {
    setConstraints(prev =>
      prev.map(c => (c.id === id ? { ...c, is_enabled: !currentEnabled } : c))
    );
  };

  const handleWeightChange = (id, newWeight) => {
    setConstraints(prev =>
      prev.map(c => (c.id === id ? { ...c, weight: parseFloat(newWeight) || 0 } : c))
    );
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setSuccessMessage('');
    try {
      await Promise.all(
        constraints.map(c =>
          api.put(`/constraints/${c.id}`, {
            weight: c.weight,
            is_enabled: c.is_enabled,
          })
        )
      );
      setSuccessMessage('Constraint weights & rules successfully updated!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update constraint configuration.');
    } finally {
      setSaving(false);
    }
  };

  const hardConstraints = constraints.filter(c => c.type === 'HARD');
  const softConstraints = constraints.filter(c => c.type === 'SOFT');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Constraint Engine & Weight Studio</h1>
          <p className="text-xs text-slate-600">Configure zero-violation hard rules & tune soft penalty weights for Genetic Optimization</p>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="inline-flex items-center px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 transition disabled:opacity-50"
        >
          <Save className="w-4 h-4 mr-2" />
          <span>{saving ? 'Saving Configuration...' : 'Save & Apply Rules'}</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-semibold flex items-center">
          <Check className="w-4 h-4 mr-2 text-emerald-700" /> {successMessage}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-slate-600 text-xs flex items-center justify-center space-x-2">
          <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading constraint rules...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hard Constraints Card */}
          <div className="p-6 rounded-2xl glass-panel space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center">
                <ShieldAlert className="w-5 h-5 mr-2 text-rose-600" /> Hard Constraints (Strict Rules)
              </h2>
              <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 border border-rose-500/20">
                W_hard = 10,000
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Hard constraints MUST NOT be violated under any condition. A candidate schedule with 0 hard violations is considered feasible.
            </p>

            <div className="space-y-3">
              {hardConstraints.map(c => (
                <div key={c.id} className="p-3 rounded-xl bg-slate-50/80 border border-slate-200 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-indigo-700 font-mono">{c.code}</span>
                      <span className="text-xs font-semibold text-slate-900">{c.name}</span>
                    </div>
                    <p className="text-[11px] text-slate-600">{c.description || 'Mandatory constraint'}</p>
                  </div>

                  <button
                    onClick={() => handleToggleEnable(c.id, c.is_enabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      c.is_enabled ? 'bg-indigo-600' : 'bg-slate-100'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        c.is_enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Soft Constraints Card */}
          <div className="p-6 rounded-2xl glass-panel space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-indigo-600" /> Soft Constraints (Penalty Weights)
              </h2>
              <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-700 border border-indigo-500/20">
                Multi-Objective
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Soft constraints represent preferences (student spacing, faculty workload equality). Higher weights penalize violations more heavily.
            </p>

            <div className="space-y-4">
              {softConstraints.map(c => (
                <div key={c.id} className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-indigo-700 font-mono">{c.code}</span>
                      <span className="text-xs font-semibold text-slate-900">{c.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={c.weight}
                        onChange={e => handleWeightChange(c.id, e.target.value)}
                        className="w-16 p-1 bg-white border border-slate-200 rounded text-center text-xs font-mono text-indigo-700 font-bold"
                      />
                      <span className="text-xs text-slate-500 font-mono">pts</span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={c.weight}
                    onChange={e => handleWeightChange(c.id, e.target.value)}
                    className="w-full accent-indigo-500 bg-slate-100 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
