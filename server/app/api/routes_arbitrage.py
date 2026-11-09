import hashlib
import json
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_arbitr
from app.core.config import settings
from app.core.database import get_db
from app.models.entities import AttendanceRecord, AuditLog, User
from app.schemas.arbitrage import (
    ArbitrageSessionRequest,
    ArbitrageSessionResponse,
    StudentListItem,
    StudentRewardSummary,
)

router = APIRouter(prefix="/arbitrage", tags=["Arbitrage (Starosta-Arbitr)"])

DEFAULT_GROUP_STUDENTS = [
    {
        "telegram_id": 99990001,
        "full_name": "Алексей Старостин (Арбитр)",
        "username": "starosta_arbitr",
        "role": "admin",
        "character_class": "croupier",
        "level": 3,
        "hype_xp": 350,
        "luck_chips": 250,
        "jester_keys": 3,
    },
    {
        "telegram_id": 99990002,
        "full_name": "Даниил Шулеров",
        "username": "daniil_shuler",
        "role": "player",
        "character_class": "cardsharp",
        "level": 2,
        "hype_xp": 180,
        "luck_chips": 85,
        "jester_keys": 1,
    },
    {
        "telegram_id": 99990003,
        "full_name": "Роман Криптонов",
        "username": "roman_crypto",
        "role": "player",
        "character_class": "crypto_illusionist",
        "level": 2,
        "hype_xp": 190,
        "luck_chips": 110,
        "jester_keys": 2,
    },
    {
        "telegram_id": 99990004,
        "full_name": "Максим Штурмов",
        "username": "max_redteam",
        "role": "player",
        "character_class": "red_teamer",
        "level": 2,
        "hype_xp": 175,
        "luck_chips": 130,
        "jester_keys": 1,
    },
    {
        "telegram_id": 99990005,
        "full_name": "Екатерина Крупьева",
        "username": "kate_croupier",
        "role": "player",
        "character_class": "croupier",
        "level": 3,
        "hype_xp": 320,
        "luck_chips": 190,
        "jester_keys": 2,
    },
    {
        "telegram_id": 99990006,
        "full_name": "Артем Смирнов",
        "username": "artem_smirnov",
        "role": "player",
        "character_class": "cardsharp",
        "level": 1,
        "hype_xp": 60,
        "luck_chips": 45,
        "jester_keys": 0,
    },
    {
        "telegram_id": 99990007,
        "full_name": "София Ветрова",
        "username": "sofia_vetrova",
        "role": "player",
        "character_class": "crypto_illusionist",
        "level": 2,
        "hype_xp": 150,
        "luck_chips": 95,
        "jester_keys": 1,
    },
    {
        "telegram_id": 99990008,
        "full_name": "Никита Морозов",
        "username": "nikita_morozov",
        "role": "player",
        "character_class": "red_teamer",
        "level": 1,
        "hype_xp": 85,
        "luck_chips": 60,
        "jester_keys": 0,
    },
]


async def seed_roster_if_empty(db: AsyncSession):
    """Ensures students of the group exist in the database (only in MOCK_AUTH_MODE)."""
    if not settings.MOCK_AUTH_MODE:
        return

    added = False
    for s in DEFAULT_GROUP_STUDENTS:
        stmt = select(User).where(User.telegram_id == s["telegram_id"])
        res = await db.execute(stmt)
        if res.scalar_one_or_none() is None:
            user = User(
                telegram_id=s["telegram_id"],
                full_name=s["full_name"],
                username=s["username"],
                role=s["role"],
                character_class=s["character_class"],
                level=s["level"],
                hype_xp=s["hype_xp"],
                luck_chips=s["luck_chips"],
                jester_keys=s["jester_keys"],
            )
            db.add(user)
            added = True
    if added:
        await db.commit()


@router.get("/students", response_model=List[StudentListItem])
async def get_students_roster(
    arbitr: User = Depends(get_current_arbitr),
    db: AsyncSession = Depends(get_db)
):
    """Returns the full academic group roster for attendance marking."""
    await seed_roster_if_empty(db)
    stmt = select(User).order_by(User.full_name)
    result = await db.execute(stmt)
    students = result.scalars().all()
    return students


@router.post("/session", response_model=ArbitrageSessionResponse)
async def record_arbitrage_session(
    payload: ArbitrageSessionRequest,
    arbitr: User = Depends(get_current_arbitr),
    db: AsyncSession = Depends(get_db)
):
    """
    Batch records academic attendance, recitations, and lab submissions in 2 clicks.
    Awards XP, Chips, Keys and commits an immutable SHA-256 Audit Log and Attendance records.
    """
    if not payload.records:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session records cannot be empty"
        )

    # Base reward rules
    base_xp = 25 if payload.session_type == "lecture" else 35
    recitation_chips = 30
    lab_chips = 50
    first_three_chips = 75
    first_three_keys = 1

    total_present = 0
    total_absent = 0
    total_xp_awarded = 0
    total_chips_awarded = 0
    summaries: List[StudentRewardSummary] = []

    # Get last audit log for SHA-256 hash chaining
    stmt_last_audit = select(AuditLog).order_by(AuditLog.id.desc()).limit(1)
    last_audit_res = await db.execute(stmt_last_audit)
    last_audit = last_audit_res.scalar_one_or_none()
    prev_hash = last_audit.hash if last_audit else "0" * 64

    now_utc = datetime.now(timezone.utc)

    # Batch query all involved students to prevent N+1 query problem
    student_ids = [rec.student_id for rec in payload.records]
    stmt_users = select(User).where(User.telegram_id.in_(student_ids))
    users_res = await db.execute(stmt_users)
    students_map = {u.telegram_id: u for u in users_res.scalars().all()}

    # Prepare audit detail records for cryptographic hashing
    student_audit_details = []
    attendance_entities_to_add: List[AttendanceRecord] = []

    for rec in payload.records:
        student = students_map.get(rec.student_id)
        if not student:
            continue

        student_xp = 0
        student_chips = 0
        student_keys = 0

        if rec.present:
            total_present += 1
            student_xp += base_xp

            if rec.recitation:
                student_chips += recitation_chips

            if rec.lab_first_three:
                student_chips += first_three_chips
                student_keys += first_three_keys
            elif rec.lab_submitted:
                student_chips += lab_chips
        else:
            total_absent += 1

        # Apply rewards to student
        student.hype_xp += student_xp
        student.luck_chips += student_chips
        student.jester_keys += student_keys

        # Strict Level up formula: level = 1 + (hype_xp // 150)
        calc_level = 1 + (student.hype_xp // 150)
        if calc_level > student.level:
            student.level = calc_level

        total_xp_awarded += student_xp
        total_chips_awarded += student_chips

        summaries.append(
            StudentRewardSummary(
                student_id=student.telegram_id,
                full_name=student.full_name,
                xp_awarded=student_xp,
                chips_awarded=student_chips,
                keys_awarded=student_keys,
                new_level=student.level,
                new_xp=student.hype_xp,
            )
        )

        student_audit_details.append({
            "student_id": student.telegram_id,
            "present": rec.present,
            "recitation": rec.recitation,
            "lab_submitted": rec.lab_submitted,
            "lab_first_three": rec.lab_first_three,
            "xp_awarded": student_xp,
            "chips_awarded": student_chips,
            "keys_awarded": student_keys,
        })

        # Create real attendance record
        att_record = AttendanceRecord(
            student_id=student.telegram_id,
            subject_name=payload.subject_name,
            session_type=payload.session_type,
            present=rec.present,
            recitation=rec.recitation,
            lab_submitted=rec.lab_submitted,
            lab_first_three=rec.lab_first_three,
            xp_awarded=student_xp,
            chips_awarded=student_chips,
            keys_awarded=student_keys,
            recorded_at=now_utc,
        )
        attendance_entities_to_add.append(att_record)

    # Compute SHA-256 cryptographic hash for tamper-evident audit log
    audit_payload = {
        "subject": payload.subject_name,
        "session_type": payload.session_type,
        "present_count": total_present,
        "absent_count": total_absent,
        "total_xp": total_xp_awarded,
        "total_chips": total_chips_awarded,
        "students": student_audit_details,
    }
    payload_str = json.dumps(audit_payload, sort_keys=True)
    hash_material = (
        f"{prev_hash}:{arbitr.telegram_id}:{payload.subject_name}:"
        f"{payload.session_type}:{now_utc.isoformat()}:{payload_str}"
    )
    current_hash = hashlib.sha256(hash_material.encode("utf-8")).hexdigest()

    audit_entry = AuditLog(
        user_id=arbitr.telegram_id,
        event_type="attendance_session",
        payload=payload_str,
        points_awarded=total_xp_awarded,
        verified_by=arbitr.telegram_id,
        prev_hash=prev_hash,
        hash=current_hash,
        timestamp=now_utc,
    )
    db.add(audit_entry)
    await db.flush()  # assign audit_entry.id

    for att in attendance_entities_to_add:
        att.session_id = audit_entry.id
        db.add(att)

    await db.commit()
    await db.refresh(audit_entry)

    return ArbitrageSessionResponse(
        success=True,
        session_id=audit_entry.id,
        subject_name=payload.subject_name,
        session_type=payload.session_type,
        timestamp=now_utc,
        total_present=total_present,
        total_absent=total_absent,
        total_xp_awarded=total_xp_awarded,
        total_chips_awarded=total_chips_awarded,
        audit_hash=current_hash,
        student_summaries=summaries,
    )
