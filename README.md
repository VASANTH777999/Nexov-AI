# NexovAI — Multilingual Voice & AI Doctor Appointment Platform

An advanced, production-grade, real-time voice and conversational AI clinical platform. Callers talk naturally to an intelligent medical receptionist (**Alex**) who can check specialist availability, reserve appointment slots, and manage cancellations in real time across multiple languages.

---

## 🌟 Key Highlights

- **Instant Sub-Second Frontend (~300ms)**: Powered by **React.js + Vite** for immediate startup and zero compilation delays.
- **Interactive Virtual Calling Experience**:
  - Pops up on demand when clicking **"Virtual Call"** or **"Start Virtual Call"** with smooth spring animations.
  - **Multiple Device Styles**: Switch dynamically between:
    - 📱 **Flagship Titanium (Samsung Galaxy S25 Ultra)**: Realistic titanium frame, Dynamic AMOLED edge curves, punch-hole camera, One UI 7 system bar, and automatic clinic number typing (`+91 1800-639-6824`) with DTMF keypad tones.
    - 🎙️ **Studio Audio Console**: Clinical audio workstation with real-time sound spectrum and VU meters.
    - 📱 **Minimalist Slate**: Clean floating glass phone frame.
  - Realistic call lifecycles: Dialing with DTMF tones $\rightarrow$ Ringing / Connecting with audio ringtone $\rightarrow$ Connected with live timer $\rightarrow$ Call Ended.
  - Live animated 3D visualizers & soundwave reacting to voice in real time.
  - In-phone scrolling transcript and interactive appointment confirmation cards.
- **Natural, Human-Like Conversational Intelligence**:
  - Warm, empathetic human receptionist persona without robotic, mechanical, or AI-sounding cadence.
  - **Strict Language Isolation**: Automatically detects user language from their first utterance and responds **100% in the exact same language** (Telugu, Hindi, Tamil, Kannada, Malayalam, Marathi, Bengali, or English) without mixing languages or unprompted switching.
- **Pure Spoken Phone Authentication**:
  - Callers are identified **only** by the phone number they speak out loud. No password, no login, no OTP, no caller ID.
- **Mandatory Phone Confirmation Protocol**:
  - The agent strictly reads the caller's phone number back to them out loud in their spoken language to verbally confirm before executing any booking or cancellation.
- **Pipecat Voice Pipeline**: Real-time voice pipeline built with **Pipecat 1.17**, **Silero VAD**, **ElevenLabs STT/TTS**, and **Nvidia NIM LLM**.
- **Ultra-Fast LLM Engine**: Powered by **Nvidia NIM** (`nvidia/nemotron-3.5-bolt-e4b` / `nvidia/nemotron-3.5-lightning-30b-a3b`) with native OpenAI-compatible function calling for sub-second responses.
- **Clean Enterprise Multipage Platform**:
  - All device model names, debug tags, and AI-generated labels are hidden from the main site to maintain a pristine, realistic healthcare enterprise interface.
  - **Home**: 3D Holographic Particle Orb (Three.js WebGL), stats cards, quick call launcher.
  - **Specialists Directory**: 6 board-certified specialist doctors with live open slots, bios, and one-click phone booking.
  - **Appointments & Records**: Real-time appointment schedule with phone number search, live status indicators, and cancellation.
  - **Consultation Chat**: Multilingual conversational chat with natural speech synthesis and audio waveforms.
  - **Operations Dashboard**: Real-time telemetry, language distribution, and system health.
- **Single-Command Launch**: Launch the entire stack (backend + frontend + browser auto-launch) with `Run.bat`.
- **Production-Ready & Vercel Deployable**: Zero-error Vercel deployment with root `vercel.json` configured for Vite build.

---

## 🏗️ Architecture

```
                                  +-----------------------------+
                                  |    React.js + Vite Client   |
                                  |   (Virtual Calling Suite)   |
                                  +--------------+--------------+
                                                 |
                       +-------------------------+-------------------------+
                       |                                                   |
                       v                                                   v
           [REST & WebSocket]                                      [Vercel Cloud]
                   |                                                       |
+------------------v-------------------+                +------------------v-------------------+
|      FastAPI / Pipecat Server        |                |     Vite Single-Page Production      |
|--------------------------------------|                |--------------------------------------|
| • Pipecat 1.17 Voice Pipeline        |                | • Instant ~300ms Dev Launch          |
| • Silero VAD (Voice Activity)        |                | • 3D WebGL Holographic Orb (Three.js)|
| • ElevenLabs STT & TTS               |                | • In-Browser Gemini AI Chat Engine   |
| • SQLite Clinical Database           |                | • Web Audio DTMF & Ringtones         |
+------------------+-------------------+                +------------------+-------------------+
                   |                                                       |
                   +-------------------------+-----------------------------+
                                             |
                                             v
                           +-----------------------------------+
                           |        Nvidia NIM LLM             |
                           |   (nvidia/nemotron-3.5-bolt-e4b)  |
                           |  Native Function Calling Engine   |
                           +-----------------+-----------------+
                                             |
                   +-------------------------+-------------------------+
                   |                         |                         |
                   v                         v                         v
        check_doctor_availability     book_appointment        cancel_appointment
```

---

## 🛠️ Required Tools Registered in LLM Pipeline

| Tool Name | Parameters | Purpose |
| :--- | :--- | :--- |
| `check_doctor_availability` | `doctor_name_or_specialty`, `date` | Returns open time slots for a doctor, specialty, or date so the agent can offer them conversationally to the caller. |
| `book_appointment` | `patient_phone`, `doctor_name_or_id`, `date`, `time_slot`, `patient_name` | Books the selected slot for the caller using their spoken phone number after reading it back to confirm. |
| `cancel_appointment` | `patient_phone`, `appointment_id_or_date`, `doctor_name` | Locates and cancels the caller's active appointment using their spoken phone number after verbal confirmation. |

---

## 🚀 How to Run with a Single Command

On Windows:
```cmd
Run.bat
```

What `Run.bat` does automatically:
1. Detects Python 3.10+ and Node.js 18+.
2. Configures the Nvidia API Key environment variable (`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`).
3. Initializes the SQLite database and seeds 6 specialist doctors and dynamic schedules.
4. Starts the Python FastAPI backend on `http://localhost:8000`.
5. Starts the React.js Vite frontend on `http://localhost:3000` (launches in ~300ms).
6. Opens `http://localhost:3000` automatically in your default browser.

---

## 🌐 Deploying to Vercel

The project is configured for zero-error Vercel deployment with `vercel.json`:

1. Push this repository to GitHub:
   ```bash
   git add .
   git commit -m "feat: complete NexovAI multilingual voice platform"
   git push origin main
   ```
2. In the [Vercel Dashboard](https://vercel.com/new), import the repository.
3. The build configuration in `vercel.json` runs:
   - Framework: `Vite`
   - Build Command: `cd frontend && npm install && npm run build`
   - Output Directory: `frontend/dist`
4. Click **Deploy** — builds and deploys cleanly with zero errors.

---

## 👥 Clinical Specialist Roster

1. **Dr. Sarah Jenkins** — Cardiologist (Heart Center, Room 302)
2. **Dr. Marcus Chen** — Dermatologist (Derma Suite, Room 114)
3. **Dr. Emily Rodriguez** — Pediatrician (Kids Wellness, Room 205)
4. **Dr. David Patel** — Neurologist (Neuro Wing, Room 410)
5. **Dr. Olivia Taylor** — Orthopedic Surgeon (Bone & Joint Clinic, Room 108)
6. **Dr. James Wilson** — General Physician (Primary Care, Room 101)

---

## 📞 Pure Spoken Authentication Rules

- **Zero Passwords / OTPs**: Callers authenticate solely by saying their phone number out loud.
- **Verbal Confirmation Protocol**: Before saving a booking or cancelling an appointment, the agent repeats:
  - *English*: *"I have your phone number as 9876543210. Is that correct?"*
  - *Telugu*: *"నేను మీ ఫోన్ నంబర్‌ను 9876543210 గా నమోదు చేసుకున్నాను. ఇది సరైనదేనా అండీ?"*
  - *Hindi*: *"मैंने आपका फ़ोन नंबर 9876543210 दर्ज किया है। क्या यह सही है?"*
- Once confirmed verbally, the agent calls the function and confirms the appointment on screen and audio.
