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

# 🔥 1) Это будет ВНУТРЕННЕЕ FastAPI приложение
fastapi_app = FastAPI(title="Wishlist Realtime API")

# --- CORS ---
raw = (getattr(settings, "cors_origins", None) or "").strip()
origins = [o.strip() for o in raw.split(",") if o.strip()]

# Если на Railway переменная не задана — ставим нормальный дефолт (НЕ "*")
if not origins:
    origins = [FRONTEND_ORIGIN, LOCAL_ORIGIN]

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,  # токен в localStorage -> cookie не нужны
    allow_methods=["*"],
    allow_headers=["*"],      # Content-Type, Authorization и т.д.
)

# --- Preflight handler (на всякий случай) ---
@fastapi_app.options("/{path:path}")
async def preflight(path: str, request: Request):
    return Response(status_code=204)

@fastapi_app.get("/health")
def health():
    return {"ok": True}

fastapi_app.include_router(api_router)

# Создаём таблицы автоматически (для MVP)
Base.metadata.create_all(bind=engine)

# 🔥 2) А ВОТ ЭТО — ГЛАВНОЕ ASGI ПРИЛОЖЕНИЕ (и FastAPI внутри него)
app = socketio.ASGIApp(
    sio,
    other_asgi_app=fastapi_app,
)
