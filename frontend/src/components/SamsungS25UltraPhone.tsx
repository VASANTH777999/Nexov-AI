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
  Sparkles,
  Send,
  Delete,
  Grid,
  Languages,
  X,
  Wifi,
  Signal,
  BatteryMedium,
  CheckCircle2,
  Calendar,
  Clock,
  ShieldCheck,
  Ear,
  AlertCircle
} from 'lucide-react';
import { GeminiLiveVisualizer } from './GeminiLiveVisualizer';
import { AudioWaveform } from './AudioWaveform';
import { BookingCard } from './BookingCard';
import { TranscriptMessage } from '../lib/types';
import { sounds } from '../lib/soundEffects';
import { detectTextLanguage } from '../lib/serverTools';

interface SamsungS25UltraPhoneProps {
  isOpen: boolean;
  onClose: () => void;
  onActionExecuted?: (action: any) => void;
  prefilledPrompt?: string | null;
}

type PhoneMode = 'dialer' | 'calling' | 'connected' | 'ended';
type TurnState = 'idle' | 'agent_speaking' | 'listening' | 'user_speaking' | 'analyzing';

export const SamsungS25UltraPhone: React.FC<SamsungS25UltraPhoneProps> = ({
  isOpen,
  onClose,
  onActionExecuted,
  prefilledPrompt,
}) => {
  const [mode, setMode] = useState<PhoneMode>('dialer');
  const [dialedNumber, setDialedNumber] = useState<string>('');
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState<boolean>(true);
  const [currentSpeaker, setCurrentSpeaker] = useState<'caller' | 'agent' | 'idle'>('idle');
  const [turnState, setTurnState] = useState<TurnState>('idle');
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [lastAction, setLastAction] = useState<any | null>(null);
  const [detectedLanguage, setDetectedLanguage] = useState<string>('English');
  const [isAutoTyping, setIsAutoTyping] = useState<boolean>(false);
  const [liveInterimSpeech, setLiveInterimSpeech] = useState<string>('');
  const [sttLanguage, setSttLanguage] = useState<string>('en-IN');
  const [isSpeechSupported, setIsSpeechSupported] = useState<boolean>(true);
  const [micPermissionGranted, setMicPermissionGranted] = useState<boolean>(false);

  const transcriptBottomRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any | null>(null);
  const isListeningActiveRef = useRef<boolean>(false);

  // Turn-taking and Echo Suppression Mutex Refs
  const isAgentSpeakingRef = useRef<boolean>(false);
  const isProcessingRef = useRef<boolean>(false);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const speechWatchdogRef = useRef<NodeJS.Timeout | null>(null);
  const accumulatedSpeechRef = useRef<string>('');
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Synchronous State Mirror Refs (Eliminating Stale Closures in Asynchronous Callbacks)
  const modeRef = useRef<PhoneMode>('dialer');
  const isMutedRef = useRef<boolean>(false);
  const isSpeakerOnRef = useRef<boolean>(true);
  const sttLanguageRef = useRef<string>('en-IN');
  const transcriptRef = useRef<TranscriptMessage[]>([]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);
  useEffect(() => {
    isSpeakerOnRef.current = isSpeakerOn;
  }, [isSpeakerOn]);
  useEffect(() => {
    sttLanguageRef.current = sttLanguage;
  }, [sttLanguage]);
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  // MediaRecorder Fallback for direct ElevenLabs Scribe STT
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const CLINIC_RECEPTION_NUMBER = "+91 1800-639-6824";

  // System Clock
  const [currentTime, setCurrentTime] = useState<string>('12:45');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Call Duration Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (mode === 'connected') {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [mode]);

  // Scroll transcript
  useEffect(() => {
    transcriptBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, lastAction, liveInterimSpeech]);

  // Voice Selection for Web Speech Fallback
  const getNaturalVoice = (lang: string) => {
    if (typeof window === 'undefined') return null;
    const voices = window.speechSynthesis.getVoices();

    if (lang === 'Telugu') {
      return (
        voices.find((v) => v.lang.startsWith('te') || v.name.includes('Telugu') || v.name.includes('తెలుగు')) ||
        null
      );
    }
    if (lang === 'Hindi') {
      return (
        voices.find((v) => (v.name.includes('Natural') || v.name.includes('Online')) && v.lang.startsWith('hi')) ||
        voices.find((v) => v.lang.startsWith('hi')) ||
        null
      );
    }
    if (lang === 'Tamil') {
      return voices.find((v) => v.lang.startsWith('ta')) || null;
    }
    if (lang === 'Kannada') {
      return voices.find((v) => v.lang.startsWith('kn')) || null;
    }

    return (
      voices.find((v) => v.name.includes('Natural') && v.lang.startsWith('en')) ||
      voices.find((v) => (v.name.includes('Jenny') || v.name.includes('Aria') || v.name.includes('Google US')) && v.lang.startsWith('en')) ||
      voices.find((v) => v.lang === 'en-US' && !v.name.includes('Desktop')) ||
      voices.find((v) => v.lang.startsWith('en')) ||
      null
    );
  };

  // Safe Speech Recognition Starter with State Verification
  const startListeningSafely = () => {
    if (isMutedRef.current || modeRef.current !== 'connected') return;
    if (isAgentSpeakingRef.current || isProcessingRef.current) return;
    if (isListeningActiveRef.current) return;

    if (!recognitionRef.current) {
      initSpeechRecognition();
    }

    const rec = recognitionRef.current;
    if (!rec) return;

    try {
      rec.lang = sttLanguageRef.current;
      rec.start();
      isListeningActiveRef.current = true;
      setTurnState('listening');
      setCurrentSpeaker('idle');
    } catch (e: any) {
      if (e?.name === 'InvalidStateError') {
        // Recognition might be in transition or already running
        setTimeout(() => {
          if (
            modeRef.current === 'connected' &&
            !isAgentSpeakingRef.current &&
            !isProcessingRef.current &&
            !isMutedRef.current
          ) {
            try {
              rec.start();
              isListeningActiveRef.current = true;
              setTurnState('listening');
              setCurrentSpeaker('idle');
            } catch (err2) {
              isListeningActiveRef.current = true;
              setTurnState('listening');
              setCurrentSpeaker('idle');
            }
          }
        }, 150);
      } else {
        console.warn('Recognition start notice:', e);
        isListeningActiveRef.current = false;
      }
    }
  };

  const stopListeningSafely = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.abort();
    } catch (e) {}
    isListeningActiveRef.current = false;
  };

  // Fallback Web Speech Synthesis
  const fallbackWebSpeech = (cleanText: string, onEnd: () => void) => {
    try {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.98;
      utterance.pitch = 1.0;

      const lang = detectTextLanguage(cleanText);
      setDetectedLanguage(lang);

      const voice = getNaturalVoice(lang);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        utterance.lang = lang === 'Telugu' ? 'te-IN' : lang === 'Hindi' ? 'hi-IN' : 'en-US';
      }

      utterance.onend = onEnd;
      utterance.onerror = onEnd;

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('WebSpeech fallback error:', e);
      onEnd();
    }
  };

  // Speech Synthesis with Guaranteed Unlock Watchdog
  const speakText = async (text: string, onComplete?: () => void) => {
    if (!isSpeakerOnRef.current || typeof window === 'undefined') {
      onComplete?.();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      if (currentAudioRef.current) {
        try {
          currentAudioRef.current.pause();
          currentAudioRef.current = null;
        } catch (e) {}
      }

      const cleanText = text.replace(/[*_#`]/g, '').trim();
      if (!cleanText) {
        onComplete?.();
        return;
      }

      // 1. Lock mutex and silence microphone immediately while agent speaks
      isAgentSpeakingRef.current = true;
      stopListeningSafely();
      setTurnState('agent_speaking');
      setCurrentSpeaker('agent');
      setLiveInterimSpeech('');

      let hasFinalized = false;
      const finalizeAgentSpeech = () => {
        if (hasFinalized) return;
        hasFinalized = true;

        if (speechWatchdogRef.current) {
          clearTimeout(speechWatchdogRef.current);
          speechWatchdogRef.current = null;
        }

        // Release speaking mutex immediately
        isAgentSpeakingRef.current = false;

        // AUTOMATICALLY RESTART LISTENING FOR USER'S VOICE INPUT!
        if (modeRef.current === 'connected' && !isProcessingRef.current && !isMutedRef.current) {
          setTurnState('listening');
          setCurrentSpeaker('idle');
          isListeningActiveRef.current = false;

          // Resume listening cleanly after small acoustic buffer
          setTimeout(() => {
            startListeningSafely();
          }, 200);

          // Redundancy watchdog to guarantee microphone is listening without any manual click
          setTimeout(() => {
            if (
              modeRef.current === 'connected' &&
              !isAgentSpeakingRef.current &&
              !isProcessingRef.current &&
              !isMutedRef.current &&
              !isListeningActiveRef.current
            ) {
              startListeningSafely();
            }
          }, 600);
        }
        onComplete?.();
      };

      // Watchdog: dynamically computed based on text length with safety margin
      const watchdogMs = Math.max(8000, Math.min(30000, cleanText.length * 90 + 3000));
      if (speechWatchdogRef.current) clearTimeout(speechWatchdogRef.current);
      speechWatchdogRef.current = setTimeout(() => {
        console.log('Speech watchdog triggered: auto-unlocking microphone');
        finalizeAgentSpeech();
      }, watchdogMs);

      // 2. Try High-Fidelity ElevenLabs Studio Audio Synthesis First!
      try {
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: cleanText }),
        });

        if (response.ok) {
          const blob = await response.blob();
          const audioUrl = URL.createObjectURL(blob);
          const audio = new Audio(audioUrl);
          currentAudioRef.current = audio;
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            currentAudioRef.current = null;
            finalizeAgentSpeech();
          };
          audio.onerror = () => {
            URL.revokeObjectURL(audioUrl);
            currentAudioRef.current = null;
            fallbackWebSpeech(cleanText, finalizeAgentSpeech);
          };

          try {
            await audio.play();
            return;
          } catch (playErr) {
            console.warn('Audio play notice, falling back to WebSpeech:', playErr);
            fallbackWebSpeech(cleanText, finalizeAgentSpeech);
            return;
          }
        }
      } catch (err) {
        console.log('ElevenLabs audio streaming note, using Web Speech:', err);
      }

      // 3. Fallback to Web Speech API
      fallbackWebSpeech(cleanText, finalizeAgentSpeech);
    } catch (e) {
      console.warn('TTS error:', e);
      isAgentSpeakingRef.current = false;
      onComplete?.();
    }
  };

  // High-Precision Speech Recognition Initializer
  const initSpeechRecognition = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = sttLanguageRef.current;

      recognition.onstart = () => {
        isListeningActiveRef.current = true;
        setMicPermissionGranted(true);
        if (!isAgentSpeakingRef.current && !isProcessingRef.current) {
          setTurnState('listening');
          setCurrentSpeaker('idle');
        }
      };

      recognition.onresult = (event: any) => {
        if (isAgentSpeakingRef.current || isProcessingRef.current) {
          return;
        }

        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptText = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcriptText + ' ';
          } else {
            interim += transcriptText;
          }
        }

        setTurnState('user_speaking');
        setCurrentSpeaker('caller');

        if (final) {
          accumulatedSpeechRef.current = (accumulatedSpeechRef.current + ' ' + final).trim();
        }

        const currentText = interim || accumulatedSpeechRef.current;
        if (currentText) {
          setLiveInterimSpeech(currentText);
        }

        // Debounce: 1.1s of silence indicates user has finished utterance
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }

        silenceTimerRef.current = setTimeout(() => {
          const userFullText = (accumulatedSpeechRef.current || interim).trim();
          accumulatedSpeechRef.current = '';
          setLiveInterimSpeech('');

          if (userFullText && !isAgentSpeakingRef.current && !isProcessingRef.current) {
            handleUserUtterance(userFullText);
          }
        }, 1100);
      };

      recognition.onerror = (e: any) => {
        if (e.error !== 'no-speech' && e.error !== 'aborted') {
          console.warn('SpeechRecognition event notice:', e.error);
        }
        if (e.error === 'not-allowed') {
          setMicPermissionGranted(false);
          isListeningActiveRef.current = false;
        }
      };

      recognition.onend = () => {
        isListeningActiveRef.current = false;
        // Automatically restart listening continuously if still connected, agent not speaking, and not muted
        if (
          modeRef.current === 'connected' &&
          !isAgentSpeakingRef.current &&
          !isProcessingRef.current &&
          !isMutedRef.current
        ) {
          setTimeout(() => {
            startListeningSafely();
          }, 150);
        }
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('SpeechRecognition setup error:', err);
    }
  };

  // Re-initialize or update recognition language
  useEffect(() => {
    initSpeechRecognition();
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (speechWatchdogRef.current) clearTimeout(speechWatchdogRef.current);
      stopListeningSafely();
    };
  }, [sttLanguage]);

  // Request browser mic permission explicitly upon call initiation
  const requestMicAccess = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicPermissionGranted(true);
        // Cleanly release stream tracks so SpeechRecognition has full exclusive access
        stream.getTracks().forEach((t) => t.stop());
      }
    } catch (e) {
      console.log('Mic permission request note:', e);
    }
  };

  // Automatic Typing sequence for dialer simulation
  const startAutoTypingAndCall = () => {
    if (isAutoTyping) return;
    setIsAutoTyping(true);
    setDialedNumber('');

    const chars = CLINIC_RECEPTION_NUMBER.split('');
    chars.forEach((char, index) => {
      setTimeout(() => {
        setDialedNumber((prev) => prev + char);
        if (char !== ' ' && char !== '-') {
          sounds.playKeypadTone(char);
        }

        if (index === chars.length - 1) {
          setTimeout(() => {
            setIsAutoTyping(false);
            initiateCall();
          }, 350);
        }
      }, index * 35);
    });
  };

  // Initiate Call
  const initiateCall = async () => {
    await requestMicAccess();
    setMode('calling');
    modeRef.current = 'calling';
    sounds.startRinging();
    setCallDuration(0);
    setTurnState('idle');

    setTimeout(() => {
      sounds.playConnectChime();
      setMode('connected');
      modeRef.current = 'connected';

      if (prefilledPrompt) {
        setInputValue(prefilledPrompt);
      }

      // Warm, natural human opening greeting. Alex speaks once and WAITS for the user!
      const greetingText =
        "Hello! Thank you for calling NexovAI Health Clinic. I'm Alex, your medical receptionist. How can I assist you today?";
      const initialMsg: TranscriptMessage = {
        id: 'msg-1',
        speaker: 'agent',
        text: greetingText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setTranscript([initialMsg]);
      speakText(greetingText);
    }, 1800);
  };

  // Lifecycle on modal open
  useEffect(() => {
    if (!isOpen) {
      stopListeningSafely();
      if (currentAudioRef.current) {
        try {
          currentAudioRef.current.pause();
          currentAudioRef.current = null;
        } catch (e) {}
      }
      if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
      sounds.stopRinging();
      setMode('dialer');
      modeRef.current = 'dialer';
      setDialedNumber('');
      setCallDuration(0);
      setTranscript([]);
      setLastAction(null);
      setTurnState('idle');
      isAgentSpeakingRef.current = false;
      isProcessingRef.current = false;
      return;
    }

    startAutoTypingAndCall();

    return () => {
      sounds.stopRinging();
    };
  }, [isOpen]);

  const handleEndCall = () => {
    sounds.playEndCallChime();
    isAgentSpeakingRef.current = false;
    isProcessingRef.current = false;
    stopListeningSafely();
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      } catch (e) {}
    }
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
    setMode('ended');
    modeRef.current = 'ended';
    setTurnState('idle');
    setCurrentSpeaker('idle');
  };

  // User Utterance Handler with Half-Duplex Locking
  const handleUserUtterance = async (userText: string) => {
    if (!userText.trim() || isProcessingRef.current) return;

    // Lock processing state so no overlapping inputs can occur
    isProcessingRef.current = true;
    stopListeningSafely();
    setTurnState('analyzing');
    setCurrentSpeaker('caller');
    setLiveInterimSpeech('');
    accumulatedSpeechRef.current = '';

    const userMsg: TranscriptMessage = {
      id: `user-${Date.now()}`,
      speaker: 'caller',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setTranscript((prev) => [...prev, userMsg]);
    setInputValue('');

    const detected = detectTextLanguage(userText);
    setDetectedLanguage(detected);

    try {
      const history = transcriptRef.current.map((m) => ({
        role: m.speaker === 'caller' ? 'user' : 'assistant',
        content: m.text,
      }));
      history.push({ role: 'user', content: userText });

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, message: userText }),
      });

      if (!res.ok) throw new Error('API failed');

      const data = await res.json();
      const reply = data.reply || "I am right here with you. How can I assist you further?";
      const action = data.action;

      if (data.detected_language) {
        setDetectedLanguage(data.detected_language);
      }

      const agentMsg: TranscriptMessage = {
        id: `agent-${Date.now()}`,
        speaker: 'agent',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: action || undefined,
      };

      setTranscript((prev) => [...prev, agentMsg]);

      // Release processing lock and speak response
      isProcessingRef.current = false;
      speakText(reply);

      if (action) {
        setLastAction(action);
        sounds.playSuccessSound();
        onActionExecuted?.(action);
      }
    } catch (e) {
      console.error(e);
      let fallback = "I am checking into that for you right now. Take your time.";
      if (detected === 'Telugu') {
        fallback = "నేను ఆ వివరాలను పరిశీలిస్తున్నాను అండీ. దయచేసి ఒక్క క్షణం వేచి ఉండండి.";
      } else if (detected === 'Hindi') {
        fallback = "मैं अभी आपके लिए यह जानकारी देख रही हूँ। कृपया एक क्षण प्रतीक्षा करें।";
      }

      setTranscript((prev) => [
        ...prev,
        {
          id: `agent-${Date.now()}`,
          speaker: 'agent',
          text: fallback,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      isProcessingRef.current = false;
      speakText(fallback);
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Explicit Mic Toggle / Reconnect
  const handleMicToggle = () => {
    if (isMuted) {
      setIsMuted(false);
      isMutedRef.current = false;
      isAgentSpeakingRef.current = false;
      startListeningSafely();
    } else {
      setIsMuted(true);
      isMutedRef.current = true;
      stopListeningSafely();
      setTurnState('idle');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-2xl">
      {/* Mobile Screen Shell (Sleek Titanium Architecture - Zero model brand text) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 320 }}
        className="relative w-full max-w-[420px] h-[850px] max-h-[92vh] bg-[#080b12] rounded-[48px] border-[5px] border-[#2b3548] ring-1 ring-white/15 shadow-[0_0_100px_rgba(45,212,191,0.25)] flex flex-col overflow-hidden text-slate-100 select-none"
      >
        {/* Curved Screen Edge & Sheen */}
        <div className="absolute inset-0 rounded-[43px] border border-white/10 pointer-events-none" />

        {/* Center Front Camera Cutout with sensor ring */}
        <div className="absolute top-3.5 inset-x-0 flex justify-center z-40 pointer-events-none">
          <div className="w-3.5 h-3.5 rounded-full bg-black border border-slate-700/80 shadow-inner flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-[#0d1527] ring-1 ring-cyan-500/50" />
          </div>
        </div>

        {/* System Status Bar */}
        <div className="pt-3 px-7 pb-1 flex items-center justify-between text-[11px] text-slate-300 font-medium z-30">
          <span className="font-semibold tracking-tight">{currentTime}</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold">5G+</span>
            <Signal className="w-3.5 h-3.5 text-slate-200" />
            <Wifi className="w-3.5 h-3.5 text-slate-200" />
            <span className="text-[10px] font-mono">98%</span>
            <BatteryMedium className="w-4 h-4 text-emerald-400" />
          </div>
        </div>

        {/* Close Modal Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-4 z-40 p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all shadow-md"
          title="Close Call"
        >
          <X className="w-4 h-4" />
        </button>

        {/* DIALER SCREEN */}
        {mode === 'dialer' && (
          <div className="flex-1 flex flex-col justify-between px-6 pt-5 pb-7 overflow-y-auto">
            <div className="text-center pt-2">
              <span className="text-[11px] text-cyan-400 font-mono tracking-wider uppercase font-semibold">
                NexovAI Medical Reception
              </span>
              <div className="mt-3 min-h-[46px] flex items-center justify-center">
                <span className="text-2xl font-bold font-mono tracking-wider text-white">
                  {dialedNumber || ' '}
                </span>
                {isAutoTyping && (
                  <span className="w-2.5 h-6 bg-cyan-400 ml-1 animate-pulse" />
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {isAutoTyping ? 'Connecting to Medical Reception...' : 'Clinical Direct Line'}
              </p>
            </div>

            {/* Keypad Grid */}
            <div className="grid grid-cols-3 gap-y-3 gap-x-6 px-4 my-auto">
              {[
                { digit: '1', sub: ' ' },
                { digit: '2', sub: 'ABC' },
                { digit: '3', sub: 'DEF' },
                { digit: '4', sub: 'GHI' },
                { digit: '5', sub: 'JKL' },
                { digit: '6', sub: 'MNO' },
                { digit: '7', sub: 'PQRS' },
                { digit: '8', sub: 'TUV' },
                { digit: '9', sub: 'WXYZ' },
                { digit: '*', sub: ' ' },
                { digit: '0', sub: '+' },
                { digit: '#', sub: ' ' },
              ].map((k) => (
                <button
                  key={k.digit}
                  onClick={() => {
                    setDialedNumber((prev) => prev + k.digit);
                    sounds.playKeypadTone(k.digit);
                  }}
                  className="w-16 h-16 rounded-full bg-slate-800/70 hover:bg-slate-700 active:scale-95 transition-all flex flex-col items-center justify-center mx-auto border border-slate-700/50 shadow-md"
                >
                  <span className="text-xl font-bold text-white">{k.digit}</span>
                  {k.sub !== ' ' && (
                    <span className="text-[9px] text-slate-400 font-semibold tracking-widest">{k.sub}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Bottom Call & Action Bar */}
            <div className="flex items-center justify-around pt-2">
              <button
                onClick={startAutoTypingAndCall}
                className="text-xs text-cyan-400 font-medium hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" /> Redial
              </button>

              <button
                onClick={initiateCall}
                className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-90 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/40 transition-all"
              >
                <Phone className="w-7 h-7 fill-slate-950" />
              </button>

              <button
                onClick={() => setDialedNumber((prev) => prev.slice(0, -1))}
                className="p-3 text-slate-400 hover:text-white"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* IN-CALL SCREEN */}
        {mode !== 'dialer' && (
          <div className="flex-1 flex flex-col justify-between overflow-hidden">
            {/* Call Header */}
            <div className="pt-3 px-6 pb-2 text-center border-b border-slate-800/80 bg-slate-950/40">
              {/* Spoken Dialect Selector */}
              <div className="flex items-center justify-center gap-1.5 mb-1.5">
                <span className="text-[10px] text-slate-400 font-mono">Dialect:</span>
                {[
                  { code: 'en-IN', label: 'English' },
                  { code: 'te-IN', label: 'తెలుగు' },
                  { code: 'hi-IN', label: 'हिंदी' },
                  { code: 'ta-IN', label: 'தமிழ்' },
                ].map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setSttLanguage(l.code);
                      sttLanguageRef.current = l.code;
                      if (recognitionRef.current) {
                        try {
                          recognitionRef.current.lang = l.code;
                        } catch (e) {}
                      }
                    }}
                    className={`text-[10px] px-2.5 py-0.5 rounded-full border transition-all font-medium ${
                      sttLanguage === l.code
                        ? 'bg-gradient-to-r from-cyan-500 to-indigo-500 text-white border-cyan-400 font-bold shadow-sm'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:text-white'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>

              <h2 className="text-base font-bold text-white">Alex • Patient Receptionist</h2>
              <p className="text-xs text-cyan-400 font-medium">NexovAI Health &amp; Medical Pavilion</p>
              <p className="text-[11px] font-mono text-slate-400 mt-0.5">{CLINIC_RECEPTION_NUMBER}</p>

              {/* Real-time Turn Status Bar */}
              <div className="mt-2 flex items-center justify-center gap-2 text-xs font-mono font-semibold">
                {mode === 'calling' && (
                  <span className="text-amber-400 animate-pulse flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    Connecting to Medical Reception...
                  </span>
                )}
                {mode === 'connected' && (
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 flex items-center gap-1.5 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      {formatTimer(callDuration)}
                    </span>
                    <span className="text-slate-600">•</span>
                    {turnState === 'agent_speaking' && (
                      <span className="text-cyan-400 animate-pulse flex items-center gap-1 font-sans">
                        <Volume2 className="w-3.5 h-3.5" /> Alex speaking...
                      </span>
                    )}
                    {turnState === 'listening' && (
                      <span className="text-emerald-400 flex items-center gap-1 font-sans">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        Listening (Speak freely)...
                      </span>
                    )}
                    {turnState === 'user_speaking' && (
                      <span className="text-teal-300 font-bold flex items-center gap-1 animate-pulse font-sans">
                        <Mic className="w-3.5 h-3.5 text-teal-400" /> Hearing you speak...
                      </span>
                    )}
                    {turnState === 'analyzing' && (
                      <span className="text-amber-300 flex items-center gap-1 animate-pulse font-sans">
                        <Sparkles className="w-3.5 h-3.5" /> Analyzing query...
                      </span>
                    )}
                  </div>
                )}
                {mode === 'ended' && (
                  <span className="text-rose-400">Call Ended ({formatTimer(callDuration)})</span>
                )}
              </div>

              {/* Sound Aura Visualizer & Audio Waveform */}
              <div className="py-2 flex flex-col items-center justify-center">
                <GeminiLiveVisualizer
                  state={
                    mode === 'connected'
                      ? turnState === 'agent_speaking'
                        ? 'speaking'
                        : turnState === 'user_speaking'
                        ? 'listening'
                        : turnState === 'analyzing'
                        ? 'thinking'
                        : 'idle'
                      : 'idle'
                  }
                  speaker={currentSpeaker}
                  size="sm"
                />
                <div className="w-full max-w-[260px] -mt-1">
                  <AudioWaveform
                    isActive={mode === 'connected'}
                    isMuted={isMuted}
                    speaker={currentSpeaker}
                  />
                </div>
              </div>
            </div>

            {/* In-Phone Live Conversation Transcript */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
              {transcript.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.speaker === 'caller' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${
                      msg.speaker === 'caller'
                        ? 'bg-gradient-to-r from-cyan-600 to-teal-500 text-slate-950 font-semibold rounded-tr-none'
                        : 'bg-slate-800/90 text-slate-100 border border-slate-700/60 rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-0.5 px-1 font-mono">
                    {msg.speaker === 'caller' ? 'You' : 'Alex'} • {msg.timestamp}
                  </span>
                </div>
              ))}

              {/* Real-time Interim Streaming Transcript */}
              {liveInterimSpeech && (
                <div className="flex flex-col items-end">
                  <div className="max-w-[88%] rounded-2xl p-2.5 text-xs leading-relaxed bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 rounded-tr-none animate-pulse italic flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-spin flex-shrink-0" />
                    <span>{liveInterimSpeech}...</span>
                  </div>
                  <span className="text-[9px] text-cyan-400 mt-0.5 px-1 font-mono">
                    Hearing you in real-time...
                  </span>
                </div>
              )}

              {/* In-Phone Booking Confirmation Card */}
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

            {/* Quick Action Speech Prompts */}
            {mode === 'connected' && (
              <div className="px-3 py-1.5 border-t border-slate-800/60 bg-slate-900/40">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[10px]">
                  <button
                    onClick={() => handleUserUtterance('నమస్కారం! డాక్టర్ దేవి శెట్టి గారి అపాయింట్‌మెంట్ స్లాట్లు ఉన్నాయా?')}
                    className="px-2.5 py-1 rounded-full bg-purple-950/70 hover:bg-purple-900 text-purple-200 whitespace-nowrap border border-purple-700/40 font-medium"
                  >
                    తెలుగు: డాక్టర్ దేవి శెట్టి స్లాట్స్?
                  </button>
                  <button
                    onClick={() => handleUserUtterance('नमस्ते! मुझे कल डॉक्टर सैंड్రా ली से मिलना है। क्या स्लॉट खाली हैं?')}
                    className="px-2.5 py-1 rounded-full bg-indigo-950/70 hover:bg-indigo-900 text-indigo-200 whitespace-nowrap border border-indigo-700/40 font-medium"
                  >
                    हिंदी: डॉ. सैंड్రా ली स्लॉट?
                  </button>
                  <button
                    onClick={() => handleUserUtterance('What slots are open tomorrow with Dr. Sanjay Gupta for migraines?')}
                    className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 whitespace-nowrap border border-slate-700/40"
                  >
                    Dr. Sanjay Gupta
                  </button>
                  <button
                    onClick={() => handleUserUtterance('Please book tomorrow 10:30 AM with Dr. Devi Shetty. My phone number is 9876543210.')}
                    className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 whitespace-nowrap border border-slate-700/40"
                  >
                    Book: 9876543210
                  </button>
                  <button
                    onClick={() => handleUserUtterance('Yes, that phone number is correct! అవును, అదే నా నంబర్.')}
                    className="px-2.5 py-1 rounded-full bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 whitespace-nowrap border border-emerald-700/40 font-medium"
                  >
                    Confirm Number
                  </button>
                  <button
                    onClick={() => handleUserUtterance('Cancel my appointment for phone number 9876543210')}
                    className="px-2.5 py-1 rounded-full bg-rose-950/70 hover:bg-rose-900 text-rose-300 whitespace-nowrap border border-rose-700/40"
                  >
                    Cancel Appointment
                  </button>
                </div>
              </div>
            )}

            {/* In-Phone Input Box (Hybrid voice & type) */}
            {mode === 'connected' && (
              <div className="px-3 py-2 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUserUtterance(inputValue);
                  }}
                  disabled={turnState === 'analyzing' || turnState === 'agent_speaking'}
                  placeholder={
                    turnState === 'agent_speaking'
                      ? 'Alex speaking...'
                      : turnState === 'analyzing'
                      ? 'Analyzing query...'
                      : 'Speak naturally or type query...'
                  }
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 font-sans disabled:opacity-50"
                />
                <button
                  onClick={() => handleUserUtterance(inputValue)}
                  disabled={!inputValue.trim() || turnState === 'analyzing' || turnState === 'agent_speaking'}
                  className="p-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 disabled:opacity-40 hover:scale-105 active:scale-95 transition-all font-bold"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Bottom Mobile Phone Controls */}
            <div className="p-3.5 bg-slate-950 border-t border-slate-800/80 flex items-center justify-around">
              {mode === 'connected' ? (
                <>
                  <button
                    onClick={handleMicToggle}
                    className={`p-3 rounded-full transition-all flex items-center justify-center ${
                      isMuted
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : turnState === 'user_speaking'
                        ? 'bg-teal-500/30 text-teal-300 border border-teal-400 animate-pulse'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                    }`}
                    title={isMuted ? 'Unmute Mic' : 'Mic Active - Click to Restart Listening'}
                  >
                    {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => setMode('dialer')}
                    className="p-3 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700"
                    title="Keypad"
                  >
                    <Grid className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleEndCall}
                    className="p-3.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/40 active:scale-95 transition-all"
                    title="End Call"
                  >
                    <PhoneOff className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                    className={`p-3 rounded-full transition-all ${
                      !isSpeakerOn
                        ? 'bg-slate-800 text-slate-500'
                        : 'bg-slate-800 text-cyan-400 hover:bg-slate-700'
                    }`}
                    title={isSpeakerOn ? 'Mute AI Voice' : 'Unmute AI Voice'}
                  >
                    {isSpeakerOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </button>
                </>
              ) : mode === 'calling' ? (
                <div className="flex items-center justify-center w-full">
                  <button
                    onClick={handleEndCall}
                    className="p-3.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/40 active:scale-95 transition-all"
                    title="End Call"
                  >
                    <PhoneOff className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 w-full">
                  <button
                    onClick={initiateCall}
                    className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 hover:scale-102 transition-all"
                  >
                    <Phone className="w-4 h-4" /> Call Back
                  </button>
                  <button
                    onClick={() => setMode('dialer')}
                    className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                  >
                    Dialer
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export const VirtualCallModal = SamsungS25UltraPhone;
