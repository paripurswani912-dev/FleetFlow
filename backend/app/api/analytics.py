from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.vehicle import Vehicle
from app.models.fuel_log import FuelLog
from app.models.maintenance import Maintenance
from app.models.expense import Expense
from app.models.trip import Trip
from app.core.dependencies import require_roles
from app.models.user import User


router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"],
)


ANALYTICS_ROLES = (1, 4, 5)


@router.get("/fuel-efficiency")
def get_fuel_efficiency(
    current_user: User = Depends(
        require_roles(*ANALYTICS_ROLES)
    ),
    db: Session = Depends(get_db),
):
    vehicles = db.query(Vehicle).order_by(
        Vehicle.id
    ).all()

    results = []

    for vehicle in vehicles:
        fuel_logs = db.query(FuelLog).filter(
            FuelLog.vehicle_id == vehicle.id
        ).order_by(
            FuelLog.odometer
        ).all()

        if len(fuel_logs) < 2:
            results.append({
                "vehicle_id": vehicle.id,
                "registration_number": (
                    vehicle.registration_number
                ),
                "distance_travelled": 0,
                "fuel_consumed": sum(
                    log.liters for log in fuel_logs
                ),
                "fuel_efficiency_km_per_litre": None,
            })
            continue

        starting_odometer = fuel_logs[0].odometer
        ending_odometer = fuel_logs[-1].odometer

        distance_travelled = (
            ending_odometer
            - starting_odometer
        )

        fuel_consumed = sum(
            log.liters for log in fuel_logs
        )

        if (
            fuel_consumed > 0
            and distance_travelled >= 0
        ):
            efficiency = round(
                distance_travelled
                / fuel_consumed,
                2,
            )
        else:
            efficiency = None

        results.append({
            "vehicle_id": vehicle.id,
            "registration_number": (
                vehicle.registration_number
            ),
            "distance_travelled": (
                distance_travelled
            ),
            "fuel_consumed": fuel_consumed,
            "fuel_efficiency_km_per_litre": (
                efficiency
            ),
        })

    return {
        "vehicles": results
    }


@router.get("/fleet-utilization")
def get_fleet_utilization(
    current_user: User = Depends(
        require_roles(*ANALYTICS_ROLES)
    ),
    db: Session = Depends(get_db),
):
    total_active_vehicles = db.query(
        Vehicle
    ).filter(
        Vehicle.status != "Retired"
    ).count()

    vehicles_on_trip = db.query(
        Vehicle
    ).filter(
        Vehicle.status == "On Trip"
    ).count()

    if total_active_vehicles == 0:
        utilization_percent = 0.0
    else:
        utilization_percent = round(
            (
                vehicles_on_trip
                / total_active_vehicles
            ) * 100,
            2,
        )

    return {
        "total_active_vehicles": (
            total_active_vehicles
        ),
        "vehicles_on_trip": vehicles_on_trip,
        "fleet_utilization_percent": (
            utilization_percent
        ),
    }


@router.get("/operating-cost")
def get_operating_cost(
    current_user: User = Depends(
        require_roles(*ANALYTICS_ROLES)
    ),
    db: Session = Depends(get_db),
):
    fuel_cost = db.query(
        func.coalesce(
            func.sum(FuelLog.cost),
            0,
        )
    ).scalar()

    maintenance_cost = db.query(
        func.coalesce(
            func.sum(Maintenance.cost),
            0,
        )
    ).filter(
        Maintenance.status == "Completed"
    ).scalar()

    operating_cost = (
        float(fuel_cost or 0)
        + float(maintenance_cost or 0)
    )

    return {
        "fuel_cost": float(
            fuel_cost or 0
        ),
        "maintenance_cost": float(
            maintenance_cost or 0
        ),
        "operating_cost": operating_cost,
    }


@router.get("/trip-profitability")
def get_trip_profitability(
    current_user: User = Depends(
        require_roles(*ANALYTICS_ROLES)
    ),
    db: Session = Depends(get_db),
):
    completed_trips = db.query(
        Trip
    ).filter(
        Trip.status == "Completed"
    ).order_by(
        Trip.id
    ).all()

    results = []

    for trip in completed_trips:
        fuel_cost = db.query(
            func.coalesce(
                func.sum(FuelLog.cost),
                0,
            )
        ).filter(
            FuelLog.vehicle_id
            == trip.vehicle_id
        ).scalar()

        maintenance_cost = db.query(
            func.coalesce(
                func.sum(Maintenance.cost),
                0,
            )
        ).filter(
            Maintenance.vehicle_id
            == trip.vehicle_id,
            Maintenance.status
            == "Completed",
        ).scalar()

        total_cost = (
            float(fuel_cost or 0)
            + float(maintenance_cost or 0)
        )

        profit = (
            float(trip.revenue)
            - total_cost
        )

        results.append({
            "trip_id": trip.id,
            "source": trip.source,
            "destination": trip.destination,
            "vehicle_id": trip.vehicle_id,
            "revenue": float(
                trip.revenue
            ),
            "operating_cost": total_cost,
            "profit": profit,
        })

    return {
        "completed_trips": results
    }


@router.get("/roi")
def get_vehicle_roi(
    current_user: User = Depends(
        require_roles(*ANALYTICS_ROLES)
    ),
    db: Session = Depends(get_db),
):
    vehicles = db.query(Vehicle).order_by(
        Vehicle.id
    ).all()

    results = []

    for vehicle in vehicles:
        revenue = db.query(
            func.coalesce(
                func.sum(Trip.revenue),
                0,
            )
        ).filter(
            Trip.vehicle_id == vehicle.id,
            Trip.status == "Completed",
        ).scalar()

        fuel_cost = db.query(
            func.coalesce(
                func.sum(FuelLog.cost),
                0,
            )
        ).filter(
            FuelLog.vehicle_id
            == vehicle.id
        ).scalar()

        maintenance_cost = db.query(
            func.coalesce(
                func.sum(Maintenance.cost),
                0,
            )
        ).filter(
            Maintenance.vehicle_id
            == vehicle.id,
            Maintenance.status
            == "Completed",
        ).scalar()

        total_operating_cost = (
            float(fuel_cost or 0)
            + float(maintenance_cost or 0)
        )

        net_return = (
            float(revenue or 0)
            - total_operating_cost
        )

        acquisition_cost = float(
            vehicle.acquisition_cost or 0
        )

        if acquisition_cost > 0:
            roi_percent = round(
                (
                    net_return
                    / acquisition_cost
                ) * 100,
                2,
            )
        else:
            roi_percent = None

        results.append({
            "vehicle_id": vehicle.id,
            "registration_number": (
                vehicle.registration_number
            ),
            "acquisition_cost": (
                acquisition_cost
            ),
            "revenue": float(
                revenue or 0
            ),
            "fuel_cost": float(
                fuel_cost or 0
            ),
            "maintenance_cost": float(
                maintenance_cost or 0
            ),
            "operating_cost": (
                total_operating_cost
            ),
            "net_return": net_return,
            "roi_percent": roi_percent,
        })

    return {
        "vehicles": results
    }


@router.get("/financial-summary")
def get_financial_summary(
    current_user: User = Depends(
        require_roles(*ANALYTICS_ROLES)
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

    operating_cost = (
        float(total_fuel_cost or 0)
        + float(total_maintenance_cost or 0)
    )

    total_overall_cost = (
        operating_cost
        + float(total_other_expenses or 0)
    )

    net_profit = (
        float(total_revenue or 0)
        - total_overall_cost
    )

    vehicles = db.query(Vehicle).all()

    total_acquisition_cost = sum(
        float(vehicle.acquisition_cost or 0)
        for vehicle in vehicles
    )

    if total_acquisition_cost > 0:
        roi_percent = round(
            (
                net_profit
                / total_acquisition_cost
            ) * 100,
            2,
        )
    else:
        roi_percent = None

    completed_trip_count = db.query(
        Trip
    ).filter(
        Trip.status == "Completed"
    ).count()

    return {
        "revenue": {
            "total_revenue": float(
                total_revenue or 0
            ),
            "completed_trips": (
                completed_trip_count
            ),
        },
        "costs": {
            "fuel_cost": float(
                total_fuel_cost or 0
            ),
            "maintenance_cost": float(
                total_maintenance_cost or 0
            ),
            "operating_cost": operating_cost,
            "other_expenses": float(
                total_other_expenses or 0
            ),
            "total_overall_cost": (
                total_overall_cost
            ),
        },
        "profitability": {
            "net_profit": net_profit,
            "roi_percent": roi_percent,
        },
    }