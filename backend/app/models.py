from pydantic import BaseModel, Field
from typing import List, Optional

class Doctor(BaseModel):
    id: str
    name: str
    specialty: str
    rating: float
    experience: str
    avatar: str
    bio: str
    room: str
    available_days: List[str]

class TimeSlot(BaseModel):
    id: str
    doctor_id: str
    date: str  # YYYY-MM-DD
    time: str  # e.g. "09:30 AM"
    is_available: bool = True

class Appointment(BaseModel):
    id: str
    patient_phone: str
    patient_name: Optional[str] = "Caller"
    doctor_id: str
    doctor_name: str
    specialty: str
    date: str  # YYYY-MM-DD
    time_slot: str  # e.g. "10:30 AM"
    status: str = "confirmed"  # confirmed, cancelled, completed
    created_at: str
    notes: Optional[str] = "Booked via AI Voice Agent"

class CheckAvailabilityRequest(BaseModel):
    doctor_name_or_specialty: Optional[str] = None
    date: Optional[str] = None

class BookAppointmentRequest(BaseModel):
    patient_phone: str
    doctor_name_or_id: str
    date: str
    time_slot: str
    patient_name: Optional[str] = "Caller"

class CancelAppointmentRequest(BaseModel):
    patient_phone: str
    appointment_id_or_date: Optional[str] = None
    doctor_name: Optional[str] = None

class CallSession(BaseModel):
    session_id: str
    start_time: str
    end_time: Optional[str] = None
    caller_phone: Optional[str] = None
    transcript: List[dict] = []
    actions_taken: List[dict] = []

