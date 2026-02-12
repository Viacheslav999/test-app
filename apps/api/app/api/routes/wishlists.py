import secrets
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from pydantic import BaseModel

from app.db.session import get_db
from app.models.wishlist import Wishlist
from app.models.item import Item
from app.models.reservation import Reservation
from app.models.contribution import Contribution
from app.services.auth import decode_access_token

router = APIRouter(prefix="/wishlists", tags=["wishlists"])


def require_user(authorization: str | None) -> int:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    user_id = decode_access_token(authorization.split(" ", 1)[1])
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user_id


class WishlistCreate(BaseModel):
    title: str


class ItemCreate(BaseModel):
    title: str
    url: str
    price: float | None = None
    image_url: str | None = None
    allow_funding: bool = False


@router.post("")
def create_wishlist(
    payload: WishlistCreate,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    user_id = require_user(authorization)
    slug = secrets.token_urlsafe(10).replace("-", "").replace("_", "")[:16]
    w = Wishlist(owner_id=user_id, title=payload.title, public_slug=slug)
    db.add(w)
    db.commit()
    db.refresh(w)
    return {"id": w.id, "title": w.title, "public_slug": w.public_slug}


@router.get("")
def list_my_wishlists(
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    user_id = require_user(authorization)
    rows = db.scalars(
        select(Wishlist)
        .where(Wishlist.owner_id == user_id)
        .order_by(Wishlist.id.desc())
    ).all()
    return [{"id": w.id, "title": w.title, "public_slug": w.public_slug} for w in rows]


# ✅ PUBLIC должен быть выше динамического /{wishlist_id}
@router.get("/public/{slug}")
def get_public(slug: str, db: Session = Depends(get_db)):
    w = db.scalar(select(Wishlist).where(Wishlist.public_slug == slug))
    if not w:
        raise HTTPException(status_code=404, detail="Not found")

    items = db.scalars(
        select(Item)
        .where(Item.wishlist_id == w.id, Item.archived.is_(False))
        .order_by(Item.id.desc())
    ).all()

    result_items = []
    for it in items:
        reserved_count = (
            db.scalar(select(func.count(Reservation.id)).where(Reservation.item_id == it.id)) or 0
        )
        total = (
            db.scalar(select(func.coalesce(func.sum(Contribution.amount), 0)).where(Contribution.item_id == it.id)) or 0
        )

        result_items.append(
            {
                "id": it.id,
                "title": it.title,
                "url": it.url,
                "image_url": it.image_url,
                "price": float(it.price) if it.price is not None else None,
                "allow_funding": it.allow_funding,
                "reserved": reserved_count > 0,
                "funded_amount": float(total),
            }
        )

    return {"id": w.id, "title": w.title, "items": result_items}


# ✅ Админка — получить 1 вишлист по id (с items)
@router.get("/{wishlist_id}")
def get_my_wishlist(
    wishlist_id: int,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    user_id = require_user(authorization)
    w = db.scalar(
        select(Wishlist).where(Wishlist.id == wishlist_id, Wishlist.owner_id == user_id)
    )
    if not w:
        raise HTTPException(status_code=404, detail="Wishlist not found")

    items = db.scalars(
        select(Item)
        .where(Item.wishlist_id == w.id, Item.archived.is_(False))
        .order_by(Item.id.desc())
    ).all()

    return {
        "id": w.id,
        "title": w.title,
        "public_slug": w.public_slug,
        "items": [
            {
                "id": it.id,
                "title": it.title,
                "url": it.url,
                "image_url": it.image_url,
                "price": float(it.price) if it.price is not None else None,
                "allow_funding": it.allow_funding,
            }
            for it in items
        ],
    }


@router.post("/{wishlist_id}/items")
def add_item(
    wishlist_id: int,
    payload: ItemCreate,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    user_id = require_user(authorization)
    w = db.scalar(
        select(Wishlist).where(Wishlist.id == wishlist_id, Wishlist.owner_id == user_id)
    )
    if not w:
        raise HTTPException(status_code=404, detail="Wishlist not found")

    item = Item(
        wishlist_id=wishlist_id,
        title=payload.title,
        url=payload.url,
        price=payload.price,
        image_url=payload.image_url,
        allow_funding=payload.allow_funding,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"id": item.id}


# ✅ “удаление” подарка — архивируем (чтобы не ломать историю)
@router.delete("/{wishlist_id}/items/{item_id}")
def archive_item(
    wishlist_id: int,
    item_id: int,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    user_id = require_user(authorization)
    w = db.scalar(
        select(Wishlist).where(Wishlist.id == wishlist_id, Wishlist.owner_id == user_id)
    )
    if not w:
        raise HTTPException(status_code=404, detail="Wishlist not found")

    it = db.scalar(select(Item).where(Item.id == item_id, Item.wishlist_id == w.id))
    if not it:
        raise HTTPException(status_code=404, detail="Item not found")

    it.archived = True
    db.add(it)
    db.commit()
    return {"ok": True}

