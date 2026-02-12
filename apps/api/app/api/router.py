from fastapi import APIRouter
from app.api.routes.auth import router as auth_router
from app.api.routes.wishlists import router as wishlists_router
from app.api.routes.public_actions import router as public_router
from app.api.routes.meta import router as meta_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(wishlists_router)
api_router.include_router(public_router)
api_router.include_router(meta_router)
