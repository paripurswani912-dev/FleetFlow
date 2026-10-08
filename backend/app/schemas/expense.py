from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ExpenseCreate(BaseModel):
    vehicle_id: int = Field(gt=0)
    trip_id: int | None = Field(default=None, gt=0)
    category: str = Field(min_length=1, max_length=50)
    amount: float = Field(gt=0)
    description: str | None = None


class ExpenseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    vehicle_id: int
    trip_id: int | None
    category: str
    amount: float
    description: str | None
    expense_date: datetime