from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.role import Role
from app.schemas.role import RoleResponse
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User

router = APIRouter(
    prefix="/roles",
    tags=["Roles"],
)

# 5 Fixed Predefined System Roles
PREDEFINED_ROLES = [
    (1, "Fleet Manager", "Fleet operations, vehicles, drivers, trips, maintenance, and operational reports."),
    (2, "Driver", "Driver-specific assigned trip operations and status updates."),
    (3, "Safety Officer", "Maintenance management, vehicle inspection, driver licensing, and safety compliance."),
    (4, "Financial Analyst", "Fuel logs, expenses, financial analytics, trip profitability, and financial statements."),
    (5, "System Administrator", "Full administrative control, user provisioning, role assignments, and security audit logs."),
]


def seed_predefined_roles(db: Session):
    for role_id, name, desc in PREDEFINED_ROLES:
        existing = db.query(Role).filter(Role.id == role_id).first()
        if not existing:
            new_role = Role(id=role_id, name=name, description=desc)
            db.add(new_role)
    try:
        db.commit()
    except Exception:
        db.rollback()


@router.post(
    "/",
    status_code=403,
)
def create_role():
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Creating custom roles is disabled. FleetFlow relies on predefined system roles.",
    )


@router.get(
    "/",
    response_model=list[RoleResponse],
)
def get_roles(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    seed_predefined_roles(db)
    return db.query(Role).order_by(Role.id).all()


@router.get(
    "/{role_id}",
    response_model=RoleResponse,
)
def get_role(
    role_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    seed_predefined_roles(db)
    role = db.query(Role).filter(Role.id == role_id).first()

    if role is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found.",
        )

    return role