from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.role import Role
from app.schemas.user import UserCreate, UserResponse
from app.core.security import hash_password
from app.core.audit import create_audit_log
from app.core.dependencies import require_roles


router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


@router.post(
    "/",
    response_model=UserResponse,
    status_code=201,
)
def create_user(
    user_data: UserCreate,
    current_user: User = Depends(
        require_roles(5)
    ),
    db: Session = Depends(get_db),
):
    existing_user = db.query(User).filter(
        User.email == user_data.email
    ).first()

    if existing_user is not None:
        raise HTTPException(
            status_code=409,
            detail="A user with this email already exists.",
        )

    role = db.query(Role).filter(
        Role.id == user_data.role_id
    ).first()

    if role is None:
        raise HTTPException(
            status_code=404,
            detail="Role not found.",
        )

    user = User(
        full_name=user_data.full_name,
        email=user_data.email,
        password_hash=hash_password(
            user_data.password
        ),
        role_id=user_data.role_id,
        is_active=True,
    )

    db.add(user)

    try:
        db.flush()

        create_audit_log(
            db=db,
            user_id=current_user.id,
            action="CREATE",
            entity_type="User",
            entity_id=user.id,
            description=(
                f"User {user.email} created "
                f"with role {role.name}."
            ),
        )

        db.commit()
        db.refresh(user)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail="A user with this email already exists.",
        )

    return user


@router.get(
    "/",
    response_model=list[UserResponse],
)
def get_users(
    current_user: User = Depends(
        require_roles(5)
    ),
    db: Session = Depends(get_db),
):
    return db.query(User).order_by(
        User.id
    ).all()


@router.get(
    "/{user_id}",
    response_model=UserResponse,
)
def get_user(
    user_id: int,
    current_user: User = Depends(
        require_roles(5)
    ),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found.",
        )

    return user


@router.patch(
    "/{user_id}/deactivate",
    response_model=UserResponse,
)
def deactivate_user(
    user_id: int,
    current_user: User = Depends(
        require_roles(5)
    ),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found.",
        )

    if user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot deactivate your own account.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=409,
            detail="User is already inactive.",
        )

    user.is_active = False

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="DEACTIVATE",
        entity_type="User",
        entity_id=user.id,
        description=(
            f"User {user.email} deactivated."
        ),
    )

    db.commit()
    db.refresh(user)

    return user


@router.patch(
    "/{user_id}/activate",
    response_model=UserResponse,
)
def activate_user(
    user_id: int,
    current_user: User = Depends(
        require_roles(5)
    ),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found.",
        )

    if user.is_active:
        raise HTTPException(
            status_code=409,
            detail="User is already active.",
        )

    user.is_active = True

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="ACTIVATE",
        entity_type="User",
        entity_id=user.id,
        description=(
            f"User {user.email} activated."
        ),
    )

    db.commit()
    db.refresh(user)

    return user