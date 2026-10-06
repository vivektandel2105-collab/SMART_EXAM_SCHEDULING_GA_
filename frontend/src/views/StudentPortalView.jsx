import React, { useState } from 'react';
import { 
  GraduationCap, 
  Calendar, 
  Clock, 
  MapPin, 
  Download, 
  BookOpen, 
  CheckCircle2, 
  Search,
  FileText
} from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import PageHeader from '../components/common/PageHeader';

export default function StudentPortalView() {
  const [search, setSearch] = useState('');

  // Sample student exam roster for demonstration
  const studentExams = [
    {
      id: 'ex-1',
      code: 'CS401',
      name: 'Design & Analysis of Algorithms',
      date: 'Oct 14, 2026',
      time: '09:00 AM - 12:00 PM',
      room: 'A-101',
      building: 'Main Science Block',
      seat: 'Desk 42',
      status: 'CONFIRMED',
      type: 'Core Theory'
    },
    {
      id: 'ex-2',
      code: 'CS403',
      name: 'Database Management Systems',
      date: 'Oct 16, 2026',
      time: '02:00 PM - 05:00 PM',
      room: 'B-204',
      building: 'Technology Annex',
      seat: 'Desk 18',
      status: 'CONFIRMED',
      type: 'Core Theory'
    },
    {
      id: 'ex-3',
      code: 'CS405',
      name: 'Artificial Intelligence & GA',
      date: 'Oct 19, 2026',
      time: '09:00 AM - 12:00 PM',
      room: 'A-105',
      building: 'Main Science Block',
      seat: 'Desk 05',
      status: 'CONFIRMED',
      type: 'Elective'
    },
    {
      id: 'ex-4',
      code: 'MATH302',
      name: 'Discrete Mathematics & Graph Theory',
      date: 'Oct 22, 2026',
      time: '09:00 AM - 12:00 PM',
      room: 'C-102',
      building: 'Mathematics Wing',
      seat: 'Desk 31',
      status: 'UPCOMING',
      type: 'Foundational'
    }
  ];

  const filteredExams = studentExams.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Student Banner Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-50 via-white to-orange-50 border border-blue-500/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-600 flex-shrink-0">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black text-slate-900 font-manrope">My Examination Schedule</h1>
              <Badge variant="indigo">Fall Semester 2026</Badge>
            </div>
            <p className="text-xs text-slate-700 mt-1">
              Roll No: <span className="font-mono text-blue-600 font-bold">2026-CS-0142</span> | Program: Computer Science & Engineering (B.Tech)
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          icon={<Download className="w-4 h-4" />}
          onClick={() => alert('Downloading official hall ticket PDF...')}
        >
          Download Official Hall Ticket (PDF)
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search subject or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F3F7FE] border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="text-xs text-slate-600">
          Showing <span className="font-bold text-slate-800">{filteredExams.length}</span> scheduled examinations
        </div>
      </div>

      {/* Exam Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredExams.map((exam) => (
          <Card key={exam.id} className="p-6 hover:border-blue-500/40 transition-all duration-200 group">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-mono font-bold text-xs text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                    {exam.code}
                  </span>
                  <Badge variant="secondary" size="sm">{exam.type}</Badge>
                </div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-300 transition">
                  {exam.name}
                </h3>
              </div>
              <Badge variant={exam.status === 'CONFIRMED' ? 'success' : 'info'}>
                {exam.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs border-t border-slate-100 pt-4 mt-2">
              <div className="flex items-center space-x-2 text-slate-700">
                <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>{exam.date}</span>
              </div>

              <div className="flex items-center space-x-2 text-slate-700">
                <Clock className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <span>{exam.time}</span>
              </div>

              <div className="flex items-center space-x-2 text-slate-700">
                <MapPin className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                <span>Room {exam.room} ({exam.building})</span>
              </div>

              <div className="flex items-center space-x-2 text-slate-700 font-mono">
                <FileText className="w-4 h-4 text-amber-700 flex-shrink-0" />
                <span className="font-bold text-amber-700">{exam.seat}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
