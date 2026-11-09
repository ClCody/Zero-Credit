from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class UserBase(BaseModel):
    telegram_id: int
    username: Optional[str] = None
    full_name: str
    role: str = "player"
    character_class: str = "cardsharp"
    hype_xp: int = 0
    luck_chips: int = 0
    jester_keys: int = 0
    level: int = 1
    is_bankrupt: bool = False
    bankrupt_until: Optional[datetime] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class UserProfileResponse(UserBase):
    pass


class AuthValidationRequest(BaseModel):
    init_data: str


class AuthValidationResponse(BaseModel):
    valid: bool
    user: Optional[UserProfileResponse] = None
    detail: Optional[str] = None


class HealthCheckResponse(BaseModel):
    status: str
    app: str
    version: str
    environment: str
    mock_auth: bool
