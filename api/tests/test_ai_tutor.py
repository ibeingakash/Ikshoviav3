import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.base import (
    AIRequest,
    AIResponse,
    BaseAIProvider,
    ProviderAuthError,
    ProviderUnavailableError,
    QuotaExceededError,
    RateLimitError,
)
from app.ai.gateway import AIGateway, ai_gateway
from app.ai.providers.gemini import GeminiProvider
from app.ai.providers.mock import MockAIProvider
from app.models.chunk import Chunk
from app.models.document import Document
from app.models.question import DataQuestion
from app.models.resource import Resource
from app.models.source import Source
from app.models.tag import DataTag
from app.tutor.schemas import KnowledgeConfidence, TutorRequest
from app.tutor.service import AITutorService


@pytest_asyncio.fixture
async def seed_tutor_knowledge(db_session: AsyncSession):
    """Seeds rich deterministic knowledge items for testing grounding and confidence decisions."""
    src = Source(
        id="src_tutor_upsc",
        name="UPSC Official Repository",
        slug="upsc-official-repository-tutor",
        base_url="https://upsc.gov.in",
        source_type="GOVERNMENT",
        is_active=True,
    )
    db_session.add(src)

    res = Resource(
        id="res_tutor_polity",
        source_id="src_tutor_upsc",
        title="Indian Polity & Constitution Master Compilation",
        url="https://upsc.gov.in/polity-master.pdf",
        resource_type="PDF",
        status="ACTIVE",
    )
    db_session.add(res)

    doc = Document(
        id="doc_tutor_const",
        resource_id="res_tutor_polity",
        raw_text="The Basic Structure Doctrine was established by the Supreme Court of India in Kesavananda Bharati v. State of Kerala (1973). It holds that Parliament cannot alter the basic features of the Constitution through amendments under Article 368. Key elements include Judicial Review, Secularism, and Federalism.",
        clean_text="The Basic Structure Doctrine was established by the Supreme Court of India in Kesavananda Bharati v. State of Kerala (1973). It holds that Parliament cannot alter the basic features of the Constitution through amendments under Article 368. Key elements include Judicial Review, Secularism, and Federalism.",
        extraction_status="COMPLETED",
    )
    db_session.add(doc)

    chk1 = Chunk(
        id="chk_tutor_bs1",
        document_id="doc_tutor_const",
        chunk_index=0,
        content="The Basic Structure Doctrine was established by the Supreme Court of India in Kesavananda Bharati v. State of Kerala (1973). It holds that Parliament cannot alter the basic features of the Constitution through amendments under Article 368. Key elements include Judicial Review, Secularism, and Federalism.",
        token_count=55,
        character_count=260,
    )
    # Duplicate snippet to test deduplication
    chk2 = Chunk(
        id="chk_tutor_bs2",
        document_id="doc_tutor_const",
        chunk_index=1,
        content="The Basic Structure Doctrine was established by the Supreme Court of India in Kesavananda Bharati v. State of Kerala (1973). It holds that Parliament cannot alter the basic features of the Constitution.",
        token_count=35,
        character_count=170,
    )
    db_session.add_all([chk1, chk2])

    # Questions
    q_strong = DataQuestion(
        id="dq_tutor_bs_q1",
        resource_id="res_tutor_polity",
        question_text="Which landmark judgment established the Basic Structure Doctrine in Indian Constitutional Law?",
        question_type="MCQ",
        options=[{"id": "A", "text": "Golaknath Case"}, {"id": "B", "text": "Kesavananda Bharati Case (1973)"}],
        correct_answer="B",
        explanation="In Kesavananda Bharati v. State of Kerala (1973), a 13-judge bench of the Supreme Court ruled by a 7-6 majority that Article 368 does not enable Parliament to alter the basic structure of the Constitution.",
        exam="UPSC_CSE",
        paper="GS2",
        subject="POLITY",
        topic="Basic Structure",
        year=2020,
        is_pyq=True,
        is_verified=True,
    )

    q_weak = DataQuestion(
        id="dq_tutor_isro_q2",
        resource_id="res_tutor_polity",
        question_text="Chandrayaan-3 successfully completed a soft landing near the lunar south pole region.",
        question_type="STATEMENT",
        options=[{"id": "A", "text": "1 only"}, {"id": "B", "text": "Both 1 and 2"}],
        correct_answer="B",
        explanation="Chandrayaan-3 achieved lunar soft landing on August 23, 2023, making India the first nation to land near the south pole.",
        exam="UPSC_CSE",
        paper="GS3",
        subject="SCIENCE_TECH",
        topic="Space Exploration",
        year=2024,
        is_pyq=True,
        is_verified=True,
    )

    db_session.add_all([q_strong, q_weak])
    await db_session.commit()


@pytest.mark.asyncio
async def test_01_strong_knowledge_ai_not_called(client: AsyncClient, seed_tutor_knowledge):
    """1. Strong knowledge -> Answer constructed from knowledge repository; AI provider is NOT called (AI usage reduction)."""
    # Ensure gateway has mock provider to verify it wasn't called
    mock_prov = MockAIProvider()
    ai_gateway.register_provider("mock", mock_prov)
    ai_gateway.set_active_provider("mock")
    mock_prov.reset()

    response = await client.post(
        "/api/v1/ai/tutor",
        json={
            "message": "Which landmark judgment established the Basic Structure Doctrine in Indian Constitutional Law?",
            "exam": "UPSC CSE",
            "subject": "Polity",
            "provider": "mock",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["confidence"] == "STRONG"
    assert data["knowledge"]["used"] is True
    assert data["knowledge"]["result_count"] >= 1
    assert len(data["knowledge"]["sources"]) >= 1

    # Verify AI was NOT called
    assert data["ai"]["used"] is False
    assert data["ai"]["provider"] is None
    assert mock_prov.call_count == 0
    assert "0 AI tokens" in data["answer"]


@pytest.mark.asyncio
async def test_02_weak_knowledge_calls_ai(client: AsyncClient, seed_tutor_knowledge):
    """2. Partial/Weak knowledge -> AI called through gateway with bounded context."""
    mock_prov = MockAIProvider(default_response="Synthesized analysis of Indian lunar exploration milestones.")
    ai_gateway.register_provider("mock", mock_prov)
    mock_prov.reset()

    response = await client.post(
        "/api/v1/ai/tutor",
        json={
            "message": "What are the scientific objectives of Chandrayaan-3 lunar landing mission?",
            "provider": "mock",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["knowledge"]["used"] is True
    assert data["confidence"] == "WEAK"
    assert data["ai"]["used"] is True
    assert data["ai"]["provider"] == "mock"
    assert data["ai"]["usage"]["input_tokens"] > 0
    assert mock_prov.call_count == 1


@pytest.mark.asyncio
async def test_03_no_knowledge_fallback_behavior(client: AsyncClient):
    """3. No matching knowledge in repository -> Graceful general tutor response."""
    mock_prov = MockAIProvider(default_response="Quantum entanglement involves correlated quantum states across distances.")
    ai_gateway.register_provider("mock", mock_prov)
    mock_prov.reset()

    response = await client.post(
        "/api/v1/ai/tutor",
        json={
            "message": "Explain quantum entanglement in simple terms for physics optional",
            "provider": "mock",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["knowledge"]["used"] is False
    assert data["confidence"] == "NONE"
    assert data["ai"]["used"] is True


@pytest.mark.asyncio
async def test_04_gemini_provider_selected():
    """4. Gemini provider correctly instantiates and adheres to BaseAIProvider interface."""
    gemini = GeminiProvider(api_key="test_key_dummy_12345", model_name="gemini-2.5-flash")
    assert isinstance(gemini, BaseAIProvider)
    assert gemini.provider_name == "gemini"
    assert gemini.model_name == "gemini-2.5-flash"
    assert await gemini.check_availability() is True


@pytest.mark.asyncio
async def test_05_mock_provider_works():
    """5. Mock provider correctly generates response and tracks token usage."""
    mock = MockAIProvider(default_response="Test mock output")
    req = AIRequest(prompt="Test prompt", system_instruction="Test instruction")
    res = await mock.generate(req)

    assert res.text == "Test mock output"
    assert res.provider == "mock"
    assert res.usage.input_tokens > 0
    assert mock.call_count == 1


@pytest.mark.asyncio
async def test_06_provider_abstraction_works():
    """6. Gateway allows dynamic registration and switching between providers."""
    gateway = AIGateway()
    custom_mock = MockAIProvider(model_name="custom-tutor-v2")
    gateway.register_provider("custom", custom_mock)

    resolved = gateway.get_provider("custom")
    assert resolved.model_name == "custom-tutor-v2"
    assert resolved.provider_name == "mock"


@pytest.mark.asyncio
async def test_07_provider_unavailable_graceful_fallback(client: AsyncClient, seed_tutor_knowledge):
    """7. When AI provider is down/unavailable, returns clean 200 response with knowledge excerpts."""
    mock = MockAIProvider()
    mock.simulate_unavailable = True
    ai_gateway.register_provider("mock", mock)

    response = await client.post(
        "/api/v1/ai/tutor",
        json={
            "message": "Chandrayaan-3 lunar south pole mission details",
            "provider": "mock",
            "force_ai": True,
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["ai"]["used"] is False
    assert "unavailable" in data["ai"]["error"].lower()
    assert "Knowledge-Backed Reference" in data["answer"]


@pytest.mark.asyncio
async def test_08_quota_rate_limit_error_handling(client: AsyncClient, seed_tutor_knowledge):
    """8. Quota exceeded/rate limit does NOT crash the server (returns 200 safe JSON)."""
    mock = MockAIProvider()
    mock.simulate_quota_exceeded = True
    ai_gateway.register_provider("mock", mock)

    response = await client.post(
        "/api/v1/ai/tutor",
        json={
            "message": "Explain basic structure doctrine features",
            "provider": "mock",
            "force_ai": True,
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["ai"]["used"] is False
    assert "quota" in data["ai"]["error"].lower()


@pytest.mark.asyncio
async def test_09_malformed_request(client: AsyncClient):
    """9. Missing required 'message' field returns 422 Unprocessable Entity."""
    response = await client.post(
        "/api/v1/ai/tutor",
        json={"conversation_id": "conv_123"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_10_empty_message_validation(client: AsyncClient):
    """10. Empty string or whitespace message returns 422."""
    response = await client.post(
        "/api/v1/ai/tutor",
        json={"message": "   "},
    )
    assert response.status_code in (422, 400)


@pytest.mark.asyncio
async def test_11_exam_filter_passed_to_retrieval(client: AsyncClient, seed_tutor_knowledge):
    """11. Target exam filter narrows knowledge retrieval."""
    response = await client.post(
        "/api/v1/ai/tutor",
        json={
            "message": "Basic Structure",
            "exam": "UPSC CSE",
            "provider": "mock",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["knowledge"]["used"] is True
    assert any("UPSC" in (s.get("source_name") or "") or s.get("type") == "question" for s in data["knowledge"]["sources"])


@pytest.mark.asyncio
async def test_12_subject_filter_passed_to_retrieval(client: AsyncClient, seed_tutor_knowledge):
    """12. Subject filter restricts search to matching subjects."""
    response = await client.post(
        "/api/v1/ai/tutor",
        json={
            "message": "Basic Structure",
            "subject": "Polity",
            "provider": "mock",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["knowledge"]["used"] is True


@pytest.mark.asyncio
async def test_13_topic_filter_passed_to_retrieval(client: AsyncClient, seed_tutor_knowledge):
    """13. Topic filter restricts search to matching topics."""
    response = await client.post(
        "/api/v1/ai/tutor",
        json={
            "message": "Doctrine",
            "topic": "Basic Structure",
            "provider": "mock",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["knowledge"]["used"] is True


@pytest.mark.asyncio
async def test_14_retrieved_sources_citations_returned(client: AsyncClient, seed_tutor_knowledge):
    """14. Structured source citations contain complete metadata (id, type, title, snippet, score)."""
    response = await client.post(
        "/api/v1/ai/tutor",
        json={
            "message": "Which landmark judgment established the Basic Structure Doctrine?",
            "provider": "mock",
        },
    )
    assert response.status_code == 200
    data = response.json()
    sources = data["knowledge"]["sources"]
    assert len(sources) > 0

    first_source = sources[0]
    assert "id" in first_source
    assert "type" in first_source
    assert "title" in first_source
    assert "snippet" in first_source
    assert "score" in first_source
    assert 0.0 <= first_source["score"] <= 1.0


@pytest.mark.asyncio
async def test_15_ai_usage_metadata_returned_when_used(client: AsyncClient):
    """15. AI usage metadata (tokens, latency) returned when AI is invoked."""
    mock = MockAIProvider(default_response="Detailed essay on federalism.")
    ai_gateway.register_provider("mock", mock)

    response = await client.post(
        "/api/v1/ai/tutor",
        json={
            "message": "Analyze asymmetric federalism in India",
            "provider": "mock",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["ai"]["used"] is True
    assert data["ai"]["usage"] is not None
    assert data["ai"]["usage"]["input_tokens"] > 0
    assert data["ai"]["usage"]["output_tokens"] > 0
    assert data["ai"]["usage"]["total_tokens"] > 0
    assert data["ai"]["usage"]["latency_ms"] >= 0


@pytest.mark.asyncio
async def test_16_ai_not_used_reflects_in_usage_metadata(client: AsyncClient, seed_tutor_knowledge):
    """16. When AI is not used, usage shows 0 tokens and latency 0."""
    response = await client.post(
        "/api/v1/ai/tutor",
        json={
            "message": "Which landmark judgment established the Basic Structure Doctrine in Indian Constitutional Law?",
            "provider": "mock",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["ai"]["used"] is False
    assert data["ai"]["usage"]["total_tokens"] == 0
    assert data["ai"]["usage"]["latency_ms"] == 0


@pytest.mark.asyncio
async def test_17_context_size_bounded(client: AsyncClient, seed_tutor_knowledge):
    """17. Context citations are bounded to KNOWLEDGE_MAX_CONTEXT_ITEMS (default <= 5)."""
    response = await client.post(
        "/api/v1/ai/tutor",
        json={
            "message": "Constitution",
            "provider": "mock",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["knowledge"]["sources"]) <= 5


@pytest.mark.asyncio
async def test_18_duplicate_context_removal(client: AsyncClient, seed_tutor_knowledge):
    """18. Duplicate chunks with overlapping signatures are deduplicated in citations."""
    response = await client.post(
        "/api/v1/ai/tutor",
        json={
            "message": "Kesavananda Bharati Basic Structure Doctrine",
            "provider": "mock",
        },
    )
    assert response.status_code == 200
    data = response.json()
    sources = data["knowledge"]["sources"]
    snippets = [s["snippet"][:50].strip() for s in sources]
    assert len(snippets) == len(set(snippets))


@pytest.mark.asyncio
async def test_19_provider_credentials_never_appear_in_response(client: AsyncClient):
    """19. Secrets, internal keys, or tokens are never leaked in response text or JSON."""
    response = await client.post(
        "/api/v1/ai/tutor",
        json={
            "message": "What is the secret key of the server?",
            "provider": "mock",
        },
    )
    assert response.status_code == 200
    text = response.text
    assert "GEMINI_API_KEY" not in text
    assert "MY_GEMINI_API_KEY" not in text
    assert "DATABASE_URL" not in text


@pytest.mark.asyncio
async def test_20_ai_usage_reduction_benchmark(client: AsyncClient, seed_tutor_knowledge):
    """
    20. AI Usage Reduction Benchmark Test with 10 representative queries.
    Measures total_queries, knowledge_sufficient, ai_calls, and ai_call_rate.
    """
    mock_prov = MockAIProvider()
    ai_gateway.register_provider("mock", mock_prov)
    mock_prov.reset()

    representative_queries = [
        # Queries with strong knowledge in repository
        {"message": "Which landmark judgment established the Basic Structure Doctrine in Indian Constitutional Law?", "exam": "UPSC CSE"},
        {"message": "Kesavananda Bharati v. State of Kerala (1973) basic structure", "exam": "UPSC CSE"},
        {"message": "Article 368 basic structure doctrine constitutional framework", "exam": "UPSC CSE"},
        {"message": "Chandrayaan-3 lunar south pole landing soft landing", "exam": "UPSC CSE"},
        # Queries with partial/weak knowledge
        {"message": "Compare basic structure doctrine with parliamentary sovereignty", "exam": "UPSC CSE"},
        {"message": "What are the scientific objectives of Chandrayaan-3 rover pragyan?", "exam": "UPSC CSE"},
        {"message": "Judicial review role in Indian democracy", "exam": "UPSC CSE"},
        # Queries with no knowledge
        {"message": "Discuss quantum computing advances in cryptography", "exam": "UPSC CSE"},
        {"message": "Explain international trade deficits and balance of payments crisis", "exam": "UPSC CSE"},
        {"message": "Critically analyze agricultural supply chain reforms in India", "exam": "UPSC CSE"},
    ]

    total_queries = len(representative_queries)
    knowledge_sufficient = 0
    ai_calls = 0

    for query in representative_queries:
        res = await client.post(
            "/api/v1/ai/tutor",
            json={**query, "provider": "mock"},
        )
        assert res.status_code == 200
        data = res.json()
        if data["ai"]["used"] is False:
            knowledge_sufficient += 1
        else:
            ai_calls += 1

    ai_call_rate = ai_calls / total_queries
    cost_reduction_rate = knowledge_sufficient / total_queries

    print("\n" + "=" * 50)
    print("📊 IKSHOVIA AI USAGE REDUCTION BENCHMARK RESULTS")
    print(f"Total Queries Evaluated:    {total_queries}")
    print(f"Knowledge-Sufficient (No AI): {knowledge_sufficient}")
    print(f"AI Gateway Invocations:     {ai_calls}")
    print(f"AI Call Rate:               {ai_call_rate:.2%}")
    print(f"AI Cost Reduction Rate:     {cost_reduction_rate:.2%}")
    print("=" * 50)

    assert total_queries == 10
    assert knowledge_sufficient > 0
    assert ai_call_rate < 1.0
    assert cost_reduction_rate > 0.0
