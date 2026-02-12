from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Reservation(Base):
    __tablename__ = "reservations"

    id: Mapped[int] = mapped_column(primary_key=True)
    item_id: Mapped[int] = mapped_column(ForeignKey("items.id"), index=True)

    guest_token: Mapped[str] = mapped_column(String(64), index=True)

    item = relationship("Item", back_populates="reservations")
