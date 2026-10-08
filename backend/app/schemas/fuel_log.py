from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class FuelLogCreate(BaseModel):
    vehicle_id: int = Field(gt=0)
    liters: float = Field(gt=0)
    cost: float = Field(ge=0)
    odometer: float = Field(ge=0)
    notes: str | None = None


class FuelLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    vehicle_id: int
    liters: float
    cost: float
    odometer: float
    fuel_date: datetime
    notes: str | None