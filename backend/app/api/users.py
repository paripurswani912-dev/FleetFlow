from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.models.user import User
from app.models.role import Role
from app.schemas.user import UserCreate, UserResponse
from app.core.security import hash_password

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("/", response_model=UserResponse, status_code=201)
def create_user(user_data: UserCreate, db: Session = Depends(get_db)):
    role = db.query(Role).filter(Role.id == user_data.role_id).first()

    if role is None:
        raise HTTPException(
            status_code=404,
            detail="Role not found."
        )

    existing_user = db.query(User).filter(
        User.username == user_data.username
    ).first()

    if existing_user is not None:
        raise HTTPException(
            status_code=409,
            detail="Username already exists."
        )

    user = User(
    username=user_data.username,
    password=hash_password(user_data.password),
    role_id=user_data.role_id,
)
    db.add(user)

    try:
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Username already exists."
        )

    return user