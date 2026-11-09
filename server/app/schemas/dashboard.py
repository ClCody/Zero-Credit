from typing import List, Optional

from pydantic import BaseModel

from app.schemas.common import UserProfileResponse


class ClassInfo(BaseModel):
    code: str
    name_ru: str
    emblem: str
    perk_title: str
    perk_description: str
    ultimate_name: str


class RelicSlot(BaseModel):
    slot_index: int
    is_unlocked: bool = True
    required_level: int
    equipped_item_id: Optional[str] = None
    equipped_item_name: Optional[str] = None


class AcademicStats(BaseModel):
    attendance_count: int
    attendance_rate: float
    recitations_count: int
    labs_count: int
    streak_days: int


class DashboardResponse(BaseModel):
    user: UserProfileResponse
    class_info: ClassInfo
    stats: AcademicStats
    relic_slots: List[RelicSlot]
    total_slots: int = 6
    unlocked_slots_count: int


class ChangeClassRequest(BaseModel):
    character_class: str
