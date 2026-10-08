from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_user, require_roles
from app.models.user import User


router = APIRouter(
    prefix="/auth-test",
    tags=["Authentication Test"],
)


@router.get("/me")
def get_my_profile(
    current_user: User = Depends(get_current_user),
):
    return {
        "message": "Authentication successful.",
        "user_id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role_id": current_user.role_id,
    }


@router.get("/admin-only")
def admin_only(
    current_user: User = Depends(require_roles(5)),
):
    return {
        "message": "Administrator access granted.",
        "user_id": current_user.id,
        "role_id": current_user.role_id,
    }