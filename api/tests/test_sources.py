import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_source_success(client: AsyncClient):
    """Verifies registering a valid new source returns 201 Created."""
    payload = {
        "name": "Press Information Bureau",
        "slug": "pib-india",
        "base_url": "https://pib.gov.in",
        "source_type": "GOVERNMENT",
        "is_active": True,
    }
    response = await client.post("/api/v1/sources", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["id"].startswith("src_")
    assert data["name"] == "Press Information Bureau"
    assert data["slug"] == "pib-india"
    assert data["base_url"] == "https://pib.gov.in"
    assert data["is_active"] is True
    assert "created_at" in data


@pytest.mark.asyncio
async def test_duplicate_source_rejection(client: AsyncClient):
    """Verifies registering a source with a duplicate slug returns 409 Conflict."""
    payload = {
        "name": "Union Public Service Commission",
        "slug": "upsc-gov",
        "base_url": "https://upsc.gov.in",
        "source_type": "GOVERNMENT",
    }
    # First creation
    res1 = await client.post("/api/v1/sources", json=payload)
    assert res1.status_code == 201

    # Duplicate creation
    res2 = await client.post("/api/v1/sources", json=payload)
    assert res2.status_code == 409
    data = res2.json()
    assert data["success"] is False
    assert data["error"]["code"] == "DUPLICATE_ENTITY"


@pytest.mark.asyncio
async def test_get_source_by_id(client: AsyncClient):
    """Verifies fetching a source by its ID returns 200 OK."""
    create_res = await client.post("/api/v1/sources", json={
        "name": "The Hindu Archives",
        "slug": "the-hindu-archives",
        "base_url": "https://thehindu.com",
        "source_type": "NEWS",
    })
    assert create_res.status_code == 201
    source_id = create_res.json()["id"]

    get_res = await client.get(f"/api/v1/sources/{source_id}")
    assert get_res.status_code == 200
    data = get_res.json()
    assert data["id"] == source_id
    assert data["slug"] == "the-hindu-archives"


@pytest.mark.asyncio
async def test_get_nonexistent_source(client: AsyncClient):
    """Verifies fetching a non-existent source returns 404 Not Found."""
    response = await client.get("/api/v1/sources/src_nonexistent123")
    assert response.status_code == 404
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "ENTITY_NOT_FOUND"


@pytest.mark.asyncio
async def test_source_validation_errors(client: AsyncClient):
    """Verifies invalid source payloads return 422 Unprocessable Entity."""
    # Missing required fields
    response = await client.post("/api/v1/sources", json={"name": "Incomplete"})
    assert response.status_code == 422
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "VALIDATION_ERROR"

    # Invalid URL format
    invalid_url_res = await client.post("/api/v1/sources", json={
        "name": "Invalid URL Source",
        "slug": "invalid-url",
        "base_url": "not-a-valid-url",
        "source_type": "GOVERNMENT",
    })
    assert invalid_url_res.status_code == 422
