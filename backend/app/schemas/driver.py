
from datetime import date

from pydantic import BaseModel, ConfigDict, Field
from typing import Literal


class DriverCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    license_number: str = Field(min_length=1, max_length=50)
    license_category: str = Field(min_length=1, max_length=50)
    license_expiry: date
    contact_number: str = Field(min_length=1, max_length=20)


class DriverResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    license_number: str
    license_category: str
    license_expiry: date
    contact_number: str
    safety_score: float
    status: str


class DriverUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(default=None, min_length=1, max_length=100)
    license_number: str | None = Field(default=None, min_length=1, max_length=50)
    license_category: str | None = Field(default=None, min_length=1, max_length=50)
    license_expiry: date | None = None
    contact_number: str | None = Field(default=None, min_length=1, max_length=20)
    safety_score: float | None = Field(default=None, ge=0, le=100)
    status: Literal["Available", "On Trip", "Off Duty", "Suspended"] | None = None