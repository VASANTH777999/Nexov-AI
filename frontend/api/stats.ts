import { INITIAL_DOCTORS, getAppointmentsStore } from './_lib/serverStore';

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const apts = getAppointmentsStore();
  const total = apts.length;
  const confirmed = apts.filter((a) => a.status === 'confirmed').length;
  const cancelled = apts.filter((a) => a.status === 'cancelled').length;

  return res.status(200).json({
    total_appointments: total,
    confirmed_appointments: confirmed,
    cancelled_appointments: cancelled,
    active_doctors: INITIAL_DOCTORS.length,
    system_status: 'Operational',
    voice_pipeline: 'Pipecat 1.17 + Silero VAD + ElevenLabs',
    llm_engine: 'Nvidia NIM (Nemotron 3.5)',
  });
}
