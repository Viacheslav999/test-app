from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Wishlist(Base):
    __tablename__ = "wishlists"

    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(120))
    public_slug: Mapped[str] = mapped_column(String(32), unique=True, index=True)

    items = relationship("Item", back_populates="wishlist", cascade="all, delete-orphan")
