import socketio

sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")


def room_for_wishlist(wishlist_id: int) -> str:
    return f"wishlist:{wishlist_id}"


@sio.event
async def connect(sid, environ, auth):
    return


@sio.event
async def join_wishlist(sid, data):
    wishlist_id = int(data["wishlist_id"])
    await sio.enter_room(sid, room_for_wishlist(wishlist_id))


@sio.event
async def leave_wishlist(sid, data):
    wishlist_id = int(data["wishlist_id"])
    await sio.leave_room(sid, room_for_wishlist(wishlist_id))
