import csv
import io

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.models.trip import Trip
from app.models.fuel_log import FuelLog
from app.models.expense import Expense
from app.models.maintenance import Maintenance
from app.core.dependencies import require_roles
from app.models.user import User


router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)


def create_csv_response(
    rows: list[dict],
    filename: str,
):
    output = io.StringIO()

    if rows:
        writer = csv.DictWriter(
            output,
            fieldnames=rows[0].keys(),
        )

        writer.writeheader()
        writer.writerows(rows)

    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{filename}"'
            )
        },
    )


@router.get("/vehicles")
def export_vehicles(
    current_user: User = Depends(
        require_roles(1, 3, 5)
    ),
    db: Session = Depends(get_db),
):
    vehicles = db.query(Vehicle).order_by(
        Vehicle.id
    ).all()

    rows = [
        {
            "id": vehicle.id,
            "registration_number": vehicle.registration_number,
            "model": vehicle.model,
            "vehicle_type": vehicle.vehicle_type,
            "max_load_capacity": vehicle.max_load_capacity,
            "odometer": vehicle.odometer,
            "acquisition_cost": vehicle.acquisition_cost,
            "status": vehicle.status,
        }
        for vehicle in vehicles
    ]

    return create_csv_response(
        rows,
        "fleetflow_vehicles.csv",
    )


@router.get("/drivers")
def export_drivers(
    current_user: User = Depends(
        require_roles(1, 3, 5)
    ),
    db: Session = Depends(get_db),
):
    drivers = db.query(Driver).order_by(
        Driver.id
    ).all()

    rows = [
        {
            "id": driver.id,
            "name": driver.name,
            "license_number": driver.license_number,
            "license_category": driver.license_category,
            "license_expiry": driver.license_expiry,
            "contact_number": driver.contact_number,
            "safety_score": driver.safety_score,
            "status": driver.status,
        }
        for driver in drivers
    ]

    return create_csv_response(
        rows,
        "fleetflow_drivers.csv",
    )


@router.get("/trips")
def export_trips(
    current_user: User = Depends(
        require_roles(1, 4, 5)
    ),
    db: Session = Depends(get_db),
):
    trips = db.query(Trip).order_by(
        Trip.id
    ).all()

    rows = [
        {
            "id": trip.id,
            "source": trip.source,
            "destination": trip.destination,
            "vehicle_id": trip.vehicle_id,
            "driver_id": trip.driver_id,
            "cargo_weight": trip.cargo_weight,
            "planned_distance": trip.planned_distance,
            "revenue": trip.revenue,
            "status": trip.status,
            "created_at": trip.created_at,
        }
        for trip in trips
    ]

    return create_csv_response(
        rows,
        "fleetflow_trips.csv",
    )


@router.get("/fuel")
def export_fuel_logs(
    current_user: User = Depends(
        require_roles(1, 4, 5)
    ),
    db: Session = Depends(get_db),
):
    fuel_logs = db.query(FuelLog).order_by(
        FuelLog.id
    ).all()

    rows = [
        {
            "id": fuel_log.id,
            "vehicle_id": fuel_log.vehicle_id,
            "liters": fuel_log.liters,
            "cost": fuel_log.cost,
            "odometer": fuel_log.odometer,
            "fuel_date": fuel_log.fuel_date,
            "notes": fuel_log.notes,
        }
        for fuel_log in fuel_logs
    ]

    return create_csv_response(
        rows,
        "fleetflow_fuel_logs.csv",
    )


@router.get("/expenses")
def export_expenses(
    current_user: User = Depends(
        require_roles(1, 4, 5)
    ),
    db: Session = Depends(get_db),
):
    expenses = db.query(Expense).order_by(
        Expense.id
    ).all()

    rows = [
        {
            "id": expense.id,
            "vehicle_id": expense.vehicle_id,
            "trip_id": expense.trip_id,
            "category": expense.category,
            "amount": expense.amount,
            "description": expense.description,
            "expense_date": expense.expense_date,
        }
        for expense in expenses
    ]

    return create_csv_response(
        rows,
        "fleetflow_expenses.csv",
    )


@router.get("/maintenance")
def export_maintenance(
    current_user: User = Depends(
        require_roles(1, 3, 5)
    ),
    db: Session = Depends(get_db),
):
    maintenance_logs = db.query(
        Maintenance
    ).order_by(
        Maintenance.id
    ).all()

    rows = [
        {
            "id": maintenance.id,
            "vehicle_id": maintenance.vehicle_id,
            "description": maintenance.description,
            "maintenance_type": maintenance.maintenance_type,
            "cost": maintenance.cost,
            "status": maintenance.status,
            "started_at": maintenance.started_at,
            "completed_at": maintenance.completed_at,
        }
        for maintenance in maintenance_logs
    ]

    return create_csv_response(
        rows,
        "fleetflow_maintenance.csv",
    )


@router.get("/financial")
def export_financial_report(
    current_user: User = Depends(
        require_roles(4, 5)
    ),
    db: Session = Depends(get_db),
):
    total_revenue = db.query(
        func.coalesce(
            func.sum(Trip.revenue),
            0,
        )
    ).filter(
        Trip.status == "Completed"
    ).scalar()

    total_fuel_cost = db.query(
        func.coalesce(
            func.sum(FuelLog.cost),
            0,
        )
    ).scalar()

    total_maintenance_cost = db.query(
        func.coalesce(
            func.sum(Maintenance.cost),
            0,
        )
    ).filter(
        Maintenance.status == "Completed"
    ).scalar()

    total_other_expenses = db.query(
        func.coalesce(
            func.sum(Expense.amount),
            0,
        )
    ).scalar()

    revenue = float(total_revenue or 0)
    fuel_cost = float(total_fuel_cost or 0)
    maintenance_cost = float(
        total_maintenance_cost or 0
    )
    other_expenses = float(
        total_other_expenses or 0
    )

    operating_cost = (
        fuel_cost
        + maintenance_cost
    )

    total_cost = (
        operating_cost
        + other_expenses
    )

    net_profit = revenue - total_cost

    vehicles = db.query(Vehicle).all()

    acquisition_cost = sum(
        float(vehicle.acquisition_cost or 0)
        for vehicle in vehicles
    )

    if acquisition_cost > 0:
        roi_percent = round(
            (
                net_profit
                / acquisition_cost
            ) * 100,
            2,
        )
    else:
        roi_percent = None

    rows = [
        {
            "metric": "Total Revenue",
            "value": revenue,
        },
        {
            "metric": "Fuel Cost",
            "value": fuel_cost,
        },
        {
            "metric": "Maintenance Cost",
            "value": maintenance_cost,
        },
        {
            "metric": "Operating Cost",
            "value": operating_cost,
        },
        {
            "metric": "Other Expenses",
            "value": other_expenses,
        },
        {
            "metric": "Total Cost",
            "value": total_cost,
        },
        {
            "metric": "Net Profit",
            "value": net_profit,
        },
        {
            "metric": "ROI Percentage",
            "value": roi_percent,
        },
    ]

    return create_csv_response(
        rows,
        "fleetflow_financial_report.csv",
    )