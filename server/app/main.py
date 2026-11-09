from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import routes_arbitrage, routes_auth, routes_dashboard, routes_health
from app.core.config import settings
from app.core.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database tables
    try:
        await init_db()
    except Exception as e:
        print(f"[Database] Init warning/error: {e}")
    yield
    # Shutdown logic if needed

app = FastAPI(
    title="Zero Credit API",
    description="Grotesque Session RPG Telegram Mini App backend for IB students (DIBBB-11)",
    version="0.1.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(routes_health.router, prefix="/api")
app.include_router(routes_auth.router, prefix="/api")
app.include_router(routes_dashboard.router, prefix="/api")
app.include_router(routes_arbitrage.router, prefix="/api")

@app.get("/")
async def root():
    return {
        "message": "Welcome to Zero Credit Underground Cyber-Carnival API",
        "docs_url": "/docs",
        "status": "online"
    }
