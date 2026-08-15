import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_question_crud_and_filters(client: AsyncClient):
    # 1. Create Question
    q_res = await client.post("/api/v1/questions", json={
        "exam": "UPSC_CSE",
        "year": 2023,
        "paper": "GS1",
        "subject": "POLITY",
        "topic": "Constitutional Framework",
        "question_type": "MCQ",
        "question_text": "Consider the following statements regarding the Attorney General of India:\n1. Appointed by the President.\n2. Has the right of audience in all courts in India.",
        "options": [
            {"id": "A", "text": "1 only"},
            {"id": "B", "text": "2 only"},
            {"id": "C", "text": "Both 1 and 2"},
            {"id": "D", "text": "Neither 1 nor 2"},
        ],
        "correct_answer": "C",
        "explanation": "According to Article 76, the Attorney General is appointed by the President and has audience rights across all Indian courts.",
        "difficulty": "MEDIUM",
        "marks": 2.0,
        "negative_marks": 0.66,
        "tags": ["Polity", "Constitutional Bodies", "Article 76"],
        "is_pyq": True,
        "is_verified": True,
    })
    assert q_res.status_code == 201
    q_data = q_res.json()
    assert q_data["exam"] == "UPSC_CSE"
    assert q_data["year"] == 2023
    assert q_data["correct_answer"] == "C"
    q_id = q_data["id"]

    # 2. Get Question
    get_res = await client.get(f"/api/v1/questions/{q_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == q_id

    # 3. Filter Questions by subject and year
    filter_res = await client.get("/api/v1/questions?subject=POLITY&year=2023")
    assert filter_res.status_code == 200
    assert filter_res.json()["pagination"]["total"] == 1

    # 4. Search Filter
    search_res = await client.get("/api/v1/questions?search=Attorney")
    assert search_res.status_code == 200
    assert search_res.json()["pagination"]["total"] == 1


@pytest.mark.asyncio
async def test_bulk_create_questions(client: AsyncClient):
    bulk_res = await client.post("/api/v1/questions/bulk", json={
        "questions": [
            {
                "exam": "UPSC_CSE",
                "year": 2022,
                "paper": "GS1",
                "subject": "ECONOMY",
                "question_text": "With reference to the Indian economy, what is inflation targeting?",
                "correct_answer": "Flexible inflation targeting framework by RBI MPC",
                "explanation": "Target of 4% (+/- 2%) under the RBI Act.",
            },
            {
                "exam": "UPSC_CSE",
                "year": 2022,
                "paper": "GS1",
                "subject": "ENVIRONMENT",
                "question_text": "Which one of the following is a Ramsar wetland site in India?",
                "correct_answer": "Chilika Lake",
                "explanation": "Chilika was India's first Ramsar site designated in 1981.",
            }
        ]
    })
    assert bulk_res.status_code == 201
    created_list = bulk_res.json()
    assert len(created_list) == 2
    assert created_list[0]["subject"] == "ECONOMY"
    assert created_list[1]["subject"] == "ENVIRONMENT"
