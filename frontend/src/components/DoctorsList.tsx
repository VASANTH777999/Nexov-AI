'use client';

import React, { useState } from 'react';
import { Doctor } from '../lib/types';
import { Star, Clock, MapPin, Calendar, CheckCircle2 } from 'lucide-react';

interface DoctorsListProps {
  doctors: Doctor[];
  onSelectDoctor?: (doctor: Doctor) => void;
  onCallForDoctor?: (doctor: Doctor) => void;
}

export const DoctorsList: React.FC<DoctorsListProps> = ({
  doctors,
  onSelectDoctor,
  onCallForDoctor,
}) => {
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('All');

  const specialties = ['All', 'Cardiologist', 'Dermatologist', 'Pediatrician', 'Neurologist', 'Orthopedic Surgeon', 'General Physician'];

  const filteredDoctors = selectedSpecialty === 'All'
    ? doctors
    : doctors.filter(d => d.specialty.toLowerCase() === selectedSpecialty.toLowerCase());

  return (
    <div className="w-full">
      {/* Category filter pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-4 scrollbar-none text-xs">
        {specialties.map((spec) => (
          <button
            key={spec}
            onClick={() => setSelectedSpecialty(spec)}
            className={`px-3 py-1.5 rounded-full transition-all whitespace-nowrap font-medium ${
              selectedSpecialty === spec
                ? 'bg-clinical-500 text-slate-950 font-semibold shadow-md shadow-clinical-500/20'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/40'
            }`}
          >
            {spec}
          </button>
        ))}
      </div>

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDoctors.map((doc) => (
          <div
            key={doc.id}
            className="group relative rounded-2xl glass-panel p-4 hover:border-clinical-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-clinical-950/30 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start gap-3.5">
                <img
                  src={doc.avatar_url || doc.avatar}
                  alt={doc.name}
                  className="w-14 h-14 rounded-xl object-cover border border-slate-700/60 shadow-inner group-hover:scale-105 transition-transform"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs px-2 py-0.5 rounded-md bg-clinical-500/10 text-clinical-400 font-medium">
                      {doc.specialty}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span className="font-semibold">{doc.rating}</span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-slate-100 text-sm mt-1 truncate">
                    {doc.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" /> {doc.experience}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                {doc.bio}
              </p>

              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-500" />
                  {doc.room}
                </span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" /> Slots Open
                </span>
              </div>
            </div>

            <div className="mt-3.5">
              <button
                onClick={() => onCallForDoctor?.(doc)}
                className="w-full py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-clinical-500 hover:text-slate-950 text-slate-200 text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5 border border-slate-700/50 hover:border-transparent shadow-sm"
              >
                <Calendar className="w-3.5 h-3.5" /> Book via AI Call
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

