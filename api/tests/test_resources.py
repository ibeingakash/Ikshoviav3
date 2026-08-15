import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_resource_success(client: AsyncClient):
    """Verifies ingesting a resource linked to a valid source returns 201 Created."""
    # 1. Create source
    src_res = await client.post("/api/v1/sources", json={
        "name": "National Gazette",
        "slug": "nat-gazette",
        "base_url": "https://egazette.gov.in",
        "source_type": "GAZETTE",
    })
    assert src_res.status_code == 201
    source_id = src_res.json()["id"]

    # 2. Ingest resource
    payload = {
        "source_id": source_id,
        "title": "Extraordinary Gazette Notification on Data Protection Act",
        "url": "https://egazette.gov.in/notifications/2026/DPDP_Rules.pdf",
        "resource_type": "GAZETTE",
        "description": "Rules framed under Digital Personal Data Protection Act",
        "status": "DISCOVERED",
        "raw_content": "Official notification text content for testing hash generation.",
    }
    res = await client.post("/api/v1/resources", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["id"].startswith("res_")
    assert data["source_id"] == source_id
    assert data["title"] == payload["title"]
    assert data["url"] == payload["url"]
    assert data["content_hash"] is not None
    assert data["status"] == "DISCOVERED"


@pytest.mark.asyncio
async def test_duplicate_resource_url_rejection(client: AsyncClient):
    """Verifies ingesting a duplicate resource URL returns 409 Conflict."""
    src_res = await client.post("/api/v1/sources", json={
        "name": "RBI Bulletins",
        "slug": "rbi-bulletins",
        "base_url": "https://rbi.org.in",
        "source_type": "REGULATORY",
    })
    source_id = src_res.json()["id"]

    payload = {
        "source_id": source_id,
        "title": "Monetary Policy Report February 2026",
        "url": "https://rbi.org.in/bulletin/2026/mpr_feb.pdf",
        "resource_type": "REPORT",
    }
    # First ingest
    res1 = await client.post("/api/v1/resources", json=payload)
    assert res1.status_code == 201

    # Duplicate ingest
    res2 = await client.post("/api/v1/resources", json=payload)
    assert res2.status_code == 409
    data = res2.json()
    assert data["success"] is False
    assert data["error"]["code"] == "DUPLICATE_ENTITY"


@pytest.mark.asyncio
async def test_create_resource_invalid_source_id(client: AsyncClient):
    """Verifies referencing a non-existent source_id returns 404 Entity Not Found."""
    payload = {
        "source_id": "src_fake999",
        "title": "Orphan Resource",
        "url": "https://example.gov.in/doc1.pdf",
        "resource_type": "PDF",
    }
    res = await client.post("/api/v1/resources", json=payload)
    assert res.status_code == 404
    data = res.json()
    assert data["success"] is False
    assert data["error"]["code"] == "ENTITY_NOT_FOUND"


@pytest.mark.asyncio
async def test_get_resource_by_id(client: AsyncClient):
    """Verifies retrieving a single resource by ID returns 200 OK."""
    src_res = await client.post("/api/v1/sources", json={
        "name": "NITI Aayog",
        "slug": "niti-aayog",
        "base_url": "https://niti.gov.in",
        "source_type": "GOVERNMENT",
    })
    source_id = src_res.json()["id"]

    res_post = await client.post("/api/v1/resources", json={
        "source_id": source_id,
        "title": "Fiscal Federalism Assessment 2026",
        "url": "https://niti.gov.in/reports/fiscal_fed_2026.pdf",
        "resource_type": "REPORT",
    })
    assert res_post.status_code == 201
    resource_id = res_post.json()["id"]

    get_res = await client.get(f"/api/v1/resources/{resource_id}")
    assert get_res.status_code == 200
    data = get_res.json()
    assert data["id"] == resource_id
    assert data["title"] == "Fiscal Federalism Assessment 2026"


@pytest.mark.asyncio
async def test_get_missing_resource(client: AsyncClient):
    """Verifies requesting non-existent resource ID returns 404."""
    res = await client.get("/api/v1/resources/res_nonexistent999")
    assert res.status_code == 404
    data = res.json()
    assert data["success"] is False
    assert data["error"]["code"] == "ENTITY_NOT_FOUND"


@pytest.mark.asyncio
async def test_resource_filtering_and_pagination(client: AsyncClient):
    """Verifies filtering by source_id, resource_type, status, and pagination metadata."""
    # Create two sources
    src1 = (await client.post("/api/v1/sources", json={
        "name": "Source Alpha",
        "slug": "source-alpha",
        "base_url": "https://alpha.gov.in",
        "source_type": "GOVERNMENT",
    })).json()["id"]

    src2 = (await client.post("/api/v1/sources", json={
        "name": "Source Beta",
        "slug": "source-beta",
        "base_url": "https://beta.gov.in",
        "source_type": "ACADEMIC",
    })).json()["id"]

    # Ingest 5 resources
    for i in range(1, 4):
        await client.post("/api/v1/resources", json={
            "source_id": src1,
            "title": f"Alpha Article {i}",
            "url": f"https://alpha.gov.in/art_{i}",
            "resource_type": "ARTICLE",
            "status": "PROCESSED" if i == 1 else "DISCOVERED",
        })

    for i in range(1, 3):
        await client.post("/api/v1/resources", json={
            "source_id": src2,
            "title": f"Beta PDF {i}",
            "url": f"https://beta.gov.in/pdf_{i}",
            "resource_type": "PDF",
            "status": "DISCOVERED",
        })

    # Test 1: Filter by source_id
    res_src1 = await client.get(f"/api/v1/resources?source_id={src1}")
    assert res_src1.status_code == 200
    data_src1 = res_src1.json()
    assert data_src1["pagination"]["total"] == 3
    assert len(data_src1["data"]) == 3

    # Test 2: Filter by resource_type
    res_pdf = await client.get("/api/v1/resources?resource_type=PDF")
    assert res_pdf.status_code == 200
    data_pdf = res_pdf.json()
    assert data_pdf["pagination"]["total"] == 2
    assert all(item["resource_type"] == "PDF" for item in data_pdf["data"])

    # Test 3: Filter by status
    res_status = await client.get("/api/v1/resources?status=PROCESSED")
    assert res_status.status_code == 200
    data_status = res_status.json()
    assert data_status["pagination"]["total"] == 1
    assert data_status["data"][0]["status"] == "PROCESSED"

    # Test 4: Pagination (page_size=2)
    res_page1 = await client.get("/api/v1/resources?page=1&page_size=2")
    assert res_page1.status_code == 200
    page1_data = res_page1.json()
    assert len(page1_data["data"]) == 2
    assert page1_data["pagination"]["page"] == 1
    assert page1_data["pagination"]["page_size"] == 2
    assert page1_data["pagination"]["total"] == 5
    assert page1_data["pagination"]["total_pages"] == 3
    assert page1_data["pagination"]["has_next"] is True
    assert page1_data["pagination"]["has_previous"] is False
