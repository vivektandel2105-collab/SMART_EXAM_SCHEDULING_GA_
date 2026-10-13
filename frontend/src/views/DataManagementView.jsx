import React, { useState, useEffect } from 'react';
import api, { formatApiError } from '../services/api';
import { 
  BookOpen, 
  DoorOpen, 
  CalendarDays, 
  Users, 
  Plus, 
  Trash2, 
  Search, 
  RefreshCw, 
  DatabaseZap, 
  CheckCircle,
  X,
  AlertCircle
} from 'lucide-react';

export default function DataManagementView({ initialCategory = 'subjects' }) {
  const [activeTab, setActiveTab] = useState(initialCategory);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [sampleLoading, setSampleLoading] = useState(false);

  const tabs = [
    { id: 'subjects', label: 'Examinations / Subjects', icon: BookOpen, endpoint: '/subjects' },
    { id: 'rooms', label: 'Rooms & Capacities', icon: DoorOpen, endpoint: '/rooms' },
    { id: 'slots', label: 'Dates & Time Slots', icon: CalendarDays, endpoint: '/exam-slots' },
    { id: 'students', label: 'Students', icon: Users, endpoint: '/students' },
    { id: 'enrollments', label: 'Student Enrollments', icon: Users, endpoint: '/students/enrollments/all' },
  ];

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    const tabObj = tabs.find(t => t.id === activeTab);
    try {
      const res = await api.get(tabObj.endpoint);
      const data = Array.isArray(res.data) ? res.data : (res.data.items || []);
      setItems(data);
    } catch (err) {
      setErrorMsg(formatApiError(err) || `Failed to fetch ${activeTab}`);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    const tabObj = tabs.find(t => t.id === activeTab);
    try {
      await api.delete(`${tabObj.endpoint}/${id}`);
      setSuccessMsg('Record deleted successfully.');
      fetchData();
    } catch (err) {
      alert(formatApiError(err) || 'Deletion failed.');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const tabObj = tabs.find(t => t.id === activeTab);
    try {
      await api.post(tabObj.endpoint, formData);
      setShowAddModal(false);
      setFormData({});
      setSuccessMsg('Record created successfully.');
      fetchData();
    } catch (err) {
      setErrorMsg(formatApiError(err) || 'Creation failed.');
    }
  };

  const [clearLoading, setClearLoading] = useState(false);

  const handleLoadSampleData = async () => {
    if (!window.confirm('Reset and load sample data? (10 Subjects, 5 Rooms, 200 Students, 10 Slots)')) return;
    setSampleLoading(true);
    try {
      await api.post('/scheduler/sample-data');
      setSuccessMsg('Sample data loaded successfully!');
      fetchData();
    } catch (err) {
      alert(formatApiError(err) || 'Failed to load sample data.');
    } finally {
      setSampleLoading(false);
    }
  };

  const handleClearAllData = async () => {
    if (!window.confirm('Are you sure you want to delete ALL loaded scheduling data (subjects, exams, rooms, slots, students, and timetables)?')) {
      return;
    }
    setClearLoading(true);
    try {
      const res = await api.post('/scheduler/clear-data');
      setSuccessMsg(res.data.message || 'All loaded scheduling data has been deleted.');
      fetchData();
    } catch (err) {
      alert(formatApiError(err) || 'Failed to clear scheduling data.');
    } finally {
      setClearLoading(false);
    }
  };

  const filteredItems = items.filter(item => {
    const s = JSON.stringify(item).toLowerCase();
    return s.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Academic Scheduling Data</h1>
          <p className="text-xs text-slate-600">Configure subjects, classrooms, examination dates, time slots, and student enrollments</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLoadSampleData}
            disabled={sampleLoading || clearLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
          >
            <DatabaseZap className="w-4 h-4 text-emerald-600" />
            <span>{sampleLoading ? 'Loading...' : 'Load Sample Data'}</span>
          </button>

          <button
            onClick={handleClearAllData}
            disabled={sampleLoading || clearLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition"
            title="Delete all loaded subjects, rooms, slots, students, and timetables"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>{clearLoading ? 'Clearing...' : 'Delete All Data'}</span>
          </button>

          {activeTab !== 'enrollments' && (
            <button
              onClick={() => {
                setFormData({});
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Record</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')}><X className="w-4 h-4" /></button>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-semibold flex justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchTerm('');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
          />
        </div>
        <button
          onClick={fetchData}
          className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
          title="Refresh Table"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading {activeTab}...</div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No records found. Click <strong>Add Record</strong> or <strong>Load Sample Data</strong>.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  {activeTab === 'subjects' && (
                    <>
                      <th className="py-3 px-4 font-bold">Subject Code</th>
                      <th className="py-3 px-4 font-bold">Subject Name</th>
                      <th className="py-3 px-4 font-bold">Exam Duration</th>
                      <th className="py-3 px-4 font-bold">Status</th>
                      <th className="py-3 px-4 font-bold text-right">Actions</th>
                    </>
                  )}
                  {activeTab === 'rooms' && (
                    <>
                      <th className="py-3 px-4 font-bold">Room Number</th>
                      <th className="py-3 px-4 font-bold">Building</th>
                      <th className="py-3 px-4 font-bold">Seating Capacity</th>
                      <th className="py-3 px-4 font-bold">Room Type</th>
                      <th className="py-3 px-4 font-bold text-right">Actions</th>
                    </>
                  )}
                  {activeTab === 'slots' && (
                    <>
                      <th className="py-3 px-4 font-bold">Examination Date</th>
                      <th className="py-3 px-4 font-bold">Session</th>
                      <th className="py-3 px-4 font-bold">Start Time</th>
                      <th className="py-3 px-4 font-bold">End Time</th>
                      <th className="py-3 px-4 font-bold text-right">Actions</th>
                    </>
                  )}
                  {activeTab === 'students' && (
                    <>
                      <th className="py-3 px-4 font-bold">Roll Number</th>
                      <th className="py-3 px-4 font-bold">Student Name</th>
                      <th className="py-3 px-4 font-bold">Email</th>
                      <th className="py-3 px-4 font-bold">Status</th>
                      <th className="py-3 px-4 font-bold text-right">Actions</th>
                    </>
                  )}
                  {activeTab === 'enrollments' && (
                    <>
                      <th className="py-3 px-4 font-bold">Roll Number</th>
                      <th className="py-3 px-4 font-bold">Student Name</th>
                      <th className="py-3 px-4 font-bold">Subject Code</th>
                      <th className="py-3 px-4 font-bold">Subject Name</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    {activeTab === 'subjects' && (
                      <>
                        <td className="py-3 px-4 font-mono font-bold text-blue-700">{item.subject_code}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{item.subject_name}</td>
                        <td className="py-3 px-4 text-slate-600">{item.exam_duration_minutes || 180} mins</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">Active</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button onClick={() => handleDelete(item.id)} className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </>
                    )}
                    {activeTab === 'rooms' && (
                      <>
                        <td className="py-3 px-4 font-bold text-slate-900">{item.room_number}</td>
                        <td className="py-3 px-4 text-slate-600">{item.building}</td>
                        <td className="py-3 px-4 font-bold text-indigo-700">{item.capacity} seats</td>
                        <td className="py-3 px-4 text-slate-600">{item.room_type || 'CLASSROOM'}</td>
                        <td className="py-3 px-4 text-right">
                          <button onClick={() => handleDelete(item.id)} className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </>
                    )}
                    {activeTab === 'slots' && (
                      <>
                        <td className="py-3 px-4 font-semibold text-slate-800">{item.exam_date}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                            {item.session_name}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{item.start_time}</td>
                        <td className="py-3 px-4 text-slate-600">{item.end_time}</td>
                        <td className="py-3 px-4 text-right">
                          <button onClick={() => handleDelete(item.id)} className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </>
                    )}
                    {activeTab === 'students' && (
                      <>
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">{item.roll_number}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{item.name}</td>
                        <td className="py-3 px-4 text-slate-600">{item.email}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">Active</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button onClick={() => handleDelete(item.id)} className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </>
                    )}
                    {activeTab === 'enrollments' && (
                      <>
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">{item.roll_number}</td>
                        <td className="py-3 px-4 text-slate-700">{item.student_name}</td>
                        <td className="py-3 px-4 font-mono font-bold text-blue-700">{item.subject_code}</td>
                        <td className="py-3 px-4 text-slate-700">{item.subject_name}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Add {tabs.find(t => t.id === activeTab)?.label}</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3 text-xs">
              {activeTab === 'subjects' && (
                <>
                  <div>
                    <label className="block text-slate-600 mb-1">Subject Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CS301"
                      value={formData.subject_code || ''}
                      onChange={e => setFormData({ ...formData, subject_code: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Subject Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Data Structures"
                      value={formData.subject_name || ''}
                      onChange={e => setFormData({ ...formData, subject_name: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Duration (Minutes)</label>
                    <input
                      type="number"
                      defaultValue={180}
                      value={formData.exam_duration_minutes || 180}
                      onChange={e => setFormData({ ...formData, exam_duration_minutes: parseInt(e.target.value) || 180 })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </>
              )}

              {activeTab === 'rooms' && (
                <>
                  <div>
                    <label className="block text-slate-600 mb-1">Room Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. R-101"
                      value={formData.room_number || ''}
                      onChange={e => setFormData({ ...formData, room_number: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Building *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Academic Block A"
                      value={formData.building || ''}
                      onChange={e => setFormData({ ...formData, building: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Capacity *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 60"
                      value={formData.capacity || ''}
                      onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </>
              )}

              {activeTab === 'slots' && (
                <>
                  <div>
                    <label className="block text-slate-600 mb-1">Examination Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.exam_date || ''}
                      onChange={e => setFormData({ ...formData, exam_date: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Session Name *</label>
                    <select
                      value={formData.session_name || 'MORNING'}
                      onChange={e => setFormData({ ...formData, session_name: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      <option value="MORNING">MORNING (09:00 - 12:00)</option>
                      <option value="AFTERNOON">AFTERNOON (14:00 - 17:00)</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-600 mb-1">Start Time</label>
                      <input
                        type="time"
                        value={formData.start_time || '09:00'}
                        onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">End Time</label>
                      <input
                        type="time"
                        value={formData.end_time || '12:00'}
                        onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'students' && (
                <>
                  <div>
                    <label className="block text-slate-600 mb-1">Roll Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2026-CS-0001"
                      value={formData.roll_number || ''}
                      onChange={e => setFormData({ ...formData, roll_number: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Student Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={formData.name || ''}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. john@smartexam.edu"
                      value={formData.email || ''}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
