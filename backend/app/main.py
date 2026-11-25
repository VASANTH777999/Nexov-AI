import os
import json
import uuid
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query, Body, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response

from .config import settings
from .database import (
    init_db,
    get_all_doctors,
    check_doctor_availability,
    book_appointment,
    cancel_appointment,
    get_all_appointments,
    get_dashboard_stats,
)
from .models import (
    BookAppointmentRequest,
    CancelAppointmentRequest,
    CheckAvailabilityRequest
)
from .llm_client import NvidiaLLMClient

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("nexovai.api")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Real-time Voice Doctor Appointment Booking System powered by Pipecat, Nvidia NIM, and ElevenLabs."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

llm_client = NvidiaLLMClient()

@app.on_event("startup")
async def startup_event():
    logger.info("Initializing Clinic SQLite database...")
    init_db()
    logger.info("Database initialized successfully.")

@app.get("/")
def root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "llm_engine": "Nvidia NIM (Nemotron 3.5)",
        "voice_pipeline": "Pipecat 1.17 + Silero VAD + ElevenLabs"
    }

@app.get("/api/health")
def health():
    return {"status": "ok", "time": datetime.now().isoformat()}

# ----------------- DOCTORS & SLOTS ----------------- #

@app.get("/api/doctors")
def api_get_doctors():
    doctors = get_all_doctors()
    return {"status": "success", "count": len(doctors), "doctors": doctors}

@app.get("/api/slots")
def api_get_slots(
    doctor: Optional[str] = Query(None, description="Doctor name or specialty"),
    date: Optional[str] = Query(None, description="Target date (YYYY-MM-DD or tomorrow)")
):
    result = check_doctor_availability(doctor, date)
    return result

# ----------------- APPOINTMENTS ----------------- #

@app.get("/api/appointments")
def api_get_appointments(phone: Optional[str] = Query(None)):
    apts = get_all_appointments(phone)
    return {"status": "success", "count": len(apts), "appointments": apts}

@app.post("/api/appointments/book")
def api_book_appointment(req: BookAppointmentRequest):
    result = book_appointment(
        patient_phone=req.patient_phone,
        doctor_name_or_id=req.doctor_name_or_id,
        appointment_date=req.date,
        time_slot=req.time_slot,
        patient_name=req.patient_name or "Caller"
    )
    if result.get("status") == "error":
        raise HTTPException(status_code=400, detail=result.get("message"))
    return result

@app.post("/api/appointments/cancel")
def api_cancel_appointment(req: CancelAppointmentRequest):
    result = cancel_appointment(
        patient_phone=req.patient_phone,
        appointment_id_or_date=req.appointment_id_or_date,
        doctor_name=req.doctor_name
    )
    if result.get("status") == "error":
        raise HTTPException(status_code=404, detail=result.get("message"))
    return result

@app.get("/api/stats")
def api_get_stats():
    stats = get_dashboard_stats()
    return stats

@app.post("/api/reset")
def api_reset_db():
    init_db(force_reseed=True)
    return {"status": "success", "message": "Database successfully reset and re-seeded with pristine mock data."}

# ----------------- CONVERSATIONAL AI (Nvidia NIM) ----------------- #

@app.post("/api/chat")
async def api_chat_turn(payload: Dict[str, Any] = Body(...)):
    """
    Direct voice-optimized chat endpoint for the frontend call screen.
    Runs Nvidia NIM LLM with tool calling and returns response + any booking/cancellation actions.
    """
    messages = payload.get("messages", [])
    user_message = payload.get("message")
    if user_message:
        messages.append({"role": "user", "content": user_message})

    reply, updated_messages, action = llm_client.chat_step(messages)
    return {
        "reply": reply,
        "messages": updated_messages,
        "action": action,
        "detected_language": llm_client.last_detected_language
    }

# ----------------- ELEVENLABS HIGH-FIDELITY TTS ----------------- #

@app.post("/api/tts")
async def api_synthesize_tts(payload: Dict[str, Any] = Body(...)):
    """
    Direct high-fidelity ElevenLabs TTS streaming endpoint using the user's API key.
    Synthesizes natural, human, studio-quality audio in English, Telugu, Hindi, Tamil, etc.
    """
    text = payload.get("text", "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")

    voice_id = payload.get("voice_id") or settings.ELEVENLABS_VOICE_ID or "EXAVITQu4vr4xnSDxMaL"
    model_id = payload.get("model_id") or settings.ELEVENLABS_MODEL_ID or "eleven_multilingual_v2"

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    headers = {
        "xi-api-key": settings.ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg"
    }
    body = {
        "text": text,
        "model_id": model_id,
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75,
            "style": 0.15,
            "use_speaker_boost": True
        }
    }
    try:
        import httpx
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, headers=headers, json=body)
            if resp.status_code == 200:
                return Response(content=resp.content, media_type="audio/mpeg")
            else:
                logger.warning(f"ElevenLabs TTS status {resp.status_code}: {resp.text}")
                raise HTTPException(status_code=resp.status_code, detail=f"ElevenLabs TTS failed: {resp.text}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"ElevenLabs TTS exception: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ----------------- ELEVENLABS SCRIBE STT ----------------- #

@app.post("/api/stt")
async def api_transcribe_audio(
    file: UploadFile = File(...),
    language_code: Optional[str] = Form(None)
):
    """
    Direct high-precision ElevenLabs Scribe STT endpoint.
    Accepts raw audio blobs from frontend mic and transcribes with state-of-the-art accuracy
    in English, Telugu, Hindi, Tamil, and all regional languages.
    """
    try:
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Empty audio recording")

        url = "https://api.elevenlabs.io/v1/speech-to-text"
        headers = {
            "xi-api-key": settings.ELEVENLABS_API_KEY
        }
        data = {
            "model_id": "scribe_v1"
        }
        if language_code:
            data["language_code"] = language_code

        files = {
            "file": (file.filename or "recording.webm", content, file.content_type or "audio/webm")
        }

        import httpx
        async with httpx.AsyncClient(timeout=25.0) as client:
            resp = await client.post(url, headers=headers, data=data, files=files)
            if resp.status_code == 200:
                result = resp.json()
                text = result.get("text", "").strip()
                logger.info(f"ElevenLabs STT Result: '{text}'")
                return {"text": text, "status": "success"}
            else:
                logger.warning(f"ElevenLabs STT returned {resp.status_code}: {resp.text}")
                raise HTTPException(status_code=resp.status_code, detail=f"ElevenLabs STT error: {resp.text}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"ElevenLabs STT exception: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ----------------- WEBSOCKET: REAL-TIME CALL SCREEN ----------------- #

active_connections: List[WebSocket] = []

async def broadcast_event(event_type: str, data: Dict[str, Any]):
    """Broadcast real-time booking/cancellation updates to all open dashboard connections."""
    message = json.dumps({"type": event_type, "data": data})
    for conn in list(active_connections):
        try:
            await conn.send_text(message)
        except Exception:
            pass

@app.websocket("/ws/call")
async def websocket_call_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    session_id = str(uuid.uuid4())
    logger.info(f"WebSocket client connected: session {session_id}")

    # Conversation history for this voice call
    conversation_history: List[Dict[str, Any]] = []

    try:
        # Send initial connected greeting
        initial_greeting = (
            "Hello! Thank you for calling NexovAI Medical Clinic. "
            "My name is Alex. How can I help you today?"
        )
        conversation_history.append({"role": "assistant", "content": initial_greeting})

        await websocket.send_text(json.dumps({
            "type": "call_connected",
            "session_id": session_id,
            "agent_name": "Alex (AI Receptionist)",
            "greeting": initial_greeting,
            "timestamp": datetime.now().isoformat()
        }))

        while True:
            raw_data = await websocket.receive_text()
            data = json.loads(raw_data)
            msg_type = data.get("type")

            if msg_type == "caller_speech":
                speech_text = data.get("text", "").strip()
                if not speech_text:
                    continue

                logger.info(f"[{session_id}] Caller: {speech_text}")
                conversation_history.append({"role": "user", "content": speech_text})

                # Broadcast caller transcript
                await websocket.send_text(json.dumps({
                    "type": "transcript",
                    "speaker": "caller",
                    "text": speech_text,
                    "timestamp": datetime.now().isoformat()
                }))

                # Run through Nvidia NIM LLM with tool calling
                reply, conversation_history, action = llm_client.chat_step(conversation_history)
                logger.info(f"[{session_id}] Agent: {reply} | Action: {action}")

                # Send agent response
                await websocket.send_text(json.dumps({
                    "type": "agent_speech",
                    "speaker": "agent",
                    "text": reply,
                    "action": action,
                    "timestamp": datetime.now().isoformat()
                }))

                # If an appointment was booked or cancelled, broadcast to all dashboards to update UI live!
                if action:
                    await broadcast_event("dashboard_update", {
                        "action": action["tool"],
                        "details": action["result"],
                        "stats": get_dashboard_stats()
                    })

            elif msg_type == "end_call":
                logger.info(f"[{session_id}] Call ended by user.")
                await websocket.send_text(json.dumps({
                    "type": "call_ended",
                    "session_id": session_id,
                    "timestamp": datetime.now().isoformat()
                }))
                break

            elif msg_type == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))

    except WebSocketDisconnect:
        logger.info(f"WebSocket client disconnected: session {session_id}")
    except Exception as e:
        logger.error(f"WebSocket error in session {session_id}: {e}")
    finally:
        if websocket in active_connections:
            active_connections.remove(websocket)

# ----------------- WEBSOCKET: PIPECAT PIPELINE ----------------- #

@app.websocket("/ws/pipecat")
async def websocket_pipecat_endpoint(websocket: WebSocket):
    """
    Dedicated raw Pipecat audio pipeline endpoint for full binary audio streaming
    with Silero VAD and ElevenLabs STT/TTS.
    """
    await websocket.accept()
    import asyncio
    from .pipeline import PipecatVoicePipeline
    pipeline = PipecatVoicePipeline(
        websocket=websocket,
        on_action=lambda act: asyncio.create_task(broadcast_event("dashboard_update", {
            "action": act["tool"],
            "details": act["result"],
            "stats": get_dashboard_stats()
        }))
    )
    try:
        await pipeline.run()
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.warning(f"Pipecat pipeline ended: {e}")
    finally:
        await pipeline.cancel()

