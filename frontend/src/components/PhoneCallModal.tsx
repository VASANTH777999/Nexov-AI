'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  Send,
  User,
  ShieldCheck,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { AudioWaveform } from './AudioWaveform';
import { BookingCard } from './BookingCard';
import { TranscriptMessage } from '../lib/types';
import { sounds } from '../lib/soundEffects';

interface PhoneCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActionExecuted?: (action: any) => void;
  prefilledPrompt?: string | null;
}

type CallState = 'ringing' | 'connected' | 'ended';

export const PhoneCallModal: React.FC<PhoneCallModalProps> = ({
  isOpen,
  onClose,
  onActionExecuted,
  prefilledPrompt,
}) => {
  const [callState, setCallState] = useState<CallState>('ringing');
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState<boolean>(true);
  const [currentSpeaker, setCurrentSpeaker] = useState<'caller' | 'agent' | 'idle'>('idle');
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [lastAction, setLastAction] = useState<any | null>(null);

  const transcriptBottomRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callState === 'connected') {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState]);

  // Scroll transcript to bottom
  useEffect(() => {
    transcriptBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, lastAction]);

  // Setup Web Speech API for microphone input
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const lastResult = event.results[event.results.length - 1];
          if (lastResult.isFinal) {
            const text = lastResult[0].transcript.trim();
            if (text) {
              handleUserUtterance(text);
            }
          }
        };

        recognition.onerror = (err: any) => {
          console.warn('Speech recognition error:', err);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  // Voice synthesis helper
  const speakText = (text: string) => {
    if (!isSpeakerOn || typeof window === 'undefined') return;
    try {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*_#]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      // Select warm natural voice if available
      const voices = window.speechSynthesis.getVoices();
      const naturalVoice = voices.find(
        (v) => (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Jenny')) && v.lang.startsWith('en')
      );
      if (naturalVoice) {
        utterance.voice = naturalVoice;
      }

      utterance.onstart = () => setCurrentSpeaker('agent');
      utterance.onend = () => setCurrentSpeaker('idle');
      utterance.onerror = () => setCurrentSpeaker('idle');

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('TTS error:', e);
    }
  };

  // Connect call & initialize
  useEffect(() => {
    if (!isOpen) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      if (typeof window !== 'undefined') {
        window.speechSynthesis?.cancel();
      }
      sounds.stopRinging();
      setCallState('ringing');
      setCallDuration(0);
      setTranscript([]);
      setLastAction(null);
      return;
    }

    // Play ringing tone
    sounds.startRinging();
    setCallState('ringing');
    setCallDuration(0);

    // Simulate phone connect delay (1.8 seconds)
    const connectTimer = setTimeout(() => {
      sounds.playConnectChime();
      setCallState('connected');

      const greetingText =
        "Hello! Thank you for calling NexovAI Medical Clinic. My name is Alex. How can I help you today?";
      const initialMsg: TranscriptMessage = {
        id: 'msg-1',
        speaker: 'agent',
        text: greetingText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setTranscript([initialMsg]);
      speakText(greetingText);

      // Start mic if not muted
      if (recognitionRef.current && !isMuted) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (e) {}
      }

      // If prefilled prompt was passed, execute it
      if (prefilledPrompt) {
        setTimeout(() => {
          handleUserUtterance(prefilledPrompt);
        }, 1200);
      }
    }, 1800);

    return () => {
      clearTimeout(connectTimer);
      sounds.stopRinging();
    };
  }, [isOpen]);

  const handleEndCall = () => {
    sounds.playEndCallChime();
    if (typeof window !== 'undefined') {
      window.speechSynthesis?.cancel();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
      } catch (e) {}
    }
    setCallState('ended');
  };

  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (e) {}
      }
    } else {
      setIsMuted(true);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          setIsListening(false);
        } catch (e) {}
      }
    }
  };

  const handleToggleSpeaker = () => {
    if (isSpeakerOn) {
      if (typeof window !== 'undefined') {
        window.speechSynthesis?.cancel();
      }
      setIsSpeakerOn(false);
    } else {
      setIsSpeakerOn(true);
    }
  };

  const handleUserUtterance = async (userText: string) => {
    if (!userText.trim()) return;

    setCurrentSpeaker('caller');
    const userMsg: TranscriptMessage = {
      id: `user-${Date.now()}`,
      speaker: 'caller',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setTranscript((prev) => [...prev, userMsg]);
    setInputValue('');

    try {
      // Build conversation history for API
      const conversationHistory = transcript.map((m) => ({
        role: m.speaker === 'caller' ? 'user' : 'assistant',
        content: m.text,
      }));
      conversationHistory.push({ role: 'user', content: userText });

      // Call LLM API (supports local FastAPI and Next.js Vercel serverless)
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonBodyOrFallback(conversationHistory, userText),
      });

      if (!res.ok) {
        throw new Error(`API returned ${res.status}`);
      }

      const data = await res.json();
      const agentReply = data.reply || "I'm right here with you. How can I assist with your appointment?";
      const action = data.action;

      const agentMsg: TranscriptMessage = {
        id: `agent-${Date.now()}`,
        speaker: 'agent',
        text: agentReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: action || undefined,
      };

      setTranscript((prev) => [...prev, agentMsg]);
      speakText(agentReply);

      if (action) {
        setLastAction(action);
        sounds.playSuccessSound();
        onActionExecuted?.(action);
      }
    } catch (err) {
      console.error('Call turn error:', err);
      // Graceful voice fallback
      const fallbackMsg: TranscriptMessage = {
        id: `agent-${Date.now()}`,
        speaker: 'agent',
        text: "I heard you clearly. Let me check the schedule for you right now.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setTranscript((prev) => [...prev, fallbackMsg]);
      speakText(fallbackMsg.text);
    }
  };

  // Helper to fallback gracefully between endpoints
  const jsonBodyOrFallback = (messages: any[], userText: string) => {
    return JSON.stringify({
      messages: messages,
      message: userText,
    });
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
      {/* Phone Case Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85, y: 30 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-[390px] h-[780px] max-h-[92vh] bg-slate-950 rounded-[48px] border-[6px] border-slate-700/80 shadow-2xl shadow-clinical-950/60 flex flex-col overflow-hidden text-slate-100"
      >
        {/* Phone Speaker Notch & Dynamic Island */}
        <div className="absolute top-2 inset-x-0 flex justify-center z-40 pointer-events-none">
          <div className="w-28 h-5 bg-slate-900 rounded-full flex items-center justify-center gap-2 border border-slate-700/50">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-700" />
            <div className="w-10 h-1 bg-slate-800 rounded-full" />
          </div>
        </div>

        {/* Top Status Bar */}
        <div className="pt-8 px-6 pb-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>NexovAI Voice</span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-clinical-400" /> 5G
          </span>
        </div>

        {/* Call Header / Caller ID */}
        <div className="px-6 py-3 flex flex-col items-center text-center border-b border-slate-800/80">
          <div className="relative">
            {callState === 'ringing' && (
              <div className="absolute -inset-3 rounded-full bg-clinical-500/20 animate-ping pointer-events-none" />
            )}
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-clinical-600 to-teal-400 p-0.5 shadow-lg shadow-clinical-500/20">
              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-clinical-300 animate-pulse" />
              </div>
            </div>
          </div>

          <h2 className="text-base font-bold text-white mt-2">Alex (AI Receptionist)</h2>
          <p className="text-xs text-clinical-400 font-medium">NexovAI Medical Clinic</p>

          {/* Call Status Indicator */}
          <div className="mt-1 text-xs font-mono">
            {callState === 'ringing' && (
              <span className="text-amber-400 animate-pulse">Ringing & Connecting...</span>
            )}
            {callState === 'connected' && (
              <span className="text-emerald-400 font-semibold">{formatTimer(callDuration)}</span>
            )}
            {callState === 'ended' && (
              <span className="text-rose-400">Call Ended ({formatTimer(callDuration)})</span>
            )}
          </div>
        </div>

        {/* Live Audio Waveform */}
        <div className="bg-slate-900/40 border-b border-slate-800/60">
          <AudioWaveform
            isActive={callState === 'connected'}
            isMuted={isMuted}
            speaker={currentSpeaker}
          />
        </div>

        {/* Live In-Phone Transcript Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
          {transcript.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.speaker === 'caller' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${
                  msg.speaker === 'caller'
                    ? 'bg-clinical-600 text-slate-950 font-medium rounded-tr-none'
                    : 'bg-slate-800/90 text-slate-100 border border-slate-700/50 rounded-tl-none'
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 px-1 font-mono">
                {msg.speaker === 'caller' ? 'You (Caller)' : 'Alex'} • {msg.timestamp}
              </span>
            </div>
          ))}

          {/* In-Phone Animated Booking Confirmation Card */}
          <AnimatePresence>
            {lastAction && (
              <BookingCard
                action={lastAction}
                onClose={() => setLastAction(null)}
              />
            )}
          </AnimatePresence>

          <div ref={transcriptBottomRef} />
        </div>

        {/* Quick Voice Prompt Suggestions */}
        {callState === 'connected' && (
          <div className="px-3 py-1.5 border-t border-slate-800/60 bg-slate-900/30">
            <p className="text-[10px] text-slate-500 mb-1 px-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-clinical-400" /> Tap to speak phrase:
            </p>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
              <button
                onClick={() => handleUserUtterance('Do you have any cardiologist available tomorrow?')}
                className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap border border-slate-700/40"
              >
                Check Cardiologist
              </button>
              <button
                onClick={() => handleUserUtterance('Please book tomorrow 10:30 AM. My phone number is 555-234-5678.')}
                className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap border border-slate-700/40"
              >
                Book 10:30 AM (555-234-5678)
              </button>
              <button
                onClick={() => handleUserUtterance('Yes, that phone number is correct!')}
                className="px-2.5 py-1 rounded-full bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 whitespace-nowrap border border-emerald-700/40"
              >
                Confirm Phone Number
              </button>
              <button
                onClick={() => handleUserUtterance('Cancel my appointment for phone number 555-234-5678')}
                className="px-2.5 py-1 rounded-full bg-rose-950/60 hover:bg-rose-900 text-rose-300 whitespace-nowrap border border-rose-700/40"
              >
                Cancel Appointment
              </button>
            </div>
          </div>
        )}

        {/* Spoken Text Input Bar (Keyboard / Voice helper) */}
        {callState === 'connected' && (
          <div className="px-3 py-2 bg-slate-900/80 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleUserUtterance(inputValue);
              }}
              placeholder="Speak or type caller message..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-clinical-500/60"
            />
            <button
              onClick={() => handleUserUtterance(inputValue)}
              disabled={!inputValue.trim()}
              className="p-1.5 rounded-xl bg-clinical-500 text-slate-950 disabled:opacity-40 transition-opacity"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Bottom Phone Controls Bar */}
        <div className="p-4 bg-slate-950 border-t border-slate-800/80 flex items-center justify-around">
          {callState === 'connected' ? (
            <>
              {/* Mute button */}
              <button
                onClick={handleToggleMute}
                className={`p-3.5 rounded-full transition-all ${
                  isMuted
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* End Call Button */}
              <button
                onClick={handleEndCall}
                className="p-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 hover:scale-105 active:scale-95 transition-all"
                title="End Call"
              >
                <PhoneOff className="w-6 h-6" />
              </button>

              {/* Speaker Volume Button */}
              <button
                onClick={handleToggleSpeaker}
                className={`p-3.5 rounded-full transition-all ${
                  !isSpeakerOn
                    ? 'bg-slate-800 text-slate-500'
                    : 'bg-slate-800 text-clinical-400 hover:bg-slate-700'
                }`}
                title={isSpeakerOn ? 'Mute AI Voice' : 'Unmute AI Voice'}
              >
                {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
            </>
          ) : callState === 'ringing' ? (
            <div className="flex items-center justify-center w-full">
              <button
                onClick={onClose}
                className="p-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-all"
                title="Cancel Call"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={() => {
                  setCallState('ringing');
                  sounds.startRinging();
                  setTimeout(() => {
                    sounds.playConnectChime();
                    setCallState('connected');
                  }, 1800);
                }}
                className="flex-1 py-2.5 rounded-2xl bg-clinical-500 hover:bg-clinical-400 text-slate-950 font-semibold text-xs flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" /> Call Again
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

