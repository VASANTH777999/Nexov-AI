// Server-side in-memory clinic store for Vercel Serverless & Next.js standalone execution
import { Doctor, Appointment } from './types';

export const INITIAL_DOCTORS: Doctor[] = [
  {
    id: "doc-1",
    name: "Dr. Devi Shetty",
    specialty: "Cardiologist",
    rating: 4.98,
    experience: "30+ years",
    avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80",
    bio: "World-renowned Cardiac Surgeon, Chairman of Narayana Health & Padma Bhushan recipient. Pioneer of accessible, high-volume cardiovascular healthcare.",
    room: "Heart Center, Room 302",
    available_days: ["Mon", "Tue", "Wed", "Thu", "Fri"]
  },
  {
    id: "doc-2",
    name: "Dr. Sandra Lee",
    specialty: "Dermatologist",
    rating: 4.92,
    experience: "18 years",
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80",
    bio: "Internationally acclaimed board-certified Dermatologist (FAAD) & Cutaneous Surgeon. Expert in medical dermatology, eczema, skin barrier, and lesions.",
    room: "Derma Suite, Room 114",
    available_days: ["Mon", "Wed", "Fri", "Sat"]
  },
  {
    id: "doc-3",
    name: "Dr. Harvey Karp",
    specialty: "Pediatrician",
    rating: 4.95,
    experience: "28 years",
    avatar: "https://images.unsplash.com/photo-1594824813579-9943ff1bf4b1?w=400&auto=format&fit=crop&q=80",
    bio: "Fellow of the American Academy of Pediatrics (FAAP) and acclaimed child development specialist. Pioneer in infant care, pediatric wellness, and milestones.",
    room: "Kids Wellness, Room 205",
    available_days: ["Mon", "Tue", "Thu", "Fri"]
  },
  {
    id: "doc-4",
    name: "Dr. Sanjay Gupta",
    specialty: "Neurologist",
    rating: 4.96,
    experience: "22 years",
    avatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80",
    bio: "Associate Professor of Neurosurgery at Emory University. Leading expert in migraine pathology, neuropathy, spine and brain health, and cognitive neurology.",
    room: "Neuro Wing, Room 410",
    available_days: ["Tue", "Wed", "Thu"]
  },
  {
    id: "doc-5",
    name: "Dr. James Andrews",
    specialty: "Orthopedic Surgeon",
    rating: 4.99,
    experience: "35 years",
    avatar: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&auto=format&fit=crop&q=80",
    bio: "World-renowned pioneer in orthopedics, sports medicine, and arthroscopic joint repair. Premier authority on knee, shoulder, and musculoskeletal health.",
    room: "Bone & Joint Clinic, Room 108",
    available_days: ["Mon", "Tue", "Wed", "Fri"]
  },
  {
    id: "doc-6",
    name: "Dr. Siddhartha Mukherjee",
    specialty: "General Physician",
    rating: 4.97,
    experience: "20 years",
    avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&auto=format&fit=crop&q=80",
    bio: "Rhodes Scholar, Columbia University Associate Professor of Medicine, and Pulitzer Prize winner. Specialist in internal medicine, diagnostics, and general wellness.",
    room: "Primary Care, Room 101",
    available_days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  }
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: "APT-261124-2001",
    patient_phone: "5552345678",
    patient_name: "John Davis",
    doctor_id: "doc-2",
    doctor_name: "Dr. Marcus Chen",
    specialty: "Dermatologist",
    date: "2026-11-25",
    time_slot: "10:30 AM",
    status: "confirmed",
    created_at: "2026-11-24 18:30:00",
    notes: "Booked via AI Voice Agent"
  }
];

// Persistent global singleton across hot reloads and serverless invocations
declare global {
  var _clinicAppointments: Appointment[] | undefined;
}

export function getAppointmentsStore(): Appointment[] {
  if (!global._clinicAppointments) {
    global._clinicAppointments = [...INITIAL_APPOINTMENTS];
  }
  return global._clinicAppointments;
}

export function resetAppointmentsStore(): void {
  global._clinicAppointments = [...INITIAL_APPOINTMENTS];
}

