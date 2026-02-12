import socketio

FRONTEND_ORIGIN = "https://optimistic-determination-production-1895.up.railway.app"
LOCAL_ORIGIN = "http://localhost:3000"

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=[FRONTEND_ORIGIN, LOCAL_ORIGIN],
)


def room_for_wishlist(wishlist_key) -> str:
    # ключ может быть int(id) или str(slug) — делаем всегда строку
    return f"wishlist:{str(wishlist_key)}"


@sio.event
async def connect(sid, environ, auth):
    return


@sio.event
async def disconnect(sid):
    return


@sio.event
async def join_wishlist(sid, data):
    # поддерживаем оба варианта: wishlist_id или slug
    key = data.get("wishlist_id", None)
    if key is None:
        key = data.get("slug", None)

    if key is None:
        return

    await sio.enter_room(sid, room_for_wishlist(key))


@sio.event
async def leave_wishlist(sid, data):
    key = data.get("wishlist_id", None)
    if key is None:
        key = data.get("slug", None)

    if key is None:
        return

    await sio.leave_room(sid, room_for_wishlist(key))


