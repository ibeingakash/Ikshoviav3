# IKSHOVIA — PHASE 4.1J: TELEGRAM → MAINS COPY INGESTION & GROUNDED DATASET IMPORT

## Executive Summary & Safety Guarantees

| Metric / Guard | Value / Status | Explanation |
| :--- | :--- | :--- |
| **Phase 4.1J Ingestion Status** | **PASS** | Complete secure pipeline verified with 27/27 automated tests passing |
| **Model Actually Trained** | **NO** | Zero training executed; training strictly locked |
| **Fine-Tuning Executed** | **NO** | Zero fine-tuning or LoRA execution permitted |
| **Synthetic Data Created** | **NO** | Real database data and authorized copies only |
| **Training Lock Status** | **LOCKED** | Safety gate enforces absolute lock until readiness passes |
| **Phase 4.1G Audit Result** | **TRAINING_NOT_READY** | Real ground-truth threshold blocked (0/200 answers, 7/250 reviews) |
| **Telegram Runtime Status** | **BLOCKED_CONFIGURATION** | No live bot token configured in server environment; mock/fixture fallback active |
| **Benchmark Contamination** | **0 Leakage** | Isolated gold set (6/20 items) completely protected |

---

## 1. Architectural Overview

Telegram is used **strictly as an ingestion transport**. Content arriving via Telegram **does not automatically become training data**. Every copy undergoes an 8-stage verification pipeline:

```
[Authorized Telegram Source]
             │ (Webhook / Update)
             ▼
[1. Source Validation & Authorization]
             │ (MIME & Size Checks)
             ▼
[2. SHA-256 Hashing & Idempotency] ── (Duplicate?) ──> [DUPLICATE_SOURCE_FILE]
             │ (Unique File)
             ▼
[3. PDF / OCR Extraction] ─────────── (< 80% Conf?) ─> [OCR_REVIEW_REQUIRED]
             │
             ▼
[4. Question & Answer Segmentation]
             │
             ▼
[5. Faculty Ground-Truth Detection]
             │
             ▼
[6. PII Sanitization & Pseudonymization]
             │
             ▼
[7. Duplicate Answer & Benchmark Isolation Guard]
             │
             ▼
[8. Certified Faculty Validation] ──── (Approved) ────> [DATASET_CANDIDATE]
```

---

## 2. Telegram Source Authorization

Ingestion is restricted to explicitly authorized private groups, channels, or direct bot uploads:
- **Registry Table**: `public.mains_telegram_sources`
- **Fields**: `id`, `source_type` (`PRIVATE_GROUP`, `PRIVATE_CHANNEL`, `DIRECT_BOT_UPLOAD`), `telegram_chat_id`, `telegram_chat_type`, `display_name`, `authorized`, `enabled`, `authorization_basis`, `retention_policy`, `created_by`, `audit_metadata`.
- **RBAC**: Only users with `ADMIN` or `SUPER_ADMIN` roles can authorize sources or modify retention policies.
- **Strict Prohibition**: Public scraping or open channel ingestion is strictly blocked.

---

## 3. Ingestion Lifecycle & State Machine

Incoming updates transition through the following states:
1. `DISCOVERED`: Telegram update received with document or photo payload.
2. `AUTHORIZED`: Verified that `chat.id` belongs to an enabled and authorized source.
3. `DOWNLOADING` / `DOWNLOADED`: File payload retrieved via Telegram Bot API or secure buffer.
4. `HASHED`: SHA-256 computed. If duplicate exists, flagged `DUPLICATE_SOURCE_FILE` and linked without creating duplicate copy.
5. `EXTRACTING`: Native PDF text extraction using `pdf-parse` with page counts and character bounds.
6. `OCR_PROCESSING` / `OCR_COMPLETED`: Scanned documents or images processed through `safeTesseractRecognize`. If confidence < 0.80, flagged `OCR_REVIEW_REQUIRED`.
7. `SEGMENTING`: Deterministic splitting of Question prompt vs Student Answer text.
8. `GROUND_TRUTH_DETECTION`: Detection of existing faculty marks (e.g. `8/10`, `12/20`) and written evaluative comments. Statuses: `FACULTY_GROUND_TRUTH_PRESENT`, `FACULTY_GROUND_TRUTH_PARTIAL`, `FACULTY_GROUND_TRUTH_ABSENT`, `FACULTY_GROUND_TRUTH_REQUIRES_VALIDATION`.
9. `PII_SANITIZATION`: Redaction of phone numbers, email addresses, roll numbers, and Telegram usernames (`[REDACTED_PHONE]`, `[REDACTED_EMAIL]`, `[REDACTED_ROLL_NO]`). Generation of salted pseudonymous learner hash using `HMAC-SHA256`.
10. `DUPLICATE_CHECK`: Normalized answer hash compared against existing submissions and candidate pool.
11. `BENCHMARK_ISOLATION`: Checked against all items in `mains_evaluation_benchmark_items`. If collision detected, marked `EXCLUDED` and flagged `benchmark_overlap = true`.
12. `DATASET_CANDIDATE`: Only reached if all quality gates, PII sanitization, benchmark isolation, and certified faculty ground-truth validation pass.

---

## 4. API Endpoints

All endpoints enforce strict RBAC (`requireAdmin` / `requireTeacher`):

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/admin/mains/telegram/sources` | Lists all authorized and pending Telegram sources |
| `POST` | `/api/admin/mains/telegram/sources` | Registers and whitelists a new Telegram source |
| `PATCH` | `/api/admin/mains/telegram/sources/:id` | Updates authorization, display name, or retention policy |
| `POST` | `/api/admin/mains/telegram/webhook` | Official webhook update receiver from Telegram Bot API |
| `GET` | `/api/admin/mains/telegram/imports` | Paginated queue of imported copies with filter support |
| `GET` | `/api/admin/mains/telegram/imports/:id` | Full detail inspection (extracted, OCR, sanitized, evaluation) |
| `POST` | `/api/admin/mains/telegram/imports/:id/validate-ground-truth` | Faculty certification of existing or verified marks/rubric |
| `POST` | `/api/admin/mains/telegram/imports/:id/retry` | Re-executes extraction pipeline on preserved file |
| `POST` | `/api/admin/mains/telegram/imports/:id/exclude` | Marks copy as excluded from dataset |
| `GET` | `/api/admin/mains/telegram/stats` | Returns real telemetry, counts, and runtime status |

---

## 5. Security & Secret Protection

- **Bot Token**: Read exclusively server-side via `process.env.TELEGRAM_DATASET_BOT_TOKEN`.
- **Zero UI Exposure**: Bot token is never returned via API, never rendered in frontend bundles, never logged in server logs, and never requested in UI forms.
- **Source Hardening**: Unauthorized chat payloads are rejected immediately with `403` / `REJECTED_UNAUTHORIZED_SOURCE` and logged in audit trails.

---

## 6. Automated Verification Test Suite (27/27 Tests)

Automated test script: `scripts/verify-phase4-1j-telegram-ingestion.ts`

```
[Test 01] ✅ PASS: Authorized source accepted
[Test 02] ✅ PASS: Unauthorized source rejected
[Test 03] ✅ PASS: PDF accepted
[Test 04] ✅ PASS: Image accepted
[Test 05] ✅ PASS: Unsupported file rejected
[Test 06] ✅ PASS: SHA-256 generated
[Test 07] ✅ PASS: Duplicate source detected
[Test 08] ✅ PASS: PDF extraction works
[Test 09] ✅ PASS: OCR workflow works
[Test 10] ✅ PASS: Low OCR confidence routes to review
[Test 11] ✅ PASS: Question/answer segmentation persists
[Test 12] ✅ PASS: Faculty-ground-truth detection works
[Test 13] ✅ PASS: Ground-truth validation works
[Test 14] ✅ PASS: PII sanitization works
[Test 15] ✅ PASS: Learner pseudonymization works
[Test 16] ✅ PASS: Answer hash generated
[Test 17] ✅ PASS: Duplicate candidate detected / flagged correctly
[Test 18] ✅ PASS: Benchmark isolation works
[Test 19] ✅ PASS: Training candidate requires faculty ground truth
[Test 20] ✅ PASS: Historical source is preserved
[Test 21] ✅ PASS: Failed imports are isolated
[Test 22] ✅ PASS: Retry works
[Test 23] ✅ PASS: Bulk queue works
[Test 24] ✅ PASS: RBAC works
[Test 25] ✅ PASS: Telegram token never appears in API responses/log output
[Test 26] ✅ PASS: No synthetic data created
[Test 27] ✅ PASS: No model training executed (training locked)
==============================================================
TOTAL TESTS: 27 | PASSED: 27 | FAILED: 0
==============================================================
```

---

## 7. Current Real State Summary

- **Authorized Sources**: 0 active production sources (admin setup required)
- **Imported Copies**: 0 real production copies
- **Unique Training Answers**: 0 / 200 required
- **Faculty-Verified Reviews**: 7 / 250 required
- **Benchmark Items**: 6 / 20 required (zero leakage)
- **Model Training Status**: **LOCKED** (Phase 4.1G audit: `TRAINING_NOT_READY`)
