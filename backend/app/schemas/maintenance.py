from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class MaintenanceCreate(BaseModel):
    vehicle_id: int = Field(gt=0)
    description: str = Field(min_length=1)
    maintenance_type: str = Field(min_length=1, max_length=50)
    cost: float = Field(ge=0)


class MaintenanceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    vehicle_id: int
    description: str
    maintenance_type: str
    cost: float
    status: str
    started_at: datetime
    completed_at: datetime | None