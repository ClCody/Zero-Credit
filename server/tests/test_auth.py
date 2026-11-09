import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import settings
from app.core.security import generate_telegram_init_data, validate_telegram_init_data
from app.main import app


@pytest.mark.asyncio
async def test_telegram_hmac_crypto_validation():
    bot_token = "123456789:TestBotTokenSecretKey"
    user_payload = {
        "id": 100200300,
        "first_name": "Иван",
        "last_name": "Хакер",
        "username": "ivan_cyber"
    }

    # Generate valid signed initData
    valid_init_data = generate_telegram_init_data(user_payload, bot_token)
    assert "hash=" in valid_init_data

    # Valid check
    parsed = validate_telegram_init_data(valid_init_data, bot_token)
    assert parsed is not None
    assert parsed["user"]["id"] == 100200300
    assert parsed["user"]["username"] == "ivan_cyber"

    # Tampered payload check
    tampered_data = valid_init_data.replace("ivan_cyber", "malicious_user")
    assert validate_telegram_init_data(tampered_data, bot_token) is None

    # Invalid bot token check
    assert validate_telegram_init_data(valid_init_data, "987654321:WrongToken") is None


@pytest.mark.asyncio
async def test_get_me_mock_auth():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Mock Player
        res_player = await ac.get(
            "/api/me",
            headers={"Authorization": "Bearer mock_player"}
        )
        assert res_player.status_code == 200
        data_player = res_player.json()
        assert data_player["role"] == "player"
        assert data_player["telegram_id"] == 99990002
        assert "Даниил" in data_player["full_name"]

        # Mock Admin / Starosta
        res_admin = await ac.get(
            "/api/me",
            headers={"Authorization": "Bearer mock_admin"}
        )
        assert res_admin.status_code == 200
        data_admin = res_admin.json()
        assert data_admin["role"] == "admin"
        assert data_admin["telegram_id"] == 99990001
        assert "Старостин" in data_admin["full_name"]


@pytest.mark.asyncio
async def test_get_me_valid_telegram_init_data():
    real_user = {
        "id": 77712345,
        "first_name": "Михаил",
        "last_name": "Криптограф",
        "username": "crypto_mike"
    }
    init_data = generate_telegram_init_data(real_user, settings.BOT_TOKEN)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get(
            "/api/me",
            headers={"Authorization": f"Bearer {init_data}"}
        )
        assert response.status_code == 200
        user_info = response.json()
        assert user_info["telegram_id"] == 77712345
        assert user_info["full_name"] == "Михаил Криптограф"
        assert user_info["username"] == "crypto_mike"
        assert user_info["role"] == "player"


@pytest.mark.asyncio
async def test_get_me_invalid_signature_fails():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get(
            "/api/me",
            headers={"Authorization": "Bearer query_id=fake&hash=invalid_hex_hash_value"}
        )
        assert response.status_code == 401
        assert "Invalid Telegram authentication signature" in response.json()["detail"]


@pytest.mark.asyncio
async def test_validate_endpoint():
    user = {"id": 888111, "first_name": "Алиса", "username": "alice_sec"}
    valid_data = generate_telegram_init_data(user, settings.BOT_TOKEN)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Valid test
        res_valid = await ac.post("/api/auth/validate", json={"init_data": valid_data})
        assert res_valid.status_code == 200
        assert res_valid.json()["valid"] is True
        assert res_valid.json()["user"]["telegram_id"] == 888111

        # Invalid test
        res_invalid = await ac.post("/api/auth/validate", json={"init_data": "corrupted_data"})
        assert res_invalid.status_code == 200
        assert res_invalid.json()["valid"] is False
