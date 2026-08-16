from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import IntegrityError
from app.config import settings
from app.core.exceptions import (
    DataAPIException,
    data_api_exception_handler,
    general_exception_handler,
    sqlalchemy_integrity_handler,
    validation_exception_handler,
)
from app.core.logging import RequestLoggingMiddleware, logger
from app.routers import chunks, documents, health, ingestion, jobs, questions, resources, search, sources, tags


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for startup and graceful shutdown."""
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION} [{settings.APP_ENV}]")
    yield
    logger.info(f"Shutting down {settings.APP_NAME}")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
# IKSHOVIA Data API — Foundation Service

The **IKSHOVIA Data API** is a provider-independent backend foundation designed to power:
* Public and allowed source ingestion
* Document and PDF lifecycle management
* Civil Services / State PCS question repository
* AI-assisted knowledge workflows and quizzes
* Multi-client distribution (Web, Mobile, Telegram)

### Key Architectural Principles
* **Provider-Independent**: Agnostic to AI, OCR, and cloud storage providers.
* **Resilient**: Strict validation, explicit schema constraints, and uniform JSON errors.
* **Auditable**: Complete timestamping, source attribution, and content hashing.
    """,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# 1. Register Global CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Register Request Logging Middleware
app.add_middleware(RequestLoggingMiddleware)

# 3. Register Global Exception Handlers
app.add_exception_handler(DataAPIException, data_api_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(IntegrityError, sqlalchemy_integrity_handler)
app.add_exception_handler(Exception, general_exception_handler)

# 4. Include Routers
# Root health route
app.include_router(health.router)

# Versioned API routes under prefix /api/v1
app.include_router(sources.router, prefix=settings.API_V1_PREFIX)
app.include_router(resources.router, prefix=settings.API_V1_PREFIX)
app.include_router(documents.router, prefix=settings.API_V1_PREFIX)
app.include_router(chunks.router, prefix=settings.API_V1_PREFIX)
app.include_router(jobs.router, prefix=settings.API_V1_PREFIX)
app.include_router(questions.router, prefix=settings.API_V1_PREFIX)
app.include_router(tags.router, prefix=settings.API_V1_PREFIX)
app.include_router(ingestion.router, prefix=settings.API_V1_PREFIX)
app.include_router(search.router, prefix=settings.API_V1_PREFIX)
