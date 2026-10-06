import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  Clock, 
  MapPin, 
  Award, 
  FileText, 
  ArrowRight,
  Sparkles,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';

export default function StudentDashboardView({ setActiveView }) {
  const { user } = useAuth();
  const [studentInfo, setStudentInfo] = useState({
    rollNumber: user?.roll_number || user?.id?.substring(0, 8).toUpperCase() || 'STU-REGISTERED',
    name: user?.name || 'Registered Student',
    email: user?.email || '',
    program: 'B.Tech Computer Science',
    department: 'Computer Science & Engineering',
    semester: 'Semester 6',
    attendance: '95.0%',
    totalSubjects: 6,
    upcomingExamsCount: 4,
  });

  const [upcomingExams, setUpcomingExams] = useState([
    {
      id: 'ex-1',
      code: 'CSE3001',
      subjectName: 'Database Management Systems',
      examDate: 'Dec 10, 2026',
      time: '09:00 AM - 12:00 PM',
      room: 'A101',
      building: 'Main Block',
      floor: 'Floor 1',
      seatNumber: 'Desk A-14',
      status: 'Upcoming',
      type: 'Core Theory'
    },
    {
      id: 'ex-2',
      code: 'CSE3002',
      subjectName: 'Operating Systems',
      examDate: 'Dec 10, 2026',
      time: '02:00 PM - 05:00 PM',
      room: 'A102',
      building: 'Main Block',
      floor: 'Floor 1',
      seatNumber: 'Desk B-08',
      status: 'Upcoming',
      type: 'Core Theory'
    },
    {
      id: 'ex-3',
      code: 'CSE3003',
      subjectName: 'Computer Networks',
      examDate: 'Dec 11, 2026',
      time: '09:00 AM - 12:00 PM',
      room: 'A201',
      building: 'Main Block',
      floor: 'Floor 2',
      seatNumber: 'Desk C-22',
      status: 'Upcoming',
      type: 'Core Theory'
    },
    {
      id: 'ex-4',
      code: 'CSE3004',
      subjectName: 'Software Engineering & GA',
      examDate: 'Dec 12, 2026',
      time: '09:00 AM - 12:00 PM',
      room: 'A101',
      building: 'Main Block',
      floor: 'Floor 1',
      seatNumber: 'Desk A-14',
      status: 'Upcoming',
      type: 'Elective'
    }
  ]);

  useEffect(() => {
    fetchStudentProfile();
  }, [user]);

  const fetchStudentProfile = async () => {
    try {
      const res = await api.get('/students');
      if (Array.isArray(res.data) && res.data.length > 0) {
        const matching = res.data.find(s => s.email === user?.email) || res.data[0];
        setStudentInfo(prev => ({
          ...prev,
          rollNumber: matching.roll_number || user?.id?.substring(0, 8).toUpperCase() || prev.rollNumber,
          name: matching.name || user?.name || prev.name,
          email: matching.email || user?.email || prev.email,
        }));
      }
    } catch (err) {
      console.log('Using authenticated user profile data.');
    }
  };

  const kpiCards = [
    { label: 'Student Roll ID', value: studentInfo.rollNumber, desc: 'Official Enrollment ID', icon: GraduationCap, color: 'blue' },
    { label: 'Academic Program', value: studentInfo.program, desc: studentInfo.department, icon: BookOpen, color: 'cyan' },
    { label: 'Current Semester', value: studentInfo.semester, desc: 'Div-A | Regular Track', icon: Calendar, color: 'indigo' },
    { label: 'Enrolled Subjects', value: `${studentInfo.totalSubjects} Subjects`, desc: 'Winter Term 2026', icon: Award, color: 'purple' },
  ];

  return (
    <div className="space-y-6">
      {/* Student Welcome Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-white via-white to-[#F3F7FE] border border-slate-200 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 border border-cyan-400/30 flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-cyan-500/20">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 font-manrope tracking-tight">
                Welcome, {studentInfo.name}
              </h1>
              <Badge variant="indigo">Verified Student</Badge>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              {studentInfo.program} • {studentInfo.semester} • Student ID: <span className="font-mono text-cyan-700 font-bold">{studentInfo.rollNumber}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            size="md"
            icon={<FileText className="w-4 h-4" />}
            onClick={() => setActiveView('hall-ticket')}
          >
            Hall Ticket
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={<Calendar className="w-4 h-4" />}
            onClick={() => setActiveView('timetable')}
          >
            View Timetable
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xl hover:border-cyan-500/40 transition">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" /> Active
                </span>
              </div>
              <div className="text-xl font-black text-slate-900 font-manrope mb-1 truncate">
                {card.value}
              </div>
              <div className="text-xs font-semibold text-slate-700">{card.label}</div>
              <div className="text-[11px] text-slate-600 mt-1 truncate">{card.desc}</div>
            </div>
          );
        })}
      </div>

      {/* Upcoming Examinations Card Section */}
      <Card
        title="Upcoming Examinations Schedule"
        subtitle="Conflicted-free exam hall seat allocations"
        icon={Clock}
        action={
          <Badge variant="indigo">{upcomingExams.length} Exams Scheduled</Badge>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {upcomingExams.map((exam) => (
            <div
              key={exam.id}
              className="p-5 rounded-2xl bg-[#F3F7FE] border border-slate-200 hover:border-cyan-500/40 transition group"
            >
              <div className="flex items-start justify-between mb-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-mono font-bold text-xs text-cyan-700 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      {exam.code}
                    </span>
                    <Badge variant="secondary" size="sm">{exam.type}</Badge>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-cyan-300 transition">
                    {exam.subjectName}
                  </h3>
                </div>
                <Badge variant="info">{exam.status}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                <div className="flex items-center space-x-2 text-slate-700">
                  <Calendar className="w-4 h-4 text-cyan-700 flex-shrink-0" />
                  <span>{exam.examDate}</span>
                </div>

                <div className="flex items-center space-x-2 text-slate-700">
                  <Clock className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <span>{exam.time}</span>
                </div>

                <div className="flex items-center space-x-2 text-slate-700">
                  <MapPin className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                  <span>{exam.room} ({exam.building})</span>
                </div>

                <div className="flex items-center space-x-2 font-mono text-amber-700 font-bold">
                  <FileText className="w-4 h-4 text-amber-700 flex-shrink-0" />
                  <span>{exam.seatNumber}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
