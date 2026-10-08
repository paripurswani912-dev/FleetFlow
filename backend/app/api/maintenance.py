from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.maintenance import Maintenance
from app.models.vehicle import Vehicle
from app.schemas.maintenance import MaintenanceCreate, MaintenanceResponse

router = APIRouter(
    prefix="/maintenance",
    tags=["Maintenance"],
)


@router.post("/", response_model=MaintenanceResponse, status_code=201)
def create_maintenance(
    maintenance_data: MaintenanceCreate,
    db: Session = Depends(get_db),
):
    vehicle = db.query(Vehicle).filter(
        Vehicle.id == maintenance_data.vehicle_id
    ).first()

    if vehicle is None:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found.",
        )

    if vehicle.status == "Retired":
        raise HTTPException(
            status_code=409,
            detail="Cannot create maintenance for a retired vehicle.",
        )

    if vehicle.status == "On Trip":
        raise HTTPException(
            status_code=409,
            detail="Cannot start maintenance while vehicle is on a trip.",
        )

    maintenance = Maintenance(
        **maintenance_data.model_dump(),
        status="Open",
        started_at=datetime.now(),
    )

    vehicle.status = "In Shop"

    db.add(maintenance)

    try:
        db.commit()
        db.refresh(maintenance)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Maintenance creation failed.",
        )

    return maintenance

@router.patch("/{maintenance_id}/complete", response_model=MaintenanceResponse)
def complete_maintenance(
    maintenance_id: int,
    db: Session = Depends(get_db),
):
    maintenance = db.query(Maintenance).filter(
        Maintenance.id == maintenance_id
    ).first()

    if maintenance is None:
        raise HTTPException(
            status_code=404,
            detail="Maintenance record not found.",
        )

    if maintenance.status != "Open":
        raise HTTPException(
            status_code=409,
            detail="Only Open maintenance records can be completed.",
        )

    maintenance.status = "Completed"
    maintenance.completed_at = datetime.now()

    vehicle = db.query(Vehicle).filter(
        Vehicle.id == maintenance.vehicle_id
    ).first()

    if vehicle is None:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found.",
        )

    # Check whether another maintenance record is still open.
    other_open_maintenance = db.query(Maintenance).filter(
        Maintenance.vehicle_id == maintenance.vehicle_id,
        Maintenance.status == "Open",
        Maintenance.id != maintenance.id,
    ).first()

    if other_open_maintenance is None and vehicle.status != "Retired":
        vehicle.status = "Available"

    try:
        db.commit()
        db.refresh(maintenance)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Maintenance completion failed.",
        )

    return maintenance

@router.get("/", response_model=list[MaintenanceResponse])
def get_maintenance_records(db: Session = Depends(get_db)):
    return db.query(Maintenance).order_by(Maintenance.id).all()
@router.get("/{maintenance_id}", response_model=MaintenanceResponse)
def get_maintenance(
    maintenance_id: int,
    db: Session = Depends(get_db),
):
    maintenance = db.query(Maintenance).filter(
        Maintenance.id == maintenance_id
    ).first()

    if maintenance is None:
        raise HTTPException(
            status_code=404,
            detail="Maintenance record not found.",
        )

    return maintenance