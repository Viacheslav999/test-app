import socketio

FRONTEND_ORIGIN = "https://optimistic-determination-production-1895.up.railway.app"
LOCAL_ORIGIN = "http://localhost:3000"

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=[FRONTEND_ORIGIN, LOCAL_ORIGIN],
)

def room_for_wishlist(wishlist_id: int) -> str:
    return f"wishlist:{wishlist_id}"

@sio.event
async def connect(sid, environ, auth):
    # можно оставить пусто; главное — не падать
    return

@sio.event
async def disconnect(sid):
    return

@sio.event
async def join_wishlist(sid, data):
    wishlist_id = int(data.get("wishlist_id"))
    await sio.enter_room(sid, room_for_wishlist(wishlist_id))

@sio.event
async def leave_wishlist(sid, data):
    wishlist_id = int(data.get("wishlist_id"))
    await sio.leave_room(sid, room_for_wishlist(wishlist_id))

