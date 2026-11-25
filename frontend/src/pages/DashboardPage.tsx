import React, { useState, useEffect } from 'react';
import { StatsHeader } from '../components/StatsHeader';
import { DoctorsList } from '../components/DoctorsList';
import { AppointmentsTable } from '../components/AppointmentsTable';
import { Doctor, Appointment, DashboardStats } from '../lib/types';
import { CheckCircle2, RefreshCw, Sparkles, Activity, Cpu, ShieldCheck } from 'lucide-react';

interface DashboardPageProps {
  onLaunchPhone: (prompt?: string | null) => void;
  highlightId?: string | null;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onLaunchPhone, highlightId }) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total_doctors: 6,
    today_available_slots: 36,
    active_appointments: 1,
    cancelled_appointments: 0,
    system_status: 'Operational',
    voice_pipeline: 'Pipecat 1.17 + Silero VAD + ElevenLabs',
    llm_engine: 'Nvidia NIM (Nemotron 3.5)',
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [dRes, aRes, sRes] = await Promise.all([
        fetch('/api/doctors'),
        fetch('/api/appointments'),
        fetch('/api/stats'),
      ]);
      if (dRes.ok) setDoctors((await dRes.json()).doctors || []);
      if (aRes.ok) setAppointments((await aRes.json()).appointments || []);
      if (sRes.ok) setStats(await sRes.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleReset = async () => {
    await fetch('/api/reset', { method: 'POST' });
    await loadData();
    setToastMessage('Database re-seeded with pristine clinical mock data.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6 flex-1">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-clinical-500 text-slate-950 font-bold text-xs shadow-xl shadow-clinical-500/30">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      <StatsHeader
        stats={stats}
        onTryCallClick={() => onLaunchPhone(null)}
        onResetClick={handleReset}
      />

      {/* Telemetry and System Health Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl glass-panel flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Voice Pipeline Engine</span>
            <p className="text-sm font-semibold text-white mt-1">Pipecat 1.17 + Silero VAD</p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-2xl glass-panel flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Nvidia NIM LLM</span>
            <p className="text-sm font-semibold text-white mt-1">nvidia/nemotron-3.5-bolt-e4b</p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
            <Cpu className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-2xl glass-panel flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Caller Identity Verification</span>
            <p className="text-sm font-semibold text-emerald-400 mt-1">Spoken Phone Confirmation</p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Live Appointments Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-clinical-400" /> Live Appointments Roster
          </h2>
          <button
            onClick={loadData}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        <AppointmentsTable
          appointments={appointments}
          highlightId={highlightId}
          onCancelClick={(apt) => {
            onLaunchPhone(`Please cancel my appointment for phone number ${apt.patient_phone}`);
          }}
        />
      </div>

      {/* Doctors Grid Preview */}
      <div className="space-y-3 pt-4">
        <h2 className="text-base font-bold text-white">Doctors On Duty</h2>
        <DoctorsList
          doctors={doctors}
          onCallForDoctor={(doc) => {
            onLaunchPhone(`I would like to book an appointment with ${doc.name} tomorrow.`);
          }}
        />
      </div>
    </main>
  );
};

