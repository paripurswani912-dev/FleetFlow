from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.models.vehicle import Vehicle
from app.schemas.vehicle import (
    VehicleCreate,
    VehicleResponse,
    VehicleUpdate,
)
from app.core.audit import create_audit_log
from app.core.dependencies import (
    get_current_user,
    require_roles,
)
from app.models.user import User


router = APIRouter(
    prefix="/vehicles",
    tags=["Vehicles"],
)


@router.post(
    "/",
    response_model=VehicleResponse,
    status_code=201,
)
def create_vehicle(
    vehicle_data: VehicleCreate,
    current_user: User = Depends(
        require_roles(1, 5)
    ),
    db: Session = Depends(get_db),
):
    vehicle = Vehicle(
        **vehicle_data.model_dump()
    )

    db.add(vehicle)

    try:
        db.flush()

        create_audit_log(
            db=db,
            user_id=current_user.id,
            action="CREATE",
            entity_type="Vehicle",
            entity_id=vehicle.id,
            description=(
                f"Vehicle "
                f"{vehicle.registration_number} "
                f"created."
            ),
        )

        db.commit()
        db.refresh(vehicle)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail=(
                "A vehicle with this "
                "registration number may "
                "already exist."
            ),
        )

    return vehicle


@router.get(
    "/",
    response_model=list[VehicleResponse],
)
def get_vehicles(
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    return db.query(Vehicle).order_by(
        Vehicle.id
    ).all()


@router.get(
    "/{vehicle_id}",
    response_model=VehicleResponse,
)
def get_vehicle(
    vehicle_id: int,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    vehicle = db.query(Vehicle).filter(
        Vehicle.id == vehicle_id
    ).first()

    if vehicle is None:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found",
        )

    return vehicle


@router.patch(
    "/{vehicle_id}",
    response_model=VehicleResponse,
)
def update_vehicle(
    vehicle_id: int,
    vehicle_data: VehicleUpdate,
    current_user: User = Depends(
        require_roles(1, 5)
    ),
    db: Session = Depends(get_db),
):
    vehicle = db.query(Vehicle).filter(
        Vehicle.id == vehicle_id
    ).first()

    if vehicle is None:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found",
        )

    update_data = vehicle_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(vehicle, field, value)

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="UPDATE",
        entity_type="Vehicle",
        entity_id=vehicle.id,
        description=(
            f"Vehicle "
            f"{vehicle.registration_number} "
            f"updated."
        ),
    )

    try:
        db.commit()
        db.refresh(vehicle)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail=(
                "A vehicle with this "
                "registration number may "
                "already exist."
            ),
        )

    return vehicle


@router.patch(
    "/{vehicle_id}/retire",
    response_model=VehicleResponse,
)
def retire_vehicle(
    vehicle_id: int,
    current_user: User = Depends(
        require_roles(1, 5)
    ),
    db: Session = Depends(get_db),
):
    vehicle = db.query(Vehicle).filter(
        Vehicle.id == vehicle_id
    ).first()

    if vehicle is None:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found",
        )

    if vehicle.status in (
        "On Trip",
        "In Shop",
    ):
        raise HTTPException(
            status_code=409,
            detail=(
                "Cannot retire a vehicle "
                "that is on a trip or "
                "in the shop."
            ),
        )

    if vehicle.status == "Retired":
        raise HTTPException(
            status_code=409,
            detail="Vehicle is already retired.",
        )

    vehicle.status = "Retired"

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="RETIRE",
        entity_type="Vehicle",
        entity_id=vehicle.id,
        description=(
            f"Vehicle "
            f"{vehicle.registration_number} "
            f"retired."
        ),
    )

    db.commit()
    db.refresh(vehicle)

    return vehicle