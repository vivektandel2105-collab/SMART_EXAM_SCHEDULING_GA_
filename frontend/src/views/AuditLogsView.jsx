import React, { useState } from 'react';
import { 
  BarChart2, 
  Search, 
  Filter, 
  ShieldCheck, 
  UserCheck, 
  Cpu, 
  Database, 
  Lock, 
  AlertCircle,
  Calendar,
  Clock
} from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import PageHeader from '../components/common/PageHeader';

export default function AuditLogsView() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const logs = [
    {
      id: 'log-101',
      timestamp: '2026-09-30 22:30:15',
      user: 'admin@smartexam.com',
      action: 'GA_SCHEDULER_RUN_COMPLETED',
      details: 'Executed Genetic Algorithm optimization run ID: ga-88f21. Fitness: 25, Hard Violations: 0.',
      ip: '192.168.1.10',
      category: 'SCHEDULER',
      status: 'SUCCESS'
    },
    {
      id: 'log-102',
      timestamp: '2026-09-30 22:15:40',
      user: 'admin@smartexam.com',
      action: 'TIMETABLE_VERSION_SAVED',
      details: 'Saved Timetable Version v1.0 with 142 exam room assignments.',
      ip: '192.168.1.10',
      category: 'TIMETABLE',
      status: 'SUCCESS'
    },
    {
      id: 'log-103',
      timestamp: '2026-09-30 21:50:02',
      user: 'examcell@smartexam.edu',
      action: 'AUTO_INVIGILATE_EXECUTE',
      details: 'Automatically allocated 68 faculty invigilators across 42 exam rooms.',
      ip: '192.168.1.45',
      category: 'INVIGILATION',
      status: 'SUCCESS'
    },
    {
      id: 'log-104',
      timestamp: '2026-09-30 20:12:18',
      user: 'admin@smartexam.com',
      action: 'EXCEL_IMPORT_DRY_RUN',
      details: 'Processed dry-run preview for student_enrollments.xlsx (2,450 records validated).',
      ip: '192.168.1.10',
      category: 'IMPORT',
      status: 'SUCCESS'
    },
    {
      id: 'log-105',
      timestamp: '2026-09-30 19:40:55',
      user: 'faculty@smartexam.edu',
      action: 'USER_LOGIN_SUCCESS',
      details: 'Authenticated via email/password authentication portal.',
      ip: '10.0.4.12',
      category: 'SECURITY',
      status: 'SUCCESS'
    }
  ];

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.details.toLowerCase().includes(search.toLowerCase()) ||
                          log.action.toLowerCase().includes(search.toLowerCase()) ||
                          log.user.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || log.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs & System Activity Roster"
        subtitle="Security events, GA solver execution trails, data imports, and administrative actions"
      />

      {/* Filter & Search Header Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search user, action or log details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F3F7FE] border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="p-2 bg-[#F3F7FE] border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="SCHEDULER">GA Scheduler</option>
            <option value="TIMETABLE">Timetable</option>
            <option value="INVIGILATION">Invigilation</option>
            <option value="IMPORT">Excel Import</option>
            <option value="SECURITY">Security & Auth</option>
          </select>
        </div>

        <div className="text-xs text-slate-600">
          Total Logs: <span className="font-bold text-slate-800">{filteredLogs.length}</span>
        </div>
      </div>

      {/* Audit Logs Table */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F3F7FE] border-b border-slate-200 text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Action Event</th>
                <th className="px-4 py-3">Details / Audit Payload</th>
                <th className="px-4 py-3">IP Address</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#F3F7FE]/60 transition">
                  <td className="px-4 py-3 text-slate-600 text-[11px] whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="px-4 py-3 font-semibold text-blue-600 font-sans">
                    {log.user}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="indigo" size="sm">{log.category}</Badge>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-800 text-[11px]">
                    {log.action}
                  </td>
                  <td className="px-4 py-3 text-slate-700 font-sans max-w-md truncate" title={log.details}>
                    {log.details}
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-[11px]">
                    {log.ip}
                  </td>
                  <td className="px-4 py-3 text-right font-sans">
                    <Badge variant="success" size="sm">{log.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
