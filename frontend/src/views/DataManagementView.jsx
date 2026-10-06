import React, { useState, useEffect } from 'react';
import api from '../services/api';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Tabs from '../components/common/Tabs';
import Badge from '../components/common/Badge';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import { 
  Plus, 
  Search, 
  Trash2, 
  DoorOpen, 
  BookOpen, 
  UserCheck, 
  Users, 
  CalendarDays, 
  Building 
} from 'lucide-react';

export default function DataManagementView({ initialCategory = 'rooms' }) {
  const [activeTab, setActiveTab] = useState(initialCategory);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({});

  const tabs = [
    { id: 'rooms', label: 'Rooms', icon: DoorOpen, endpoint: '/rooms' },
    { id: 'subjects', label: 'Subjects', icon: BookOpen, endpoint: '/subjects' },
    { id: 'faculty', label: 'Faculty', icon: UserCheck, endpoint: '/faculty' },
    { id: 'students', label: 'Students', icon: Users, endpoint: '/students' },
    { id: 'slots', label: 'Exam Slots', icon: CalendarDays, endpoint: '/exam-slots' },
    { id: 'departments', label: 'Departments', icon: Building, endpoint: '/departments' },
  ];

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    const tabObj = tabs.find(t => t.id === activeTab);
    try {
      const res = await api.get(tabObj.endpoint);
      const data = res.data.items || res.data;
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(`Failed to fetch ${activeTab}:`, err);
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
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Deletion failed.');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const tabObj = tabs.find(t => t.id === activeTab);
    try {
      await api.post(tabObj.endpoint, formData);
      setShowModal(false);
      setFormData({});
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Creation failed.');
    }
  };

  const filteredItems = items.filter(item => {
    const searchStr = JSON.stringify(item).toLowerCase();
    return searchStr.includes(searchTerm.toLowerCase());
  });

  const pageSize = 10;
  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
  const paginatedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Column definitions per tab
  const columnsMap = {
    rooms: [
      { title: 'Room Number', key: 'room_number', render: (val) => <span className="font-bold text-slate-900">{val}</span> },
      { title: 'Building', key: 'building' },
      { title: 'Floor', key: 'floor' },
      { title: 'Capacity', key: 'capacity', render: (val) => <span className="font-bold text-blue-600 font-mono">{val} seats</span> },
      { title: 'Status', key: 'is_available', render: (val) => <Badge>{val ? 'ACTIVE' : 'INACTIVE'}</Badge> },
      { 
        title: 'Actions', 
        key: 'id', 
        align: 'right',
        render: (id) => (
          <Button variant="ghost" size="sm" icon={Trash2} onClick={() => handleDelete(id)}>
            Delete
          </Button>
        ) 
      }
    ],
    subjects: [
      { title: 'Subject Code', key: 'subject_code', render: (val) => <span className="font-bold text-blue-600 font-mono">{val}</span> },
      { title: 'Subject Name', key: 'subject_name', render: (val) => <span className="font-semibold text-slate-900">{val}</span> },
      { title: 'Exam Duration', key: 'exam_duration_minutes', render: (val) => <span className="font-mono text-slate-600">{val} mins</span> },
      { title: 'Type', key: 'exam_type', render: (val) => <Badge>{val || 'THEORY'}</Badge> },
      { 
        title: 'Actions', 
        key: 'id', 
        align: 'right',
        render: (id) => (
          <Button variant="ghost" size="sm" icon={Trash2} onClick={() => handleDelete(id)}>
            Delete
          </Button>
        ) 
      }
    ],
    faculty: [
      { title: 'Employee ID', key: 'employee_id', render: (val) => <span className="font-mono font-bold text-blue-600">{val}</span> },
      { title: 'Faculty Name', key: 'name', render: (val) => <span className="font-semibold text-slate-900">{val}</span> },
      { title: 'Email Address', key: 'email', render: (val) => <span className="text-slate-600 font-mono">{val}</span> },
      { title: 'Designation', key: 'designation', render: (val) => val || 'Faculty' },
      { 
        title: 'Actions', 
        key: 'id', 
        align: 'right',
        render: (id) => (
          <Button variant="ghost" size="sm" icon={Trash2} onClick={() => handleDelete(id)}>
            Delete
          </Button>
        ) 
      }
    ],
    students: [
      { title: 'Roll Number', key: 'roll_number', render: (val) => <span className="font-mono font-bold text-blue-600">{val}</span> },
      { title: 'Student Name', key: 'name', render: (val) => <span className="font-semibold text-slate-900">{val}</span> },
      { title: 'Email Address', key: 'email', render: (val) => <span className="text-slate-600 font-mono">{val}</span> },
      { title: 'Status', key: 'status', render: (val) => <Badge>{val || 'ACTIVE'}</Badge> },
      { 
        title: 'Actions', 
        key: 'id', 
        align: 'right',
        render: (id) => (
          <Button variant="ghost" size="sm" icon={Trash2} onClick={() => handleDelete(id)}>
            Delete
          </Button>
        ) 
      }
    ],
    slots: [
      { title: 'Exam Date', key: 'exam_date', render: (val) => <span className="font-bold text-blue-600 font-mono">{val}</span> },
      { title: 'Session', key: 'session_name', render: (val) => <Badge>{val}</Badge> },
      { title: 'Start Time', key: 'start_time', render: (val) => <span className="font-mono">{val}</span> },
      { title: 'End Time', key: 'end_time', render: (val) => <span className="font-mono">{val}</span> },
      { 
        title: 'Actions', 
        key: 'id', 
        align: 'right',
        render: (id) => (
          <Button variant="ghost" size="sm" icon={Trash2} onClick={() => handleDelete(id)}>
            Delete
          </Button>
        ) 
      }
    ],
    departments: [
      { title: 'Code', key: 'code', render: (val) => <span className="font-bold text-blue-600 font-mono">{val}</span> },
      { title: 'Department Name', key: 'name', render: (val) => <span className="font-semibold text-slate-900">{val}</span> },
      { 
        title: 'Actions', 
        key: 'id', 
        align: 'right',
        render: (id) => (
          <Button variant="ghost" size="sm" icon={Trash2} onClick={() => handleDelete(id)}>
            Delete
          </Button>
        ) 
      }
    ],
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        category="Academic Setup"
        breadcrumbs={['Data Management', activeTab]}
        title={`${activeTab.toUpperCase()} MANAGEMENT`}
        subtitle="Manage examination rooms, seating capacity, faculty supervisors, and subject enrollments."
        action={
          <Button variant="primary" icon={Plus} onClick={() => { setFormData({}); setShowModal(true); }}>
            Add {activeTab.slice(0, -1)}
          </Button>
        }
      />

      {/* Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={(id) => { setActiveTab(id); setCurrentPage(1); setSearchTerm(''); }} />

        <div className="w-full md:w-64">
          <Input
            icon={Search}
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
      </div>

      {/* Data Table */}
      <Table
        columns={columnsMap[activeTab] || []}
        data={paginatedItems}
        loading={loading}
        emptyMessage={`No ${activeTab} records found matching criteria.`}
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredItems.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />

      {/* Add Entity Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`Add New ${activeTab.slice(0, -1).toUpperCase()}`}
        subtitle={`Enter institutional record details for ${activeTab}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleFormSubmit}>Save Record</Button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {activeTab === 'rooms' && (
            <>
              <Input
                label="Room Number"
                required
                placeholder="e.g. A101"
                value={formData.room_number || ''}
                onChange={e => setFormData({ ...formData, room_number: e.target.value })}
              />
              <Input
                label="Building / Block"
                required
                placeholder="e.g. Main Block"
                value={formData.building || ''}
                onChange={e => setFormData({ ...formData, building: e.target.value })}
              />
              <Input
                label="Seating Capacity"
                type="number"
                required
                placeholder="60"
                value={formData.capacity || 60}
                onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
              />
            </>
          )}

          {activeTab === 'subjects' && (
            <>
              <Input
                label="Subject Code"
                required
                placeholder="e.g. CSE3001"
                value={formData.subject_code || ''}
                onChange={e => setFormData({ ...formData, subject_code: e.target.value })}
              />
              <Input
                label="Subject Name"
                required
                placeholder="e.g. Database Management Systems"
                value={formData.subject_name || ''}
                onChange={e => setFormData({ ...formData, subject_name: e.target.value })}
              />
              <Input
                label="Exam Duration (Minutes)"
                type="number"
                required
                placeholder="180"
                value={formData.exam_duration_minutes || 180}
                onChange={e => setFormData({ ...formData, exam_duration_minutes: parseInt(e.target.value) })}
              />
            </>
          )}

          {!['rooms', 'subjects'].includes(activeTab) && (
            <>
              <Input
                label="Code / ID"
                required
                placeholder="Identifier"
                value={formData.code || formData.roll_number || formData.employee_id || ''}
                onChange={e => setFormData({ ...formData, code: e.target.value, roll_number: e.target.value, employee_id: e.target.value })}
              />
              <Input
                label="Name"
                required
                placeholder="Name"
                value={formData.name || ''}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </>
          )}
        </form>
      </Modal>
    </div>
  );
}
