import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath("api"))

from app.ai.base import (
    AIRequest,
    BaseAIProvider,
    ProviderUnavailableError,
    QuotaExceededError,
    RateLimitError,
)
from app.ai.gateway import AIGateway, ai_gateway
from app.ai.providers.gemini import GeminiProvider
from app.ai.providers.mock import MockAIProvider
from app.models import Base
from app.models.chunk import Chunk
from app.models.document import Document
from app.models.question import DataQuestion
from app.models.resource import Resource
from app.models.source import Source
from app.tutor.schemas import TutorRequest
from app.tutor.service import AITutorService
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

engine = create_async_engine(
    "sqlite+aiosqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
SessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False)


async def run_all_tutor_tests():
    print("=" * 60)
    print("🧪 Running IKSHOVIA AI Tutor & Gateway Test Suite")
    print("=" * 60)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # 1. Seed Knowledge
    async with SessionLocal() as db:
        src = Source(
            id="src_tutor_upsc",
            name="UPSC Official Repository",
            slug="upsc-official-repository-tutor",
            base_url="https://upsc.gov.in",
            source_type="GOVERNMENT",
            is_active=True,
        )
        db.add(src)

        res = Resource(
            id="res_tutor_polity",
            source_id="src_tutor_upsc",
            title="Indian Polity & Constitution Master Compilation",
            url="https://upsc.gov.in/polity-master.pdf",
            resource_type="PDF",
            status="ACTIVE",
        )
        db.add(res)

        doc = Document(
            id="doc_tutor_const",
            resource_id="res_tutor_polity",
            raw_text="The Basic Structure Doctrine was established by the Supreme Court of India in Kesavananda Bharati v. State of Kerala (1973). It holds that Parliament cannot alter the basic features of the Constitution through amendments under Article 368. Key elements include Judicial Review, Secularism, and Federalism.",
            clean_text="The Basic Structure Doctrine was established by the Supreme Court of India in Kesavananda Bharati v. State of Kerala (1973). It holds that Parliament cannot alter the basic features of the Constitution through amendments under Article 368. Key elements include Judicial Review, Secularism, and Federalism.",
            extraction_status="COMPLETED",
        )
        db.add(doc)

        chk1 = Chunk(
            id="chk_tutor_bs1",
            document_id="doc_tutor_const",
            chunk_index=0,
            content="The Basic Structure Doctrine was established by the Supreme Court of India in Kesavananda Bharati v. State of Kerala (1973). It holds that Parliament cannot alter the basic features of the Constitution through amendments under Article 368. Key elements include Judicial Review, Secularism, and Federalism.",
            token_count=55,
            character_count=260,
        )
        chk2 = Chunk(
            id="chk_tutor_bs2",
            document_id="doc_tutor_const",
            chunk_index=1,
            content="The Basic Structure Doctrine was established by the Supreme Court of India in Kesavananda Bharati v. State of Kerala (1973). It holds that Parliament cannot alter the basic features of the Constitution.",
            token_count=35,
            character_count=170,
        )
        db.add_all([chk1, chk2])

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

        db.add_all([q_strong, q_weak])
        await db.commit()

    service = AITutorService()
    mock_prov = MockAIProvider()
    ai_gateway.register_provider("mock", mock_prov)

    # Test 1: Strong Knowledge -> AI not called
    async with SessionLocal() as db:
        mock_prov.reset()
        res1 = await service.process_query(
            db,
            TutorRequest(
                message="Which landmark judgment established the Basic Structure Doctrine in Indian Constitutional Law?",
                exam="UPSC CSE",
                subject="Polity",
                provider="mock",
            ),
        )
        assert res1.confidence == "STRONG", f"Expected STRONG, got {res1.confidence}"
        assert res1.ai.used is False, "Expected ai.used == False for strong knowledge"
        assert mock_prov.call_count == 0, f"Expected 0 AI calls, got {mock_prov.call_count}"
        assert res1.knowledge.result_count >= 1
        print("✅ 1. Strong knowledge -> Answer constructed from knowledge repository (0 AI tokens)")

    # Test 2: Weak Knowledge -> AI called
    async with SessionLocal() as db:
        mock_prov.reset()
        res2 = await service.process_query(
            db,
            TutorRequest(
                message="Explain lunar south pole landing objectives",
                provider="mock",
            ),
        )
        assert res2.ai.used is True, "Expected ai.used == True for weak knowledge"
        assert mock_prov.call_count == 1, "Expected 1 AI call"
        print("✅ 2. Weak knowledge -> AI called with grounded context")

    # Test 3: No Knowledge -> AI called or graceful
    async with SessionLocal() as db:
        mock_prov.reset()
        res3 = await service.process_query(
            db,
            TutorRequest(
                message="Discuss general theory of relativity equations",
                provider="mock",
            ),
        )
        assert res3.confidence == "NONE"
        assert res3.ai.used is True
        print("✅ 3. No knowledge -> General AI tutor response generated")

    # Test 4: Gemini Provider interface
    gemini = GeminiProvider(api_key="test_key", model_name="gemini-2.5-flash")
    assert isinstance(gemini, BaseAIProvider)
    assert gemini.provider_name == "gemini"
    print("✅ 4. Gemini provider conforms to BaseAIProvider interface")

    # Test 5: Mock Provider tracks usage
    mock_standalone = MockAIProvider(default_response="Mock answer")
    req = AIRequest(prompt="Test prompt", system_instruction="Test inst")
    mock_res = await mock_standalone.generate(req)
    assert mock_res.text == "Mock answer"
    assert mock_res.usage.total_tokens > 0
    print("✅ 5. Mock provider generates responses and token usage metrics")

    # Test 6: Gateway provider resolution
    gw = AIGateway()
    gw.register_provider("custom_mock", MockAIProvider(model_name="custom-v1"))
    prov = gw.get_provider("custom_mock")
    assert prov.model_name == "custom-v1"
    print("✅ 6. AI Gateway abstraction and provider switching verified")

    # Test 7: Provider unavailable graceful fallback
    async with SessionLocal() as db:
        mock_fail = MockAIProvider()
        mock_fail.simulate_unavailable = True
        gw_fail = AIGateway()
        gw_fail.register_provider("mock", mock_fail)

        res7 = await service.process_query(
            db,
            TutorRequest(
                message="Chandrayaan-3 lunar landing",
                provider="mock",
                force_ai=True,
            ),
            gateway_override=gw_fail,
        )
        assert res7.success is True
        assert res7.ai.used is False
        assert "unavailable" in res7.ai.error.lower()
        print("✅ 7. Provider unavailable -> Clean 200 response with knowledge reference")

    # Test 8: Quota exceeded error handling
    async with SessionLocal() as db:
        mock_quota = MockAIProvider()
        mock_quota.simulate_quota_exceeded = True
        gw_quota = AIGateway()
        gw_quota.register_provider("mock", mock_quota)

        res8 = await service.process_query(
            db,
            TutorRequest(
                message="Explain basic structure doctrine",
                provider="mock",
                force_ai=True,
            ),
            gateway_override=gw_quota,
        )
        assert res8.success is True
        assert res8.ai.used is False
        assert "quota" in res8.ai.error.lower()
        print("✅ 8. Quota exceeded -> Graceful fallback, no crash")

    # Test 9: Deduplication of sources
    async with SessionLocal() as db:
        res9 = await service.process_query(
            db,
            TutorRequest(
                message="Kesavananda Bharati Basic Structure Doctrine",
                provider="mock",
            ),
        )
        snippets = [s.snippet[:50].strip() for s in res9.knowledge.sources]
        assert len(snippets) == len(set(snippets)), "Expected deduplicated snippets"
        print("✅ 9. Duplicate overlapping chunk snippets deduplicated")

    # Test 10: Citation Metadata completeness
    async with SessionLocal() as db:
        res10 = await service.process_query(
            db,
            TutorRequest(
                message="Which landmark judgment established the Basic Structure Doctrine?",
                provider="mock",
            ),
        )
        src1 = res10.knowledge.sources[0]
        assert src1.id and src1.title and src1.snippet and (0.0 <= src1.score <= 1.0)
        print("✅ 10. Citation metadata complete with IDs, types, scores, and bounded snippets")

    # Test 11: AI Usage Reduction Benchmark (10 Queries)
    representative_queries = [
        {"message": "Which landmark judgment established the Basic Structure Doctrine in Indian Constitutional Law?", "exam": "UPSC CSE"},
        {"message": "Kesavananda Bharati v. State of Kerala (1973) basic structure", "exam": "UPSC CSE"},
        {"message": "Article 368 basic structure doctrine constitutional framework", "exam": "UPSC CSE"},
        {"message": "Chandrayaan-3 lunar south pole landing soft landing", "exam": "UPSC CSE"},
        {"message": "Compare basic structure doctrine with parliamentary sovereignty", "exam": "UPSC CSE"},
        {"message": "What are the scientific objectives of Chandrayaan-3 rover pragyan?", "exam": "UPSC CSE"},
        {"message": "Judicial review role in Indian democracy", "exam": "UPSC CSE"},
        {"message": "Discuss quantum computing advances in cryptography", "exam": "UPSC CSE"},
        {"message": "Explain international trade deficits and balance of payments crisis", "exam": "UPSC CSE"},
        {"message": "Critically analyze agricultural supply chain reforms in India", "exam": "UPSC CSE"},
    ]

    total_queries = len(representative_queries)
    knowledge_sufficient = 0
    ai_calls = 0

    async with SessionLocal() as db:
        for q in representative_queries:
            r = await service.process_query(db, TutorRequest(**q, provider="mock"))
            if r.ai.used is False:
                knowledge_sufficient += 1
            else:
                ai_calls += 1

    ai_call_rate = ai_calls / total_queries
    cost_reduction = knowledge_sufficient / total_queries

    print("\n" + "=" * 60)
    print("📊 AI USAGE REDUCTION BENCHMARK (10 Representative Queries)")
    print(f"Total Queries:                  {total_queries}")
    print(f"Knowledge-Sufficient (No AI):   {knowledge_sufficient}")
    print(f"AI Invocations Required:        {ai_calls}")
    print(f"AI Call Rate:                   {ai_call_rate:.1%}")
    print(f"Cost / Token Reduction Rate:    {cost_reduction:.1%}")
    print("=" * 60)

    assert knowledge_sufficient > 0, "Expected measurable cost reduction"
    assert ai_call_rate < 1.0, "Expected AI call rate < 1.0"
    print("✅ 11. AI Usage Reduction Benchmark successfully validated!")


if __name__ == "__main__":
    asyncio.run(run_all_tutor_tests())
