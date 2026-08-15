from datetime import datetime, timezone
from fastapi import APIRouter, Depends, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import settings
from app.database import get_db

router = APIRouter(tags=["Health & Status"])


@router.get(
    "/health",
    summary="Root Service Health",
    description="Basic service liveness check verifying the HTTP API server is accepting connections.",
    status_code=status.HTTP_200_OK,
)
async def root_health():
    """Returns basic liveness information."""
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.APP_ENV,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get(
    f"{settings.API_V1_PREFIX}/health",
    summary="API v1 Deep Health Check",
    description="Deep health check verifying both API server operation and PostgreSQL database connectivity.",
    status_code=status.HTTP_200_OK,
)
async def api_v1_health(db: AsyncSession = Depends(get_db)):
    """Verifies database connectivity and returns operational metrics."""
    db_status = "connected"
    db_latency_ms = None
    
    try:
        import time
        start = time.perf_counter()
        result = await db.execute(text("SELECT 1"))
        db_latency_ms = round((time.perf_counter() - start) * 1000, 2)
        if result.scalar() != 1:
            db_status = "degraded"
    except Exception as exc:
        db_status = f"unhealthy: {str(exc)}"

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "api_prefix": settings.API_V1_PREFIX,
        "database": {
            "status": db_status,
            "latency_ms": db_latency_ms,
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
