import os
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.vehicle import Vehicle
from app.models.vehicle_document import VehicleDocument
from app.schemas.vehicle_document import VehicleDocumentResponse


router = APIRouter(
    prefix="/vehicle-documents",
    tags=["Vehicle Documents"],
)


UPLOAD_DIR = "uploads/vehicle_documents"

os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post(
    "/",
    response_model=VehicleDocumentResponse,
    status_code=201,
)
def upload_vehicle_document(
    vehicle_id: int = Form(...),
    document_type: str = Form(...),
    expiry_date: str | None = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    vehicle = db.query(Vehicle).filter(
        Vehicle.id == vehicle_id
    ).first()

    if vehicle is None:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found.",
        )

    allowed_extensions = {
        ".pdf",
        ".jpg",
        ".jpeg",
        ".png",
    }

    extension = os.path.splitext(
        file.filename or ""
    )[1].lower()

    if extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type.",
        )

    unique_name = f"{uuid.uuid4()}{extension}"

    file_path = os.path.join(
        UPLOAD_DIR,
        unique_name,
    )

    with open(file_path, "wb") as buffer:
        buffer.write(file.file.read())

    parsed_expiry_date = None

    if expiry_date:
        from datetime import date

        try:
            parsed_expiry_date = date.fromisoformat(
                expiry_date
            )
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Invalid expiry date. Use YYYY-MM-DD.",
            )

    document = VehicleDocument(
        vehicle_id=vehicle_id,
        document_type=document_type,
        file_name=file.filename or unique_name,
        file_path=file_path,
        expiry_date=parsed_expiry_date,
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    return document


@router.get(
    "/",
    response_model=list[VehicleDocumentResponse],
)
def get_vehicle_documents(
    db: Session = Depends(get_db),
):
    return db.query(VehicleDocument).order_by(
        VehicleDocument.id
    ).all()


@router.get(
    "/vehicle/{vehicle_id}",
    response_model=list[VehicleDocumentResponse],
)
def get_documents_for_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
):
    vehicle = db.query(Vehicle).filter(
        Vehicle.id == vehicle_id
    ).first()

    if vehicle is None:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found.",
        )

    return db.query(VehicleDocument).filter(
        VehicleDocument.vehicle_id == vehicle_id
    ).order_by(
        VehicleDocument.id
    ).all()