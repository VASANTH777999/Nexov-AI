import React, { useState, useEffect } from 'react';
import { Doctor } from '../lib/types';
import { Interactive3DCard } from '../components/Interactive3DCard';
import {
  Users,
  Star,
  Clock,
  MapPin,
  PhoneCall,
  Search,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Calendar,
  Award,
  ArrowRight
} from 'lucide-react';

interface DoctorsPageProps {
  onLaunchPhone: (prompt?: string | null) => void;
}

export const DoctorsPage: React.FC<DoctorsPageProps> = ({ onLaunchPhone }) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [search, setSearch] = useState<string>('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('All');

  useEffect(() => {
    fetch('/api/doctors')
      .then((res) => res.json())
      .then((data) => setDoctors(data.doctors || []))
      .catch((err) => console.error(err));
  }, []);

  const specialties = [
    { label: 'All', color: 'from-slate-700 to-slate-900 border-slate-700' },
    { label: 'Cardiologist', color: 'from-rose-500 to-red-600 border-rose-500/40' },
    { label: 'Dermatologist', color: 'from-purple-500 to-fuchsia-600 border-purple-500/40' },
    { label: 'Pediatrician', color: 'from-amber-500 to-yellow-600 border-amber-500/40' },
    { label: 'Neurologist', color: 'from-cyan-500 to-sky-600 border-cyan-500/40' },
    { label: 'Orthopedic Surgeon', color: 'from-emerald-500 to-teal-600 border-emerald-500/40' },
    { label: 'General Physician', color: 'from-indigo-500 to-purple-600 border-indigo-500/40' },
  ];

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSpec =
      selectedSpecialty === 'All' ||
      doc.specialty.toLowerCase() === selectedSpecialty.toLowerCase();
    const matchesSearch =
      doc.name.toLowerCase().includes(search.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(search.toLowerCase()) ||
      doc.room.toLowerCase().includes(search.toLowerCase());
    return matchesSpec && matchesSearch;
  });

  const getSpecialtyBadge = (specialty: string) => {
    switch (specialty.toLowerCase()) {
      case 'cardiologist':
        return 'bg-rose-500/10 text-rose-300 border-rose-500/30';
      case 'dermatologist':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      case 'pediatrician':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'neurologist':
        return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
      case 'orthopedic surgeon':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
      default:
        return 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30';
    }
  };

  return (
    <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8 flex-1">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-8 rounded-3xl glass-panel-elevated relative overflow-hidden border border-cyan-500/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-cyan-500/15 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-spin" /> World-Renowned Medical Faculty
          </span>
          <h1 className="text-2xl md:text-4xl font-black text-white">
            Specialist Physicians &amp; Availability
          </h1>
          <p className="text-xs md:text-sm text-slate-300 max-w-xl leading-relaxed">
            Consult with top healthcare authorities. Use Google Gemini AI Voice Mode to check real-time slots and reserve your appointment with spoken phone authentication.
          </p>
        </div>

        <button
          onClick={() => onLaunchPhone(null)}
          className="relative z-10 flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 text-white font-extrabold text-xs shadow-xl shadow-cyan-500/25 hover:scale-105 active:scale-95 transition-all"
        >
          <PhoneCall className="w-4 h-4 fill-white" />
          <span>Launch Gemini Live Call</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Colorful Specialty Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          {specialties.map((s) => (
            <button
              key={s.label}
              onClick={() => setSelectedSpecialty(s.label)}
              className={`px-3.5 py-2 rounded-2xl transition-all whitespace-nowrap font-bold text-xs border ${
                selectedSpecialty === s.label
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-500 text-white border-cyan-400 shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border-slate-800'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search doctor, specialty, room..."
            className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
          />
        </div>
      </div>

      {/* 3D Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoctors.map((doc) => (
          <Interactive3DCard key={doc.id} maxTilt={6} className="h-full">
            <div className="p-6 rounded-3xl glass-panel h-full flex flex-col justify-between border border-slate-800 hover:border-cyan-500/40 hover:shadow-2xl transition-all duration-300 relative overflow-hidden group">
              <div>
                {/* Doctor Avatar & Badges */}
                <div className="flex items-start gap-4">
                  <div className="relative flex-shrink-0">
                    <img
                      src={doc.avatar_url || doc.avatar}
                      alt={doc.name}
                      className="w-18 h-18 rounded-2xl object-cover border-2 border-slate-700 shadow-md group-hover:border-cyan-400 transition-colors"
                      style={{ width: '4.5rem', height: '4.5rem' }}
                    />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-950 border border-amber-400/60 flex items-center justify-center">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getSpecialtyBadge(doc.specialty)}`}>
                        {doc.specialty}
                      </span>
                      <span className="text-xs text-amber-300 font-bold font-mono">
                        ★ {doc.rating}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white mt-1 group-hover:text-cyan-300 transition-colors truncate">
                      {doc.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5 font-mono">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{doc.experience} experience</span>
                    </div>
                  </div>
                </div>

                {/* Bio Description */}
                <p className="text-xs text-slate-300 mt-4 leading-relaxed line-clamp-3">
                  {doc.bio}
                </p>

                {/* Clinic Room Tag */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span className="flex items-center gap-1.5 text-cyan-400">
                    <MapPin className="w-3.5 h-3.5" /> {doc.room}
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Mon - Fri
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <button
                  onClick={() => onLaunchPhone(null)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white font-bold text-xs shadow-md shadow-cyan-500/20 active:scale-95 transition-all"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Voice Book with Alex</span>
                </button>

                <span className="text-[11px] text-slate-400 font-mono">
                  Room {doc.room.split(' ')[1] || 'Main'}
                </span>
              </div>
            </div>
          </Interactive3DCard>
        ))}
      </div>
    </main>
  );
};
