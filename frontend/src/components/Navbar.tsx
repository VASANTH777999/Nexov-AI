import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sparkles,
  Phone,
  MessageSquare,
  Users,
  Calendar,
  LayoutDashboard,
  Languages,
  Activity
} from 'lucide-react';

interface NavbarProps {
  onOpenPhone: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenPhone }) => {
  const location = useLocation();
  const pathname = location.pathname;

  const navItems = [
    { label: 'Home', href: '/', icon: Sparkles },
    { label: 'Gemini AI Chat', href: '/chat', icon: MessageSquare },
    { label: 'Specialists', href: '/doctors', icon: Users },
    { label: 'Appointments', href: '/appointments', icon: Calendar },
    { label: 'Operations', href: '/dashboard', icon: LayoutDashboard },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-400 via-indigo-500 to-fuchsia-500 p-0.5 shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-transform">
            <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan-300 animate-spin" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white font-sans">
                Nexov<span className="text-cyan-400">AI</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 font-mono border border-cyan-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Gemini Live Voice
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Multilingual Clinical Pavilion</p>
          </div>
        </Link>

        {/* Center Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800/80">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right CTA & Multilingual Indicator */}
        <div className="flex items-center gap-3">
          {/* Multilingual Pill */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 font-mono bg-slate-900/80 px-2.5 py-1.5 rounded-xl border border-slate-800">
            <Languages className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] text-slate-300">EN • తెలుగు • हिंदी • தமிழ்</span>
          </div>

          {/* Gemini Live Call Button */}
          <button
            onClick={onOpenPhone}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 hover:from-cyan-400 hover:to-fuchsia-400 text-white font-extrabold text-xs shadow-lg shadow-cyan-500/25 hover:scale-105 active:scale-95 transition-all"
          >
            <Phone className="w-3.5 h-3.5 fill-white animate-bounce" />
            <span>Gemini Live Call</span>
          </button>
        </div>
      </div>
    </header>
  );
};
