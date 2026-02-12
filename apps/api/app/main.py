from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio

from app.core.config import settings
from app.api.router import api_router
from app.db.base import Base
from app.db.session import engine
from app.realtime.socket import sio


app = FastAPI(title="Wishlist Realtime API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"ok": True}


app.include_router(api_router)

# Создаём таблицы автоматически (для MVP)
Base.metadata.create_all(bind=engine)

# 🔥 Правильная интеграция Socket.IO с FastAPI
asgi_app = socketio.ASGIApp(
    sio,
    other_asgi_app=app
)
