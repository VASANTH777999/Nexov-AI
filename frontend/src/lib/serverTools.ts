import { INITIAL_DOCTORS, getAppointmentsStore } from './serverStore';

export const TOOLS_SCHEMA = [
  {
    type: "function",
    function: {
      name: "check_doctor_availability",
      description: "Checks available appointment slots for a doctor, medical specialty, or date. Call this when the caller asks about doctor availability or open appointment times.",
      parameters: {
        type: "object",
        properties: {
          doctor_name_or_specialty: {
            type: "string",
            description: "Doctor name (e.g. Dr. Jenkins, Dr. Chen) or medical specialty in English (Cardiologist, Dermatologist, Pediatrician, Neurologist, Orthopedic Surgeon, General Physician)"
          },
          date: {
            type: "string",
            description: "Target date for the appointment. Can be 'today', 'tomorrow', or a date in YYYY-MM-DD format."
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "book_appointment",
      description: "Books a selected doctor appointment slot for the caller. Requires the caller's spoken phone number. ONLY call this AFTER reading the phone number back to the caller to confirm.",
      parameters: {
        type: "object",
        properties: {
          patient_phone: {
            type: "string",
            description: "The caller's phone number as spoken by them (e.g., '5552345678' or '9876543210')."
          },
          doctor_name_or_id: {
            type: "string",
            description: "Name or ID of the doctor in English (e.g. 'Dr. Sarah Jenkins' or 'Dr. Marcus Chen' or 'Cardiologist')."
          },
          date: {
            type: "string",
            description: "Appointment date in YYYY-MM-DD format or 'tomorrow'."
          },
          time_slot: {
            type: "string",
            description: "Chosen time slot (e.g. '09:00 AM', '10:30 AM', '02:00 PM')."
          },
          patient_name: {
            type: "string",
            description: "The caller's name if they provided it, otherwise 'Caller'."
          }
        },
        required: ["patient_phone", "doctor_name_or_id", "date", "time_slot"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "cancel_appointment",
      description: "Cancels an existing appointment found using the caller's spoken phone number. ONLY call this AFTER reading the phone number back to the caller to confirm.",
      parameters: {
        type: "object",
        properties: {
          patient_phone: {
            type: "string",
            description: "The caller's phone number used when the appointment was booked."
          },
          appointment_id_or_date: {
            type: "string",
            description: "Optional specific appointment ID (e.g. APT-2001) or date if known."
          },
          doctor_name: {
            type: "string",
            description: "Optional doctor's name for disambiguation if caller has multiple appointments."
          }
        },
        required: ["patient_phone"]
      }
    }
  }
];

export function detectTextLanguage(text: string): string {
  if (!text) return "English";
  if (/[\u0C00-\u0C7F]/.test(text)) return "Telugu";
  if (/[\u0900-\u097F]/.test(text)) return "Hindi";
  if (/[\u0B80-\u0BFF]/.test(text)) return "Tamil";
  if (/[\u0C80-\u0CFF]/.test(text)) return "Kannada";
  if (/[\u0D00-\u0D7F]/.test(text)) return "Malayalam";
  if (/[\u0980-\u09FF]/.test(text)) return "Bengali";
  if (/[\u0A80-\u0AFF]/.test(text)) return "Gujarati";

  const low = text.toLowerCase();
  if (/\b(namaskaram|ela unnaru|kavali|undi|cheppandi|dhanyavadalu|meeru)\b/.test(low)) return "Telugu";
  if (/\b(namaste|kaise|chahiye|doctor sahab|bataiye|dhanyawad|shukriya|aap)\b/.test(low)) return "Hindi";
  if (/\b(vanakkam|epdi irukeenga|venum|solleenga|nandri)\b/.test(low)) return "Tamil";

  return "English";
}

export const SYSTEM_PROMPT = `You are Alex, a warm, polite, and highly experienced Human Medical Receptionist at NexovAI Medical Clinic. You speak with natural human warmth, empathy, and professional healthcare courtesy.

CRITICAL COMMUNICATION & TONE RULES:
1. PURE HUMAN-LIKE TONE:
   - Speak exactly like a caring, real human receptionist at a top hospital.
   - Never sound robotic, mechanical, scripted, or AI-toned.
   - Never say "As an AI model", "I am an artificial assistant", or use robotic terminology.
   - Spoken phone responses must be natural, clear, and concise (1 to 2 sentences) so they sound crisp and fluid over a phone call. Avoid markdown bullet points or asterisks.

2. STRICT LANGUAGE ISOLATION & ACCURACY:
   - Always reply 100% in the EXACT SAME LANGUAGE the caller is currently speaking.
   - If the caller speaks English, reply 100% in natural, fluent English.
   - If the caller speaks Telugu, reply 100% in natural, fluent Telugu.
   - If the caller speaks Hindi, reply 100% in natural, fluent Hindi.
   - If the caller speaks Tamil, Kannada, Malayalam, Marathi, or Bengali, reply 100% in that exact language.
   - ABSOLUTE PROHIBITION ON LANGUAGE MIXING: Never mix multiple languages in a single reply (do not start in English and switch to Telugu, or vice-versa).
   - NEVER SWITCH LANGUAGES unless the caller explicitly switches language first.

3. CLINICAL STAFF & SPECIALTIES:
   - Dr. Devi Shetty (Cardiologist, Heart Center, Room 302). Chairman of Narayana Health, Padma Bhushan recipient, 30+ yrs experience. Focus: cardiovascular surgery, hypertension, preventive cardiology.
   - Dr. Sandra Lee (Dermatologist, Derma Suite, Room 114). Board-certified FAAD, 18 yrs experience. Focus: clinical dermatology, eczema, acne, skin lesions, skin cancer screening.
   - Dr. Harvey Karp (Pediatrician, Kids Wellness, Room 205). FAAP, acclaimed child development pioneer, 28 yrs experience. Focus: infant soothing, pediatric wellness, developmental health.
   - Dr. Sanjay Gupta (Neurologist, Neuro Wing, Room 410). Associate Professor of Neurosurgery, 22 yrs experience. Focus: migraines, chronic headaches, neuropathy, spine/brain wellness.
   - Dr. James Andrews (Orthopedic Surgeon, Bone & Joint Clinic, Room 108). World authority on sports medicine, 35 yrs experience. Focus: knee, shoulder, joint arthroscopy, ligament repair.
   - Dr. Siddhartha Mukherjee (General Physician, Primary Care, Room 101). Rhodes Scholar, Pulitzer Prize winner, 20 yrs experience. Focus: internal medicine, diagnostic triaging, wellness.

4. BROAD CONVERSATIONAL INTELLIGENCE & UNRELATED CHAT:
   - Primarily, you manage clinic reception, doctor availability, and appointments.
   - You ALSO possess rich, open-ended conversational intelligence. If the caller asks general questions, casual small talk, health curiosity, or completely unrelated inquiries (e.g. "How are you doing today?", "I had a stressful morning", "What's good for a sore throat?", "Tell me about yourself", "What's the weather like?", or everyday trivia):
     * Respond warmly, thoughtfully, and helpfully to whatever they say!
     * NEVER give a robotic refusal such as "I can only answer appointment questions".
     * Answer naturally with a warm human smile. When relevant, you can gently offer: "Would you like me to book a quick consultation with Dr. Siddhartha Mukherjee or one of our doctors to help you out?"

5. CORE CLINIC PROTOCOLS:
   - IDENTIFICATION SOLELY BY SPOKEN PHONE NUMBER: Callers are identified ONLY by the phone number they speak out loud. No passwords, logins, or OTPs.
   - MANDATORY VERBAL CONFIRMATION BEFORE BOOKING OR CANCELLING:
     Before executing book_appointment or cancel_appointment, you MUST repeat the phone number back to the caller in their spoken language and ask for verbal confirmation.
     * English: "I have your phone number as 9876543210. Is that correct?"
     * Telugu: "నేను మీ ఫోన్ నంబర్‌ను 9876543210 గా నమోదు చేసుకున్నాను. ఇది సరైనదేనా అండీ?"
     * Hindi: "मैंने आपका फ़ोन नंबर 9876543210 दर्ज किया है। क्या यह सही है?"
     Only call the booking/cancellation tool AFTER the caller verbally confirms (e.g. 'Yes', 'Correct', 'అవును', 'हाँ').
   - Tool arguments (doctor names, specialties, dates) must be passed in English to function calls, while your speech to the caller is in their preferred language.
`;

export function normalizePhone(phone: string): string {
  if (!phone) return "";
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    digits = digits.slice(1);
  }
  return digits;
}

export function formatPhone(digits: string): string {
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return digits;
}

export function executeServerTool(toolName: string, args: Record<string, any>) {
  const appointments = getAppointmentsStore();

  if (toolName === "check_doctor_availability") {
    const query = (args.doctor_name_or_specialty || "").toLowerCase();
    const targetDate = args.date || "tomorrow";

    const matchedDocs = query
      ? INITIAL_DOCTORS.filter(d => d.name.toLowerCase().includes(query) || d.specialty.toLowerCase().includes(query))
      : INITIAL_DOCTORS;

    const standardTimes = ["09:00 AM", "10:30 AM", "11:30 AM", "02:00 PM", "03:30 PM", "04:30 PM"];
    const slots = [];

    for (const doc of matchedDocs.slice(0, 3)) {
      for (const time of standardTimes.slice(0, 3)) {
        slots.push({
          doctor_id: doc.id,
          doctor_name: doc.name,
          specialty: doc.specialty,
          date: targetDate,
          time: time,
          room: doc.room
        });
      }
    }

    return {
      status: "success",
      search_date: targetDate,
      count: slots.length,
      available_slots: slots
    };
  }

  if (toolName === "book_appointment") {
    const rawPhone = args.patient_phone || "";
    const cleanPhone = normalizePhone(rawPhone);

    if (!cleanPhone || cleanPhone.length < 7) {
      return { status: "error", message: "A valid phone number is required to book an appointment." };
    }

    const docQuery = (args.doctor_name_or_id || "").toLowerCase();
    const doc = INITIAL_DOCTORS.find(d => d.id === docQuery || d.name.toLowerCase().includes(docQuery) || d.specialty.toLowerCase().includes(docQuery)) || INITIAL_DOCTORS[0];

    const aptId = `APT-${Date.now().toString().slice(-6)}`;
    const newApt = {
      id: aptId,
      patient_phone: cleanPhone,
      patient_name: args.patient_name || "Caller",
      doctor_id: doc.id,
      doctor_name: doc.name,
      specialty: doc.specialty,
      date: args.date || "2026-11-25",
      time_slot: args.time_slot || "10:30 AM",
      status: "confirmed" as const,
      created_at: new Date().toISOString(),
      notes: "Booked via AI Voice Agent"
    };

    appointments.unshift(newApt);

    return {
      status: "success",
      appointment_id: aptId,
      patient_phone: cleanPhone,
      formatted_phone: formatPhone(cleanPhone),
      doctor_name: doc.name,
      specialty: doc.specialty,
      date: newApt.date,
      time_slot: newApt.time_slot,
      room: doc.room,
      message: `Appointment successfully confirmed with ${doc.name} (${doc.specialty}) for ${newApt.date} at ${newApt.time_slot}.`
    };
  }

  if (toolName === "cancel_appointment") {
    const rawPhone = args.patient_phone || "";
    const cleanPhone = normalizePhone(rawPhone);

    if (!cleanPhone) {
      return { status: "error", message: "A valid phone number is required to cancel your appointment." };
    }

    const existingIndex = appointments.findIndex(a => a.status === 'confirmed' && (a.patient_phone.includes(cleanPhone) || cleanPhone.includes(a.patient_phone)));

    if (existingIndex === -1) {
      return { status: "error", message: `No active appointment found for phone number ${formatPhone(cleanPhone)}.` };
    }

    const apt = appointments[existingIndex];
    apt.status = 'cancelled';

    return {
      status: "success",
      appointment_id: apt.id,
      patient_phone: cleanPhone,
      doctor_name: apt.doctor_name,
      specialty: apt.specialty,
      date: apt.date,
      time_slot: apt.time_slot,
      message: `Appointment ${apt.id} with ${apt.doctor_name} on ${apt.date} at ${apt.time_slot} has been successfully cancelled.`
    };
  }

  return { status: "error", message: `Unknown tool: ${toolName}` };
}
