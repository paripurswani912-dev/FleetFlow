from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.expense import Expense
from app.models.vehicle import Vehicle
from app.models.trip import Trip
from app.schemas.expense import (
    ExpenseCreate,
    ExpenseResponse,
)
from app.core.audit import create_audit_log
from app.core.dependencies import (
    get_current_user,
    require_roles,
)
from app.models.user import User


router = APIRouter(
    prefix="/expenses",
    tags=["Expenses"],
)


@router.post(
    "/",
    response_model=ExpenseResponse,
    status_code=201,
)
def create_expense(
    expense_data: ExpenseCreate,
    current_user: User = Depends(
        require_roles(1, 4, 5)
    ),
    db: Session = Depends(get_db),
):
    vehicle = db.query(Vehicle).filter(
        Vehicle.id == expense_data.vehicle_id
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
                "Expenses cannot be added "
                "to a retired vehicle."
            ),
        )

    if expense_data.trip_id is not None:
        trip = db.query(Trip).filter(
            Trip.id == expense_data.trip_id
        ).first()

        if trip is None:
            raise HTTPException(
                status_code=404,
                detail="Trip not found.",
            )

        if trip.vehicle_id != expense_data.vehicle_id:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Trip does not belong "
                    "to the selected vehicle."
                ),
            )

    expense = Expense(
        **expense_data.model_dump()
    )

    db.add(expense)
    db.flush()

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="CREATE",
        entity_type="Expense",
        entity_id=expense.id,
        description=(
            f"Expense of {expense.amount} "
            f"for vehicle "
            f"{vehicle.registration_number} "
            f"created."
        ),
    )

    db.commit()
    db.refresh(expense)

    return expense


@router.get(
    "/",
    response_model=list[ExpenseResponse],
)
def get_expenses(
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    return db.query(Expense).order_by(
        Expense.id
    ).all()


@router.get(
    "/{expense_id}",
    response_model=ExpenseResponse,
)
def get_expense(
    expense_id: int,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    expense = db.query(Expense).filter(
        Expense.id == expense_id
    ).first()

    if expense is None:
        raise HTTPException(
            status_code=404,
            detail="Expense not found.",
        )

    return expense