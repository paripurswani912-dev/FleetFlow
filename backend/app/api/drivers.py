from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.models.driver import Driver
from app.schemas.driver import (
    DriverCreate,
    DriverResponse,
    DriverUpdate,
)
from app.core.audit import create_audit_log
from app.core.dependencies import (
    get_current_user,
    require_roles,
)
from app.models.user import User


router = APIRouter(
    prefix="/drivers",
    tags=["Drivers"],
)


@router.post(
    "/",
    response_model=DriverResponse,
    status_code=201,
)
def create_driver(
    driver_data: DriverCreate,
    current_user: User = Depends(
        require_roles(1, 5)
    ),
    db: Session = Depends(get_db),
):
    driver = Driver(
        **driver_data.model_dump()
    )

    db.add(driver)

    try:
        db.flush()

        create_audit_log(
            db=db,
            user_id=current_user.id,
            action="CREATE",
            entity_type="Driver",
            entity_id=driver.id,
            description=(
                f"Driver {driver.name} created."
            ),
        )

        db.commit()
        db.refresh(driver)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail=(
                "A driver with this "
                "license number may "
                "already exist."
            ),
        )

    return driver


@router.get(
    "/",
    response_model=list[DriverResponse],
)
def get_drivers(
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    return db.query(Driver).order_by(
        Driver.id
    ).all()


@router.get(
    "/{driver_id}",
    response_model=DriverResponse,
)
def get_driver(
    driver_id: int,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    driver = db.query(Driver).filter(
        Driver.id == driver_id
    ).first()

    if driver is None:
        raise HTTPException(
            status_code=404,
            detail="Driver not found",
        )

    return driver


@router.patch(
    "/{driver_id}",
    response_model=DriverResponse,
)
def update_driver(
    driver_id: int,
    driver_data: DriverUpdate,
    current_user: User = Depends(
        require_roles(1, 5)
    ),
    db: Session = Depends(get_db),
):
    driver = db.query(Driver).filter(
        Driver.id == driver_id
    ).first()

    if driver is None:
        raise HTTPException(
            status_code=404,
            detail="Driver not found",
        )

    update_data = driver_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(driver, field, value)

    action = "UPDATE"

    if "status" in update_data:
        if update_data["status"] == "Suspended":
            action = "SUSPEND"

        elif update_data["status"] == "Available":
            action = "ACTIVATE"

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action=action,
        entity_type="Driver",
        entity_id=driver.id,
        description=(
            f"Driver {driver.name} updated."
        ),
    )

    try:
        db.commit()
        db.refresh(driver)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail=(
                "A driver with this "
                "license number may "
                "already exist."
            ),
        )

    return driver