import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_job_lifecycle(client: AsyncClient):
    # 1. Create Job
    job_res = await client.post("/api/v1/jobs", json={
        "job_type": "EXTRACTION",
        "meta_info": {"target_url": "https://pib.gov.in"},
    })
    assert job_res.status_code == 201
    job_data = job_res.json()
    assert job_data["status"] == "PENDING"
    assert job_data["progress_percentage"] == 0
    job_id = job_data["id"]

    # 2. Get Job Status
    get_res = await client.get(f"/api/v1/jobs/{job_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == job_id

    # 3. Update Job Progress
    update_res = await client.patch(f"/api/v1/jobs/{job_id}", json={
        "status": "RUNNING",
        "progress_percentage": 50,
        "items_processed": 5,
        "total_items": 10,
    })
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["status"] == "RUNNING"
    assert updated_data["progress_percentage"] == 50
    assert updated_data["items_processed"] == 5

    # 4. List Jobs
    list_res = await client.get("/api/v1/jobs?status=RUNNING")
    assert list_res.status_code == 200
    assert list_res.json()["pagination"]["total"] == 1
