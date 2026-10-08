from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.trip import Trip
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.schemas.trip import TripCreate, TripResponse
from app.core.audit import create_audit_log
from app.core.dependencies import (
    get_current_user,
    require_roles,
)
from app.models.user import User


router = APIRouter(
    prefix="/trips",
    tags=["Trips"],
)


def get_driver_for_user(user: User, db: Session) -> Driver | None:
    return db.query(Driver).filter(
        (Driver.id == user.id) | (func.lower(Driver.name) == func.lower(user.full_name))
    ).first()


@router.post(
    "/",
    response_model=TripResponse,
    status_code=201,
)
def create_trip(
    trip_data: TripCreate,
    current_user: User = Depends(
        require_roles(1, 5)
    ),
    db: Session = Depends(get_db),
):
    vehicle = db.query(Vehicle).filter(
        Vehicle.id == trip_data.vehicle_id
    ).first()

    if vehicle is None:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found.",
        )

    driver = db.query(Driver).filter(
        Driver.id == trip_data.driver_id
    ).first()

    if driver is None:
        raise HTTPException(
            status_code=404,
            detail="Driver not found.",
        )

    if vehicle.status != "Available":
        raise HTTPException(
            status_code=409,
            detail="Vehicle is not available.",
        )

    if driver.status != "Available":
        raise HTTPException(
            status_code=409,
            detail="Driver is not available.",
        )

    if trip_data.cargo_weight > vehicle.max_load_capacity:
        raise HTTPException(
            status_code=400,
            detail="Cargo weight exceeds vehicle capacity.",
        )

    trip = Trip(
        source=trip_data.source,
        destination=trip_data.destination,
        vehicle_id=trip_data.vehicle_id,
        driver_id=trip_data.driver_id,
        cargo_weight=trip_data.cargo_weight,
        planned_distance=trip_data.planned_distance,
        revenue=trip_data.revenue,
        status="Draft",
    )

    db.add(trip)
    db.flush()

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="CREATE",
        entity_type="Trip",
        entity_id=trip.id,
        description=(
            f"Trip from {trip.source} to "
            f"{trip.destination} created."
        ),
    )

    db.commit()
    db.refresh(trip)

    return trip


@router.patch(
    "/{trip_id}/dispatch",
    response_model=TripResponse,
)
def dispatch_trip(
    trip_id: int,
    current_user: User = Depends(
        require_roles(1, 2, 5)
    ),
    db: Session = Depends(get_db),
):
    trip = db.query(Trip).filter(
        Trip.id == trip_id
    ).first()

    if trip is None:
        raise HTTPException(
            status_code=404,
            detail="Trip not found.",
        )

    # Driver Ownership Verification
    if current_user.role_id == 2:
        driver_rec = get_driver_for_user(current_user, db)
        if not driver_rec or trip.driver_id != driver_rec.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Driver ownership error: You can only dispatch trips assigned to you.",
            )

    if trip.status != "Draft":
        raise HTTPException(
            status_code=409,
            detail="Only Draft trips can be dispatched.",
        )

    vehicle = db.query(Vehicle).filter(
        Vehicle.id == trip.vehicle_id
    ).first()

    driver = db.query(Driver).filter(
        Driver.id == trip.driver_id
    ).first()

    if vehicle is None or driver is None:
        raise HTTPException(
            status_code=404,
            detail="Trip vehicle or driver not found.",
        )

    if vehicle.status != "Available":
        raise HTTPException(
            status_code=409,
            detail="Vehicle is not available for dispatch.",
        )

    if driver.status != "Available":
        raise HTTPException(
            status_code=409,
            detail="Driver is not available for dispatch.",
        )

    if driver.license_expiry < date.today():
        raise HTTPException(
            status_code=409,
            detail="Driver license has expired.",
        )

    if trip.cargo_weight > vehicle.max_load_capacity:
        raise HTTPException(
            status_code=400,
            detail="Cargo weight exceeds vehicle capacity.",
        )

    trip.status = "Dispatched"

    vehicle.status = "On Trip"
    driver.status = "On Trip"

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="DISPATCH",
        entity_type="Trip",
        entity_id=trip.id,
        description=(
            f"Trip from {trip.source} to "
            f"{trip.destination} dispatched."
        ),
    )

    db.commit()
    db.refresh(trip)

    return trip


@router.patch(
    "/{trip_id}/complete",
    response_model=TripResponse,
)
def complete_trip(
    trip_id: int,
    current_user: User = Depends(
        require_roles(1, 2, 5)
    ),
    db: Session = Depends(get_db),
):
    trip = db.query(Trip).filter(
        Trip.id == trip_id
    ).first()

    if trip is None:
        raise HTTPException(
            status_code=404,
            detail="Trip not found.",
        )

    # Driver Ownership Verification
    if current_user.role_id == 2:
        driver_rec = get_driver_for_user(current_user, db)
        if not driver_rec or trip.driver_id != driver_rec.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Driver ownership error: You can only complete trips assigned to you.",
            )

    if trip.status != "Dispatched":
        raise HTTPException(
            status_code=409,
            detail="Only Dispatched trips can be completed.",
        )

    vehicle = db.query(Vehicle).filter(
        Vehicle.id == trip.vehicle_id
    ).first()

    driver = db.query(Driver).filter(
        Driver.id == trip.driver_id
    ).first()

    if vehicle is None or driver is None:
        raise HTTPException(
            status_code=404,
            detail="Trip vehicle or driver not found.",
        )

    trip.status = "Completed"

    vehicle.status = "Available"
    driver.status = "Available"

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="COMPLETE",
        entity_type="Trip",
        entity_id=trip.id,
        description=(
            f"Trip from {trip.source} to "
            f"{trip.destination} completed."
        ),
    )

    db.commit()
    db.refresh(trip)

    return trip


@router.patch(
    "/{trip_id}/cancel",
    response_model=TripResponse,
)
def cancel_trip(
    trip_id: int,
    current_user: User = Depends(
        require_roles(1, 5)
    ),
    db: Session = Depends(get_db),
):
    trip = db.query(Trip).filter(
        Trip.id == trip_id
    ).first()

    if trip is None:
        raise HTTPException(
            status_code=404,
            detail="Trip not found.",
        )

    if trip.status == "Completed":
        raise HTTPException(
            status_code=409,
            detail="Completed trips cannot be cancelled.",
        )

    if trip.status == "Cancelled":
        raise HTTPException(
            status_code=409,
            detail="Trip is already cancelled.",
        )

    vehicle = db.query(Vehicle).filter(
        Vehicle.id == trip.vehicle_id
    ).first()

    driver = db.query(Driver).filter(
        Driver.id == trip.driver_id
    ).first()

    trip.status = "Cancelled"

    if vehicle is not None and vehicle.status == "On Trip":
        vehicle.status = "Available"

    if driver is not None and driver.status == "On Trip":
        driver.status = "Available"

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="CANCEL",
        entity_type="Trip",
        entity_id=trip.id,
        description=(
            f"Trip from {trip.source} to "
            f"{trip.destination} cancelled."
        ),
    )

    db.commit()
    db.refresh(trip)

    return trip


@router.get(
    "/",
    response_model=list[TripResponse],
)
def get_trips(
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    if current_user.role_id in (1, 4, 5):
        return db.query(Trip).order_by(Trip.id).all()

    if current_user.role_id == 2:
        driver_rec = get_driver_for_user(current_user, db)
        if not driver_rec:
            return []
        return db.query(Trip).filter(Trip.driver_id == driver_rec.id).order_by(Trip.id).all()

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have permission to view trips.",
    )


@router.get(
    "/{trip_id}",
    response_model=TripResponse,
)
def get_trip(
    trip_id: int,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    if current_user.role_id == 3:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view trips.",
        )

    trip = db.query(Trip).filter(
        Trip.id == trip_id
    ).first()

    if trip is None:
        raise HTTPException(
            status_code=404,
            detail="Trip not found.",
        )

    if current_user.role_id == 2:
        driver_rec = get_driver_for_user(current_user, db)
        if not driver_rec or trip.driver_id != driver_rec.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Driver ownership error: You can only view trips assigned to you.",
            )

    return trip