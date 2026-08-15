# IKSHOVIA Data Ingestion & Knowledge API

The **IKSHOVIA Data API** is a modular, high-performance, provider-independent backend service designed to power public/allowed source ingestion, document extraction, text chunking, Civil Services/State PCS question bank ingestion, ingestion workflows, and multi-client distribution (Web, Mobile, Telegram).

---

## 🌟 Architectural Highlights

1. **Provider-Independent**: Agnostic to specific AI vendors, OCR engines, or paid scrapers.
2. **Zero-Cost Beta**: Fully operational locally at ₹0 without requiring paid third-party APIs.
3. **Async Architecture**: Powered by Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy 2.x Async Engine, and PostgreSQL.
4. **Standardized Responses**: Uniform JSON wrappers, pagination metadata, and structured error handling.
5. **Production Migration Ready**: Complete Alembic database migrations (`001_initial_data_api_tables`, `002_data_pipeline_tables`).
6. **100% Isolated Testing**: Full test suite running on in-memory SQLite with `aiosqlite` and `pytest-asyncio`.

---

## 📁 Directory Structure

```
api/
├── app/
│   ├── __init__.py
│   ├── main.py                  # FastAPI app factory, OpenAPI docs, and global middlewares
│   ├── config.py                # Pydantic v2 settings & database URL resolvers
│   ├── database.py              # SQLAlchemy 2.0 async engine & session dependencies
│   ├── models/                  # Declarative SQLAlchemy models
│   │   ├── base.py
│   │   ├── source.py            # Sources (data_sources)
│   │   ├── resource.py          # Resources (data_resources)
│   │   ├── document.py          # Extracted Documents (data_documents)
│   │   ├── chunk.py             # Semantic Text Chunks (data_chunks)
│   │   ├── job.py               # Ingestion & Sync Jobs (data_ingestion_jobs)
│   │   ├── question.py          # PYQs & MCQs (data_questions)
│   │   └── tag.py               # Taxonomy & Syllabus Tags (data_tags)
│   ├── schemas/                 # Pydantic v2 request/response models
│   │   ├── common.py            # APIResponse & PaginatedResponse wrappers
│   │   ├── source.py            # SourceCreate, SourceResponse
│   │   ├── resource.py          # ResourceCreate, ResourceResponse
│   │   ├── document.py          # DocumentCreate, DocumentResponse, DocumentChunkRequest
│   │   ├── chunk.py             # ChunkCreate, ChunkResponse
│   │   ├── job.py               # JobCreate, JobResponse, JobUpdate
│   │   ├── question.py          # DataQuestionCreate, DataQuestionResponse, BulkQuestionCreate
│   │   └── tag.py               # TagCreate, TagResponse
│   ├── routers/                 # Route controllers
│   │   ├── health.py            # GET /health & GET /api/v1/health
│   │   ├── sources.py           # Sources CRUD (/api/v1/sources)
│   │   ├── resources.py         # Resources CRUD & filtering (/api/v1/resources)
│   │   ├── documents.py         # Documents CRUD & auto-chunking (/api/v1/documents)
│   │   ├── chunks.py            # Chunks search & retrieval (/api/v1/chunks)
│   │   ├── jobs.py              # Ingestion job lifecycle (/api/v1/jobs)
│   │   ├── questions.py         # Questions & PYQ repository (/api/v1/questions)
│   │   └── tags.py              # Taxonomy & syllabus tags (/api/v1/tags)
│   └── core/
│       ├── logging.py           # Secure, structured request logging middleware
│       └── exceptions.py        # Centralized exception handlers
├── tests/                       # Pytest test suite (100% isolated in-memory DB)
│   ├── conftest.py
│   ├── test_health.py
│   ├── test_sources.py
│   ├── test_resources.py
│   ├── test_documents.py
│   ├── test_chunks.py
│   ├── test_jobs.py
│   ├── test_questions.py
│   └── test_tags.py
├── alembic/                     # Database migration management
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
│       ├── 001_initial_data_api_tables.py
│       └── 002_data_pipeline_tables.py
├── alembic.ini
├── requirements.txt
├── .env.example
├── postman_collection.json
└── README.md
```

---

## 🚀 Setup & Execution

### 1. Install Dependencies
```bash
pip install -r api/requirements.txt
```

### 2. Run Database Migrations
```bash
python3 -m alembic -c api/alembic.ini upgrade head
```

### 3. Run Automated Tests
```bash
pytest -v api/tests
```

### 4. Start the Development Server
```bash
uvicorn app.main:app --app-dir api --host 0.0.0.0 --port 8000 --reload
```

---

## 📑 API Endpoints Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Basic liveness check |
| `GET` | `/api/v1/health` | Deep database health check |
| `GET` | `/api/v1/sources` | List all registered data sources |
| `POST` | `/api/v1/sources` | Register a new data source |
| `GET` | `/api/v1/sources/{id}` | Get source by ID |
| `GET` | `/api/v1/resources` | List resources with pagination and filters |
| `POST` | `/api/v1/resources` | Ingest a new resource linked to a source |
| `GET` | `/api/v1/resources/{id}` | Get resource by ID |
| `GET` | `/api/v1/documents` | List extracted documents |
| `POST` | `/api/v1/documents` | Register extracted document body |
| `GET` | `/api/v1/documents/{id}` | Get document by ID |
| `POST` | `/api/v1/documents/{id}/chunk` | Automatically chunk document text |
| `GET` | `/api/v1/chunks` | Search and list text chunks |
| `POST` | `/api/v1/chunks` | Create manual chunk |
| `GET` | `/api/v1/jobs` | List ingestion background jobs |
| `POST` | `/api/v1/jobs` | Enqueue a new ingestion/extraction job |
| `GET` | `/api/v1/jobs/{id}` | Get job status & metrics |
| `PATCH` | `/api/v1/jobs/{id}` | Update job progress and state |
| `GET` | `/api/v1/questions` | Filter PYQs/MCQs by exam, year, subject, etc. |
| `POST` | `/api/v1/questions` | Ingest a single question |
| `POST` | `/api/v1/questions/bulk` | Bulk import questions |
| `GET` | `/api/v1/questions/{id}` | Get question by ID |
| `GET` | `/api/v1/tags` | List syllabus taxonomy tags |
| `POST` | `/api/v1/tags` | Register a taxonomy tag |
