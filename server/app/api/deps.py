from typing import Optional

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_mock_user_profile, validate_telegram_init_data
from app.models.entities import User


async def get_or_create_user(
    db: AsyncSession,
    telegram_id: int,
    full_name: str,
    username: Optional[str] = None,
    default_role: str = "player",
    default_class: str = "cardsharp",
    initial_stats: Optional[dict] = None
) -> User:
    """Finds a user by telegram_id or creates one with defaults."""
    stmt = select(User).where(User.telegram_id == telegram_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if user:
        # Update username / full_name if updated in Telegram
        updated = False
        if username and user.username != username:
            user.username = username
            updated = True
        if full_name and user.full_name != full_name:
            user.full_name = full_name
            updated = True
        if updated:
            await db.commit()
            await db.refresh(user)
        return user

    # Create new student profile
    stats = initial_stats or {}
    user = User(
        telegram_id=telegram_id,
        username=username,
        full_name=full_name,
        role=default_role,
        character_class=default_class,
        hype_xp=stats.get("hype_xp", 0),
        luck_chips=stats.get("luck_chips", 0),
        jester_keys=stats.get("jester_keys", 0),
        level=stats.get("level", 1),
        is_bankrupt=False
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    FastAPI dependency: authenticates user via Telegram WebApp initData (HMAC-SHA-256)
    or via dev mock token when MOCK_AUTH_MODE is enabled.
    """
    if not authorization:
        if settings.MOCK_AUTH_MODE:
            mock = get_mock_user_profile("player")
            return await get_or_create_user(
                db,
                telegram_id=mock["telegram_id"],
                full_name=mock["full_name"],
                username=mock["username"],
                default_role=mock["role"],
                default_class=mock["character_class"],
                initial_stats=mock
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing"
        )

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format (expected 'Bearer <initData>')"
        )

    # 1. Dev Mock Mode handling
    if token.startswith("mock_"):
        if not settings.MOCK_AUTH_MODE:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Mock authorization is disabled in production"
            )
        role = "admin" if ("admin" in token or "starosta" in token) else "player"
        mock = get_mock_user_profile(role)
        return await get_or_create_user(
            db,
            telegram_id=mock["telegram_id"],
            full_name=mock["full_name"],
            username=mock["username"],
            default_role=mock["role"],
            default_class=mock["character_class"],
            initial_stats=mock
        )

    # 2. Cryptographic Telegram initData validation
    validated_data = validate_telegram_init_data(token, settings.BOT_TOKEN)
    if not validated_data or "user" not in validated_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Telegram authentication signature"
        )

    tg_user = validated_data["user"]
    telegram_id = tg_user.get("id")
    if not telegram_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Telegram user payload missing 'id'"
        )

    first_name = tg_user.get("first_name", "")
    last_name = tg_user.get("last_name", "")
    full_name = f"{first_name} {last_name}".strip() or f"Студент #{telegram_id}"
    username = tg_user.get("username")

    return await get_or_create_user(
        db,
        telegram_id=telegram_id,
        full_name=full_name,
        username=username,
        default_role="player",
        default_class="cardsharp"
    )


async def get_current_arbitr(
    current_user: User = Depends(get_current_user)
) -> User:
    """Ensures current user possesses Starosta-Arbitr or Moderator privileges."""
    if current_user.role not in ("admin", "moderator"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Action restricted to Starosta-Arbitr"
        )
    return current_user
