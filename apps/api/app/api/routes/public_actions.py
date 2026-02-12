import secrets
from decimal import Decimal, ROUND_HALF_UP

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.models.wishlist import Wishlist
from app.models.item import Item
from app.models.reservation import Reservation
from app.models.contribution import Contribution
from app.realtime.socket import sio, room_for_wishlist

router = APIRouter(prefix="/public", tags=["public"])


def ensure_guest_token(token: str | None) -> str:
    return token or secrets.token_urlsafe(16)


def q2(x: Decimal) -> Decimal:
    return x.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


class ReserveIn(BaseModel):
    slug: str
    item_id: int
    guest_token: str | None = None


class UnreserveIn(BaseModel):
    slug: str
    item_id: int
    guest_token: str


class ContributeIn(BaseModel):
    slug: str
    item_id: int
    amount: float
    currency: str = "EUR"
    guest_token: str | None = None


@router.post("/reserve")
async def reserve(payload: ReserveIn, db: Session = Depends(get_db)):
    guest = ensure_guest_token(payload.guest_token)

    w = db.scalar(select(Wishlist).where(Wishlist.public_slug == payload.slug))
    if not w:
        raise HTTPException(status_code=404, detail="Wishlist not found")

    item = db.scalar(
        select(Item).where(
            Item.id == payload.item_id,
            Item.wishlist_id == w.id,
            Item.archived == False,
        )
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    existing = db.scalar(select(Reservation).where(Reservation.item_id == item.id))
    if existing:
        raise HTTPException(status_code=409, detail="Already reserved")

    r = Reservation(item_id=item.id, guest_token=guest)
    db.add(r)
    db.commit()

    # emit в комнаты по id и по slug (чтобы фронт мог джойнить как угодно)
    await sio.emit(
        "reservation_changed",
        {"item_id": item.id, "reserved": True},
        room=room_for_wishlist(w.id),
    )
    await sio.emit(
        "reservation_changed",
        {"item_id": item.id, "reserved": True},
        room=room_for_wishlist(w.public_slug),
    )
    return {"guest_token": guest}


@router.post("/unreserve")
async def unreserve(payload: UnreserveIn, db: Session = Depends(get_db)):
    w = db.scalar(select(Wishlist).where(Wishlist.public_slug == payload.slug))
    if not w:
        raise HTTPException(status_code=404, detail="Wishlist not found")

    r = db.scalar(select(Reservation).where(Reservation.item_id == payload.item_id))
    if not r:
        return {"ok": True}

    if r.guest_token != payload.guest_token:
        raise HTTPException(status_code=403, detail="Not your reservation")

    db.delete(r)
    db.commit()

    await sio.emit(
        "reservation_changed",
        {"item_id": payload.item_id, "reserved": False},
        room=room_for_wishlist(w.id),
    )
    await sio.emit(
        "reservation_changed",
        {"item_id": payload.item_id, "reserved": False},
        room=room_for_wishlist(w.public_slug),
    )
    return {"ok": True}


@router.post("/contribute")
async def contribute(payload: ContributeIn, db: Session = Depends(get_db)):
    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be > 0")

    guest = ensure_guest_token(payload.guest_token)

    w = db.scalar(select(Wishlist).where(Wishlist.public_slug == payload.slug))
    if not w:
        raise HTTPException(status_code=404, detail="Wishlist not found")

    # лочим item, чтобы два запроса одновременно не перелили сумму
    item = (
        db.execute(
            select(Item)
            .where(
                Item.id == payload.item_id,
                Item.wishlist_id == w.id,
                Item.archived == False,
            )
            .with_for_update()
        )
        .scalars()
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if not item.allow_funding:
        raise HTTPException(status_code=400, detail="Funding disabled")
    if item.price is None:
        raise HTTPException(status_code=400, detail="Item has no target price")

    target = q2(Decimal(str(item.price)))

    current = db.scalar(
        select(func.coalesce(func.sum(Contribution.amount), 0)).where(Contribution.item_id == item.id)
    )
    current = q2(Decimal(str(current or 0)))

    remaining = q2(target - current)
    if remaining <= 0:
        raise HTTPException(status_code=400, detail="Target already reached")

    requested = q2(Decimal(str(payload.amount)))
    to_add = requested if requested <= remaining else remaining

    # если вдруг запросом пришло < 0.01 или осталось 0.00
    if to_add <= 0:
        raise HTTPException(status_code=400, detail="Nothing to add")

    c = Contribution(item_id=item.id, amount=to_add, currency=payload.currency, guest_token=guest)
    db.add(c)
    db.commit()

    new_total = q2(current + to_add)

    # realtime
    await sio.emit(
        "funding_progress",
        {"item_id": item.id, "funded_amount": float(new_total), "target_amount": float(target)},
        room=room_for_wishlist(w.id),
    )
    await sio.emit(
        "funding_progress",
        {"item_id": item.id, "funded_amount": float(new_total), "target_amount": float(target)},
        room=room_for_wishlist(w.public_slug),
    )

    return {"guest_token": guest, "funded_amount": float(new_total), "target_amount": float(target)}
