
from pydantic import BaseModel, ConfigDict, Field


class VehicleCreate(BaseModel):
    registration_number: str = Field(
        min_length=1,
        max_length=20,
    )
    model: str = Field(min_length=1, max_length=100)
    vehicle_type: str = Field(min_length=1, max_length=50)
    max_load_capacity: float = Field(gt=0)
    odometer: float = Field(default=0.0, ge=0)
    acquisition_cost: float = Field(ge=0)


class VehicleUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    registration_number: str | None = Field(
        default=None,
        min_length=1,
        max_length=20,
    )
    model: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )
    vehicle_type: str | None = Field(
        default=None,
        min_length=1,
        max_length=50,
    )
    max_load_capacity: float | None = Field(
        default=None,
        gt=0,
    )
    odometer: float | None = Field(default=None, ge=0)
    acquisition_cost: float | None = Field(default=None, ge=0)
    status: str | None = None


class VehicleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    registration_number: str
    model: str
    vehicle_type: str
    max_load_capacity: float
    odometer: float
    acquisition_cost: float
    status: str