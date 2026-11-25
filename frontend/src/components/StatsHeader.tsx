'use client';

import React from 'react';
import { DashboardStats } from '../lib/types';
import { PhoneCall, Users, CalendarCheck, Clock, Activity, Cpu, Sparkles } from 'lucide-react';

interface StatsHeaderProps {
  stats: DashboardStats;
  onTryCallClick: () => void;
  onResetClick: () => void;
}

export const StatsHeader: React.FC<StatsHeaderProps> = ({
  stats,
  onTryCallClick,
  onResetClick,
}) => {
  return (
    <div className="w-full space-y-4">
      {/* Top Banner with Brand and Try Call CTA */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 p-7 rounded-3xl glass-panel-elevated relative overflow-hidden border border-cyan-500/20">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-gradient-to-bl from-cyan-500/15 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-gradient-to-tr from-emerald-500/15 via-teal-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 text-xs font-mono border border-cyan-500/30">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>NexovAI Real-time Voice Intelligence</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Doctor Appointment Voice System
          </h1>
          <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Talk directly to Alex, our AI receptionist, to check doctor availability, book appointments, and cancel existing bookings.
            Caller identity is authenticated solely by spoken phone number with mandatory verbal read-back confirmation.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={onResetClick}
            className="px-4 py-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-all border border-slate-700/80 shadow-md"
            title="Reset database to clean mock data"
          >
            Reset Data
          </button>
          <button
            onClick={onTryCallClick}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 hover:from-cyan-400 hover:to-fuchsia-400 text-white font-extrabold text-sm shadow-xl shadow-cyan-500/25 hover:scale-105 active:scale-95 transition-all"
          >
            <PhoneCall className="w-4 h-4 animate-bounce fill-white" />
            <span>Try Call</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl glass-panel border border-slate-800 hover:border-cyan-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>Specialist Doctors</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{stats.total_doctors}</span>
            <span className="text-[11px] text-cyan-400 font-mono">Board Certified</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl glass-panel border border-slate-800 hover:border-sky-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>Today&apos;s Slots</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{stats.today_available_slots}</span>
            <span className="text-[11px] text-sky-400 font-mono">Real-time Open</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl glass-panel border border-slate-800 hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>Active Appointments</span>
            <CalendarCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400">{stats.active_appointments}</span>
            <span className="text-[11px] text-emerald-400 font-mono">Confirmed</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl glass-panel border border-slate-800 hover:border-purple-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>System Pipeline</span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xs font-mono font-bold text-purple-300">Pipecat + ElevenLabs</span>
          </div>
        </div>
      </div>
    </div>
  );
};
