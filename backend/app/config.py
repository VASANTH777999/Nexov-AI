import os
from pydantic import BaseModel
from typing import Optional

class Settings:
    PROJECT_NAME: str = "NexovAI Voice Clinic"
    VERSION: str = "1.0.0"
    API_PORT: int = int(os.getenv("PORT", "8000"))
    
    # LLM (Nvidia NIM API)
    NVIDIA_API_KEY: str = os.getenv(
        "NVIDIA_API_KEY",
        "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"
    )
    NVIDIA_BASE_URL: str = os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1")
    PRIMARY_MODEL: str = os.getenv("PRIMARY_MODEL", "nvidia/nemotron-3.5-bolt-e4b")
    FALLBACK_MODEL: str = os.getenv("FALLBACK_MODEL", "nvidia/nemotron-3.5-lightning-30b-a3b")
    BACKUP_MODEL: str = os.getenv("BACKUP_MODEL", "mistralai/mistral-large-4-1t-a52b")

    # ElevenLabs STT & TTS
    ELEVENLABS_API_KEY: str = os.getenv(
        "ELEVENLABS_API_KEY",
        "sk_19e8cb2386f1ab9f298302f94336203c6b858467b79d3c71"
    )
    ELEVENLABS_VOICE_ID: str = os.getenv(
        "ELEVENLABS_VOICE_ID",
        "EXAVITQu4vr4xnSDxMaL" # Sarah (reassuring, confident, natural clinical receptionist voice)
    )
    ELEVENLABS_MODEL_ID: str = os.getenv(
        "ELEVENLABS_MODEL_ID",
        "eleven_multilingual_v2"
    )

    # Database
    DATABASE_PATH: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "clinic.db")

settings = Settings()
