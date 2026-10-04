
from datetime import date

from sqlalchemy import String, Integer, Float, Date
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Driver(Base):
    __tablename__ = "drivers"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    license_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
    )

    license_category: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    license_expiry: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    contact_number: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    safety_score: Mapped[float] = mapped_column(
        Float,
        default=100.0,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="Available",
        nullable=False,
    )