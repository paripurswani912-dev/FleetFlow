from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.expense import Expense
from app.models.vehicle import Vehicle
from app.models.trip import Trip
from app.schemas.expense import ExpenseCreate, ExpenseResponse

router = APIRouter(prefix="/expenses", tags=["Expenses"])


@router.post("/", response_model=ExpenseResponse, status_code=201)
def create_expense(expense_data: ExpenseCreate, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(
        Vehicle.id == expense_data.vehicle_id
    ).first()

    if vehicle is None:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found."
        )

    if expense_data.trip_id is not None:
        trip = db.query(Trip).filter(
            Trip.id == expense_data.trip_id
        ).first()

        if trip is None:
            raise HTTPException(
                status_code=404,
                detail="Trip not found."
            )

    expense = Expense(**expense_data.model_dump())

    db.add(expense)

    try:
        db.commit()
        db.refresh(expense)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Expense creation failed."
        )

    return expense

@router.get("/", response_model=list[ExpenseResponse])
def get_expenses(db: Session = Depends(get_db)):
    return db.query(Expense).order_by(Expense.id).all()

@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_expense(expense_id: int, db: Session = Depends(get_db)):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()

    if expense is None:
        raise HTTPException(
            status_code=404,
            detail="Expense not found."
        )

    return expense