import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  FileText, 
  Download, 
  Eye, 
  Table, 
  CheckCircle2, 
  BarChart3, 
  Building, 
  Users, 
  UserCheck, 
  ShieldAlert, 
  Sparkles,
  Printer
} from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import PageHeader from '../components/common/PageHeader';
import Modal from '../components/common/Modal';

export default function ReportsView() {
  const [previewReport, setPreviewReport] = useState(null);

  const reports = [
    {
      id: 'rpt-master',
      title: 'Complete Institution Timetable',
      description: 'Master schedule matrix covering all departments, rooms, slots, and invigilator assignments.',
      icon: Table,
      category: 'MASTER',
      formats: ['PDF', 'EXCEL', 'CSV']
    },
    {
      id: 'rpt-student',
      title: 'Student Exam Schedules',
      description: 'Individualized student hall tickets with exam dates, seating desks, and room locations.',
      icon: Users,
      category: 'ACADEMIC',
      formats: ['PDF', 'EXCEL']
    },
    {
      id: 'rpt-rooms',
      title: 'Room Allocation Roster',
      description: 'Room-by-room seating utilization, desk capacity layout, and slot occupancy matrix.',
      icon: Building,
      category: 'INFRASTRUCTURE',
      formats: ['PDF', 'EXCEL', 'CSV']
    },
    {
      id: 'rpt-faculty',
      title: 'Faculty Invigilation Duties',
      description: 'Faculty shift assignments, total invigilation hours, and co-invigilator duty rosters.',
      icon: UserCheck,
      category: 'FACULTY',
      formats: ['PDF', 'EXCEL']
    },
    {
      id: 'rpt-dept',
      title: 'Departmental Examination Schedule',
      description: 'Filtered schedule view per academic department (CSE, ECE, ME, EE, Civil).',
      icon: FileText,
      category: 'DEPARTMENT',
      formats: ['PDF', 'EXCEL', 'CSV']
    },
    {
      id: 'rpt-conflict',
      title: 'Constraint & Conflict Audit Report',
      description: 'Detailed zero-violation hard constraint proof and soft penalty optimization score breakdown.',
      icon: ShieldAlert,
      category: 'AUDIT',
      formats: ['PDF']
    },
    {
      id: 'rpt-ga',
      title: 'GA Solver Convergence Analytics',
      description: 'Generation-by-generation fitness evolution curve, mutation stats, and execution timing graph.',
      icon: BarChart3,
      category: 'OPTIMIZATION',
      formats: ['PDF', 'EXCEL']
    }
  ];

  const handleDownload = (reportTitle, format) => {
    alert(`Generating ${format} export for "${reportTitle}"...`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Export Center"
        subtitle="Generate, preview, and download institutional examination schedules in PDF, Excel, and CSV formats"
      />

      {/* Report Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((rpt) => {
          const Icon = rpt.icon;
          return (
            <Card key={rpt.id} className="p-6 flex flex-col justify-between hover:border-blue-500/40 transition group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                    <Icon className="w-5 h-5" />
                  </div>
                  <Badge variant="indigo" size="sm">{rpt.category}</Badge>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-300 transition">
                    {rpt.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {rpt.description}
                  </p>
                </div>
              </div>

              <div className="pt-6 mt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Available Formats:</span>
                  <div className="flex items-center space-x-1 font-mono font-bold text-[10px]">
                    {rpt.formats.map((fmt) => (
                      <span key={fmt} className="px-1.5 py-0.5 rounded bg-[#F3F7FE] border border-slate-200 text-slate-700">
                        {fmt}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    icon={<Eye className="w-3.5 h-3.5" />}
                    onClick={() => setPreviewReport(rpt)}
                  >
                    Preview
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    icon={<Download className="w-3.5 h-3.5" />}
                    onClick={() => handleDownload(rpt.title, 'PDF')}
                  >
                    Export PDF
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Report Preview Modal */}
      {previewReport && (
        <Modal
          isOpen={!!previewReport}
          onClose={() => setPreviewReport(null)}
          title={`Report Preview: ${previewReport.title}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#F3F7FE] border border-slate-200 flex items-center justify-between">
              <div className="text-xs text-slate-700">
                Generated from Active Published Schedule <span className="text-blue-600 font-mono font-bold">(v1.0 - Fall 2026)</span>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="secondary" size="sm" icon={<Printer className="w-3.5 h-3.5" />} onClick={() => window.print()}>
                  Print
                </Button>
                <Button variant="primary" size="sm" icon={<Download className="w-3.5 h-3.5" />} onClick={() => handleDownload(previewReport.title, 'EXCEL')}>
                  Download Excel
                </Button>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#F3F7FE] border border-slate-200 max-h-96 overflow-y-auto space-y-4 font-mono text-xs">
              <div className="flex justify-between border-b border-slate-200 pb-3 text-slate-600">
                <span>INSTITUTION: UNIVERSITY EXAM CELL</span>
                <span>DATE: {new Date().toLocaleDateString()}</span>
              </div>

              <div className="space-y-2 text-slate-800">
                <div className="font-bold text-blue-600 text-sm">{previewReport.title.toUpperCase()} - SUMMARY TABLE</div>
                <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-1">
                  <div>• Total Scheduled Examinations: 142 Exams</div>
                  <div>• Allocated Exam Halls / Rooms: 42 Rooms</div>
                  <div>• Participating Students: 2,450 Enrolled</div>
                  <div>• Assigned Invigilation Staff: 68 Faculty Members</div>
                  <div>• Hard Constraint Violations: 0 (Validated)</div>
                </div>

                <div className="text-slate-600 text-[11px] pt-2">
                  [Sample Records Table rendered for live report previewing...]
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
