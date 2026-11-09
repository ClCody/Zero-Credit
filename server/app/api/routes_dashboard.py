from typing import Dict, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.entities import AttendanceRecord, User
from app.schemas.common import UserProfileResponse
from app.schemas.dashboard import (
    AcademicStats,
    ChangeClassRequest,
    ClassInfo,
    DashboardResponse,
    RelicSlot,
)

router = APIRouter(prefix="/me", tags=["Student Dashboard"])

CLASSES_REGISTRY: Dict[str, ClassInfo] = {
    "cardsharp": ClassInfo(
        code="cardsharp",
        name_ru="Шулер-Аналитик",
        emblem="♠",
        perk_title="Взгляд Шулера",
        perk_description="Увеличенный шанс крита по КТ, возможность выбора лута из 3 карт в магазине (Artifact of Command).",
        ultimate_name="Сброс колоды"
    ),
    "crypto_illusionist": ClassInfo(
        code="crypto_illusionist",
        name_ru="Крипто-Иллюзионист",
        emblem="🔮",
        perk_title="Доказательство с Нулевым Разглашением",
        perk_description="Заморозка стриков при уважительном пропуске, защита жетонов от сгорания.",
        ultimate_name="ZK-Proof Щит"
    ),
    "red_teamer": ClassInfo(
        code="red_teamer",
        name_ru="Редтимер-Штурмовик",
        emblem="⚔️",
        perk_title="Эксплойт Нулевого Дня",
        perk_description="+25% взрывного урона по боссу при первой сдаче лабораторной работы с колес.",
        ultimate_name="Взлом Деканата"
    ),
    "croupier": ClassInfo(
        code="croupier",
        name_ru="Крупье-Дипломат",
        emblem="🎭",
        perk_title="Скрытый Процент (House Edge)",
        perk_description="Скидка 15% на открытие сундуков в Балагане, бонусный реролл дейликов для синдиката.",
        ultimate_name="Ва-Банк Стола"
    ),
}


@router.get("/dashboard", response_model=DashboardResponse)
async def get_student_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns full student dashboard data:
    - User profile
    - Class info & perks
    - Academic statistics (attendance, recitations, labs)
    - 6 Relic slots with unlock statuses based on current level
    """
    class_code = current_user.character_class or "cardsharp"
    class_info = CLASSES_REGISTRY.get(class_code, CLASSES_REGISTRY["cardsharp"])

    # Calculate 6 Relic Slots based on level
    # Level 1 -> 1 slot, Level 2 -> 2 slots ... Level 6+ -> 6 slots
    relic_slots: List[RelicSlot] = []
    unlocked_count = min(current_user.level, 6)

    for i in range(1, 7):
        is_unlocked = i <= current_user.level
        relic_slots.append(
            RelicSlot(
                slot_index=i,
                is_unlocked=is_unlocked,
                required_level=i,
                equipped_item_id=None,
                equipped_item_name=None
            )
        )

    # Calculate attendance and activity stats from real AttendanceRecord entities
    stmt_records = (
        select(AttendanceRecord)
        .where(AttendanceRecord.student_id == current_user.telegram_id)
        .order_by(AttendanceRecord.recorded_at.desc())
    )
    records_res = await db.execute(stmt_records)
    student_records = records_res.scalars().all()

    total_sessions = len(student_records)
    attended_records = [r for r in student_records if r.present]
    attendance_count = len(attended_records)

    attendance_rate = (
        round((attendance_count / total_sessions) * 100, 1)
        if total_sessions > 0
        else 100.0
    )

    recitations_count = sum(1 for r in attended_records if r.recitation)
    labs_count = sum(1 for r in attended_records if (r.lab_submitted or r.lab_first_three))

    # Real streak: consecutive attended sessions starting from the most recent
    streak_days = 0
    for r in student_records:
        if r.present:
            streak_days += 1
        else:
            break

    stats = AcademicStats(
        attendance_count=attendance_count,
        attendance_rate=attendance_rate,
        recitations_count=recitations_count,
        labs_count=labs_count,
        streak_days=streak_days,
    )

    return DashboardResponse(
        user=UserProfileResponse.model_validate(current_user),
        class_info=class_info,
        stats=stats,
        relic_slots=relic_slots,
        total_slots=6,
        unlocked_slots_count=unlocked_count
    )


@router.post("/class", response_model=DashboardResponse)
async def change_student_class(
    payload: ChangeClassRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Allows student to select or switch their IB specialization class."""
    if payload.character_class not in CLASSES_REGISTRY:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown character class '{payload.character_class}'. Valid: {list(CLASSES_REGISTRY.keys())}"
        )

    current_user.character_class = payload.character_class
    await db.commit()
    await db.refresh(current_user)

    return await get_student_dashboard(current_user, db)


@router.get("/classes", response_model=List[ClassInfo])
async def list_available_classes():
    """Returns the compendium of the 4 IB specialization classes."""
    return list(CLASSES_REGISTRY.values())
