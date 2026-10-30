"""
VYUHAM – Autonomous AI-Based Workflow Orchestration Platform
FastAPI Application Entry Point
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db
from app.api import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan – initialize DB on startup."""
    init_db()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    description="Autonomous AI-Based Workflow Orchestration Platform",
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

# CORS – Allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all API routes
app.include_router(api_router)


@app.get("/")
def root():
    return {
        "application": "VYUHAM",
        "description": "Autonomous AI-Based Workflow Orchestration Platform",
        "version": settings.APP_VERSION,
        "status": "running",
        "execution_mode": settings.EXECUTION_MODE,
        "ai_enabled": bool(settings.ANTHROPIC_API_KEY),
    }


@app.get("/health")
def health_check():
    from app.core.database import engine
    from sqlalchemy import text
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "healthy",
        "application": "VYUHAM",
        "database": db_status,
        "execution_mode": settings.EXECUTION_MODE,
        "ai_enabled": bool(settings.ANTHROPIC_API_KEY),
    }
