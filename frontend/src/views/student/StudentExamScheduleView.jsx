import React, { useState } from 'react';
import { CalendarDays, Clock, MapPin, CheckCircle2, AlertCircle, FileText, Search } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import PageHeader from '../../components/common/PageHeader';

export default function StudentExamScheduleView() {
  const [search, setSearch] = useState('');

  const exams = [
    {
      id: 'ex-101',
      code: 'CSE3001',
      name: 'Database Management Systems',
      date: 'Dec 10, 2026',
      startTime: '09:00 AM',
      endTime: '12:00 PM',
      room: 'A101',
      building: 'Main Block',
      seatNumber: 'Desk A-14',
      status: 'Upcoming'
    },
    {
      id: 'ex-102',
      code: 'CSE3002',
      name: 'Operating Systems',
      date: 'Dec 10, 2026',
      startTime: '02:00 PM',
      endTime: '05:00 PM',
      room: 'A102',
      building: 'Main Block',
      seatNumber: 'Desk B-08',
      status: 'Upcoming'
    },
    {
      id: 'ex-103',
      code: 'CSE3003',
      name: 'Computer Networks',
      date: 'Dec 11, 2026',
      startTime: '09:00 AM',
      endTime: '12:00 PM',
      room: 'A201',
      building: 'Main Block',
      seatNumber: 'Desk C-22',
      status: 'Upcoming'
    },
    {
      id: 'ex-104',
      code: 'CSE3004',
      name: 'Software Engineering & GA',
      date: 'Dec 12, 2026',
      startTime: '09:00 AM',
      endTime: '12:00 PM',
      room: 'A101',
      building: 'Main Block',
      seatNumber: 'Desk A-14',
      status: 'Upcoming'
    },
    {
      id: 'ex-100',
      code: 'CSE2005',
      name: 'Data Structures & Algorithms',
      date: 'Oct 15, 2026',
      startTime: '09:00 AM',
      endTime: '12:00 PM',
      room: 'A101',
      building: 'Main Block',
      seatNumber: 'Desk A-14',
      status: 'Completed'
    }
  ];

  const filtered = exams.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exam Schedule & Status Roster"
        subtitle="Individual exam shift assignments, timing, and status tracking"
      />

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search code or exam title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F3F7FE] border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant="info">Upcoming (4)</Badge>
          <Badge variant="success">Completed (1)</Badge>
        </div>
      </div>

      {/* Exam List Cards */}
      <div className="space-y-4">
        {filtered.map((exam) => (
          <Card key={exam.id} className="p-5 hover:border-cyan-500/40 transition">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-mono font-bold text-xs text-cyan-700 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                    {exam.code}
                  </span>
                  <span className="text-xs text-slate-600 font-semibold">{exam.name}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">{exam.name}</h3>
              </div>

              <Badge 
                variant={
                  exam.status === 'Completed' ? 'success' :
                  exam.status === 'Today' ? 'warning' : 'info'
                }
              >
                {exam.status}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs pt-4">
              <div className="flex items-center space-x-2 text-slate-700">
                <CalendarDays className="w-4 h-4 text-cyan-700 flex-shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-600">Exam Date</div>
                  <div className="font-semibold">{exam.date}</div>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-slate-700">
                <Clock className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-600">Shift Timing</div>
                  <div className="font-semibold">{exam.startTime} - {exam.endTime}</div>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-slate-700">
                <MapPin className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-600">Assigned Hall</div>
                  <div className="font-semibold">{exam.room} ({exam.building})</div>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-amber-700 font-mono">
                <FileText className="w-4 h-4 text-amber-700 flex-shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-600 font-sans">Seating Desk</div>
                  <div className="font-bold">{exam.seatNumber}</div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
