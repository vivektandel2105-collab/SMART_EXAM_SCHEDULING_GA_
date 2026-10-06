import React, { useState } from 'react';
import { 
  UserCheck, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  FileCheck, 
  Download, 
  CheckCircle2,
  Bell
} from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import PageHeader from '../components/common/PageHeader';

export default function FacultyPortalView() {
  const [activeTab, setActiveTab] = useState('upcoming');

  const invigilationDuties = [
    {
      id: 'duty-1',
      subjectCode: 'CS401',
      subjectName: 'Design & Analysis of Algorithms',
      date: 'Oct 14, 2026',
      time: '09:00 AM - 12:00 PM',
      room: 'Hall A-101',
      building: 'Main Block',
      studentCount: 60,
      coInvigilator: 'Prof. Robert Vance',
      status: 'ASSIGNED',
      role: 'Chief Invigilator'
    },
    {
      id: 'duty-2',
      subjectCode: 'EE302',
      subjectName: 'Control Systems Engineering',
      date: 'Oct 17, 2026',
      time: '02:00 PM - 05:00 PM',
      room: 'Hall B-204',
      building: 'Engineering Wing',
      studentCount: 45,
      coInvigilator: 'Dr. Anita Sharma',
      status: 'ASSIGNED',
      role: 'Assistant Invigilator'
    },
    {
      id: 'duty-3',
      subjectCode: 'EC205',
      subjectName: 'Digital Signal Processing',
      date: 'Oct 20, 2026',
      time: '09:00 AM - 12:00 PM',
      room: 'Hall C-102',
      building: 'Electronics Block',
      studentCount: 55,
      coInvigilator: 'Prof. Marcus Brody',
      status: 'CONFIRMED',
      role: 'Chief Invigilator'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Faculty Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-50 via-white to-orange-50 border border-blue-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-600 flex-shrink-0">
            <UserCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black text-slate-900 font-manrope">Faculty Invigilation Roster</h1>
              <Badge variant="purple">Exam Cell Roster</Badge>
            </div>
            <p className="text-xs text-slate-700 mt-1">
              Faculty ID: <span className="font-mono text-purple-600 font-bold">FAC-2026-88</span> | Dept: Computer Science & Engineering
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          icon={<Download className="w-4 h-4" />}
          onClick={() => alert('Exporting duty roster PDF...')}
        >
          Export Duty Schedule (PDF)
        </Button>
      </div>

      {/* Duty Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="p-5 border border-slate-200">
          <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Total Assigned Shifts</div>
          <div className="text-3xl font-black text-slate-900">3 Shifts</div>
          <p className="text-[11px] text-slate-600 mt-1">Mid-term Fall 2026 Examinations</p>
        </Card>

        <Card className="p-5 border border-slate-200">
          <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Students Supervised</div>
          <div className="text-3xl font-black text-purple-600">160 Students</div>
          <p className="text-[11px] text-slate-600 mt-1">Across 3 examination halls</p>
        </Card>

        <Card className="p-5 border border-slate-200">
          <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Roster Compliance</div>
          <div className="text-3xl font-black text-emerald-700">100%</div>
          <p className="text-[11px] text-slate-600 mt-1">Zero consecutive shift conflicts</p>
        </Card>
      </div>

      {/* Roster Cards List */}
      <Card className="p-6">
        <div className="flex items-center justify-between pb-5 border-b border-slate-200 mb-5">
          <div>
            <h3 className="text-base font-bold text-slate-900">Assigned Invigilation Duties</h3>
            <p className="text-xs text-slate-600">Please report 20 minutes prior to exam commencement at the Exam Control Office</p>
          </div>
          <Badge variant="success">Auto-Assigned by GA</Badge>
        </div>

        <div className="space-y-4">
          {invigilationDuties.map((duty) => (
            <div key={duty.id} className="p-5 rounded-2xl bg-[#F3F7FE] border border-slate-200 hover:border-purple-500/40 transition">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-mono font-bold text-xs text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                      {duty.subjectCode}
                    </span>
                    <Badge variant="indigo" size="sm">{duty.role}</Badge>
                  </div>
                  <h4 className="text-base font-bold text-slate-900">{duty.subjectName}</h4>
                </div>

                <Badge variant={duty.status === 'CONFIRMED' ? 'success' : 'warning'}>
                  {duty.status}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs pt-4">
                <div className="flex items-center space-x-2 text-slate-700">
                  <Calendar className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-600">Date</div>
                    <div className="font-semibold">{duty.date}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-slate-700">
                  <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-600">Session Time</div>
                    <div className="font-semibold">{duty.time}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-slate-700">
                  <MapPin className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-600">Location</div>
                    <div className="font-semibold">{duty.room}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-slate-700">
                  <Users className="w-4 h-4 text-amber-700 flex-shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-600">Seating & Co-Invigilator</div>
                    <div className="font-semibold">{duty.studentCount} Students ({duty.coInvigilator})</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
