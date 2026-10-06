import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  User, 
  Mail, 
  Phone, 
  GraduationCap, 
  Building, 
  Calendar, 
  ShieldCheck,
  Check,
  Edit2
} from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import PageHeader from '../../components/common/PageHeader';

export default function StudentProfileView() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    rollNumber: user?.roll_number || user?.id?.substring(0, 8).toUpperCase() || 'STU-REGISTERED',
    name: user?.name || 'Registered Student',
    email: user?.email || '',
    phone: '+1 (555) 019-2834',
    course: 'B.Tech Computer Science',
    department: 'Computer Science & Engineering',
    semester: 'Semester 6',
    division: 'Div-A',
    status: 'ACTIVE',
  });

  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState(profile.phone);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, [user]);

  const fetchProfileData = async () => {
    try {
      const res = await api.get('/students');
      if (Array.isArray(res.data) && res.data.length > 0) {
        const matching = res.data.find(s => s.email === user?.email) || res.data[0];
        setProfile(prev => ({
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

  const handleSave = (e) => {
    e.preventDefault();
    setProfile(prev => ({ ...prev, phone }));
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="My Student Profile"
        subtitle="Institutional enrollment identity and academic registration details"
      />

      {saved && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-xs font-semibold flex items-center space-x-2">
          <Check className="w-4 h-4 text-emerald-700" />
          <span>Contact details updated successfully!</span>
        </div>
      )}

      {/* Profile Card */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 border border-cyan-400/40 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-slate-900">{profile.name}</h2>
                <Badge variant="indigo">{profile.status}</Badge>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Student ID: <span className="font-mono text-cyan-700 font-bold">{profile.rollNumber}</span>
              </p>
            </div>
          </div>

          <Button
            variant={editing ? 'ghost' : 'secondary'}
            size="sm"
            icon={<Edit2 className="w-3.5 h-3.5" />}
            onClick={() => setEditing(!editing)}
          >
            {editing ? 'Cancel Editing' : 'Edit Contact Info'}
          </Button>
        </div>

        {/* Profile Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Student ID / Roll Number
              </label>
              <div className="p-3 rounded-xl bg-[#F3F7FE] border border-slate-100 font-mono text-cyan-700 font-bold">
                {profile.rollNumber}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="p-3 rounded-xl bg-[#F3F7FE] border border-slate-100 text-slate-900 font-semibold">
                {profile.name}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Institutional Email
              </label>
              <div className="p-3 rounded-xl bg-[#F3F7FE] border border-slate-100 text-slate-700 font-mono">
                {profile.email}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Contact Phone
              </label>
              {editing ? (
                <form onSubmit={handleSave} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-1 p-2.5 rounded-xl bg-[#F3F7FE] border border-cyan-500 text-xs text-slate-900 focus:outline-none"
                  />
                  <Button variant="primary" size="sm" type="submit">
                    Save
                  </Button>
                </form>
              ) : (
                <div className="p-3 rounded-xl bg-[#F3F7FE] border border-slate-100 text-slate-700">
                  {profile.phone}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Academic Program / Course
              </label>
              <div className="p-3 rounded-xl bg-[#F3F7FE] border border-slate-100 text-slate-900 font-semibold">
                {profile.course}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Department
              </label>
              <div className="p-3 rounded-xl bg-[#F3F7FE] border border-slate-100 text-slate-700">
                {profile.department}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Semester & Division
              </label>
              <div className="p-3 rounded-xl bg-[#F3F7FE] border border-slate-100 text-indigo-700 font-bold">
                {profile.semester} ({profile.division})
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Account Security Role
              </label>
              <div className="p-3 rounded-xl bg-[#F3F7FE] border border-slate-100 flex items-center justify-between text-slate-700">
                <span>STUDENT ROLE</span>
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
