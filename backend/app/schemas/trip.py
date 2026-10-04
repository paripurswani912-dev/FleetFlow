
from pydantic import BaseModel, ConfigDict, Field


class TripCreate(BaseModel):
    source: str = Field(min_length=1, max_length=200)
    destination: str = Field(min_length=1, max_length=200)
    vehicle_id: int = Field(gt=0)
    driver_id: int = Field(gt=0)
    cargo_weight: float = Field(ge=0)
    planned_distance: float = Field(gt=0)


class TripResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    source: str
    destination: str
    vehicle_id: int
    driver_id: int
    cargo_weight: float
    planned_distance: float
    status: str