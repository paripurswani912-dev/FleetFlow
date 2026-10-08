from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.models.trip import Trip
from app.models.maintenance import Maintenance
from app.models.fuel_log import FuelLog
from app.models.expense import Expense
from app.core.dependencies import get_current_user
from app.models.user import User


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@router.get("/summary")
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total_vehicles = db.query(Vehicle).count()

    available_vehicles = db.query(Vehicle).filter(
        Vehicle.status == "Available"
    ).count()

    on_trip_vehicles = db.query(Vehicle).filter(
        Vehicle.status == "On Trip"
    ).count()

    in_shop_vehicles = db.query(Vehicle).filter(
        Vehicle.status == "In Shop"
    ).count()

    retired_vehicles = db.query(Vehicle).filter(
        Vehicle.status == "Retired"
    ).count()

    total_drivers = db.query(Driver).count()

    available_drivers = db.query(Driver).filter(
        Driver.status == "Available"
    ).count()

    on_trip_drivers = db.query(Driver).filter(
        Driver.status == "On Trip"
    ).count()

    off_duty_drivers = db.query(Driver).filter(
        Driver.status == "Off Duty"
    ).count()

    suspended_drivers = db.query(Driver).filter(
        Driver.status == "Suspended"
    ).count()

    total_trips = db.query(Trip).count()

    draft_trips = db.query(Trip).filter(
        Trip.status == "Draft"
    ).count()

    dispatched_trips = db.query(Trip).filter(
        Trip.status == "Dispatched"
    ).count()

    completed_trips = db.query(Trip).filter(
        Trip.status == "Completed"
    ).count()

    cancelled_trips = db.query(Trip).filter(
        Trip.status == "Cancelled"
    ).count()

    total_fuel_cost = db.query(
        func.coalesce(func.sum(FuelLog.cost), 0)
    ).scalar()

    total_maintenance_cost = db.query(
        func.coalesce(func.sum(Maintenance.cost), 0)
    ).filter(
        Maintenance.status == "Completed"
    ).scalar()

    total_expenses = db.query(
        func.coalesce(func.sum(Expense.amount), 0)
    ).scalar()

    fleet_utilization = 0.0

    if total_vehicles > 0:
        fleet_utilization = round(
            (on_trip_vehicles / total_vehicles) * 100,
            2,
        )

    return {
        "vehicles": {
            "total": total_vehicles,
            "available": available_vehicles,
            "on_trip": on_trip_vehicles,
            "in_shop": in_shop_vehicles,
            "retired": retired_vehicles,
        },
        "drivers": {
            "total": total_drivers,
            "available": available_drivers,
            "on_trip": on_trip_drivers,
            "off_duty": off_duty_drivers,
            "suspended": suspended_drivers,
        },
        "trips": {
            "total": total_trips,
            "draft": draft_trips,
            "dispatched": dispatched_trips,
            "completed": completed_trips,
            "cancelled": cancelled_trips,
        },
        "financials": {
            "fuel_cost": float(total_fuel_cost or 0),
            "maintenance_cost": float(
                total_maintenance_cost or 0
            ),
            "other_expenses": float(
                total_expenses or 0
            ),
        },
        "fleet_utilization_percent": fleet_utilization,
    }