import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_root_health(client: AsyncClient):
    """Verifies that GET /health returns 200 OK with expected status payload."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "timestamp" in data
    assert data["service"] == "IKSHOVIA Data API"


@pytest.mark.asyncio
async def test_api_v1_health(client: AsyncClient):
    """Verifies that GET /api/v1/health checks DB connectivity and returns 200 OK."""
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "database" in data
    assert data["database"]["status"] == "connected"
