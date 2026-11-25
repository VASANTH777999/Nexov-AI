import sqlite3
import os
import re
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional
from .config import settings

def normalize_phone(phone: str) -> str:
    """Extract only digits from a phone number string and standardize format."""
    if not phone:
        return ""
    digits = re.sub(r"\D", "", phone)
    # If 11 digits starting with 1, strip leading 1
    if len(digits) == 11 and digits.startswith("1"):
        digits = digits[1:]
    return digits

def format_phone_display(digits: str) -> str:
    """Format digits into readable phone number (XXX) XXX-XXXX or standard chunking."""
    if len(digits) == 10:
        return f"({digits[0:3]}) {digits[3:6]}-{digits[6:10]}"
    return digits

def get_connection():
    os.makedirs(os.path.dirname(settings.DATABASE_PATH), exist_ok=True)
    conn = sqlite3.connect(settings.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db(force_reseed: bool = False):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS doctors (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        specialty TEXT NOT NULL,
        rating REAL NOT NULL,
        experience TEXT NOT NULL,
        avatar TEXT NOT NULL,
        bio TEXT NOT NULL,
        room TEXT NOT NULL,
        available_days TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS slots (
        id TEXT PRIMARY KEY,
        doctor_id TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        is_available INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (doctor_id) REFERENCES doctors(id)
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY,
        patient_phone TEXT NOT NULL,
        patient_name TEXT DEFAULT 'Caller',
        doctor_id TEXT NOT NULL,
        doctor_name TEXT NOT NULL,
        specialty TEXT NOT NULL,
        date TEXT NOT NULL,
        time_slot TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'confirmed',
        created_at TEXT NOT NULL,
        notes TEXT,
        FOREIGN KEY (doctor_id) REFERENCES doctors(id)
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS call_logs (
        id TEXT PRIMARY KEY,
        start_time TEXT NOT NULL,
        end_time TEXT,
        caller_phone TEXT,
        duration_seconds INTEGER DEFAULT 0,
        transcript_json TEXT,
        actions_json TEXT
    );
    """)

    conn.commit()

    # Check if doctors exist
    cursor.execute("SELECT COUNT(*) FROM doctors")
    doc_count = cursor.fetchone()[0]

    if doc_count == 0 or force_reseed:
        seed_mock_data(conn)

    conn.close()

def seed_mock_data(conn):
    cursor = conn.cursor()
    cursor.execute("DELETE FROM slots;")
    cursor.execute("DELETE FROM doctors;")
    # keep appointments clean or seed a sample appointment
    cursor.execute("DELETE FROM appointments;")

    doctors = [
        (
            "doc-1",
            "Dr. Devi Shetty",
            "Cardiologist",
            4.98,
            "30+ years",
            "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80",
            "World-renowned Cardiac Surgeon, Chairman of Narayana Health & Padma Bhushan recipient. Pioneer of accessible, high-volume cardiovascular healthcare.",
            "Heart Center, Room 302",
            "Mon,Tue,Wed,Thu,Fri"
        ),
        (
            "doc-2",
            "Dr. Sandra Lee",
            "Dermatologist",
            4.92,
            "18 years",
            "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80",
            "Internationally acclaimed board-certified Dermatologist (FAAD) & Cutaneous Surgeon. Expert in medical dermatology, eczema, skin barrier, and lesions.",
            "Derma Suite, Room 114",
            "Mon,Wed,Fri,Sat"
        ),
        (
            "doc-3",
            "Dr. Harvey Karp",
            "Pediatrician",
            4.95,
            "28 years",
            "https://images.unsplash.com/photo-1594824813579-9943ff1bf4b1?w=400&auto=format&fit=crop&q=80",
            "Fellow of the American Academy of Pediatrics (FAAP) and acclaimed child development specialist. Pioneer in infant care, pediatric wellness, and milestones.",
            "Kids Wellness, Room 205",
            "Mon,Tue,Thu,Fri"
        ),
        (
            "doc-4",
            "Dr. Sanjay Gupta",
            "Neurologist",
            4.96,
            "22 years",
            "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80",
            "Associate Professor of Neurosurgery at Emory University. Leading expert in migraine pathology, neuropathy, spine and brain health, and cognitive neurology.",
            "Neuro Wing, Room 410",
            "Tue,Wed,Thu"
        ),
        (
            "doc-5",
            "Dr. James Andrews",
            "Orthopedic Surgeon",
            4.99,
            "35 years",
            "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&auto=format&fit=crop&q=80",
            "World-renowned pioneer in orthopedics, sports medicine, and arthroscopic joint repair. Premier authority on knee, shoulder, and musculoskeletal health.",
            "Bone & Joint Clinic, Room 108",
            "Mon,Tue,Wed,Fri"
        ),
        (
            "doc-6",
            "Dr. Siddhartha Mukherjee",
            "General Physician",
            4.97,
            "20 years",
            "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&auto=format&fit=crop&q=80",
            "Rhodes Scholar, Columbia University Associate Professor of Medicine, and Pulitzer Prize winner. Specialist in internal medicine, diagnostics, and general wellness.",
            "Primary Care, Room 101",
            "Mon,Tue,Wed,Thu,Fri,Sat"
        ),
    ]

    cursor.executemany("""
    INSERT INTO doctors (id, name, specialty, rating, experience, avatar, bio, room, available_days)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, doctors)

    # Seed slots for today, tomorrow, and the next 5 days
    today = date.today()
    standard_times = ["09:00 AM", "10:30 AM", "11:30 AM", "02:00 PM", "03:30 PM", "04:30 PM"]

    slot_entries = []
    slot_counter = 1
    for day_offset in range(0, 6):
        cur_date = (today + timedelta(days=day_offset)).strftime("%Y-%m-%d")
        for doc in doctors:
            doc_id = doc[0]
            # Vary slot availability slightly
            for idx, time_slot in enumerate(standard_times):
                slot_id = f"slot-{slot_counter}"
                slot_counter += 1
                # Make most slots available, a couple booked
                is_avail = 1
                slot_entries.append((slot_id, doc_id, cur_date, time_slot, is_avail))

    cursor.executemany("""
    INSERT INTO slots (id, doctor_id, date, time, is_available)
    VALUES (?, ?, ?, ?, ?);
    """, slot_entries)

    # Seed 2 realistic sample existing appointments for immediate testing
    tomorrow_str = (today + timedelta(days=1)).strftime("%Y-%m-%d")
    sample_phone = "5552345678"
    sample_apt_id = "APT-2001"
    cursor.execute("""
    INSERT INTO appointments (id, patient_phone, patient_name, doctor_id, doctor_name, specialty, date, time_slot, status, created_at, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        sample_apt_id,
        sample_phone,
        "John Davis",
        "doc-2",
        "Dr. Marcus Chen",
        "Dermatologist",
        tomorrow_str,
        "10:30 AM",
        "confirmed",
        datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "Booked via AI Voice Agent"
    ))
    # Mark that slot as unavailable
    cursor.execute("UPDATE slots SET is_available = 0 WHERE doctor_id = 'doc-2' AND date = ? AND time = '10:30 AM'", (tomorrow_str,))

    conn.commit()

def get_all_doctors() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM doctors")
    rows = cursor.fetchall()
    doctors = []
    for r in rows:
        d = dict(r)
        d["available_days"] = d["available_days"].split(",")
        doctors.append(d)
    conn.close()
    return doctors

def check_doctor_availability(specialty_or_name: Optional[str] = None, target_date: Optional[str] = None) -> Dict[str, Any]:
    """
    Find available slots for a doctor or specialty on a given date (or next available).
    """
    conn = get_connection()
    cursor = conn.cursor()

    today_str = date.today().strftime("%Y-%m-%d")
    tomorrow_str = (date.today() + timedelta(days=1)).strftime("%Y-%m-%d")

    # Normalize relative date strings
    if target_date:
        low = target_date.lower().strip()
        if "today" in low:
            target_date = today_str
        elif "tomorrow" in low:
            target_date = tomorrow_str
        elif not re.match(r"^\d{4}-\d{2}-\d{2}$", target_date):
            # If not YYYY-MM-DD, default to tomorrow
            target_date = tomorrow_str
    else:
        target_date = tomorrow_str

    query = """
    SELECT s.id as slot_id, s.date, s.time, d.id as doctor_id, d.name as doctor_name, d.specialty, d.room
    FROM slots s
    JOIN doctors d ON s.doctor_id = d.id
    WHERE s.is_available = 1 AND s.date >= ?
    """
    params = [target_date]

    if specialty_or_name:
        term = f"%{specialty_or_name.strip()}%"
        query += " AND (d.name LIKE ? OR d.specialty LIKE ?)"
        params.extend([term, term])

    query += " ORDER BY s.date ASC, s.time ASC LIMIT 10"

    cursor.execute(query, params)
    rows = cursor.fetchall()

    slots = [dict(r) for r in rows]
    conn.close()

    return {
        "status": "success",
        "search_date": target_date,
        "search_query": specialty_or_name,
        "count": len(slots),
        "available_slots": slots
    }

def book_appointment(patient_phone: str, doctor_name_or_id: str, appointment_date: str, time_slot: str, patient_name: str = "Caller") -> Dict[str, Any]:
    """
    Books an appointment for the caller identified by phone number.
    """
    clean_phone = normalize_phone(patient_phone)
    if not clean_phone or len(clean_phone) < 7:
        return {
            "status": "error",
            "message": "A valid phone number with at least 7 digits is required to book an appointment."
        }

    conn = get_connection()
    cursor = conn.cursor()

    today_str = date.today().strftime("%Y-%m-%d")
    tomorrow_str = (date.today() + timedelta(days=1)).strftime("%Y-%m-%d")

    # Normalize appointment date
    date_clean = appointment_date.lower().strip()
    if "today" in date_clean:
        resolved_date = today_str
    elif "tomorrow" in date_clean:
        resolved_date = tomorrow_str
    elif re.match(r"^\d{4}-\d{2}-\d{2}$", appointment_date.strip()):
        resolved_date = appointment_date.strip()
    else:
        resolved_date = tomorrow_str

    # Find the doctor
    cursor.execute("""
    SELECT * FROM doctors WHERE id = ? OR name LIKE ? OR specialty LIKE ? LIMIT 1
    """, (doctor_name_or_id, f"%{doctor_name_or_id}%", f"%{doctor_name_or_id}%"))
    doc_row = cursor.fetchone()

    if not doc_row:
        conn.close()
        return {
            "status": "error",
            "message": f"Could not find doctor matching '{doctor_name_or_id}'."
        }

    doc = dict(doc_row)

    # Standardize time format (e.g., "10:30 AM" or "10:30am" or "10:30")
    norm_time = time_slot.strip().upper()
    if "AM" not in norm_time and "PM" not in norm_time:
        # Default assumption: 9-11 is AM, 12-5 is PM
        try:
            hour = int(norm_time.split(":")[0])
            if hour >= 8 and hour <= 11:
                norm_time = f"{norm_time} AM"
            else:
                norm_time = f"{norm_time} PM"
        except Exception:
            pass

    # Check or reserve slot
    cursor.execute("""
    SELECT id FROM slots WHERE doctor_id = ? AND date = ? AND (time LIKE ? OR time = ?) AND is_available = 1 LIMIT 1
    """, (doc["id"], resolved_date, f"%{norm_time}%", norm_time))
    slot_row = cursor.fetchone()

    slot_id = None
    if slot_row:
        slot_id = slot_row["id"]
        cursor.execute("UPDATE slots SET is_available = 0 WHERE id = ?", (slot_id,))
    else:
        # Even if specific pre-seeded slot row is taken, check if already booked at exact same time
        cursor.execute("""
        SELECT id FROM appointments WHERE doctor_id = ? AND date = ? AND time_slot = ? AND status = 'confirmed'
        """, (doc["id"], resolved_date, norm_time))
        existing_apt = cursor.fetchone()
        if existing_apt:
            conn.close()
            return {
                "status": "error",
                "message": f"That slot at {norm_time} on {resolved_date} with {doc['name']} is unfortunately already booked. Would you like to check other times?"
            }

    # Generate appointment ID
    apt_id = f"APT-{datetime.now().strftime('%y%m%d')}-{abs(hash(clean_phone + resolved_date + norm_time)) % 10000:04d}"
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    cursor.execute("""
    INSERT INTO appointments (id, patient_phone, patient_name, doctor_id, doctor_name, specialty, date, time_slot, status, created_at, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?)
    """, (
        apt_id,
        clean_phone,
        patient_name,
        doc["id"],
        doc["name"],
        doc["specialty"],
        resolved_date,
        norm_time,
        now_str,
        "Booked via AI Voice Agent"
    ))

    conn.commit()
    conn.close()

    return {
        "status": "success",
        "appointment_id": apt_id,
        "patient_phone": clean_phone,
        "formatted_phone": format_phone_display(clean_phone),
        "doctor_name": doc["name"],
        "specialty": doc["specialty"],
        "room": doc["room"],
        "date": resolved_date,
        "time_slot": norm_time,
        "message": f"Appointment successfully confirmed with {doc['name']} ({doc['specialty']}) for {resolved_date} at {norm_time}."
    }

def cancel_appointment(patient_phone: str, appointment_id_or_date: Optional[str] = None, doctor_name: Optional[str] = None) -> Dict[str, Any]:
    """
    Cancels an existing appointment found using the phone number caller spoke.
    """
    clean_phone = normalize_phone(patient_phone)
    if not clean_phone or len(clean_phone) < 7:
        return {
            "status": "error",
            "message": "A valid phone number is required to locate and cancel your appointment."
        }

    conn = get_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM appointments WHERE patient_phone = ? AND status = 'confirmed'"
    params = [clean_phone]

    if appointment_id_or_date:
        term = appointment_id_or_date.strip()
        query += " AND (id = ? OR date LIKE ?)"
        params.extend([term, f"%{term}%"])

    if doctor_name:
        query += " AND doctor_name LIKE ?"
        params.append(f"%{doctor_name.strip()}%")

    query += " ORDER BY date ASC, time_slot ASC"

    cursor.execute(query, params)
    apts = cursor.fetchall()

    if not apts:
        # Check without phone filter to see if phone was typed differently
        cursor.execute("SELECT * FROM appointments WHERE status = 'confirmed'")
        all_confirmed = cursor.fetchall()
        matching = [a for a in all_confirmed if clean_phone in a["patient_phone"] or a["patient_phone"] in clean_phone]
        if matching:
            apts = matching
        else:
            conn.close()
            return {
                "status": "error",
                "message": f"No active appointment was found registered under phone number {format_phone_display(clean_phone)}."
            }

    # Cancel the first matching appointment
    apt_to_cancel = dict(apts[0])
    apt_id = apt_to_cancel["id"]

    cursor.execute("UPDATE appointments SET status = 'cancelled' WHERE id = ?", (apt_id,))

    # Free up the slot if available
    cursor.execute("""
    UPDATE slots SET is_available = 1 
    WHERE doctor_id = ? AND date = ? AND (time = ? OR time LIKE ?)
    """, (apt_to_cancel["doctor_id"], apt_to_cancel["date"], apt_to_cancel["time_slot"], f"%{apt_to_cancel['time_slot']}%"))

    conn.commit()
    conn.close()

    return {
        "status": "success",
        "appointment_id": apt_id,
        "patient_phone": clean_phone,
        "doctor_name": apt_to_cancel["doctor_name"],
        "specialty": apt_to_cancel["specialty"],
        "date": apt_to_cancel["date"],
        "time_slot": apt_to_cancel["time_slot"],
        "message": f"Appointment {apt_id} with {apt_to_cancel['doctor_name']} on {apt_to_cancel['date']} at {apt_to_cancel['time_slot']} has been successfully cancelled."
    }

def get_all_appointments(patient_phone: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    if patient_phone:
        clean = normalize_phone(patient_phone)
        cursor.execute("SELECT * FROM appointments WHERE patient_phone LIKE ? ORDER BY created_at DESC", (f"%{clean}%",))
    else:
        cursor.execute("SELECT * FROM appointments ORDER BY created_at DESC")
    rows = cursor.fetchall()
    apts = [dict(r) for r in rows]
    conn.close()
    return apts

def get_dashboard_stats() -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM doctors")
    total_doctors = cursor.fetchone()[0]

    today_str = date.today().strftime("%Y-%m-%d")
    cursor.execute("SELECT COUNT(*) FROM slots WHERE is_available = 1 AND date = ?", (today_str,))
    today_available_slots = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM appointments WHERE status = 'confirmed'")
    active_appointments = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM appointments WHERE status = 'cancelled'")
    cancelled_appointments = cursor.fetchone()[0]

    conn.close()
    return {
        "total_doctors": total_doctors,
        "today_available_slots": today_available_slots,
        "active_appointments": active_appointments,
        "cancelled_appointments": cancelled_appointments,
        "system_status": "Operational",
        "voice_pipeline": "Pipecat 1.17 + Silero VAD + ElevenLabs",
        "llm_engine": "Nvidia NIM (Nemotron 3.5)"
    }

