import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_and_get_document(client: AsyncClient):
    # 1. Create Source
    src_res = await client.post("/api/v1/sources", json={
        "name": "PIB Press Bureau",
        "slug": "pib-press-bureau",
        "base_url": "https://pib.gov.in",
        "source_type": "GOVERNMENT",
    })
    assert src_res.status_code == 201
    source_id = src_res.json()["id"]

    # 2. Create Resource
    res_res = await client.post("/api/v1/resources", json={
        "source_id": source_id,
        "title": "Cabinet Briefing on National Green Hydrogen Mission",
        "url": "https://pib.gov.in/PressReleasePage.aspx?PRID=1888798",
        "resource_type": "PRESS_RELEASE",
    })
    assert res_res.status_code == 201
    resource_id = res_res.json()["id"]

    # 3. Create Document
    doc_res = await client.post("/api/v1/documents", json={
        "resource_id": resource_id,
        "raw_text": "The Union Cabinet approved the National Green Hydrogen Mission with an outlay of Rs. 19,744 crore.",
        "clean_text": "The Union Cabinet approved the National Green Hydrogen Mission with an outlay of Rs. 19,744 crore.",
        "mime_type": "text/plain",
        "language": "en",
        "extraction_status": "EXTRACTED",
        "extraction_method": "DIRECT_TEXT",
    })
    assert doc_res.status_code == 201
    doc_data = doc_res.json()
    assert doc_data["resource_id"] == resource_id
    assert doc_data["extraction_status"] == "EXTRACTED"
    doc_id = doc_data["id"]

    # 4. Get Document
    get_res = await client.get(f"/api/v1/documents/{doc_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == doc_id

    # 5. List Documents
    list_res = await client.get(f"/api/v1/documents?resource_id={resource_id}")
    assert list_res.status_code == 200
    assert list_res.json()["pagination"]["total"] == 1


@pytest.mark.asyncio
async def test_chunk_document_endpoint(client: AsyncClient):
    # Setup source and resource
    src_res = await client.post("/api/v1/sources", json={
        "name": "Source Chunks",
        "slug": "source-chunks",
        "base_url": "https://example.com",
    })
    source_id = src_res.json()["id"]
    res_res = await client.post("/api/v1/resources", json={
        "source_id": source_id,
        "title": "Document For Chunking",
        "url": "https://example.com/doc",
    })
    resource_id = res_res.json()["id"]

    # Create document with long text
    long_text = " ".join([f"Word{i} discussing Indian Constitution and Article {i % 395 + 1}." for i in range(1, 150)])
    doc_res = await client.post("/api/v1/documents", json={
        "resource_id": resource_id,
        "clean_text": long_text,
    })
    doc_id = doc_res.json()["id"]

    # Trigger auto-chunking
    chunk_res = await client.post(f"/api/v1/documents/{doc_id}/chunk", json={
        "chunk_size": 30,
        "chunk_overlap": 5,
    })
    assert chunk_res.status_code == 201
    chunks = chunk_res.json()
    assert len(chunks) > 1
    assert chunks[0]["document_id"] == doc_id
    assert chunks[0]["chunk_index"] == 0
