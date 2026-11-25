import React, { useState, useRef, useEffect } from 'react';
import { BookingCard } from '../components/BookingCard';
import { Interactive3DCard } from '../components/Interactive3DCard';
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  Phone,
  User,
  Bot,
  VolumeX,
  Languages,
  CheckCircle2
} from 'lucide-react';
import { sounds } from '../lib/soundEffects';
import { detectTextLanguage } from '../lib/serverTools';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  action?: any;
}

interface ChatPageProps {
  onLaunchPhone: (prompt?: string | null) => void;
}

export const ChatPage: React.FC<ChatPageProps> = ({ onLaunchPhone }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content:
        "Hello! I am Alex, your clinical patient receptionist at NexovAI Health Clinic. You can speak or chat with me in English, Telugu (తెలుగు), Hindi (हिंदी), or Tamil to check doctor schedules, discuss symptoms, or book consultations with Dr. Devi Shetty, Dr. Sandra Lee, Dr. Harvey Karp, Dr. Sanjay Gupta, Dr. James Andrews, and Dr. Siddhartha Mukherjee. How can I assist you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [liveInterim, setLiveInterim] = useState<string>('');
  const [isVoicePlaybackEnabled, setIsVoicePlaybackEnabled] = useState<boolean>(true);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, liveInterim]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-IN';

        recognition.onresult = (event: any) => {
          let interim = '';
          let final = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          if (interim) setLiveInterim(interim);
          if (final) {
            setLiveInterim('');
            handleSendMessage(final.trim());
            setIsRecording(false);
          }
        };

        recognition.onerror = () => {
          setIsRecording(false);
          setLiveInterim('');
        };
        recognition.onend = () => {
          setIsRecording(false);
          setLiveInterim('');
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      setLiveInterim('');
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        sounds.playClickTone();
      } catch (e) {
        setIsRecording(false);
      }
    }
  };

  const speakText = async (text: string) => {
    if (!isVoicePlaybackEnabled || typeof window === 'undefined') return;
    try {
      if (recognitionRef.current && isRecording) {
        try { recognitionRef.current.stop(); } catch(e) {}
        setIsRecording(false);
      }
      window.speechSynthesis.cancel();
      const clean = text.replace(/[*_#`]/g, '').trim();
      if (!clean) return;

      // 1. Try ElevenLabs Studio Audio
      try {
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: clean }),
        });
        if (response.ok) {
          const blob = await response.blob();
          const audioUrl = URL.createObjectURL(blob);
          const audio = new Audio(audioUrl);
          audio.onended = () => URL.revokeObjectURL(audioUrl);
          audio.onerror = () => URL.revokeObjectURL(audioUrl);
          await audio.play();
          return;
        }
      } catch (err) {
        console.log('Chat ElevenLabs note, using WebSpeech:', err);
      }

      // 2. Fallback to Web Speech Synthesis
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 0.98;
      utterance.pitch = 1.0;

      const lang = detectTextLanguage(clean);
      const voices = window.speechSynthesis.getVoices();

      if (lang === 'Telugu') {
        utterance.lang = 'te-IN';
        const tv = voices.find((v) => v.lang.startsWith('te') || v.name.includes('Telugu') || v.name.includes('తెలుగు'));
        if (tv) utterance.voice = tv;
      } else if (lang === 'Hindi') {
        utterance.lang = 'hi-IN';
        const hv = voices.find((v) => v.lang.startsWith('hi') || v.name.includes('Hindi') || v.name.includes('हिन्दी'));
        if (hv) utterance.voice = hv;
      } else if (lang === 'Tamil') {
        utterance.lang = 'ta-IN';
        const tav = voices.find((v) => v.lang.startsWith('ta') || v.name.includes('Tamil') || v.name.includes('தமிழ்'));
        if (tav) utterance.voice = tav;
      } else {
        utterance.lang = 'en-US';
        const naturalVoice = voices.find(
          (v) =>
            v.lang.startsWith('en') &&
            (v.name.includes('Natural') ||
              v.name.includes('Google') ||
              v.name.includes('Jenny') ||
              v.name.includes('Aria'))
        );
        if (naturalVoice) utterance.voice = naturalVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {}
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      history.push({ role: 'user', content: text });

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, message: text }),
      });

      if (!res.ok) throw new Error('Failed to reach AI service');

      const data = await res.json();
      const assistantReply = data.reply || "I am right here with you. How can I assist you further?";
      const action = data.action;

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: assistantReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: action,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      speakText(assistantReply);

      if (action) {
        sounds.playSuccessSound();
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: "I am checking the clinical schedules for you right now.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    {
      lang: 'తెలుగు',
      label: 'డాక్టర్ దేవి శెట్టి (కార్డియాలజిస్ట్) స్లాట్స్?',
      query: 'నమస్కారం! రేపు కార్డియాలజిస్ట్ డాక్టర్ దేవి శెట్టి గారి అపాయింట్‌మెంట్ స్లాట్లు ఉన్నాయా?',
    },
    {
      lang: 'हिंदी',
      label: 'डॉक्टर सैंड्रा ली (Dermatology) स्लॉट्स?',
      query: 'नमस्ते! मुझे कल डॉक्टर सैंड्रा ली से मिलना है। क्या समय उपलब्ध है?',
    },
    {
      lang: 'English',
      label: 'I have severe migraine. Which doctor?',
      query: 'I have had a severe migraine headache for 2 days. Which specialist should I consult?',
    },
    {
      lang: 'English',
      label: 'Book 10:30 AM with Dr. Devi Shetty (Phone: 9876543210)',
      query: 'Please book tomorrow 10:30 AM with Dr. Devi Shetty. My phone number is 9876543210.',
    },
    {
      lang: 'English',
      label: 'Cancel appointment for 9876543210',
      query: 'I want to cancel my appointment for phone number 9876543210.',
    },
  ];

  return (
    <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col flex-1">
      {/* Chat Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-400 via-indigo-500 to-fuchsia-500 p-0.5 shadow-md shadow-cyan-500/25">
            <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center">
              <Bot className="w-5 h-5 text-cyan-300" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              Google Gemini AI Conversational Clinic
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                Multilingual AI
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Natural Human-AI dialog in Telugu, Hindi, English, Tamil &amp; Indian languages.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsVoicePlaybackEnabled(!isVoicePlaybackEnabled)}
            className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 transition-all ${
              isVoicePlaybackEnabled
                ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
            title={isVoicePlaybackEnabled ? 'Mute AI voice output' : 'Enable AI voice output'}
          >
            {isVoicePlaybackEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline font-mono text-[11px]">
              {isVoicePlaybackEnabled ? 'Voice ON' : 'Voice OFF'}
            </span>
          </button>

          <button
            onClick={() => onLaunchPhone(null)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Phone className="w-3.5 h-3.5 fill-white" />
            <span>Launch Gemini Live Call</span>
          </button>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin max-h-[62vh] pb-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs flex-shrink-0 ${
                msg.role === 'user'
                  ? 'bg-gradient-to-tr from-cyan-400 to-indigo-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-cyan-300 border border-slate-700/80'
              }`}
            >
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed space-y-2 shadow-sm ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-cyan-600 via-teal-500 to-indigo-500 text-slate-950 font-semibold rounded-tr-none'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>

              {msg.action && (
                <div className="pt-2">
                  <BookingCard action={msg.action} />
                </div>
              )}

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/40 font-mono">
                <span>{msg.timestamp}</span>
                {msg.role === 'assistant' && (
                  <button
                    onClick={() => speakText(msg.content)}
                    className="p-1 hover:text-cyan-300 transition-colors"
                    title="Speak message aloud"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Live Interim Streaming Bubble */}
        {liveInterim && (
          <div className="flex items-start gap-3 flex-row-reverse">
            <div className="w-8 h-8 rounded-xl bg-cyan-400 text-slate-950 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div className="max-w-[80%] rounded-2xl p-3 text-xs bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 rounded-tr-none animate-pulse italic flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-spin" />
              <span>{liveInterim}...</span>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-800 text-cyan-300 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]" />
              <span className="text-xs text-slate-400 ml-1">Alex is preparing natural response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Multilingual Suggestion Chips */}
      <div className="pt-3 pb-2 flex items-center gap-2 overflow-x-auto scrollbar-none">
        <Sparkles className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(p.query)}
            className="px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-[11px] text-slate-300 border border-slate-800 hover:border-cyan-500/50 whitespace-nowrap transition-all flex items-center gap-1.5 flex-shrink-0"
          >
            <span className="font-mono text-cyan-400 text-[10px]">[{p.lang}]</span>
            <span>{p.label}</span>
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="pt-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-2xl p-2 focus-within:border-cyan-500/60 shadow-xl"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message in English, Telugu (తెలుగు), Hindi (हिंदी), or Tamil..."
            className="flex-1 bg-transparent px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
          />

          <button
            type="button"
            onClick={toggleRecording}
            className={`p-2.5 rounded-xl transition-all ${
              isRecording
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
            title={isRecording ? 'Stop Recording' : 'Voice Input (STT)'}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-indigo-500 text-slate-950 font-bold disabled:opacity-40 hover:scale-105 active:scale-95 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </main>
  );
};
