from datetime import datetime, timezone

from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    telegram_id = Column(BigInteger, primary_key=True)
    username = Column(String(64), nullable=True)
    full_name = Column(String(128), nullable=False)
    role = Column(String(16), default="player")  # admin, moderator, player
    character_class = Column(String(32), default="cardsharp")
    hype_xp = Column(Integer, default=0)
    luck_chips = Column(Integer, default=0)
    jester_keys = Column(Integer, default=0)
    level = Column(Integer, default=1)
    is_bankrupt = Column(Boolean, default=False)
    bankrupt_until = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    inventories = relationship("InventoryItem", back_populates="user", cascade="all, delete-orphan")
    attendance_records = relationship("AttendanceRecord", back_populates="student", cascade="all, delete-orphan")


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(Integer, ForeignKey("audit_logs.id"), nullable=True)
    student_id = Column(BigInteger, ForeignKey("users.telegram_id"), nullable=False)
    subject_name = Column(String(128), nullable=False)
    session_type = Column(String(32), nullable=False)  # lecture, practice, lab
    present = Column(Boolean, default=True)
    recitation = Column(Boolean, default=False)
    lab_submitted = Column(Boolean, default=False)
    lab_first_three = Column(Boolean, default=False)
    xp_awarded = Column(Integer, default=0)
    chips_awarded = Column(Integer, default=0)
    keys_awarded = Column(Integer, default=0)
    recorded_at = Column(DateTime, default=utc_now)

    student = relationship("User", back_populates="attendance_records")


class Boss(Base):
    __tablename__ = "bosses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(128), nullable=False)
    subject_name = Column(String(128), nullable=False)
    exam_type = Column(String(16), nullable=False)  # credit or exam
    total_hp = Column(Integer, default=100)
    current_hp = Column(Integer, default=100)
    insta_kill_threshold = Column(Integer, default=65)
    is_defeated = Column(Boolean, default=False)


class Syndicate(Base):
    __tablename__ = "syndicates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(64), unique=True, nullable=False)
    motto = Column(String(255), nullable=True)
    leader_id = Column(BigInteger, ForeignKey("users.telegram_id"))
    sync_rate = Column(Numeric(3, 2), default=1.00)
    shared_chips = Column(Integer, default=0)
    created_at = Column(DateTime, default=utc_now)


class InventoryItem(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.telegram_id"), nullable=False)
    item_id = Column(String(64), nullable=False)
    stack_count = Column(Integer, default=1)
    is_locked = Column(Boolean, default=False)

    user = relationship("User", back_populates="inventories")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.telegram_id"), nullable=False)
    boss_id = Column(Integer, ForeignKey("bosses.id"), nullable=True)
    event_type = Column(String(32), nullable=False)
    payload = Column(Text, nullable=True)
    points_awarded = Column(Integer, default=0)
    verified_by = Column(BigInteger, ForeignKey("users.telegram_id"), nullable=True)
    prev_hash = Column(String(64), nullable=False)
    hash = Column(String(64), nullable=False)
    timestamp = Column(DateTime, default=utc_now)
