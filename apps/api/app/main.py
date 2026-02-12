from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
import socketio

from app.core.config import settings
from app.api.router import api_router
from app.db.base import Base
from app.db.session import engine
from app.realtime.socket import sio

FRONTEND_ORIGIN = "https://optimistic-determination-production-1895.up.railway.app"
LOCAL_ORIGIN = "http://localhost:3000"

# 1️⃣ ВНУТРЕННИЙ FastAPI
fastapi_app = FastAPI(title="Wishlist Realtime API")

# --- CORS ---
raw = (getattr(settings, "cors_origins", None) or "").strip()
origins = [o.strip() for o in raw.split(",") if o.strip()]

if not origins:
    origins = [FRONTEND_ORIGIN, LOCAL_ORIGIN]

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Preflight ---
@fastapi_app.options("/{path:path}")
async def preflight(path: str, request: Request):
    return Response(status_code=204)

@fastapi_app.get("/health")
def health():
    return {"ok": True}

# API роуты
fastapi_app.include_router(api_router)

# DB (MVP)
Base.metadata.create_all(bind=engine)

# 2️⃣ ASGI (FastAPI + Socket.IO)
asgi_app = socketio.ASGIApp(
    sio,
    other_asgi_app=fastapi_app
)

# 🔥 АЛИАС ДЛЯ RAILWAY / UVICORN
app = asgi_app
