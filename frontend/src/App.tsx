import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { SamsungS25UltraPhone } from './components/SamsungS25UltraPhone';
import { HomePage } from './pages/HomePage';
import { ChatPage } from './pages/ChatPage';
import { DoctorsPage } from './pages/DoctorsPage';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { DashboardPage } from './pages/DashboardPage';

export default function App() {
  const [isPhoneOpen, setIsPhoneOpen] = useState<boolean>(false);
  const [prefilledPrompt, setPrefilledPrompt] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const handleOpenPhoneWithPrompt = (prompt?: string | null) => {
    setPrefilledPrompt(prompt || null);
    setIsPhoneOpen(true);
  };

  const handleActionExecuted = (action: any) => {
    if (action?.result?.appointment?.id) {
      setHighlightId(action.result.appointment.id);
      setTimeout(() => setHighlightId(null), 5000);
    } else if (action?.result?.id) {
      setHighlightId(action.result.id);
      setTimeout(() => setHighlightId(null), 5000);
    } else if (action?.arguments?.patient_phone) {
      setHighlightId(action.arguments.patient_phone);
      setTimeout(() => setHighlightId(null), 5000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#060913] text-[#f8fafc]">
      <Navbar onOpenPhone={() => handleOpenPhoneWithPrompt(null)} />

      <div className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage onLaunchPhone={handleOpenPhoneWithPrompt} />} />
          <Route path="/chat" element={<ChatPage onLaunchPhone={handleOpenPhoneWithPrompt} />} />
          <Route path="/doctors" element={<DoctorsPage onLaunchPhone={handleOpenPhoneWithPrompt} />} />
          <Route
            path="/appointments"
            element={
              <AppointmentsPage
                onLaunchPhone={handleOpenPhoneWithPrompt}
                highlightId={highlightId}
              />
            }
          />
          <Route
            path="/dashboard"
            element={
              <DashboardPage
                onLaunchPhone={handleOpenPhoneWithPrompt}
                highlightId={highlightId}
              />
            }
          />
          <Route path="*" element={<HomePage onLaunchPhone={handleOpenPhoneWithPrompt} />} />
        </Routes>
      </div>

      <SamsungS25UltraPhone
        isOpen={isPhoneOpen}
        onClose={() => {
          setIsPhoneOpen(false);
          setPrefilledPrompt(null);
        }}
        onActionExecuted={handleActionExecuted}
        prefilledPrompt={prefilledPrompt}
      />
    </div>
  );
}
