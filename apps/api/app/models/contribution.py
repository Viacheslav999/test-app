from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Contribution(Base):
    __tablename__ = "contributions"

    id: Mapped[int] = mapped_column(primary_key=True)
    item_id: Mapped[int] = mapped_column(ForeignKey("items.id"), index=True)

    amount: Mapped[float] = mapped_column(Numeric(10, 2))
    currency: Mapped[str] = mapped_column(String(8), default="EUR")

    guest_token: Mapped[str] = mapped_column(String(64), index=True)

    item = relationship("Item", back_populates="contributions")
