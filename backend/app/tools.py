import json
import re
from typing import Dict, Any, List, Optional
from .database import (
    check_doctor_availability as db_check_availability,
    book_appointment as db_book_appointment,
    cancel_appointment as db_cancel_appointment,
    get_all_doctors,
    format_phone_display,
    normalize_phone
)

# Tool Schemas for Nvidia NIM / OpenAI compatible Function Calling
TOOLS_SCHEMA = [
    {
        "type": "function",
        "function": {
            "name": "check_doctor_availability",
            "description": "Checks available appointment slots for a doctor, medical specialty, or date. Call this when the caller asks about doctor availability or open appointment times.",
            "parameters": {
                "type": "object",
                "properties": {
                    "doctor_name_or_specialty": {
                        "type": "string",
                        "description": "Doctor name (e.g. Dr. Jenkins, Dr. Chen) or medical specialty in English (Cardiologist, Dermatologist, Pediatrician, Neurologist, Orthopedic Surgeon, General Physician)"
                    },
                    "date": {
                        "type": "string",
                        "description": "Target date for the appointment. Can be 'today', 'tomorrow', or a date in YYYY-MM-DD format."
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "book_appointment",
            "description": "Books a selected doctor appointment slot for the caller. Requires the caller's spoken phone number. ONLY call this AFTER reading the phone number back to the caller to confirm.",
            "parameters": {
                "type": "object",
                "properties": {
                    "patient_phone": {
                        "type": "string",
                        "description": "The caller's phone number as spoken by them (e.g., '5552345678' or '9876543210')."
                    },
                    "doctor_name_or_id": {
                        "type": "string",
                        "description": "Name or ID of the doctor in English (e.g. 'Dr. Sarah Jenkins' or 'Dr. Marcus Chen' or 'Cardiologist')."
                    },
                    "date": {
                        "type": "string",
                        "description": "Appointment date in YYYY-MM-DD format or 'tomorrow'."
                    },
                    "time_slot": {
                        "type": "string",
                        "description": "Chosen time slot (e.g. '09:00 AM', '10:30 AM', '02:00 PM')."
                    },
                    "patient_name": {
                        "type": "string",
                        "description": "The caller's name if they provided it, otherwise 'Caller'."
                    }
                },
                "required": ["patient_phone", "doctor_name_or_id", "date", "time_slot"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "cancel_appointment",
            "description": "Cancels an existing appointment found using the caller's spoken phone number. ONLY call this AFTER reading the phone number back to the caller to confirm.",
            "parameters": {
                "type": "object",
                "properties": {
                    "patient_phone": {
                        "type": "string",
                        "description": "The caller's phone number used when the appointment was booked."
                    },
                    "appointment_id_or_date": {
                        "type": "string",
                        "description": "Optional specific appointment ID (e.g. APT-2001) or date if known."
                    },
                    "doctor_name": {
                        "type": "string",
                        "description": "Optional doctor's name for disambiguation if caller has multiple appointments."
                    }
                },
                "required": ["patient_phone"]
            }
        }
    }
]

def detect_text_language(text: str) -> str:
    """Accurately detects whether text is Telugu, Hindi, Tamil, Kannada, Malayalam, or English."""
    if not text:
        return "English"
    if re.search(r"[\u0C00-\u0C7F]", text):
        return "Telugu"
    if re.search(r"[\u0900-\u097F]", text):
        return "Hindi"
    if re.search(r"[\u0B80-\u0BFF]", text):
        return "Tamil"
    if re.search(r"[\u0C80-\u0CFF]", text):
        return "Kannada"
    if re.search(r"[\u0D00-\u0D7F]", text):
        return "Malayalam"
    if re.search(r"[\u0980-\u09FF]", text):
        return "Bengali"
    if re.search(r"[\u0A80-\u0AFF]", text):
        return "Gujarati"
    if re.search(r"[\u0A00-\u0A7F]", text):
        return "Punjabi"
    if re.search(r"[\u0B00-\u0B7F]", text):
        return "Odia"

    # Check for romanized conversational markers
    low = text.lower()
    if any(k in low for k in ["namaskaram", "ela unnaru", "kavali", "undi", "cheppandi", "dhanyavadalu", "meeru"]):
        return "Telugu"
    if any(k in low for k in ["namaste", "aap kaise", "chahiye", "doctor sahab", "bataiye", "dhanyawad", "shukriya"]):
        return "Hindi"
    if any(k in low for k in ["vanakkam", "epdi irukeenga", "venum", "solleenga", "nandri"]):
        return "Tamil"

    return "English"

SYSTEM_PROMPT = """You are Alex, a warm, polite, and deeply caring Human Medical Receptionist at NexovAI Health & Medical Pavilion. You speak on the phone with natural human warmth, empathy, and professional healthcare courtesy.

CORE PERSONA & HUMAN CONVERSATIONAL STYLE:
- Speak as a real, compassionate human hospital coordinator.
- Never sound robotic, mechanical, scripted, or AI-toned.
- NEVER say "As an AI model", "I am an artificial assistant", or use synthetic disclaimers.
- Use natural conversational warmth: "Oh, absolutely!", "I completely understand", "Take your time", "Let me check that right away for you", "I hope you feel much better soon".
- Keep spoken voice responses crisp, fluid, and natural (1 to 2 clear sentences) so it sounds smooth and effortless over a phone call. Avoid markdown bullet points or asterisks.

COMPREHENSIVE CLINIC KNOWLEDGE BASE:
- Facility: NexovAI Health & Medical Pavilion (Suite 400, 100 Health Way). Hours: Monday to Saturday 8:00 AM – 6:00 PM (Emergency triage 24/7). Direct line: +91 1800-639-6824.
- Specialists:
  1. Dr. Devi Shetty — Cardiologist & Cardiac Surgeon (Heart Center, Room 302). Chairman of Narayana Health, Padma Bhushan recipient, 30+ yrs experience. Focus: cardiovascular surgery, hypertension, preventive cardiology.
  2. Dr. Sandra Lee — Dermatologist (Derma Suite, Room 114). Board-certified FAAD, 18 yrs experience. Focus: clinical dermatology, eczema, acne, skin lesions, skin cancer screening.
  3. Dr. Harvey Karp — Pediatrician (Kids Wellness, Room 205). FAAP, acclaimed child development pioneer, 28 yrs experience. Focus: infant soothing, pediatric wellness, developmental health.
  4. Dr. Sanjay Gupta — Neurologist & Neurosurgeon (Neuro Wing, Room 410). Associate Professor of Neurosurgery, 22 yrs experience. Focus: migraines, chronic headaches, neuropathy, spine/brain wellness.
  5. Dr. James Andrews — Orthopedic Surgeon (Bone & Joint Clinic, Room 108). World authority on sports medicine, 35 yrs experience. Focus: knee, shoulder, joint arthroscopy, ligament repair.
  6. Dr. Siddhartha Mukherjee — General Physician & Oncologist (Primary Care, Room 101). Rhodes Scholar, Pulitzer Prize winner, 20 yrs experience. Focus: internal medicine, diagnostic triaging, wellness.

BROAD CONVERSATIONAL INTELLIGENCE & UNRELATED CHAT:
- Primarily, you manage clinic reception, doctor availability, and appointments.
- You ALSO possess rich, open-ended conversational intelligence. If the caller asks general questions, casual small talk, health curiosity, or completely unrelated inquiries (e.g. "How are you doing today?", "I had a stressful morning", "What's good for a sore throat?", "Tell me about yourself", "What's the weather like?", or everyday trivia):
  * Respond warmly, thoughtfully, and helpfully to whatever they say!
  * NEVER give a robotic refusal such as "I can only answer appointment questions".
  * Answer naturally with a warm human smile. When relevant, you can gently offer: "Would you like me to book a quick consultation with Dr. Siddhartha Mukherjee or one of our doctors to help you out?"

STRICT LANGUAGE ISOLATION (ZERO LANGUAGE MIXING):
- Always reply 100% in the EXACT SAME LANGUAGE the caller is currently speaking.
- If the caller speaks English, reply 100% in natural, fluent English.
- If the caller speaks Telugu, reply 100% in natural, respectful Telugu (తెలుగు).
- If the caller speaks Hindi, reply 100% in natural, polite Hindi (हिंदी).
- If the caller speaks Tamil, Kannada, Malayalam, Marathi, or Bengali, reply 100% in that exact language.
- NEVER mix multiple languages in a single reply (no Hindi words in English, no English words in Telugu).
- NEVER switch languages unless the caller explicitly switches language first.

MANDATORY PHONE AUTHENTICATION PROTOCOL:
- Callers are identified solely by the phone number they speak out loud. No password, login, or OTP is ever needed.
- Before executing `book_appointment` or `cancel_appointment`, you MUST repeat the phone number back to the caller in their spoken language and ask for verbal confirmation.
  * English: "I have your phone number as 9876543210. Is that correct?"
  * Telugu: "నేను మీ ఫోన్ నంబర్‌ను 9876543210 గా నమోదు చేసుకున్నాను. ఇది సరైనదేనా అండీ?"
  * Hindi: "मैंने आपका फ़ोन नंबर 9876543210 दर्ज किया है। क्या यह सही है?"
- Only execute the tool AFTER the caller verbally confirms (e.g. 'Yes', 'Correct', 'అవును', 'हाँ').
- Pass tool arguments (doctor names, specialties, dates) in English to functions, while your speech to the caller is in their preferred language.
"""

def execute_tool(tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    """Execute a function call by name with provided arguments."""
    try:
        if tool_name == "check_doctor_availability":
            doctor_name_or_specialty = arguments.get("doctor_name_or_specialty")
            date = arguments.get("date")
            result = db_check_availability(doctor_name_or_specialty, date)
            return result

        elif tool_name == "book_appointment":
            patient_phone = arguments.get("patient_phone", "")
            doctor_name_or_id = arguments.get("doctor_name_or_id", "")
            date = arguments.get("date", "")
            time_slot = arguments.get("time_slot", "")
            patient_name = arguments.get("patient_name", "Caller")
            result = db_book_appointment(
                patient_phone=patient_phone,
                doctor_name_or_id=doctor_name_or_id,
                appointment_date=date,
                time_slot=time_slot,
                patient_name=patient_name
            )
            return result

        elif tool_name == "cancel_appointment":
            patient_phone = arguments.get("patient_phone", "")
            appointment_id_or_date = arguments.get("appointment_id_or_date")
            doctor_name = arguments.get("doctor_name")
            result = db_cancel_appointment(
                patient_phone=patient_phone,
                appointment_id_or_date=appointment_id_or_date,
                doctor_name=doctor_name
            )
            return result

        else:
            return {"status": "error", "message": f"Unknown tool: {tool_name}"}

    except Exception as e:
        return {"status": "error", "message": str(e)}
