import os

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

try:
    from elevenlabs.client import ElevenLabs
except Exception:
    ElevenLabs = None

from dotenv import load_dotenv

load_dotenv()

from .config import settings
from .database import Base, engine
from .routers import scan, scans
from .schemas import HealthResponse
from .security import PASSCODE_HEADER, verify_passcode

Base.metadata.create_all(bind=engine)

app = FastAPI(title="MediVoice API", version="0.1.0")

# CORS: only the explicitly allowed origins are accepted. No wildcard "*".
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", PASSCODE_HEADER],
)

app.include_router(scan.router, prefix="/api")
app.include_router(scans.router, prefix="/api")


class SpeakRequest(BaseModel):
    text: str


@app.post("/speak", dependencies=[Depends(verify_passcode)])
async def speak(req: SpeakRequest):
    if ElevenLabs is None:
        raise HTTPException(status_code=500, detail="ElevenLabs SDK not installed")
    api_key = os.getenv("ELEVENLABS_API_KEY", "")
    if not api_key or api_key.startswith("PUT_YOUR"):
        raise HTTPException(status_code=500, detail="ELEVENLABS_API_KEY not configured")
    try:
        client = ElevenLabs(api_key=api_key)
        audio = client.text_to_speech.convert(
            text=req.text,
            voice_id="JBFqnCBsd6RMkjVDRZzb",
            model_id="eleven_multilingual_v2",
            output_format="mp3_44100_128",
        )
        return StreamingResponse(audio, media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS error: {e}")


@app.get("/api/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", gemini_configured=bool(settings.gemini_api_key))


@app.get("/")
def root() -> dict:
    return {"service": "medivoice", "docs": "/docs"}
