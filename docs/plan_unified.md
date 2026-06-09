## Plan: VoiceOut Unified Plan

TL;DR - Combine the comprehensive requirements blueprint (plan 1) with the pragmatic v2 scope to produce a single, phased implementation plan for an anonymous-first complaint tracker. Tech stack: React + Vite frontend, Spring Boot backend, PostgreSQL (+ pgvector), Gemini for optional AI, and simple hosted/local deployment. The plan emphasizes anonymity, minimal required AI, and a clear Phase 1 minimal viable product (MVP) followed by incremental AI and vector features.

**Steps**
1. Discovery & Alignment (short)
   1. Confirm admin access model (single local admin account vs. operations team) and retention policy.
   2. Re-affirm anonymity constraints: no user profile table, minimal logs, and credential recovery rules.
   3. Finalize deployment target (single host / PaaS / local developer machine).

2. Functional decomposition
   1. Core user journeys: submit complaint (anonymous), receive tracking code, admin review/triage, admin status updates, admin notes.
   2. Optional journeys: AI classification/summarization, vector-similarity search for related complaints.
   3. Define inputs/outputs and state transitions for each journey (Complaint: new -> in_review -> resolved|rejected).

3. Non-functional requirements
   1. Privacy: store only complaint text + minimal metadata; avoid IP retention by default; retention TTL configurable.
   2. Security: TLS required; admin login with hashed password (bcrypt/Argon2); rate-limiting on submit endpoint.
   3. Reliability/performance: synchronous save of complaint; async AI/enrichment; retry policy for embedding generation.
   4. AI quality: structured JSON for classifier; confidence threshold; graceful fallback to manual handling.

4. Data & architecture
   1. Core entities: Complaint, ComplaintEmbedding, AdminNote, AdminUser.
   2. Storage: PostgreSQL for relational data; pgvector extension for embeddings.
   3. Services: REST API (Spring Boot), Frontend (React/Vite), optional background worker for AI enrichment or use async endpoints.

5. AI & operational rules
   1. Classification contract: single-call JSON output schema (category, severity, summary, confidence).
   2. Embeddings: store vector in ComplaintEmbedding; generate optionally and never block complaint persistence.
   3. RAG & retrieval: deferred (out of scope for v1); document chunking rules if added later.
   4. Failure handling: timeouts, retries, and marking enrichment status on the Complaint record.

6. Delivery & backlog
   1. Phase 1 (MVP): anonymous submission form, tracking code generator, Spring REST API, PostgreSQL persistence, minimal admin login/dashboard, status updates, and basic list/detail views.
   2. Phase 2: Gemini classification/summarization as advisory, embedding generation with pgvector, similarity helpers in admin UI.
   3. Phase 3: UI polish, retention/cleanup jobs, optional RAG features.

**Relevant files (suggested in repo)**
- docs/requirements.md — consolidated requirements
- docs/architecture.md — system context and components
- docs/data-model.md — ER model and lifecycle
- docs/api-spec.md — endpoints, payloads, validation
- docs/ai-behavior.md — prompts, schemas, fallback rules
- docs/acceptance-criteria.md — testable success criteria
- src/backend/ — Spring Boot project root
- src/frontend/ — React + Vite project root

**Implementation (detailed)**

Phase 1 — MVP (BLOCKING REQUIREMENTS: database, backend, frontend basic flows)
1. Bootstrap projects
   - Create Spring Boot app with Spring Web, Spring Data JPA, PostgreSQL driver.
   - Create React app with Vite.
2. Database schema
   - Complaint table: id (UUID), tracking_code (unique short string), content (text), status (enum), created_at, updated_at, enrichment_status (enum: pending|done|failed), ai_summary (nullable), ai_category, ai_confidence.
   - ComplaintEmbedding table: id, complaint_id (FK), vector (pgvector), created_at.
   - AdminNote table: id, complaint_id, note, created_at.
   - AdminUser table: id, username, password_hash, role.
3. Backend API endpoints
   - POST /complaints: accept content, validate length, persist complaint, generate tracking code, enqueue async enrichment job (non-blocking). Return tracking code.
   - GET /complaints/{trackingCode}: return complaint status and public view (no admin fields).
   - Admin endpoints (protected): GET /admin/complaints, GET /admin/complaints/{id}, POST /admin/complaints/{id}/notes, PATCH /admin/complaints/{id}/status.
   - Auth: minimal session-based or token-based admin login; protect /admin/* routes.
4. Tracking code generation
   - Deterministic short random string (8-12 chars) stored with complaint; collision-checked.
5. Frontend
   - Submission page: textarea, submit button, display tracking code on success.
   - Admin dashboard: login, list complaints with filters (status), detail view showing content and notes, ability to change status and add notes.
6. Tests & verification
   - Unit tests for backend services (JPA repositories, service layer).
   - Integration tests for POST /complaints persistence and GET retrieval.
   - Manual test checklist: submit complaint, see tracking code, admin view complaint, update status.

Phase 2 — AI & Vector (non-blocking enhancements)
1. AI integration patterns
   - Implement an async enrichment service invoked after save: call Gemini classification + create summary and confidence score. Update complaint record.
   - If Gemini fails or low confidence, set ai_confidence and ai_status accordingly.
2. Embeddings & pgvector
   - Add embedding generation step in enrichment service; on success insert into ComplaintEmbedding.
   - Create similarity helper endpoint: GET /admin/complaints/{id}/similar?n=5 returns top-N similar complaints by vector similarity.
3. Admin UI helpers
   - Show AI summary and suggested category; allow admin to accept/override classification.
   - Show similar complaints in detail view.
4. Verification
   - Tests for enrichment flow using mocked Gemini responses.
   - Basic performance test for similarity queries.

Phase 3 — Ops, polish, and optional RAG
1. Retention & cleanup
   - Implement configurable TTL job to delete/anonymize complaints older than retention window.
2. Policy & RAG (optional)
   - If required later, add policy ingestion, chunking, and citation rules.
3. UI polish and accessibility
   - Improve styling, add search, and basic pagination.

**Relevant files to create/modify**
- src/backend/src/main/java/com/voiceout/Application.java — Spring Boot launcher
- src/backend/src/main/java/com/voiceout/controller/ComplaintController.java — public endpoints
- src/backend/src/main/java/com/voiceout/controller/AdminController.java — admin endpoints
- src/backend/src/main/java/com/voiceout/service/ComplaintService.java — business logic
- src/backend/src/main/java/com/voiceout/model/Complaint.java — JPA entity
- src/backend/src/main/resources/application.yml — DB and security config
- src/frontend/src/App.jsx — React entry
- src/frontend/src/pages/Submit.jsx — submission form
- src/frontend/src/pages/Admin/* — admin UI pages
- docs/*.md — documentation described above

**Verification (acceptance criteria)**
1. MVP: can submit a complaint anonymously and receive a tracking code; complaint stored in DB; admin can authenticate and change status; UI displays required fields.
2. AI: enrichment attaches summary and category to complaint record without blocking save; failures are recorded and do not affect complaint availability.
3. Embeddings: embedding stored in pgvector and similarity query returns meaningful related complaints for admin.
4. Privacy: no user accounts are created for submitters; logs and retention follow configured policy.

**Decisions & Assumptions**
- Anonymous-first: no submitter identities stored unless explicitly requested later.
- AI is advisory: never blocks core flows.
- Single-admin model by default; scalable to multi-admin later.
- Use bcrypt for password hashing; TLS enforced at deployment layer.

**Further Considerations / Open Questions**
1. Admin access model: local single-user vs. hosted team accounts? (recommend single admin for v1).
2. Retention window: recommend configurable default 1 year; require legal review for deletion obligations.
3. Deployment: recommend simple PaaS (Heroku/GCP App Engine) or a single VM for early testing.
4. Monitoring & logs: keep minimal logs for privacy, but ensure error monitoring (Sentry) for server-side failures.

