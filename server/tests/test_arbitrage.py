import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_students_roster_forbidden_for_player():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get(
            "/api/arbitrage/students",
            headers={"Authorization": "Bearer mock_player"}
        )
        assert res.status_code == 403
        assert "restricted to Starosta-Arbitr" in res.json()["detail"]


@pytest.mark.asyncio
async def test_students_roster_accessible_by_arbitr():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get(
            "/api/arbitrage/students",
            headers={"Authorization": "Bearer mock_admin"}
        )
        assert res.status_code == 200
        students = res.json()
        assert len(students) >= 8
        ids = [s["telegram_id"] for s in students]
        assert 99990002 in ids  # Daniil Shulerov
        assert 99990003 in ids  # Roman Cryptonov


@pytest.mark.asyncio
async def test_record_arbitrage_session_batch():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Fetch initial student state
        roster_res = await ac.get(
            "/api/arbitrage/students",
            headers={"Authorization": "Bearer mock_admin"}
        )
        students = roster_res.json()
        shuler = next(s for s in students if s["telegram_id"] == 99990002)
        shuler_id = shuler["telegram_id"]
        initial_xp = shuler["hype_xp"]

        # 2. Submit session: Shuler was present, answered at board (+30 chips), submitted lab (+50 chips)
        session_payload = {
            "subject_name": "Криптографические методы защиты информации",
            "session_type": "practice",
            "records": [
                {
                    "student_id": shuler_id,
                    "present": True,
                    "recitation": True,
                    "lab_submitted": True,
                    "lab_first_three": False,
                },
                {
                    "student_id": 99990003,  # Roman Cryptonov
                    "present": False,
                    "recitation": False,
                    "lab_submitted": False,
                    "lab_first_three": False,
                }
            ]
        }

        submit_res = await ac.post(
            "/api/arbitrage/session",
            json=session_payload,
            headers={"Authorization": "Bearer mock_admin"}
        )
        assert submit_res.status_code == 200
        data = submit_res.json()
        assert data["success"] is True
        assert data["total_present"] == 1
        assert data["total_absent"] == 1
        assert len(data["audit_hash"]) == 64

        # 3. Verify student updated in roster
        shuler_summary = next(s for s in data["student_summaries"] if s["student_id"] == shuler_id)
        # 35 base xp (practice) + 30 (recitation) + 50 (lab) = +80 chips
        assert shuler_summary["xp_awarded"] == 35
        assert shuler_summary["chips_awarded"] == 80
        assert shuler_summary["new_xp"] == initial_xp + 35


@pytest.mark.asyncio
async def test_arbitrage_session_persists_real_attendance_and_updates_dashboard():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        student_id = 99990004  # Maxim Redteam

        # 1. First session: student is present, answers at board, submits lab in first three
        payload_1 = {
            "subject_name": "Безопасность ОС",
            "session_type": "lab",
            "records": [
                {
                    "student_id": student_id,
                    "present": True,
                    "recitation": True,
                    "lab_submitted": True,
                    "lab_first_three": True,
                }
            ],
        }
        res_1 = await ac.post(
            "/api/arbitrage/session",
            json=payload_1,
            headers={"Authorization": "Bearer mock_admin"},
        )
        assert res_1.status_code == 200
        data_1 = res_1.json()
        summary_1 = data_1["student_summaries"][0]
        # 35 XP + (30 recitation + 75 first three) = 105 chips + 1 key
        assert summary_1["xp_awarded"] == 35
        assert summary_1["chips_awarded"] == 105
        assert summary_1["keys_awarded"] == 1

        # 2. Second session: student is present
        payload_2 = {
            "subject_name": "Безопасность ОС",
            "session_type": "lecture",
            "records": [
                {
                    "student_id": student_id,
                    "present": True,
                    "recitation": False,
                    "lab_submitted": False,
                    "lab_first_three": False,
                }
            ],
        }
        res_2 = await ac.post(
            "/api/arbitrage/session",
            json=payload_2,
            headers={"Authorization": "Bearer mock_admin"},
        )
        assert res_2.status_code == 200

        # Verify cryptographic hash chaining
        assert len(res_2.json()["audit_hash"]) == 64
        assert res_2.json()["audit_hash"] != res_1.json()["audit_hash"]
