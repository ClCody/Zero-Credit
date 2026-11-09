import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_get_dashboard_student():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get(
            "/api/me/dashboard",
            headers={"Authorization": "Bearer mock_player"}
        )
        assert res.status_code == 200
        data = res.json()
        assert "user" in data
        assert "class_info" in data
        assert "relic_slots" in data
        assert len(data["relic_slots"]) == 6

        # Level 2 student should have 2 slots unlocked
        unlocked = [s for s in data["relic_slots"] if s["is_unlocked"]]
        assert len(unlocked) >= 2

        # Check class info details
        assert data["class_info"]["code"] in ("cardsharp", "crypto_illusionist", "red_teamer", "croupier")
        assert len(data["class_info"]["emblem"]) > 0


@pytest.mark.asyncio
async def test_change_student_class():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Change class to red_teamer
        change_res = await ac.post(
            "/api/me/class",
            json={"character_class": "red_teamer"},
            headers={"Authorization": "Bearer mock_player"}
        )
        assert change_res.status_code == 200
        data = change_res.json()
        assert data["class_info"]["code"] == "red_teamer"
        assert data["class_info"]["name_ru"] == "Редтимер-Штурмовик"
        assert data["user"]["character_class"] == "red_teamer"

        # Invalid class should fail with 400
        invalid_res = await ac.post(
            "/api/me/class",
            json={"character_class": "wizard_unknown"},
            headers={"Authorization": "Bearer mock_player"}
        )
        assert invalid_res.status_code == 400


@pytest.mark.asyncio
async def test_list_classes():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/me/classes")
        assert res.status_code == 200
        classes = res.json()
        assert len(classes) == 4
        codes = [c["code"] for c in classes]
        assert "cardsharp" in codes
        assert "crypto_illusionist" in codes
        assert "red_teamer" in codes
        assert "croupier" in codes


@pytest.mark.asyncio
async def test_dashboard_relic_slots_exact_scaling():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get(
            "/api/me/dashboard",
            headers={"Authorization": "Bearer mock_player"}
        )
        assert res.status_code == 200
        data = res.json()
        user_level = data["user"]["level"]
        slots = data["relic_slots"]
        assert len(slots) == 6
        expected_unlocked = min(user_level, 6)
        assert data["unlocked_slots_count"] == expected_unlocked

        for slot in slots:
            if slot["slot_index"] <= user_level:
                assert slot["is_unlocked"] is True
            else:
                assert slot["is_unlocked"] is False


@pytest.mark.asyncio
async def test_dashboard_real_academic_stats():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Record attendance session for player (99990002)
        payload = {
            "subject_name": "Тестирование ИБ",
            "session_type": "practice",
            "records": [
                {
                    "student_id": 99990002,
                    "present": True,
                    "recitation": True,
                    "lab_submitted": True,
                    "lab_first_three": False,
                }
            ],
        }
        await ac.post(
            "/api/arbitrage/session",
            json=payload,
            headers={"Authorization": "Bearer mock_admin"},
        )

        dash_res = await ac.get(
            "/api/me/dashboard",
            headers={"Authorization": "Bearer mock_player"}
        )
        assert dash_res.status_code == 200
        stats = dash_res.json()["stats"]
        assert stats["attendance_count"] >= 1
        assert stats["attendance_rate"] > 0
        assert stats["recitations_count"] >= 1
        assert stats["labs_count"] >= 1
        assert stats["streak_days"] >= 1
