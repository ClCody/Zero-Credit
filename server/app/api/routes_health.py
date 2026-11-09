from fastapi import APIRouter

from app.core.config import settings
from app.schemas.common import HealthCheckResponse

router = APIRouter(tags=["Health"])

@router.get("/health", response_model=HealthCheckResponse)
async def health_check():
    return HealthCheckResponse(
        status="ok",
        app="Zero Credit API",
        version="0.1.0",
        environment=settings.ENVIRONMENT,
        mock_auth=settings.MOCK_AUTH_MODE
    )
