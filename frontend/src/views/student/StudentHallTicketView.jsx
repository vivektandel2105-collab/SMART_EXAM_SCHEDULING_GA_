import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Download, Printer, ShieldCheck, GraduationCap, CheckCircle2 } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import PageHeader from '../../components/common/PageHeader';

export default function StudentHallTicketView() {
  const { user } = useAuth();
  const [downloading, setDownloading] = useState(false);

  const studentDetails = {
    name: user?.name || 'Registered Student',
    studentId: user?.roll_number || user?.id?.substring(0, 8).toUpperCase() || 'STU-REGISTERED',
    email: user?.email || '',
    course: 'B.Tech Computer Science and Engineering',
    semester: 'Semester 6',
    department: 'Computer Science & Engineering',
    academicYear: '2026-2027',
    hallTicketNo: `HT-2026-${user?.id?.substring(0, 4).toUpperCase() || '88F4'}`,
  };

  const hallTicketExams = [
    { code: 'CSE3001', name: 'Database Management Systems', date: 'Dec 10, 2026', time: '09:00 AM - 12:00 PM', room: 'A101', building: 'Main Block', seat: 'Desk A-14' },
    { code: 'CSE3002', name: 'Operating Systems', date: 'Dec 10, 2026', time: '02:00 PM - 05:00 PM', room: 'A102', building: 'Main Block', seat: 'Desk B-08' },
    { code: 'CSE3003', name: 'Computer Networks', date: 'Dec 11, 2026', time: '09:00 AM - 12:00 PM', room: 'A201', building: 'Main Block', seat: 'Desk C-22' },
    { code: 'CSE3004', name: 'Software Engineering & GA', date: 'Dec 12, 2026', time: '09:00 AM - 12:00 PM', room: 'A101', building: 'Main Block', seat: 'Desk A-14' },
  ];

  const handleDownloadPdf = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      window.print();
    }, 500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Official Examination Hall Ticket"
        subtitle="Verified admit card for Winter 2026 End-Semester Examinations"
      />

      {/* Download Action Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between">
        <div className="text-xs text-slate-700">
          Hall Ticket Status: <span className="text-emerald-700 font-bold">VERIFIED & ISSUED</span>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            size="sm"
            icon={<Printer className="w-3.5 h-3.5" />}
            onClick={() => window.print()}
          >
            Print Card
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={<Download className="w-3.5 h-3.5" />}
            onClick={handleDownloadPdf}
            disabled={downloading}
          >
            {downloading ? 'Generating PDF...' : 'Download Hall Ticket PDF'}
          </Button>
        </div>
      </div>

      {/* Official Hall Ticket Card UI */}
      <Card className="p-8 border-2 border-cyan-500/30 bg-gradient-to-b from-white to-[#F3F7FE] shadow-2xl relative">
        {/* Header Branding */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 border border-cyan-400/40 flex items-center justify-center text-cyan-700">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 font-manrope tracking-tight">
                Smart<span className="text-cyan-700">Exam</span> University
              </h1>
              <p className="text-xs text-slate-600 font-medium">Official End-Semester Examination Hall Ticket</p>
            </div>
          </div>

          <div className="text-right font-mono text-xs">
            <div className="text-slate-600">Ticket No:</div>
            <div className="font-bold text-cyan-700 text-sm">{studentDetails.hallTicketNo}</div>
          </div>
        </div>

        {/* Student Data Summary Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-6 border-b border-slate-200 text-xs">
          <div>
            <div className="text-slate-600 text-[10px] uppercase font-bold">Student Name</div>
            <div className="text-slate-900 font-bold text-sm mt-0.5">{studentDetails.name}</div>
          </div>

          <div>
            <div className="text-slate-600 text-[10px] uppercase font-bold">Student ID / Roll No</div>
            <div className="text-cyan-700 font-mono font-bold text-sm mt-0.5">{studentDetails.studentId}</div>
          </div>

          <div>
            <div className="text-slate-600 text-[10px] uppercase font-bold">Academic Program</div>
            <div className="text-slate-800 font-semibold mt-0.5">{studentDetails.course}</div>
          </div>

          <div>
            <div className="text-slate-600 text-[10px] uppercase font-bold">Department</div>
            <div className="text-slate-700 mt-0.5">{studentDetails.department}</div>
          </div>

          <div>
            <div className="text-slate-600 text-[10px] uppercase font-bold">Semester</div>
            <div className="text-indigo-700 font-bold mt-0.5">{studentDetails.semester}</div>
          </div>

          <div>
            <div className="text-slate-600 text-[10px] uppercase font-bold">Academic Session</div>
            <div className="text-slate-700 mt-0.5">{studentDetails.academicYear}</div>
          </div>
        </div>

        {/* Exam Roster Table */}
        <div className="py-6 space-y-3">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Approved Examination Schedule & Seating Desk Allocations
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#F3F7FE] border-b border-slate-200 text-slate-600 uppercase">
                <tr>
                  <th className="px-3 py-2.5">Code</th>
                  <th className="px-3 py-2.5">Subject Title</th>
                  <th className="px-3 py-2.5">Exam Date</th>
                  <th className="px-3 py-2.5">Time</th>
                  <th className="px-3 py-2.5">Hall</th>
                  <th className="px-3 py-2.5 text-right">Desk Seat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {hallTicketExams.map((ex, idx) => (
                  <tr key={idx} className="hover:bg-[#F3F7FE]/60">
                    <td className="px-3 py-2.5 text-cyan-700 font-bold">{ex.code}</td>
                    <td className="px-3 py-2.5 text-slate-900 font-sans font-semibold">{ex.name}</td>
                    <td className="px-3 py-2.5 text-slate-700 font-sans">{ex.date}</td>
                    <td className="px-3 py-2.5 text-indigo-700 font-sans">{ex.time}</td>
                    <td className="px-3 py-2.5 text-emerald-700 font-bold">{ex.room} ({ex.building})</td>
                    <td className="px-3 py-2.5 text-right text-amber-700 font-bold">{ex.seat}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Verification Seal Footer */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-600">
          <div className="flex items-center space-x-2 text-emerald-700 font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Digital Signature Verified • Controller of Examinations</span>
          </div>
          <div>SmartExam Automated Verification System</div>
        </div>
      </Card>
    </div>
  );
}
