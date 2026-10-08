from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class VehicleDocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    vehicle_id: int
    document_type: str
    file_name: str
    file_path: str
    expiry_date: date | None
    uploaded_at: datetime