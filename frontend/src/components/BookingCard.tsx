'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle2, XCircle, Clock, User, Phone, MapPin } from 'lucide-react';

interface BookingCardProps {
  action: {
    tool: string;
    arguments: any;
    result: any;
  };
  onClose?: () => void;
}

export const BookingCard: React.FC<BookingCardProps> = ({ action, onClose }) => {
  const isBooking = action.tool === 'book_appointment';
  const isSuccess = action.result?.status === 'success';
  const data = action.result || {};

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 15 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className={`mx-3 my-2 p-3.5 rounded-2xl border ${
        isSuccess
          ? isBooking
            ? 'bg-gradient-to-br from-emerald-950/80 to-slate-900/90 border-emerald-500/40 text-emerald-100 shadow-lg shadow-emerald-950/50'
            : 'bg-gradient-to-br from-rose-950/80 to-slate-900/90 border-rose-500/40 text-rose-100 shadow-lg shadow-rose-950/50'
          : 'bg-gradient-to-br from-amber-950/80 to-slate-900/90 border-amber-500/40 text-amber-100'
      }`}
    >
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          {isSuccess ? (
            isBooking ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-400" />
            )
          ) : (
            <XCircle className="w-5 h-5 text-amber-400" />
          )}
          <span className="font-semibold text-xs tracking-wider uppercase text-white/90">
            {isBooking ? 'Appointment Confirmed' : 'Appointment Cancelled'}
          </span>
        </div>
        {data.appointment_id && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white/80">
            {data.appointment_id}
          </span>
        )}
      </div>

      <div className="mt-2.5 space-y-1.5 text-xs">
        {data.doctor_name && (
          <div className="flex items-center justify-between">
            <span className="text-white/60">Doctor:</span>
            <span className="font-medium text-white">{data.doctor_name}</span>
          </div>
        )}
        {data.specialty && (
          <div className="flex items-center justify-between">
            <span className="text-white/60">Specialty:</span>
            <span className="text-clinical-300 font-medium">{data.specialty}</span>
          </div>
        )}
        {data.date && (
          <div className="flex items-center justify-between">
            <span className="text-white/60 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Date:
            </span>
            <span className="font-medium text-white">{data.date}</span>
          </div>
        )}
        {data.time_slot && (
          <div className="flex items-center justify-between">
            <span className="text-white/60 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Time:
            </span>
            <span className="font-medium text-white">{data.time_slot}</span>
          </div>
        )}
        {data.patient_phone && (
          <div className="flex items-center justify-between">
            <span className="text-white/60 flex items-center gap-1">
              <Phone className="w-3 h-3" /> Verified Phone:
            </span>
            <span className="font-mono text-emerald-300">{data.formatted_phone || data.patient_phone}</span>
          </div>
        )}
        {data.room && (
          <div className="flex items-center justify-between">
            <span className="text-white/60 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Location:
            </span>
            <span className="text-white/80 text-[11px]">{data.room}</span>
          </div>
        )}
        {!isSuccess && data.message && (
          <div className="text-[11px] text-amber-200 mt-1 italic">
            {data.message}
          </div>
        )}
      </div>
    </motion.div>
  );
};

