
from datetime import datetime

from sqlalchemy import String, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Trip(Base):
    __tablename__ = "trips"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    source: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    destination: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    vehicle_id: Mapped[int] = mapped_column(
        ForeignKey("vehicles.id"),
        nullable=False,
    )

    driver_id: Mapped[int] = mapped_column(
        ForeignKey("drivers.id"),
        nullable=False,
    )

    cargo_weight: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    planned_distance: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="Draft",
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now,
        nullable=False,
    )