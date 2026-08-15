import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_tag_lifecycle(client: AsyncClient):
    # 1. Create Tag
    tag_res = await client.post("/api/v1/tags", json={
        "name": "Fundamental Rights",
        "slug": "fundamental-rights",
        "category": "SYLLABUS_SECTION",
        "description": "Part III of the Constitution (Articles 12-35)",
    })
    assert tag_res.status_code == 201
    tag_data = tag_res.json()
    assert tag_data["slug"] == "fundamental-rights"
    assert tag_data["category"] == "SYLLABUS_SECTION"

    # 2. Duplicate slug returns 409 Conflict
    dup_res = await client.post("/api/v1/tags", json={
        "name": "Fundamental Rights 2",
        "slug": "fundamental-rights",
    })
    assert dup_res.status_code == 409

    # 3. List Tags
    list_res = await client.get("/api/v1/tags?category=SYLLABUS_SECTION")
    assert list_res.status_code == 200
    tags = list_res.json()
    assert len(tags) >= 1
    assert tags[0]["slug"] == "fundamental-rights"

    # 4. Get Tag by ID
    tag_id = tag_data["id"]
    get_res = await client.get(f"/api/v1/tags/{tag_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == tag_id

    # 5. Missing Tag returns 404
    missing_res = await client.get("/api/v1/tags/00000000-0000-0000-0000-000000000000")
    assert missing_res.status_code == 404
