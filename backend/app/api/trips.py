
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date

from app.database import get_db
from app.models.trip import Trip
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.schemas.trip import TripCreate, TripResponse


router = APIRouter(prefix="/trips", tags=["Trips"])


@router.post("/", response_model=TripResponse, status_code=201)
def create_trip(
    trip_data: TripCreate,
    db: Session = Depends(get_db),
):
    vehicle = db.query(Vehicle).filter(
        Vehicle.id == trip_data.vehicle_id
    ).first()

    if vehicle is None:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found",
        )

    driver = db.query(Driver).filter(
        Driver.id == trip_data.driver_id
    ).first()

    if driver is None:
        raise HTTPException(
            status_code=404,
            detail="Driver not found",
        )

    if vehicle.status != "Available":
        raise HTTPException(
            status_code=409,
            detail="Vehicle is not available for a new trip.",
        )

    if driver.status != "Available":
        raise HTTPException(
            status_code=409,
            detail="Driver is not available for a new trip.",
        )

    if trip_data.cargo_weight > vehicle.max_load_capacity:
        raise HTTPException(
            status_code=422,
            detail="Cargo weight exceeds the vehicle's maximum load capacity.",
        )

    trip = Trip(
        **trip_data.model_dump(),
        status="Draft",
    )

    db.add(trip)
    db.commit()
    db.refresh(trip)

    return trip


@router.get("/", response_model=list[TripResponse])
def get_trips(db: Session = Depends(get_db)):
    return db.query(Trip).order_by(Trip.id).all()


@router.get("/{trip_id}", response_model=TripResponse)
def get_trip(
    trip_id: int,
    db: Session = Depends(get_db),
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()

    if trip is None:
        raise HTTPException(
            status_code=404,
            detail="Trip not found",
        )

    return trip
@router.patch("/{trip_id}/dispatch", response_model=TripResponse)
def dispatch_trip(
    trip_id: int,
    db: Session = Depends(get_db),
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()

    if trip is None:
        raise HTTPException(
            status_code=404,
            detail="Trip not found",
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

    if vehicle is None:
        raise HTTPException(
            status_code=404,
            detail="Assigned vehicle not found.",
        )

    if driver is None:
        raise HTTPException(
            status_code=404,
            detail="Assigned driver not found.",
        )

    if vehicle.status != "Available":
        raise HTTPException(
            status_code=409,
            detail="Vehicle is no longer available.",
        )

    if driver.status != "Available":
        raise HTTPException(
            status_code=409,
            detail="Driver is no longer available.",
        )

    if driver.license_expiry < date.today():
        raise HTTPException(
            status_code=409,
            detail="Driver's licence has expired.",
        )

    trip.status = "Dispatched"
    vehicle.status = "On Trip"
    driver.status = "On Trip"

    try:
        db.commit()
        db.refresh(trip)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Trip dispatch failed.",
        )

    return trip

@router.patch("/{trip_id}/complete", response_model=TripResponse)
def complete_trip(
    trip_id: int,
    db: Session = Depends(get_db),
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()

    if trip is None:
        raise HTTPException(
            status_code=404,
            detail="Trip not found",
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
            detail="Assigned vehicle or driver not found.",
        )

    trip.status = "Completed"
    vehicle.status = "Available"
    driver.status = "Available"

    try:
        db.commit()
        db.refresh(trip)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Trip completion failed.",
        )

    return trip

@router.patch("/{trip_id}/cancel", response_model=TripResponse)
def cancel_trip(
    trip_id: int,
    db: Session = Depends(get_db),
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()

    if trip is None:
        raise HTTPException(
            status_code=404,
            detail="Trip not found",
        )

    if trip.status not in ("Draft", "Dispatched"):
        raise HTTPException(
            status_code=409,
            detail="Only Draft or Dispatched trips can be cancelled.",
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

    try:
        db.commit()
        db.refresh(trip)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Trip cancellation failed.",
        )

    return trip

@router.get("/", response_model=list[TripResponse])
def get_trips(db: Session = Depends(get_db)):
    return db.query(Trip).order_by(Trip.id).all()

@router.get("/{trip_id}", response_model=TripResponse)
def get_trip(
    trip_id: int,
    db: Session = Depends(get_db),
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()

    if trip is None:
        raise HTTPException(
            status_code=404,
            detail="Trip not found",
        )

    return trip