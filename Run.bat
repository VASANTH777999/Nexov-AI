@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
title NexovAI - Doctor Appointment Voice Booking System
color 0B

echo ===============================================================================
echo                NEXOVAI - DOCTOR APPOINTMENT VOICE SYSTEM
echo       Real-time Voice Agent powered by Pipecat, Nvidia NIM, and ElevenLabs
echo ===============================================================================
echo.

:: 1. Check Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python is not found in your PATH.
    echo Please install Python 3.10+ and add it to PATH.
    pause
    exit /b 1
)

:: 2. Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in your PATH.
    echo Please install Node.js 18+ and add it to PATH.
    pause
    exit /b 1
)

echo [*] Python and Node.js environments detected.
echo.

:: 3. Set Environment Variables
set "NVIDIA_API_KEY=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"
set "NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1"
set "PRIMARY_MODEL=nvidia/nemotron-3.5-bolt-e4b"
set "PORT=8000"
set "PYTHONPATH=%cd%"

:: 4. Initialize SQLite Database
echo [*] Initializing clinical database and mock schedules...
python backend\run_server.py --init-only
echo [OK] Clinical database initialized.
echo.

:: 5. Check frontend packages
if not exist "frontend\node_modules" (
    echo [*] Installing frontend npm dependencies...
    cd frontend
    call npm install
    cd ..
    echo [OK] Frontend packages installed.
    echo.
)

:: 6. Launch Backend Server in background window
echo [*] Starting Python FastAPI and Pipecat Voice Pipeline on port 8000...
start "NexovAI Voice Backend - Port 8000" cmd /k "python backend\run_server.py"

:: 7. Launch Frontend Dashboard in background window
echo [*] Starting Instant React.js Web Dashboard on port 3000 (Vite ~300ms launch)...
start "NexovAI React Dashboard - Port 3000" cmd /k "cd frontend && npm run dev"

:: 8. Wait for servers to spin up
echo [*] Waiting for services to initialize...
ping 127.0.0.1 -n 3 >nul

:: 9. Open browser automatically
echo [*] Launching NexovAI Dashboard in your default browser...
start http://localhost:3000

echo.
echo ===============================================================================
echo                           SYSTEM IS READY!
echo ===============================================================================
echo  Dashboard:        http://localhost:3000
echo  FastAPI Backend:  http://localhost:8000
echo  API Docs:         http://localhost:8000/docs
echo.
echo  Voice Features:
echo   - Click 'Try Call' to open the smartphone interface
echo   - Speak into your mic or use quick-action prompt chips
echo   - Check availability for any of the 6 specialist doctors
echo   - Book or Cancel appointments: Authenticated ONLY by spoken phone number
echo   - The agent confirms the phone number back to you before executing tools
echo.
echo  To shut down the servers, simply close the backend and frontend terminal windows.
echo ===============================================================================
echo.
pause
