from sqlalchemy import String, ForeignKey, Numeric, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Item(Base):
    __tablename__ = "items"

    id: Mapped[int] = mapped_column(primary_key=True)
    wishlist_id: Mapped[int] = mapped_column(ForeignKey("wishlists.id"), index=True)

    title: Mapped[str] = mapped_column(String(200))
    url: Mapped[str] = mapped_column(String(1024))
    image_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)

    price: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)

    allow_funding: Mapped[bool] = mapped_column(Boolean, default=False)
    archived: Mapped[bool] = mapped_column(Boolean, default=False)

    wishlist = relationship("Wishlist", back_populates="items")
    reservations = relationship("Reservation", back_populates="item", cascade="all, delete-orphan")
    contributions = relationship("Contribution", back_populates="item", cascade="all, delete-orphan")
