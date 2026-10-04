
from sqlalchemy import String, Integer, Float
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    registration_number: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        nullable=False,
    )

    model: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    vehicle_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    max_load_capacity: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    odometer: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
    )

    acquisition_cost: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="Available",
        nullable=False,
    )