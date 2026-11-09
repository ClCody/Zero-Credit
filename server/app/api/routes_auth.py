from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_or_create_user
from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_mock_user_profile, validate_telegram_init_data
from app.models.entities import User
from app.schemas.common import (
    AuthValidationRequest,
    AuthValidationResponse,
    UserProfileResponse,
)

router = APIRouter(tags=["Authentication & Profile"])


@router.get("/me", response_model=UserProfileResponse)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    """Returns the authenticated student's profile."""
    return current_user


@router.post("/auth/validate", response_model=AuthValidationResponse)
async def validate_auth_payload(
    payload: AuthValidationRequest,
    db: AsyncSession = Depends(get_db)
):
    """Explicitly validates a Telegram initData payload and returns user info."""
    init_data = payload.init_data
    if init_data.startswith("mock_"):
        if not settings.MOCK_AUTH_MODE:
            return AuthValidationResponse(valid=False, detail="Mock mode disabled in production")
        role = "admin" if "admin" in init_data or "starosta" in init_data else "player"
        mock = get_mock_user_profile(role)
        user = await get_or_create_user(
            db,
            telegram_id=mock["telegram_id"],
            full_name=mock["full_name"],
            username=mock["username"],
            default_role=mock["role"],
            default_class=mock["character_class"],
            initial_stats=mock
        )
        return AuthValidationResponse(valid=True, user=UserProfileResponse.model_validate(user))

    validated = validate_telegram_init_data(init_data, settings.BOT_TOKEN)
    if not validated or "user" not in validated:
        return AuthValidationResponse(valid=False, detail="Invalid HMAC-SHA-256 signature")

    tg_user = validated["user"]
    user_id = tg_user.get("id")
    if not user_id:
        return AuthValidationResponse(valid=False, detail="Missing user id in payload")

    full_name = f"{tg_user.get('first_name', '')} {tg_user.get('last_name', '')}".strip() or f"Студент #{user_id}"
    user = await get_or_create_user(
        db,
        telegram_id=user_id,
        full_name=full_name,
        username=tg_user.get("username")
    )
    return AuthValidationResponse(valid=True, user=UserProfileResponse.model_validate(user))


@router.get("/auth/mock-profiles")
async def list_mock_profiles():
    """Lists available mock profiles for testing when MOCK_AUTH_MODE=True."""
    if not settings.MOCK_AUTH_MODE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Mock profiles are only available in development"
        )
    return {
        "admin": get_mock_user_profile("admin"),
        "player": get_mock_user_profile("player"),
    }
