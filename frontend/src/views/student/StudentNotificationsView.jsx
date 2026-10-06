import React from 'react';
import { Bell, CheckCircle2, AlertCircle, Calendar, FileText, Info } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import PageHeader from '../../components/common/PageHeader';

export default function StudentNotificationsView() {
  const notifications = [
    {
      id: 'notif-1',
      title: 'Winter 2026 Examination Schedule Published',
      message: 'The official End-Semester exam timetable matrix has been published by the University Exam Cell.',
      time: '2 hours ago',
      category: 'TIMETABLE',
      type: 'INFO',
      unread: true
    },
    {
      id: 'notif-2',
      title: 'Hall Ticket Verification & PDF Download Open',
      message: 'Your official examination hall ticket (HT-2026-88F4) is now ready for download.',
      time: '1 day ago',
      category: 'HALL TICKET',
      type: 'SUCCESS',
      unread: true
    },
    {
      id: 'notif-3',
      title: 'Exam Hall Desk Allocation Confirmed',
      message: 'Desk assignments for Computer Science core exams have been assigned (Desk A-14 in Hall A101).',
      time: '2 days ago',
      category: 'SEATING',
      type: 'INFO',
      unread: false
    }
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Student Notifications & System Alerts"
        subtitle="Timetable announcements, hall ticket updates, and exam hall notices"
      />

      <div className="space-y-3">
        {notifications.map((n) => (
          <Card key={n.id} className={`p-5 ${n.unread ? 'border-cyan-500/40 bg-[#F3F7FE]' : 'bg-white'}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start space-x-3.5">
                <div className={`p-2.5 rounded-xl flex-shrink-0 ${n.type === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-700' : 'bg-cyan-500/10 text-cyan-700'}`}>
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-slate-900">{n.title}</h3>
                    <Badge variant="indigo" size="sm">{n.category}</Badge>
                    {n.unread && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>}
                  </div>
                  <p className="text-xs text-slate-700 mt-1">{n.message}</p>
                  <span className="text-[10px] text-slate-500 mt-2 block font-mono">{n.time}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
