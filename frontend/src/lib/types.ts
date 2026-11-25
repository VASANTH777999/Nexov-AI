export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  experience: string;
  avatar: string;
  bio: string;
  room: string;
  available_days: string[];
}

export interface TimeSlot {
  slot_id: string;
  doctor_id: string;
  doctor_name: string;
  specialty: string;
  date: string;
  time: string;
  room?: string;
}

export interface Appointment {
  id: string;
  patient_phone: string;
  patient_name?: string;
  doctor_id: string;
  doctor_name: string;
  specialty: string;
  date: string;
  time_slot: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
  notes?: string;
}

export interface TranscriptMessage {
  id: string;
  speaker: 'caller' | 'agent' | 'system';
  text: string;
  timestamp: string;
  action?: {
    tool: string;
    arguments: any;
    result: any;
  };
}

export interface DashboardStats {
  total_doctors: number;
  today_available_slots: number;
  active_appointments: number;
  cancelled_appointments: number;
  system_status: string;
  voice_pipeline: string;
  llm_engine: string;
}

