import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_manual_chunk_lifecycle(client: AsyncClient):
    # Setup
    src_res = await client.post("/api/v1/sources", json={
        "name": "Chunk Src",
        "slug": "chunk-src",
        "base_url": "https://chunk.com",
    })
    source_id = src_res.json()["id"]
    res_res = await client.post("/api/v1/resources", json={
        "source_id": source_id,
        "title": "Chunk Resource",
        "url": "https://chunk.com/res",
    })
    resource_id = res_res.json()["id"]
    doc_res = await client.post("/api/v1/documents", json={
        "resource_id": resource_id,
        "clean_text": "Sample text for chunk test",
    })
    doc_id = doc_res.json()["id"]

    # 1. Create Chunk
    chk_res = await client.post("/api/v1/chunks", json={
        "document_id": doc_id,
        "chunk_index": 0,
        "content": "Preamble secures Justice, Liberty, Equality, and Fraternity for all citizens.",
        "heading": "Preamble to the Constitution of India",
        "section": "Part I",
    })
    assert chk_res.status_code == 201
    chunk_data = chk_res.json()
    assert chunk_data["document_id"] == doc_id
    assert chunk_data["heading"] == "Preamble to the Constitution of India"
    chunk_id = chunk_data["id"]

    # 2. Get Chunk
    get_res = await client.get(f"/api/v1/chunks/{chunk_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == chunk_id

    # 3. List Chunks with search filter
    search_res = await client.get(f"/api/v1/chunks?search=Preamble")
    assert search_res.status_code == 200
    assert search_res.json()["pagination"]["total"] == 1
