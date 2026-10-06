import React from 'react';
import { Info, CheckCircle2, AlertTriangle, ShieldAlert, Clock, FileCheck } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import PageHeader from '../../components/common/PageHeader';

export default function StudentInstructionsView() {
  const instructions = [
    {
      title: 'Reporting Time & Entry',
      description: 'Students must report to their assigned examination hall at least 20 minutes prior to the commencement of the exam. Entry will be barred 15 minutes after start time.',
      icon: Clock,
      category: 'IMPORTANT'
    },
    {
      title: 'Mandatory Documents',
      description: 'Students must carry a printed copy of their official SmartExam Hall Ticket along with their physical University Student Identification Card.',
      icon: FileCheck,
      category: 'MANDATORY'
    },
    {
      title: 'Prohibited Items & Electronic Devices',
      description: 'Mobile phones, smartwatches, bluetooth earphones, programmable calculators, and unapproved study notes are strictly forbidden inside the exam hall.',
      icon: ShieldAlert,
      category: 'WARNING'
    },
    {
      title: 'Seating & Desk Compliance',
      description: 'Students must sit at the exact desk number allocated on their Hall Ticket (e.g. Desk A-14). Changing seating desks without invigilator approval is an offense.',
      icon: CheckCircle2,
      category: 'RULES'
    },
    {
      title: 'Answer Booklet & Stationery Rules',
      description: 'Use blue/black ballpoint pens for writing answers. Fill in your Roll Number, Subject Code, and Desk ID accurately on the front cover of the answer script.',
      icon: Info,
      category: 'GUIDELINES'
    }
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Examination Code of Conduct & Guidelines"
        subtitle="Mandatory rules, reporting times, and regulations for all students"
      />

      <div className="space-y-4">
        {instructions.map((inst, idx) => {
          const Icon = inst.icon;
          return (
            <Card key={idx} className="p-5 border hover:border-cyan-500/40 transition">
              <div className="flex items-start space-x-4">
                <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 flex-shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-slate-900">{inst.title}</h3>
                    <Badge variant={inst.category === 'WARNING' ? 'danger' : 'indigo'} size="sm">
                      {inst.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {inst.description}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
