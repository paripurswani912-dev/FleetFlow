
from datetime import datetime

from sqlalchemy import Integer, Float, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class FuelLog(Base):
    __tablename__ = "fuel_logs"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    vehicle_id: Mapped[int] = mapped_column(
        ForeignKey("vehicles.id"),
        nullable=False,
    )

    liters: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    cost: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    odometer: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    fuel_date: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now,
        nullable=False,
    )

    notes: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )