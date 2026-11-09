from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class StudentSessionRecord(BaseModel):
    student_id: int
    present: bool = True
    recitation: bool = False
    lab_submitted: bool = False
    lab_first_three: bool = False
    custom_note: Optional[str] = None


class ArbitrageSessionRequest(BaseModel):
    subject_name: str
    session_type: str = "lecture"  # lecture, practice, lab
    records: List[StudentSessionRecord]


class StudentRewardSummary(BaseModel):
    student_id: int
    full_name: str
    xp_awarded: int
    chips_awarded: int
    keys_awarded: int
    new_level: int
    new_xp: int


class ArbitrageSessionResponse(BaseModel):
    success: bool
    session_id: int
    subject_name: str
    session_type: str
    timestamp: datetime
    total_present: int
    total_absent: int
    total_xp_awarded: int
    total_chips_awarded: int
    audit_hash: str
    student_summaries: List[StudentRewardSummary]

    model_config = ConfigDict(from_attributes=True)


class StudentListItem(BaseModel):
    telegram_id: int
    full_name: str
    username: Optional[str] = None
    character_class: str
    level: int
    hype_xp: int
    luck_chips: int
    jester_keys: int

    model_config = ConfigDict(from_attributes=True)
