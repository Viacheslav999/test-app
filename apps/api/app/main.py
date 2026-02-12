from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
import socketio

from app.core.config import settings
from app.api.router import api_router
from app.db.base import Base
from app.db.session import engine
from app.realtime.socket import sio

app = FastAPI(title="Wishlist Realtime API")

# --- CORS ---
# settings.cors_origins может быть None/пустым => не падаем
raw = (getattr(settings, "cors_origins", None) or "").strip()

origins = [o.strip() for o in raw.split(",") if o.strip()]

# В проде лучше без "*", но чтобы не ловить 400 из-за пустоты — fallback
if not origins:
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Preflight handler ---
# Если по какой-то причине OPTIONS не обрабатывается корректно (Railway/прокси/роуты),
# этот хэндлер гарантирует 204 и дальше CORSMiddleware добавит нужные заголовки.
@app.options("/{path:path}")
async def preflight(path: str, request: Request):
    return Response(status_code=204)

@app.get("/health")
def health():
    return {"ok": True}

app.include_router(api_router)

# Создаём таблицы автоматически (для MVP)
Base.metadata.create_all(bind=engine)

# Socket.IO + FastAPI
asgi_app = socketio.ASGIApp(
    sio,
    other_asgi_app=app
)

