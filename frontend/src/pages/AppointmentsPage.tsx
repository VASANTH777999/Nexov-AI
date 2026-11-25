import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { AppointmentsTable } from '../components/AppointmentsTable';
import { Interactive3DCard } from '../components/Interactive3DCard';
import { Appointment } from '../lib/types';
import {
  Calendar,
  Phone,
  Search,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Activity
} from 'lucide-react';

interface AppointmentsPageProps {
  onLaunchPhone: (prompt?: string | null) => void;
  highlightId?: string | null;
}

export const AppointmentsPage: React.FC<AppointmentsPageProps> = ({ onLaunchPhone, highlightId }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [phoneSearch, setPhoneSearch] = useState<string>('');
  const [prevCount, setPrevCount] = useState<number>(0);

  const loadAppointments = async () => {
    try {
      const res = await fetch('/api/appointments');
      if (res.ok) {
        const data = await res.json();
        const apts: Appointment[] = data.appointments || [];
        setAppointments(apts);

        // Fire celebratory confetti if a new appointment was booked!
        if (prevCount > 0 && apts.length > prevCount) {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#2dd4bf', '#38bdf8', '#c084fc', '#fbbf24'],
          });
        }
        setPrevCount(apts.length);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadAppointments();
    const interval = setInterval(loadAppointments, 4000);
    return () => clearInterval(interval);
  }, [prevCount]);

  const filteredAppointments = appointments.filter((a) => {
    if (!phoneSearch.trim()) return true;
    const cleanSearch = phoneSearch.replace(/\D/g, '');
    const cleanPhone = a.patient_phone.replace(/\D/g, '');
    return cleanPhone.includes(cleanSearch) || a.doctor_name.toLowerCase().includes(phoneSearch.toLowerCase());
  });

  const confirmedCount = appointments.filter((a) => a.status === 'confirmed').length;
  const cancelledCount = appointments.filter((a) => a.status === 'cancelled').length;

  return (
    <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8 flex-1">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-8 rounded-3xl glass-panel-elevated relative overflow-hidden border border-cyan-500/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-emerald-500/15 via-cyan-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest font-semibold flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> Real-time Clinical Schedule
          </span>
          <h1 className="text-2xl md:text-4xl font-black text-white">
            Patient Appointments &amp; Live Registry
          </h1>
          <p className="text-xs md:text-sm text-slate-300 max-w-xl leading-relaxed">
            Live synchronized record of all doctor consultations. Callers authenticate solely by their spoken phone number with mandatory verbal read-back confirmation.
          </p>
        </div>

        <button
          onClick={() => onLaunchPhone(null)}
          className="relative z-10 flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 text-slate-950 font-extrabold text-xs shadow-xl shadow-emerald-500/25 hover:scale-105 active:scale-95 transition-all"
        >
          <Phone className="w-4 h-4 fill-slate-950" />
          <span>Book or Cancel via Voice Call</span>
        </button>
      </div>

      {/* 3D KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Interactive3DCard maxTilt={5}>
          <div className="p-5 rounded-3xl glass-panel border border-slate-800 hover:border-cyan-500/30 transition-all">
            <span className="text-xs text-slate-400 font-mono">Total Bookings</span>
            <div className="text-3xl font-extrabold text-white mt-1.5">{appointments.length}</div>
            <div className="text-[11px] text-cyan-400 font-mono mt-1 flex items-center gap-1">
              <Activity className="w-3 h-3" /> Live Registry Sync
            </div>
          </div>
        </Interactive3DCard>

        <Interactive3DCard maxTilt={5}>
          <div className="p-5 rounded-3xl glass-panel border border-slate-800 hover:border-emerald-500/30 transition-all">
            <span className="text-xs text-slate-400 font-mono">Active Confirmed</span>
            <div className="text-3xl font-extrabold text-emerald-400 mt-1.5">{confirmedCount}</div>
            <div className="text-[11px] text-emerald-400 font-mono mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Ready for consultation
            </div>
          </div>
        </Interactive3DCard>

        <Interactive3DCard maxTilt={5}>
          <div className="p-5 rounded-3xl glass-panel border border-slate-800 hover:border-rose-500/30 transition-all">
            <span className="text-xs text-slate-400 font-mono">Cancelled / Released</span>
            <div className="text-3xl font-extrabold text-rose-400 mt-1.5">{cancelledCount}</div>
            <div className="text-[11px] text-rose-400 font-mono mt-1 flex items-center gap-1">
              <XCircle className="w-3 h-3" /> Slots restored to pool
            </div>
          </div>
        </Interactive3DCard>

        <Interactive3DCard maxTilt={5}>
          <div className="p-5 rounded-3xl glass-panel border border-slate-800 hover:border-purple-500/30 transition-all">
            <span className="text-xs text-slate-400 font-mono">Authentication Mode</span>
            <div className="text-xs font-mono font-bold text-purple-300 mt-2">Spoken Phone Number</div>
            <div className="text-[11px] text-purple-400 font-mono mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Verbal Read-Back Confirmed
            </div>
          </div>
        </Interactive3DCard>
      </div>

      {/* Search Bar & Refresh */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={phoneSearch}
            onChange={(e) => setPhoneSearch(e.target.value)}
            placeholder="Search by phone number or doctor name..."
            className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
          />
        </div>

        <button
          onClick={loadAppointments}
          className="p-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all shadow-md"
          title="Refresh Schedule"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Appointments Data Table */}
      <div className="rounded-3xl glass-panel overflow-hidden border border-slate-800 shadow-xl">
        <AppointmentsTable
          appointments={filteredAppointments}
          highlightId={highlightId}
          onCancel={loadAppointments}
        />
      </div>
    </main>
  );
};
