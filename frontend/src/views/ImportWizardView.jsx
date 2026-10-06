import React, { useState } from 'react';
import api from '../services/api';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertTriangle, 
  Download, 
  ArrowRight,
  RefreshCw,
  FileCheck
} from 'lucide-react';

export default function ImportWizardView() {
  const [entityType, setEntityType] = useState('students');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewResult, setPreviewResult] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const entityOptions = [
    { id: 'students', label: 'Students & Enrollments', template: '/import/template/students' },
    { id: 'subjects', label: 'Subjects & Duration', template: '/import/template/subjects' },
    { id: 'rooms', label: 'Rooms & Capacities', template: '/import/template/rooms' },
    { id: 'faculty', label: 'Faculty Members', template: '/import/template/faculty' },
    { id: 'slots', label: 'Exam Slots', template: '/import/template/slots' },
  ];

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDryRunPreview = async () => {
    if (!selectedFile) return alert('Please select an Excel (.xlsx) or CSV file first.');
    setLoading(true);
    setPreviewResult(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('entity_type', entityType);
    formData.append('dry_run', 'true');

    try {
      const res = await api.post('/import/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPreviewResult(res.data);
      setStep(3);
    } catch (err) {
      alert(err.response?.data?.detail || 'Dry run preview failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!selectedFile) return;
    setLoading(true);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('entity_type', entityType);
    formData.append('dry_run', 'false');

    try {
      const res = await api.post('/import/execute', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportResult(res.data);
      setStep(4);
    } catch (err) {
      alert(err.response?.data?.detail || 'Import execution failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setSelectedFile(null);
    setPreviewResult(null);
    setImportResult(null);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Excel / CSV Data Import Wizard</h1>
        <p className="text-xs text-slate-600">Bulk import institutional records with pre-flight dry-run validation</p>
      </div>

      {/* Progress Stepper */}
      <div className="flex items-center justify-between p-4 rounded-2xl glass-panel text-xs">
        <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}>1</div>
          <span>Select Entity & File</span>
        </div>
        <div className="w-8 h-0.5 bg-slate-100"></div>
        <div className={`flex items-center space-x-2 ${step >= 3 ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 3 ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}>2</div>
          <span>Dry-Run Preview</span>
        </div>
        <div className="w-8 h-0.5 bg-slate-100"></div>
        <div className={`flex items-center space-x-2 ${step >= 4 ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 4 ? 'bg-emerald-600 text-white' : 'bg-slate-100'}`}>3</div>
          <span>Import Summary</span>
        </div>
      </div>

      {/* Step 1 & 2: Entity & File Selection */}
      {step <= 2 && (
        <div className="p-6 rounded-2xl glass-panel space-y-6">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              1. Select Data Entity Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {entityOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setEntityType(opt.id)}
                  className={`p-3 rounded-xl border text-left text-xs font-semibold transition ${
                    entityType === opt.id
                      ? 'bg-indigo-600/20 text-indigo-700 border-indigo-500 shadow-lg'
                      : 'bg-slate-50/60 text-slate-600 border-slate-200 hover:border-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              2. Upload Excel (.xlsx) or CSV File
            </label>
            <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-8 text-center bg-slate-50/40 transition">
              <UploadCloud className="w-10 h-10 text-indigo-600 mx-auto mb-3" />
              <input
                type="file"
                accept=".xlsx,.csv"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer text-sm font-semibold text-indigo-700 hover:text-indigo-200">
                {selectedFile ? selectedFile.name : 'Click to select file'}
              </label>
              <p className="text-xs text-slate-500 mt-1">Supports Microsoft Excel (.xlsx) and standard CSV files</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <a
              href={`/api/import/template/${entityType}`}
              download
              className="inline-flex items-center text-xs text-slate-600 hover:text-indigo-300 font-medium"
            >
              <Download className="w-4 h-4 mr-1.5" /> Download CSV Template
            </a>

            <button
              onClick={handleDryRunPreview}
              disabled={!selectedFile || loading}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/25 flex items-center space-x-2 transition disabled:opacity-50"
            >
              {loading ? <span>Analyzing File...</span> : (
                <>
                  <span>Run Dry-Run Preview</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Dry-Run Preview Table */}
      {step === 3 && previewResult && (
        <div className="p-6 rounded-2xl glass-panel space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center">
              <FileCheck className="w-5 h-5 mr-2 text-indigo-600" /> Dry-Run Preview Results
            </h2>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              previewResult.is_valid ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-700 border border-amber-500/20'
            }`}>
              {previewResult.is_valid ? 'Valid & Ready' : 'Warnings Detected'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center font-mono text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-slate-600">Total Rows</div>
              <div className="text-lg font-bold text-slate-900">{previewResult.total_rows}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-slate-600">Valid Rows</div>
              <div className="text-lg font-bold text-emerald-700">{previewResult.valid_rows}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-slate-600">Invalid Rows</div>
              <div className="text-lg font-bold text-rose-600">{previewResult.invalid_rows}</div>
            </div>
          </div>

          {previewResult.errors && previewResult.errors.length > 0 && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 text-xs space-y-1">
              <div className="font-bold flex items-center mb-1">
                <AlertTriangle className="w-4 h-4 mr-1.5" /> Validation Errors:
              </div>
              {previewResult.errors.map((err, idx) => (
                <div key={idx}>• Row {err.row}: {err.message}</div>
              ))}
            </div>
          )}

          <div className="flex justify-between pt-4 border-t border-slate-200">
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
            >
              Back to Upload
            </button>

            <button
              onClick={handleExecuteImport}
              disabled={loading || previewResult.invalid_rows > 0}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-500/25 transition disabled:opacity-50"
            >
              {loading ? 'Executing Import...' : 'Confirm & Execute Import'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Import Complete Summary */}
      {step === 4 && importResult && (
        <div className="p-8 rounded-2xl glass-panel text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-700 flex items-center justify-center mx-auto mb-2 border border-emerald-500/30">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Import Successfully Completed!</h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            {importResult.imported_count} records were processed and stored in the database.
          </p>

          <button
            onClick={handleReset}
            className="mt-4 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/25 inline-flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4 mr-1.5" /> Import Another File
          </button>
        </div>
      )}
    </div>
  );
}
