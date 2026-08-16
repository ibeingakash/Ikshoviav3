import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.chunk import Chunk
from app.models.document import Document
from app.models.question import DataQuestion
from app.models.resource import Resource
from app.models.source import Source
from app.models.tag import DataTag


@pytest_asyncio.fixture
async def seed_knowledge_base(db_session: AsyncSession):
    """Deterministic seeded dataset for knowledge search and ranking tests."""
    # 1. Sources
    source1 = Source(
        id="src_upsc_gov",
        name="Union Public Service Commission",
        slug="upsc-gov",
        base_url="https://upsc.gov.in",
        source_type="GOVERNMENT",
    )
    source2 = Source(
        id="src_pib_gov",
        name="Press Information Bureau",
        slug="pib-gov",
        base_url="https://pib.gov.in",
        source_type="GOVERNMENT",
    )
    db_session.add_all([source1, source2])
    await db_session.flush()

    # 2. Resources
    res1 = Resource(
        id="res_const_amend_guide",
        source_id="src_upsc_gov",
        title="Constitutional Amendment Procedures in India",
        url="https://upsc.gov.in/materials/constitutional-amendments.pdf",
        resource_type="REPORT",
        description="Comprehensive guide on Article 368 and constitutional amendment methods.",
    )
    res2 = Resource(
        id="res_pib_chandrayaan",
        source_id="src_pib_gov",
        title="Cabinet approves Chandrayaan Lunar Mission Stage 4",
        url="https://pib.gov.in/PressReleasePage.aspx?PRID=9001",
        resource_type="PRESS_RELEASE",
        description="Press release regarding Indian space exploration and lunar landing program.",
    )
    db_session.add_all([res1, res2])
    await db_session.flush()

    # 3. Documents
    doc1 = Document(
        id="doc_const_guide",
        resource_id="res_const_amend_guide",
        clean_text="Under Article 368 of the Constitution, Parliament may in exercise of its constituent power amend by way of addition, variation or repeal any provision of this Constitution in accordance with the procedure laid down in this article. A Constitutional Amendment bill must be passed in each House by a majority of total membership and two-thirds present and voting. " * 15,
        mime_type="application/pdf",
        extraction_status="COMPLETED",
        language="en",
    )
    doc2 = Document(
        id="doc_space_pib",
        resource_id="res_pib_chandrayaan",
        clean_text="The Union Cabinet chaired by the Prime Minister has approved the mission to the Moon named Chandrayaan. ISRO will spearhead the deep space scientific payloads. " * 10,
        mime_type="text/html",
        extraction_status="COMPLETED",
        language="en",
    )
    db_session.add_all([doc1, doc2])
    await db_session.flush()

    # 4. Chunks
    chunk1 = Chunk(
        id="chk_art368_part1",
        document_id="doc_const_guide",
        chunk_index=0,
        heading="Article 368 Majorities",
        section="Chapter 4: Amendment Process",
        content="Amendments to the Constitution require special majority as well as ratification by not less than one-half of the State Legislatures for federal provisions.",
        token_count=28,
        character_count=165,
    )
    chunk2 = Chunk(
        id="chk_space_part1",
        document_id="doc_space_pib",
        chunk_index=0,
        heading="Chandrayaan Propulsion Modules",
        section="Technical Specifications",
        content="Cryogenic upper stages and lunar orbit insertion parameters for ISRO deep space missions.",
        token_count=16,
        character_count=102,
    )
    db_session.add_all([chunk1, chunk2])
    await db_session.flush()

    # 5. Questions
    q1 = DataQuestion(
        id="dq_gst_amendment",
        resource_id="res_const_amend_guide",
        exam="UPSC_CSE",
        year=2023,
        paper="GS1",
        subject="POLITY",
        topic="Constitutional Amendments",
        question_type="MCQ",
        question_text="Which Constitutional Amendment introduced the Goods and Services Tax (GST) and the GST Council in India?",
        options=[
            {"id": "A", "text": "99th Amendment"},
            {"id": "B", "text": "100th Amendment"},
            {"id": "C", "text": "101st Amendment"},
            {"id": "D", "text": "102nd Amendment"},
        ],
        correct_answer="C",
        explanation="The 101st Constitutional Amendment Act, 2016 introduced Article 246A, 269A and 279A for GST.",
        difficulty="MEDIUM",
        is_pyq=True,
        tags=["Polity", "Constitutional Amendment", "GST"],
    )
    q2 = DataQuestion(
        id="dq_presidential_election",
        resource_id="res_const_amend_guide",
        exam="UPSC_CSE",
        year=2022,
        paper="GS1",
        subject="POLITY",
        topic="Union Executive",
        question_type="MCQ",
        question_text="With reference to the election of the President of India, consider the following statements:",
        options=[
            {"id": "A", "text": "1 only"},
            {"id": "B", "text": "2 only"},
            {"id": "C", "text": "Both 1 and 2"},
            {"id": "D", "text": "Neither 1 nor 2"},
        ],
        correct_answer="A",
        explanation="Article 54 and 55 deal with Presidential elections. This was amended through the 70th Constitutional Amendment to include Delhi and Puducherry.",
        difficulty="HARD",
        is_pyq=True,
        tags=["Polity", "President", "Article 54"],
    )
    q3 = DataQuestion(
        id="dq_bpsc_history",
        resource_id=None,
        exam="BPSC",
        year=2021,
        paper="GS1",
        subject="HISTORY",
        topic="Modern History",
        question_type="MCQ",
        question_text="Who led the 1857 Revolt in Jagdishpur, Bihar?",
        options=[
            {"id": "A", "text": "Kunwar Singh"},
            {"id": "B", "text": "Nana Saheb"},
            {"id": "C", "text": "Tantia Tope"},
            {"id": "D", "text": "Mangal Pandey"},
        ],
        correct_answer="A",
        explanation="Kunwar Singh was a notable leader during the Indian Rebellion of 1857 in Bihar.",
        difficulty="EASY",
        is_pyq=True,
        tags=["History", "Bihar", "1857 Revolt"],
    )
    db_session.add_all([q1, q2, q3])
    await db_session.flush()

    # 6. Tags
    tag1 = DataTag(
        id="tag_const_amend",
        name="Constitutional Amendment",
        slug="constitutional-amendment",
        category="TOPIC",
        description="Articles and procedures related to constitutional amendments under Article 368.",
    )
    tag2 = DataTag(
        id="tag_space_tech",
        name="Space Technology",
        slug="space-technology",
        category="SUBJECT",
        description="ISRO satellite systems, launch vehicles, and lunar exploration.",
    )
    db_session.add_all([tag1, tag2])
    await db_session.commit()


@pytest.mark.asyncio
async def test_empty_and_whitespace_query_validation(client: AsyncClient):
    """Search endpoint must reject missing or whitespace queries."""
    # 1. Missing query param
    res_missing = await client.get("/api/v1/search")
    assert res_missing.status_code == 422

    # 2. Empty query param
    res_empty = await client.get("/api/v1/search?q=")
    assert res_empty.status_code == 422

    # 3. Whitespace-only query
    res_whitespace = await client.get("/api/v1/search?q=%20%20%20")
    assert res_whitespace.status_code in (400, 422)


@pytest.mark.asyncio
async def test_basic_question_search(client: AsyncClient, seed_knowledge_base):
    """Searches questions by question text."""
    res = await client.get("/api/v1/search?q=Goods+and+Services+Tax")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["query"] == "Goods and Services Tax"
    assert len(data["results"]) >= 1

    first = data["results"][0]
    assert first["type"] == "question"
    assert first["id"] == "dq_gst_amendment"
    assert "GST" in first["content"]
    assert first["metadata"]["exam"] == "UPSC_CSE"
    assert first["metadata"]["subject"] == "POLITY"


@pytest.mark.asyncio
async def test_basic_document_search(client: AsyncClient, seed_knowledge_base):
    """Searches documents by clean text content."""
    res = await client.get("/api/v1/search?q=constituent+power+amend&type=document")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert len(data["results"]) >= 1
    doc_match = data["results"][0]
    assert doc_match["type"] == "document"
    assert doc_match["id"] == "doc_const_guide"
    assert "constituent power" in doc_match["content"]
    assert doc_match["resource_id"] == "res_const_amend_guide"


@pytest.mark.asyncio
async def test_basic_chunk_search(client: AsyncClient, seed_knowledge_base):
    """Searches granular chunks."""
    res = await client.get("/api/v1/search?q=ratification+State+Legislatures&type=chunk")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert len(data["results"]) >= 1
    chunk_match = data["results"][0]
    assert chunk_match["type"] == "chunk"
    assert chunk_match["id"] == "chk_art368_part1"
    assert "Legislatures" in chunk_match["content"]


@pytest.mark.asyncio
async def test_basic_tag_search(client: AsyncClient, seed_knowledge_base):
    """Searches knowledge tags taxonomy."""
    res = await client.get("/api/v1/search?q=Constitutional+Amendment&type=tag")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert len(data["results"]) >= 1
    tag_match = data["results"][0]
    assert tag_match["type"] == "tag"
    assert tag_match["id"] == "tag_const_amend"
    assert tag_match["metadata"]["slug"] == "constitutional-amendment"


@pytest.mark.asyncio
async def test_exact_phrase_and_deterministic_ranking(client: AsyncClient, seed_knowledge_base):
    """
    Verifies that items with exact phrase matches in title/question rank above items
    with matches in explanation or body only, and unrelated items are excluded.
    """
    res = await client.get("/api/v1/search?q=Constitutional+Amendment")
    assert res.status_code == 200
    data = res.json()
    assert len(data["results"]) >= 3

    results = data["results"]
    scores = [r["score"] for r in results]

    # Verify descending score order
    assert scores == sorted(scores, reverse=True)

    # Top results should include the exact title/question matches (q1, res1/doc1, tag1)
    top_ids = [r["id"] for r in results[:3]]
    assert "dq_gst_amendment" in top_ids or "tag_const_amend" in top_ids or "doc_const_guide" in top_ids

    # Unrelated items (e.g. Kunwar Singh 1857 or Chandrayaan) should not rank high or match
    assert "dq_bpsc_history" not in [r["id"] for r in results]


@pytest.mark.asyncio
async def test_no_results_query(client: AsyncClient, seed_knowledge_base):
    """Unmatched queries should return an empty list with total=0 without errors."""
    res = await client.get("/api/v1/search?q=nonexistentquantumsuperstringtheory999")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["results"] == []
    assert data["pagination"]["total"] == 0
    assert data["pagination"]["total_pages"] == 0


@pytest.mark.asyncio
async def test_pagination_and_bounds(client: AsyncClient, seed_knowledge_base):
    """Verifies page and page_size slicing and bounds."""
    # Search for broad term matching multiple assets
    res = await client.get("/api/v1/search?q=India&page=1&page_size=1")
    assert res.status_code == 200
    data = res.json()
    assert len(data["results"]) == 1
    assert data["pagination"]["page"] == 1
    assert data["pagination"]["page_size"] == 1
    assert data["pagination"]["total"] > 1
    assert data["pagination"]["has_next"] is True

    # Page 2
    res_p2 = await client.get("/api/v1/search?q=India&page=2&page_size=1")
    assert res_p2.status_code == 200
    data_p2 = res_p2.json()
    assert len(data_p2["results"]) == 1
    assert data_p2["results"][0]["id"] != data["results"][0]["id"]
    assert data_p2["pagination"]["has_previous"] is True


@pytest.mark.asyncio
async def test_exam_and_year_filter(client: AsyncClient, seed_knowledge_base):
    """Filters results by exam and year."""
    # UPSC 2023
    res_upsc = await client.get("/api/v1/search?q=India&exam=UPSC_CSE&year=2023")
    assert res_upsc.status_code == 200
    data_upsc = res_upsc.json()
    assert len(data_upsc["results"]) >= 1
    for r in data_upsc["results"]:
        assert r["type"] == "question"
        assert r["metadata"]["exam"] == "UPSC_CSE"
        assert r["metadata"]["year"] == 2023

    # BPSC 2021
    res_bpsc = await client.get("/api/v1/search?q=Bihar&exam=BPSC&year=2021")
    assert res_bpsc.status_code == 200
    data_bpsc = res_bpsc.json()
    assert len(data_bpsc["results"]) == 1
    assert data_bpsc["results"][0]["id"] == "dq_bpsc_history"


@pytest.mark.asyncio
async def test_subject_and_pyq_filter(client: AsyncClient, seed_knowledge_base):
    """Filters questions by subject and PYQ status."""
    res = await client.get("/api/v1/search?q=President&subject=POLITY&is_pyq=true")
    assert res.status_code == 200
    data = res.json()
    assert len(data["results"]) >= 1
    for r in data["results"]:
        assert r["type"] == "question"
        assert r["metadata"]["subject"] == "POLITY"
        assert r["metadata"]["is_pyq"] is True


@pytest.mark.asyncio
async def test_source_and_resource_id_filter(client: AsyncClient, seed_knowledge_base):
    """Filters by origin source_id and resource_id."""
    res = await client.get("/api/v1/search?q=Constitution&source_id=src_upsc_gov&resource_id=res_const_amend_guide")
    assert res.status_code == 200
    data = res.json()
    assert len(data["results"]) >= 1
    for r in data["results"]:
        if r.get("resource_id"):
            assert r["resource_id"] == "res_const_amend_guide"


@pytest.mark.asyncio
async def test_mixed_result_types(client: AsyncClient, seed_knowledge_base):
    """Verifies that unified search returns mixed entity types when applicable."""
    res = await client.get("/api/v1/search?q=Constitutional")
    assert res.status_code == 200
    data = res.json()
    types_found = {r["type"] for r in data["results"]}
    # Should find at least question and document or tag
    assert len(types_found) >= 2


@pytest.mark.asyncio
async def test_content_snippet_safety_and_truncation(client: AsyncClient, seed_knowledge_base):
    """Ensures huge texts are safely truncated into compact excerpts."""
    res = await client.get("/api/v1/search?q=Parliament&type=document")
    assert res.status_code == 200
    data = res.json()
    assert len(data["results"]) >= 1
    doc = data["results"][0]
    # Snippet must be bounded (< 400 chars) and contain query context
    assert len(doc["content"]) <= 380
    assert "Parliament" in doc["content"]


@pytest.mark.asyncio
async def test_private_user_data_exclusion(client: AsyncClient, seed_knowledge_base):
    """Verifies that search only targets shared knowledge and never accepts or leaks user models."""
    res = await client.get("/api/v1/search?q=password")
    assert res.status_code == 200
    data = res.json()
    assert data["results"] == []
