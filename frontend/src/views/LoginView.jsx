import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api, { formatApiError } from '../services/api';
import {
  Lock, Mail, User, ArrowRight, Sparkles, ShieldCheck, GraduationCap,
  UserCheck, CheckCircle2, FileText, Sun, Moon
} from 'lucide-react';

function Field({ icon: Icon, label, children, light }) {
  const inputClass = light
    ? 'w-full rounded-2xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 px-4 py-3.5 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 shadow-sm'
    : 'w-full rounded-2xl bg-[#050b1b] border border-slate-700/80 text-white placeholder-slate-500 px-4 py-3.5 text-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10';

  return (
    <div>
      <label className={`block text-[11px] font-bold tracking-[0.14em] uppercase mb-2 ${light ? 'text-slate-600' : 'text-slate-300'}`}>
        {label}
      </label>
      <div className="relative">
        <Icon className={`absolute left-3.5 top-3.5 w-4 h-4 pointer-events-none ${light ? 'text-slate-400' : 'text-slate-500'}`} />
        {React.cloneElement(children, { className: `${inputClass} pl-10 ${children.props.className || ''}` })}
      </div>
    </div>
  );
}

export default function LoginView() {
  const { login } = useAuth();
  const [portalTab, setPortalTab] = useState('admin');
  const [isRegistering, setIsRegistering] = useState(false);
  const [emailOrId, setEmailOrId] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [light, setLight] = useState(() => localStorage.getItem('smartexam_theme') === 'light');

  useEffect(() => {
    localStorage.setItem('smartexam_theme', light ? 'light' : 'dark');
  }, [light]);

  const clearMessages = () => { setError(''); setSuccessMsg(''); };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!emailOrId.trim() || !password) {
      setError(portalTab === 'student' ? 'Enter your Student ID/email and password.' : 'Enter your admin email and password.');
      return;
    }
    setLoading(true); clearMessages();
    try { await login(emailOrId.trim(), password); }
    catch (err) { setError(String(formatApiError(err))); }
    finally { setLoading(false); }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault(); clearMessages();
    if (![fullName, studentId, regEmail, regPassword, confirmPassword].every(v => v.trim())) {
      setError('Please complete every field.'); return;
    }
    if (regPassword !== confirmPassword) { setError('Password and confirm password do not match.'); return; }
    setLoading(true);
    try {
      await api.post('/auth/signup', {
        name: fullName.trim(), student_id: studentId.trim(), email: regEmail.trim().toLowerCase(),
        password: regPassword, confirm_password: confirmPassword,
      });
      setSuccessMsg('Account created. Sign in below with your new credentials.');
      setEmailOrId(regEmail.trim().toLowerCase());
      setIsRegistering(false);
      setFullName(''); setStudentId(''); setRegEmail(''); setRegPassword(''); setConfirmPassword('');
    } catch (err) { setError(String(formatApiError(err))); }
    finally { setLoading(false); }
  };

  const colors = light ? {
    page: 'bg-[#f6f8ff] text-slate-900',
    grid: 'opacity-35 bg-[linear-gradient(rgba(71,85,105,.07)_1px,transparent_1px),linear-gradient(90deg,rgba(71,85,105,.07)_1px,transparent_1px)]',
    glow: 'bg-[radial-gradient(circle_at_18%_20%,rgba(37,99,235,.15),transparent_32%),radial-gradient(circle_at_82%_80%,rgba(124,58,237,.13),transparent_34%)]',
    logoBox: 'bg-white',
    subtitle: 'text-slate-500',
    card: 'bg-white/95 border-slate-200 shadow-[0_24px_70px_rgba(51,65,85,.14)]',
    tabs: 'bg-slate-50 border-slate-200',
    inactiveTab: 'text-slate-500 hover:text-slate-800',
    divider: 'border-slate-200',
    iconBox: 'bg-slate-100 border-slate-200',
    title: 'text-slate-900',
    desc: 'text-slate-500',
    footer: 'text-slate-400',
  } : {
    page: 'bg-[#050812] text-white',
    grid: 'opacity-20 bg-[linear-gradient(rgba(148,163,184,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,.08)_1px,transparent_1px)]',
    glow: 'bg-[radial-gradient(circle_at_18%_20%,rgba(37,99,235,.24),transparent_32%),radial-gradient(circle_at_82%_80%,rgba(124,58,237,.22),transparent_34%)]',
    logoBox: 'bg-[#07101f]',
    subtitle: 'text-slate-400',
    card: 'bg-[#0b1424]/95 border-slate-700/70 shadow-2xl shadow-black/40',
    tabs: 'bg-[#07101e] border-slate-700/70',
    inactiveTab: 'text-slate-400 hover:text-white',
    divider: 'border-slate-700/70',
    iconBox: 'bg-slate-800 border-slate-700',
    title: 'text-white',
    desc: 'text-slate-400',
    footer: 'text-slate-500',
  };

  return (
    <main className={`min-h-screen ${colors.page} flex items-center justify-center px-4 py-8 sm:py-10 relative overflow-hidden font-sans transition-colors duration-300`}>
      <div className={`absolute inset-0 ${colors.glow} pointer-events-none transition-opacity duration-300`} />
      <div className={`absolute inset-0 ${colors.grid} bg-[size:48px_48px] pointer-events-none`} />

      <button
        type="button"
        onClick={() => setLight(v => !v)}
        aria-label={light ? 'Switch to dark theme' : 'Switch to light theme'}
        title={light ? 'Dark theme' : 'Light theme'}
        className={`fixed top-5 right-5 z-30 w-11 h-11 rounded-full border flex items-center justify-center transition-all shadow-lg ${light ? 'bg-white border-slate-200 text-violet-600 hover:bg-slate-50' : 'bg-[#101a2d] border-slate-700 text-amber-300 hover:bg-[#16233b]'}`}
      >
        {light ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
      </button>

      <section className="relative z-10 w-full max-w-[636px]">
        <div className="text-center mb-7">
          <div className={`mx-auto mb-3 w-16 h-16 rounded-[18px] bg-gradient-to-br from-cyan-400 to-violet-600 p-[1px] shadow-2xl ${light ? 'shadow-violet-300/30' : 'shadow-cyan-500/20'}`}>
            <div className={`w-full h-full rounded-[17px] ${colors.logoBox} flex items-center justify-center transition-colors`}>
              <Sparkles className="w-7 h-7 text-cyan-400" />
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-tight">Smart<span className="text-violet-500">Exam</span></h1>
          <p className={`mt-1 text-sm ${colors.subtitle}`}>Examination Management Platform</p>
        </div>

        <div className={`rounded-[28px] border backdrop-blur-xl p-5 sm:p-7 ${colors.card} transition-colors duration-300`}>
          {!isRegistering && (
            <div className={`grid grid-cols-2 gap-2 p-1 rounded-2xl border mb-7 ${colors.tabs}`}>
              <button type="button" onClick={() => { setPortalTab('admin'); clearMessages(); }} className={`py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition ${portalTab === 'admin' ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/20' : colors.inactiveTab}`}>
                <UserCheck className="w-4 h-4" /> Admin Login
              </button>
              <button type="button" onClick={() => { setPortalTab('student'); clearMessages(); }} className={`py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition ${portalTab === 'student' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20' : colors.inactiveTab}`}>
                <GraduationCap className="w-4 h-4" /> User Login
              </button>
            </div>
          )}

          <div className={`flex items-center gap-3 pb-5 border-b mb-6 ${colors.divider}`}>
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${colors.iconBox}`}>
              {isRegistering ? <User className="w-5 h-5 text-cyan-500" /> : portalTab === 'student' ? <GraduationCap className="w-5 h-5 text-cyan-500" /> : <ShieldCheck className="w-5 h-5 text-violet-500" />}
            </div>
            <div>
              <h2 className={`text-lg font-bold ${colors.title}`}>{isRegistering ? 'Create User Account' : portalTab === 'student' ? 'User Portal Sign In' : 'Admin Portal Sign In'}</h2>
              <p className={`text-xs mt-0.5 ${colors.desc}`}>{isRegistering ? 'Enter your own details to create an account.' : portalTab === 'student' ? 'Use the credentials you registered yourself.' : 'Use your existing administrator credentials.'}</p>
            </div>
          </div>

          {successMsg && <div className="mb-5 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-600 flex gap-2"><CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />{successMsg}</div>}
          {error && <div className="mb-5 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-600">{error}</div>}

          {!isRegistering ? (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <Field light={light} icon={Mail} label={portalTab === 'student' ? 'Student ID / Email' : 'Email Address'}>
                <input type="text" value={emailOrId} onChange={e => setEmailOrId(e.target.value)} placeholder={portalTab === 'student' ? 'Enter your Student ID or email' : 'Enter your admin email'} autoComplete="username" required />
              </Field>
              <Field light={light} icon={Lock} label="Password">
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" required />
              </Field>
              <button type="submit" disabled={loading} className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition disabled:opacity-50 ${portalTab === 'student' ? 'bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 shadow-lg shadow-cyan-500/20 text-white' : 'bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/20 text-white'}`}>
                {loading ? 'Signing in...' : portalTab === 'student' ? 'Sign In as User' : 'Sign In as Admin'} {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
              {portalTab === 'student' && <button type="button" onClick={() => { setIsRegistering(true); clearMessages(); }} className="w-full text-sm text-cyan-600 hover:text-cyan-700 font-semibold pt-1">New user? Create an account</button>}
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <Field light={light} icon={User} label="Full Name"><input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Enter your full name" autoComplete="name" required /></Field>
              <Field light={light} icon={FileText} label="Student ID / Roll Number"><input type="text" value={studentId} onChange={e => setStudentId(e.target.value)} placeholder="Enter your student ID / roll number" required /></Field>
              <Field light={light} icon={Mail} label="Email Address"><input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="Enter your email address" autoComplete="email" required /></Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field light={light} icon={Lock} label="Password"><input type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} placeholder="Create a password" autoComplete="new-password" required /></Field>
                <Field light={light} icon={Lock} label="Confirm Password"><input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm password" autoComplete="new-password" required /></Field>
              </div>
              <button type="submit" disabled={loading} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 shadow-lg shadow-cyan-500/20 font-bold text-sm flex items-center justify-center gap-2 text-white disabled:opacity-50">{loading ? 'Creating account...' : 'Create Account'} {!loading && <ArrowRight className="w-4 h-4" />}</button>
              <button type="button" onClick={() => { setIsRegistering(false); clearMessages(); }} className={`w-full text-sm font-semibold ${light ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-white'}`}>Already have an account? Sign In</button>
            </form>
          )}

          <div className={`mt-7 pt-4 border-t text-center text-[11px] ${colors.divider} ${colors.footer}`}>Select your portal to continue.</div>
        </div>
      </section>
    </main>
  );
}
