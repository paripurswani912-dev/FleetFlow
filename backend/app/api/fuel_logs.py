from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.fuel_log import FuelLog
from app.models.vehicle import Vehicle
from app.schemas.fuel_log import FuelLogCreate, FuelLogResponse

router = APIRouter(
    prefix="/fuel-logs",
    tags=["Fuel Logs"],
)


@router.post("/", response_model=FuelLogResponse, status_code=201)
def create_fuel_log(
    fuel_data: FuelLogCreate,
    db: Session = Depends(get_db),
):
    vehicle = db.query(Vehicle).filter(
        Vehicle.id == fuel_data.vehicle_id
    ).first()

    if vehicle is None:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found.",
        )

    if vehicle.status == "Retired":
        raise HTTPException(
            status_code=409,
            detail="Cannot add a fuel log for a retired vehicle.",
        )

    fuel_log = FuelLog(**fuel_data.model_dump())

    db.add(fuel_log)

    try:
        db.commit()
        db.refresh(fuel_log)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Fuel log creation failed.",
        )

    return fuel_log
@router.get("/", response_model=list[FuelLogResponse])
def get_fuel_logs(db: Session = Depends(get_db)):
    return db.query(FuelLog).order_by(FuelLog.id).all()

@router.get("/{fuel_log_id}", response_model=FuelLogResponse)
def get_fuel_log(fuel_log_id: int, db: Session = Depends(get_db)):
    fuel_log = db.query(FuelLog).filter(FuelLog.id == fuel_log_id).first()

    if fuel_log is None:
        raise HTTPException(
            status_code=404,
            detail="Fuel log not found."
        )

    return fuel_log