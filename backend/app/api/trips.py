
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

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