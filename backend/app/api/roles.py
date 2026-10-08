from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.role import Role
from app.schemas.role import RoleCreate, RoleResponse

router = APIRouter(prefix="/roles", tags=["Roles"])


@router.post("/", response_model=RoleResponse, status_code=201)
def create_role(role_data: RoleCreate, db: Session = Depends(get_db)):
    existing_role = db.query(Role).filter(
        Role.name == role_data.name
    ).first()

    if existing_role is not None:
        raise HTTPException(
            status_code=409,
            detail="Role already exists."
        )

    role = Role(**role_data.model_dump())

    db.add(role)
    db.commit()
    db.refresh(role)

    return role


@router.get("/", response_model=list[RoleResponse])
def get_roles(db: Session = Depends(get_db)):
    return db.query(Role).order_by(Role.id).all()