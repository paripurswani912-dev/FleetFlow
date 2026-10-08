from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.maintenance import Maintenance
from app.models.vehicle import Vehicle
from app.schemas.maintenance import (
    MaintenanceCreate,
    MaintenanceResponse,
)
from app.core.audit import create_audit_log
from app.core.dependencies import (
    get_current_user,
    require_roles,
)
from app.models.user import User


router = APIRouter(
    prefix="/maintenance",
    tags=["Maintenance"],
)


@router.post(
    "/",
    response_model=MaintenanceResponse,
    status_code=201,
)
def create_maintenance(
    maintenance_data: MaintenanceCreate,
    current_user: User = Depends(
        require_roles(1, 3, 5)
    ),
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
            detail=(
                "Retired vehicles cannot "
                "be sent for maintenance."
            ),
        )

    if vehicle.status == "On Trip":
        raise HTTPException(
            status_code=409,
            detail="Vehicle is currently on a trip.",
        )

    maintenance = Maintenance(
        **maintenance_data.model_dump(),
        status="Open",
    )

    db.add(maintenance)

    vehicle.status = "In Shop"

    db.flush()

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="CREATE",
        entity_type="Maintenance",
        entity_id=maintenance.id,
        description=(
            f"Maintenance created for vehicle "
            f"{vehicle.registration_number}."
        ),
    )

    db.commit()
    db.refresh(maintenance)

    return maintenance


@router.patch(
    "/{maintenance_id}/complete",
    response_model=MaintenanceResponse,
)
def complete_maintenance(
    maintenance_id: int,
    current_user: User = Depends(
        require_roles(1, 3, 5)
    ),
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

    if maintenance.status == "Completed":
        raise HTTPException(
            status_code=409,
            detail="Maintenance is already completed.",
        )

    vehicle = db.query(Vehicle).filter(
        Vehicle.id == maintenance.vehicle_id
    ).first()

    if vehicle is None:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found.",
        )

    maintenance.status = "Completed"
    maintenance.completed_at = datetime.now()

    if vehicle.status != "Retired":
        vehicle.status = "Available"

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="COMPLETE",
        entity_type="Maintenance",
        entity_id=maintenance.id,
        description=(
            f"Maintenance completed for vehicle "
            f"{vehicle.registration_number}."
        ),
    )

    db.commit()
    db.refresh(maintenance)

    return maintenance


@router.get(
    "/",
    response_model=list[MaintenanceResponse],
)
def get_maintenance_logs(
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    return db.query(Maintenance).order_by(
        Maintenance.id
    ).all()


@router.get(
    "/{maintenance_id}",
    response_model=MaintenanceResponse,
)
def get_maintenance(
    maintenance_id: int,
    current_user: User = Depends(
        get_current_user
    ),
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