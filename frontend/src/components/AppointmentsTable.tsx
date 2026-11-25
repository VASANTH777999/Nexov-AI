'use client';

import React from 'react';
import { Appointment } from '../lib/types';
import { Calendar, Clock, Phone, User, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface AppointmentsTableProps {
  appointments: Appointment[];
  highlightId?: string | null;
  onCancelClick?: (appointment: Appointment) => void;
}

export const AppointmentsTable: React.FC<AppointmentsTableProps> = ({
  appointments,
  highlightId,
  onCancelClick,
}) => {
  const formatPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return phone;
  };

  return (
    <div className="w-full overflow-hidden rounded-2xl glass-panel">
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-clinical-400" /> Live Appointments Roster
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time appointments booked and modified by callers via AI Voice Agent.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Sync
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/40">
              <th className="py-3 px-4 font-medium">Appointment ID</th>
              <th className="py-3 px-4 font-medium">Caller / Phone</th>
              <th className="py-3 px-4 font-medium">Doctor & Specialty</th>
              <th className="py-3 px-4 font-medium">Date & Slot</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {appointments.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                  No appointments found. Click &quot;Try Call&quot; to book your first appointment with the AI receptionist!
                </td>
              </tr>
            ) : (
              appointments.map((apt) => {
                const isHighlighted = highlightId && apt.id.includes(highlightId);
                const isConfirmed = apt.status === 'confirmed';
                const isCancelled = apt.status === 'cancelled';

                return (
                  <tr
                    key={apt.id}
                    className={`transition-colors duration-500 ${
                      isHighlighted
                        ? 'highlight-row bg-clinical-500/15'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3 px-4 font-mono text-slate-300 font-medium">
                      {apt.id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-medium text-slate-200">
                        <Phone className="w-3.5 h-3.5 text-clinical-400" />
                        <span className="font-mono">{formatPhone(apt.patient_phone)}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <User className="w-3 h-3 text-slate-500" />
                        {apt.patient_name || 'Caller'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-200">{apt.doctor_name}</div>
                      <div className="text-[11px] text-clinical-400">{apt.specialty}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-200 font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {apt.date}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {apt.time_slot}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {isConfirmed && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Confirmed
                        </span>
                      )}
                      {isCancelled && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <XCircle className="w-3 h-3" /> Cancelled
                        </span>
                      )}
                      {!isConfirmed && !isCancelled && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-700/40 text-slate-300">
                          {apt.status}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {isConfirmed && onCancelClick && (
                        <button
                          onClick={() => onCancelClick(apt)}
                          className="text-[11px] px-2 py-1 rounded-md text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-all"
                        >
                          Cancel via Call
                        </button>
                      )}
                      {isCancelled && (
                        <span className="text-[11px] text-slate-500 italic">Released</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

