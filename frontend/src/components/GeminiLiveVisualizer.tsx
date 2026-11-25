'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface GeminiLiveVisualizerProps {
  state?: 'idle' | 'listening' | 'thinking' | 'speaking';
  speaker?: 'caller' | 'agent' | 'idle';
  language?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  realDecibel?: number; // 0 to 100
}

export const GeminiLiveVisualizer: React.FC<GeminiLiveVisualizerProps> = ({
  state = 'idle',
  speaker = 'idle',
  language = 'English',
  size = 'md',
  realDecibel = 0,
}) => {
  const isSpeaking = speaker === 'agent' || state === 'speaking';
  const isListening = speaker === 'caller' || state === 'listening';
  const isThinking = state === 'thinking';

  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-48 h-48',
    lg: 'w-72 h-72',
    xl: 'w-96 h-96',
  }[size];

  // Additional scale if real mic decibel is detected
  const audioDecibelBoost = realDecibel > 0 ? (realDecibel / 100) * 0.35 : 0;

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer ambient multi-coloured glowing aura */}
      <div
        className={`absolute rounded-full blur-[70px] transition-all duration-700 pointer-events-none ${
          isSpeaking
            ? 'w-80 h-80 bg-gradient-to-tr from-cyan-500/40 via-purple-600/35 to-rose-500/35 opacity-100 scale-125'
            : isListening
            ? 'w-80 h-80 bg-gradient-to-tr from-teal-400/40 via-sky-500/35 to-indigo-600/35 opacity-95 scale-115'
            : isThinking
            ? 'w-80 h-80 bg-gradient-to-tr from-purple-500/40 via-indigo-500/40 to-cyan-400/40 opacity-100 animate-spin'
            : 'w-60 h-60 bg-slate-800/25 opacity-50'
        }`}
      />

      {/* Dynamic Concentric Multi-color Soundwave Rings */}
      <div className={`relative ${sizeClasses} flex items-center justify-center`}>
        {/* Ring 1 - Deep Pulse */}
        <motion.div
          animate={{
            scale: isSpeaking
              ? [1 + audioDecibelBoost, 1.28 + audioDecibelBoost, 1 + audioDecibelBoost]
              : isListening
              ? [1 + audioDecibelBoost, 1.18 + audioDecibelBoost, 1 + audioDecibelBoost]
              : isThinking
              ? [1, 1.12, 1]
              : [1, 1.04, 1],
            rotate: isThinking ? [0, 360] : isSpeaking ? [0, 180, 360] : [0, 90, 0],
            borderRadius: [
              '42% 58% 70% 30% / 45% 45% 55% 55%',
              '58% 42% 38% 62% / 55% 65% 35% 45%',
              '42% 58% 70% 30% / 45% 45% 55% 55%',
            ],
          }}
          transition={{
            duration: isSpeaking ? 3.0 : isThinking ? 2.2 : 6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute inset-0 bg-gradient-to-tr from-cyan-400 via-sky-400 to-indigo-600 opacity-85 blur-[2px] shadow-2xl shadow-cyan-500/40"
        />

        {/* Ring 2 - Radiant Core */}
        <motion.div
          animate={{
            scale: isSpeaking
              ? [1.12 + audioDecibelBoost, 0.94, 1.12 + audioDecibelBoost]
              : isListening
              ? [1.08 + audioDecibelBoost, 0.96, 1.08 + audioDecibelBoost]
              : [1, 0.96, 1],
            rotate: isThinking ? [360, 0] : [-45, 45, -45],
            borderRadius: [
              '50% 50% 40% 60% / 60% 40% 60% 40%',
              '40% 60% 50% 50% / 40% 60% 40% 60%',
              '50% 50% 40% 60% / 60% 40% 60% 40%',
            ],
          }}
          transition={{
            duration: isSpeaking ? 2.4 : 5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute inset-2 bg-gradient-to-br from-fuchsia-500 via-purple-500 to-teal-300 opacity-80 blur-[1px] mix-blend-screen"
        />

        {/* Ring 3 - Outer Ripple on Voice Activity */}
        {(isSpeaking || isListening) && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0.8 }}
            animate={{ scale: 1.6, opacity: 0 }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: 'easeOut',
            }}
            className="absolute inset-[-15%] rounded-full border-2 border-cyan-400/50 pointer-events-none"
          />
        )}

        {/* Center Hologram Core with Gemini Spark */}
        <div className="relative z-10 w-20 h-20 rounded-full bg-slate-950/85 backdrop-blur-xl border border-white/40 flex flex-col items-center justify-center shadow-inner">
          <div
            className={`w-4 h-4 rounded-full shadow-[0_0_20px_#38bdf8] ${
              isSpeaking
                ? 'bg-rose-400 animate-pulse'
                : isListening
                ? 'bg-teal-400 animate-ping'
                : isThinking
                ? 'bg-purple-400 animate-spin'
                : 'bg-cyan-400 animate-pulse'
            }`}
          />
          <span className="text-[10px] font-mono text-white/95 font-bold tracking-widest uppercase mt-1">
            {isSpeaking ? 'Speaking' : isListening ? 'Listening' : isThinking ? 'Thinking' : 'Gemini AI'}
          </span>
          {language && (
            <span className="text-[8px] text-cyan-300/80 font-mono mt-0.5">
              {language}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
