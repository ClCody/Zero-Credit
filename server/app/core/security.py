import hashlib
import hmac
import json
import time
import urllib.parse
from typing import Any, Dict, Optional


def validate_telegram_init_data(init_data: str, bot_token: str) -> Optional[Dict[str, Any]]:
    """
    Validates Telegram WebApp initData string using HMAC-SHA-256 according to Telegram specs.
    Returns parsed data dictionary (with 'user' parsed as dict) or None if signature is invalid.
    """
    try:
        parsed_data = dict(urllib.parse.parse_qsl(init_data, keep_blank_values=True))
        if "hash" not in parsed_data:
            return None

        received_hash = parsed_data.pop("hash")

        # Sort keys alphabetically and format as key=value\n
        data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(parsed_data.items()))

        # secret_key = HMAC_SHA256("WebAppData", bot_token)
        secret_key = hmac.new(b"WebAppData", bot_token.encode("utf-8"), hashlib.sha256).digest()

        # expected_hash = HMAC_SHA256(secret_key, data_check_string)
        calculated_hash = hmac.new(secret_key, data_check_string.encode("utf-8"), hashlib.sha256).hexdigest()

        if hmac.compare_digest(calculated_hash, received_hash):
            if "user" in parsed_data:
                parsed_data["user"] = json.loads(parsed_data["user"])
            return parsed_data
        return None
    except Exception:
        return None


def generate_telegram_init_data(
    user_data: Dict[str, Any],
    bot_token: str,
    auth_date: Optional[int] = None,
    query_id: str = "AAFakeQueryId"
) -> str:
    """
    Generates a cryptographically valid initData string for testing or mocking TWA clients.
    """
    if auth_date is None:
        auth_date = int(time.time())

    params = {
        "query_id": query_id,
        "user": json.dumps(user_data, separators=(",", ":")),
        "auth_date": str(auth_date),
    }

    data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(params.items()))
    secret_key = hmac.new(b"WebAppData", bot_token.encode("utf-8"), hashlib.sha256).digest()
    sig = hmac.new(secret_key, data_check_string.encode("utf-8"), hashlib.sha256).hexdigest()

    params["hash"] = sig
    return urllib.parse.urlencode(params)


def get_mock_user_profile(role: str = "player") -> Dict[str, Any]:
    """Returns a mock user profile for local browser development when MOCK_AUTH_MODE is enabled."""
    profiles = {
        "admin": {
            "telegram_id": 99990001,
            "username": "starosta_arbitr",
            "full_name": "Алексей Старостин (Арбитр)",
            "role": "admin",
            "character_class": "croupier",
            "hype_xp": 350,
            "luck_chips": 250,
            "jester_keys": 3,
            "level": 3,  # 1 + (350 // 150) = 3
            "is_bankrupt": False,
        },
        "player": {
            "telegram_id": 99990002,
            "username": "student_shuler",
            "full_name": "Даниил Шулеров (ДИБББ-11)",
            "role": "player",
            "character_class": "cardsharp",
            "hype_xp": 180,
            "luck_chips": 85,
            "jester_keys": 1,
            "level": 2,  # 1 + (180 // 150) = 2
            "is_bankrupt": False,
        },
    }
    return profiles.get(role, profiles["player"])
