import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HolographicOrb3D } from '../components/HolographicOrb3D';
import { Interactive3DCard } from '../components/Interactive3DCard';
import {
  Phone,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Languages,
  ArrowRight,
  Clock,
  Users,
  CalendarCheck,
  Activity,
  HeartPulse,
  Award,
  CheckCircle2,
  Cpu,
  Layers,
  MapPin,
  Stethoscope
} from 'lucide-react';

interface HomePageProps {
  onLaunchPhone: (prompt?: string | null) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onLaunchPhone }) => {
  const [agentState, setAgentState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('speaking');

  useEffect(() => {
    const states: ('idle' | 'listening' | 'thinking' | 'speaking')[] = [
      'speaking',
      'thinking',
      'listening',
      'idle',
    ];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % states.length;
      setAgentState(states[idx]);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const indianLanguages = [
    { name: 'Telugu', native: 'తెలుగు', sample: 'డాక్టర్ దేవి శెట్టి గారి అపాయింట్‌మెంట్ స్లాట్లు ఉన్నాయా?' },
    { name: 'Hindi', native: 'हिंदी', sample: 'नमस्ते, क्या मुझे कल डॉक्टर सैंड्रा ली का समय मिल सकता है?' },
    { name: 'Tamil', native: 'தமிழ்', sample: 'நாளை மருத்துவரை சந்திக்க நேரம் கிடைக்குமா?' },
    { name: 'Kannada', native: 'ಕನ್ನಡ', sample: 'ನಾಳೆ ವೈದ್ಯರ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಲಭ್ಯವಿದೆಯೇ?' },
    { name: 'English', native: 'Global', sample: 'Check available slots for Dr. Sanjay Gupta tomorrow.' },
  ];

  // 6 Real Hospital Specialty Wings with Realistic Imagery
  const clinicalWings = [
    {
      id: 'cardiology',
      name: 'Advanced Heart Institute',
      specialty: 'Cardiology',
      doctor: 'Dr. Devi Shetty',
      role: 'Chief Cardiac Surgeon',
      room: 'Room 302 • Heart Center',
      experience: '35+ years',
      accentColor: 'rose',
      gradient: 'from-rose-500/20 via-red-500/10 to-transparent',
      borderColor: 'border-rose-500/30',
      badgeColor: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
      image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
      facilityImage: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
      availableSlots: '3 slots today',
      description: 'Comprehensive cardiovascular surgery, valve repair, and coronary angiography under the guidance of Dr. Devi Shetty.',
    },
    {
      id: 'dermatology',
      name: 'Aesthetic & Clinical Dermatology',
      specialty: 'Dermatologist',
      doctor: 'Dr. Sandra Lee',
      role: 'Clinical & Cosmetic Specialist',
      room: 'Room 114 • Derma Suite',
      experience: '20+ years',
      accentColor: 'purple',
      gradient: 'from-purple-500/20 via-fuchsia-500/10 to-transparent',
      borderColor: 'border-purple-500/30',
      badgeColor: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
      image: 'https://images.unsplash.com/photo-1594824813583-16982998a4ff?auto=format&fit=crop&w=800&q=80',
      facilityImage: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80',
      availableSlots: '4 slots today',
      description: 'State-of-the-art dermatological consultations, laser therapeutics, and skin wellness by Dr. Sandra Lee.',
    },
    {
      id: 'pediatrics',
      name: 'Children’s Health & Wellness',
      specialty: 'Pediatrician',
      doctor: 'Dr. Harvey Karp',
      role: 'Lead Child Health Specialist',
      room: 'Room 205 • Kids Wellness',
      experience: '30+ years',
      accentColor: 'amber',
      gradient: 'from-amber-500/20 via-yellow-500/10 to-transparent',
      borderColor: 'border-amber-500/30',
      badgeColor: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
      image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=800&q=80',
      facilityImage: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=800&q=80',
      availableSlots: '2 slots today',
      description: 'Warm, developmental pediatric care, infant calming, and adolescent medicine spearheaded by Dr. Harvey Karp.',
    },
    {
      id: 'neurology',
      name: 'Neuroscience & Brain Institute',
      specialty: 'Neurologist',
      doctor: 'Dr. Sanjay Gupta',
      role: 'Senior Neurosurgeon & Researcher',
      room: 'Room 410 • Neuro Wing',
      experience: '25+ years',
      accentColor: 'cyan',
      gradient: 'from-cyan-500/20 via-sky-500/10 to-transparent',
      borderColor: 'border-cyan-500/30',
      badgeColor: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
      image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=800&q=80',
      facilityImage: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80',
      availableSlots: '5 slots today',
      description: 'Advanced neuroimaging, cerebrovascular care, and migraine solutions with Dr. Sanjay Gupta.',
    },
    {
      id: 'orthopedics',
      name: 'Joint Restoration & Sports Rehab',
      specialty: 'Orthopedic Surgeon',
      doctor: 'Dr. James Andrews',
      role: 'Chief Orthopedic Surgeon',
      room: 'Room 108 • Bone & Joint Clinic',
      experience: '40+ years',
      accentColor: 'emerald',
      gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
      borderColor: 'border-emerald-500/30',
      badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
      image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=800&q=80',
      facilityImage: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80',
      availableSlots: '3 slots today',
      description: 'World-renowned sports injury reconstruction, arthroscopic surgery, and knee replacement by Dr. James Andrews.',
    },
    {
      id: 'medicine',
      name: 'Internal Medicine & Diagnostics',
      specialty: 'General Physician',
      doctor: 'Dr. Siddhartha Mukherjee',
      role: 'Physician, Oncologist & Author',
      room: 'Room 101 • Primary Care',
      experience: '22+ years',
      accentColor: 'indigo',
      gradient: 'from-indigo-500/20 via-purple-500/10 to-transparent',
      borderColor: 'border-indigo-500/30',
      badgeColor: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=800&q=80',
      facilityImage: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=800&q=80',
      availableSlots: '4 slots today',
      description: 'Holistic clinical medicine, preventative health screenings, and complex diagnosis directed by Dr. Siddhartha Mukherjee.',
    },
  ];

  return (
    <div className="flex flex-col overflow-x-hidden w-full">
      {/* Hero Section with 3D Holographic Gemini Orb */}
      <section className="relative pt-8 pb-16 lg:pt-16 lg:pb-24 overflow-hidden border-b border-slate-800/80">
        {/* Colorful Multi-Glow Background Atmosphere */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-cyan-500/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-rose-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-900/90 text-cyan-400 text-xs font-mono border border-cyan-500/30 shadow-lg shadow-cyan-500/15">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                <span className="font-bold text-white">Google Gemini AI Voice Mode</span>
                <span className="text-slate-600">•</span>
                <span className="text-purple-300 font-semibold">Real-time Bi-directional STT &amp; TTS</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.12]">
                Talk Naturally to Your{' '}
                <span className="text-gradient-gemini">
                  AI Medical Receptionist
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                Experience next-generation patient communication powered by Google Gemini AI Voice Mode. Speak naturally in{' '}
                <strong className="text-cyan-300 font-semibold">Telugu (తెలుగు)</strong>,{' '}
                <strong className="text-purple-300 font-semibold">Hindi (हिंदी)</strong>, Tamil, or English.
                The agent intelligently understands clinical context, doctor specialties, and follow-ups. Callers are authenticated solely by their spoken phone number with mandatory verbal read-back confirmation.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => onLaunchPhone(null)}
                  className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 hover:from-cyan-400 hover:to-fuchsia-400 text-white font-extrabold text-sm shadow-xl shadow-cyan-500/25 hover:scale-105 active:scale-95 transition-all"
                >
                  <Sparkles className="w-5 h-5 text-yellow-300 animate-spin" />
                  <span>Start Gemini Live Call</span>
                </button>

                <Link
                  to="/chat"
                  className="flex items-center gap-2.5 px-6 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white font-semibold text-sm border border-slate-700/80 hover:border-cyan-500/50 transition-all shadow-md"
                >
                  <MessageSquare className="w-4 h-4 text-cyan-400" />
                  <span>Clinical AI Chat</span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </Link>
              </div>

              {/* Spoken Language Ticker */}
              <div className="pt-3">
                <p className="text-[11px] text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5 mb-2 font-semibold">
                  <Languages className="w-3.5 h-3.5 text-cyan-400" /> Auto-Detects Spoken Indian Dialects:
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {indianLanguages.map((l) => (
                    <button
                      key={l.name}
                      onClick={() => onLaunchPhone(null)}
                      className="group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 transition-all text-xs"
                      title={`Speak in ${l.name} (${l.native})`}
                    >
                      <span className="font-bold text-white group-hover:text-cyan-400 transition-colors">
                        {l.native}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">({l.name})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 3D Visualizer Column */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
              <div className="relative w-full max-w-[440px] aspect-square flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 via-purple-500/20 to-rose-500/20 rounded-full blur-3xl pointer-events-none" />

                <HolographicOrb3D
                  state={agentState}
                  speaker={agentState === 'speaking' ? 'agent' : agentState === 'listening' ? 'caller' : 'idle'}
                  className="w-full h-full"
                />

                {/* Status Float Badge */}
                <div className="absolute -bottom-2 px-5 py-2.5 rounded-2xl bg-slate-900/95 border border-cyan-500/30 shadow-2xl backdrop-blur-md flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
                  <div>
                    <p className="text-xs font-bold text-white capitalize flex items-center gap-1.5">
                      Gemini Voice AI: <span className="text-cyan-300 font-mono">{agentState}</span>
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Interactive 3D WebGL Soundwave Visualizer
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3D Interactive Clinical Specialty Wings Section */}
      <section className="py-16 lg:py-20 max-w-7xl mx-auto px-4 sm:px-6 w-full space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4 text-cyan-400" /> World-Class Clinical Faculty &amp; Wings
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            Explore Medical Departments in 3D
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Move your cursor over each specialty wing to experience real-time 3D tilt. Call Alex anytime to check live doctor slots or book your consultation.
          </p>
        </div>

        {/* 6 Interactive 3D Specialty Wing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clinicalWings.map((wing) => (
            <Interactive3DCard key={wing.id} maxTilt={7} className="h-full">
              <div
                className={`h-full p-6 rounded-3xl glass-panel relative overflow-hidden flex flex-col justify-between border ${wing.borderColor} hover:shadow-2xl transition-all duration-300`}
              >
                {/* Background Accent Gradient */}
                <div className={`absolute top-0 right-0 w-44 h-44 bg-gradient-to-bl ${wing.gradient} rounded-full blur-2xl pointer-events-none`} />

                <div className="space-y-4 relative z-10">
                  {/* Top Header: Specialty Badge & Available Slots */}
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${wing.badgeColor}`}>
                      {wing.specialty}
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {wing.availableSlots}
                    </span>
                  </div>

                  {/* Doctor & Facility Image Duo */}
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img
                        src={wing.image}
                        alt={wing.doctor}
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-700 shadow-lg"
                      />
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
                        <Award className="w-3 h-3 text-amber-400" />
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {wing.doctor}
                      </h3>
                      <p className="text-xs text-slate-300 font-medium">{wing.role}</p>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">{wing.experience}</p>
                    </div>
                  </div>

                  {/* Facility Name & Location */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">{wing.name}</h4>
                    <p className="text-[11px] text-cyan-400 font-mono flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> {wing.room}
                    </p>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                    {wing.description}
                  </p>
                </div>

                {/* Bottom Action Buttons */}
                <div className="pt-5 mt-4 border-t border-slate-800/80 flex items-center justify-between relative z-10">
                  <button
                    onClick={() => onLaunchPhone(null)}
                    className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-bold transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 fill-cyan-400" />
                    <span>Voice Consult</span>
                  </button>

                  <Link
                    to="/doctors"
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-white font-medium transition-colors"
                  >
                    <span>Full Schedule</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </Interactive3DCard>
          ))}
        </div>
      </section>

      {/* Gemini Voice Architecture Showcase Section */}
      <section className="py-16 bg-slate-950/60 border-y border-slate-800/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full space-y-12">
          <div className="text-center space-y-2 max-w-3xl mx-auto">
            <span className="text-xs font-mono text-purple-400 uppercase tracking-widest font-semibold">
              Clinical Voice Engineering
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              End-to-End Conversational Intelligence
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Bi-directional speech pipeline with pure spoken phone authentication and zero robotic tone.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Interactive3DCard maxTilt={6}>
              <div className="p-6 rounded-3xl glass-panel space-y-3 h-full border border-cyan-500/20 hover:border-cyan-500/50 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                  <Cpu className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">Google Gemini Voice Pipeline</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Real-time Speech-to-Text (STT) and human-like Text-to-Speech (TTS) with 1.4-second natural silence debouncing and half-duplex acoustic echo suppression.
                </p>
              </div>
            </Interactive3DCard>

            <Interactive3DCard maxTilt={6}>
              <div className="p-6 rounded-3xl glass-panel space-y-3 h-full border border-purple-500/20 hover:border-purple-500/50 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                  <Languages className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">Adaptive Indian Dialect AI</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Automatically detects spoken Telugu, Hindi, Tamil, and English. Answers in the exact language spoken without mid-sentence language mixing or robotic cadence.
                </p>
              </div>
            </Interactive3DCard>

            <Interactive3DCard maxTilt={6}>
              <div className="p-6 rounded-3xl glass-panel space-y-3 h-full border border-emerald-500/20 hover:border-emerald-500/50 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">Pure Spoken Authentication</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  No passwords, OTPs, or usernames. Patients are securely verified solely by the phone number they speak out loud, confirmed verbally by Alex before any booking or cancellation.
                </p>
              </div>
            </Interactive3DCard>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 px-6 text-center text-xs text-slate-500 font-mono mt-auto">
        NexovAI Health &amp; Medical Pavilion • Powered by Google Gemini AI Voice Mode • All Rights Reserved
      </footer>
    </div>
  );
};
