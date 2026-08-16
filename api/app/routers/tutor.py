from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.tutor.schemas import TutorRequest, TutorResponse
from app.tutor.service import AITutorService

router = APIRouter(prefix="/ai", tags=["AI Tutor"])

tutor_service = AITutorService()


@router.post(
    "/tutor",
    response_model=TutorResponse,
    status_code=status.HTTP_200_OK,
    summary="IKSHOVIA AI Tutor Query",
    description="""
Executes grounded academic mentoring for Civil Services examinations.
**Architecture Flow:**
1. Deterministic IKSHOVIA Knowledge Search (Questions, Documents, Chunks, Tags)
2. Grounding confidence scoring (STRONG / WEAK / NONE)
3. AI Usage Optimization (Bypasses LLM when retrieved knowledge is sufficient)
4. Provider-Agnostic AI Gateway generation only when necessary
5. Graceful fallback on provider quota/rate-limit events
    """,
)
async def ask_ai_tutor(
    request: TutorRequest,
    db: AsyncSession = Depends(get_db),
) -> TutorResponse:
    """Executes retrieval-first AI Tutor processing."""
    return await tutor_service.process_query(db=db, request=request)
