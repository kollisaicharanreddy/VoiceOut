## Plan: VoiceOut Requirements Blueprint v2

This version refines the project into a small personal build. The goal is to keep the anonymous complaint flow, use a simple admin review process, and avoid enterprise-style scope.

### Project Scope

VoiceOut is an anonymous complaint tracker for a personal project. It should support:
- Anonymous complaint submission
- A generated tracking code for follow-up
- A basic admin review dashboard
- Simple complaint status updates
- Optional AI-assisted classification or summarization
- Optional semantic search using pgvector for similar complaints

### Non-Goals

This project is not aiming for production-grade compliance, scale, or multi-team operations. The following are out of scope for v1:
- RAG pipelines and policy ingestion workflows
- Complaint clustering dashboards
- Threaded anonymous messaging
- Multi-role operator management
- Formal audit/compliance automation
- Kubernetes, microservices, queues, or heavy observability tooling

### Recommended Tech Stack

#### Frontend
- React.js
- Vite for project scaffolding and local development
- Plain React with JavaScript for simplicity

#### Backend
- Spring Boot
- Spring Web for REST APIs
- Spring Data JPA with Hibernate as the ORM
- Spring Security only for a minimal admin login

#### Database
- PostgreSQL
- pgvector extension for vector storage and similarity search

#### AI
- Gemini API for optional complaint classification and summarization
- AI should be advisory only, not required for the core workflow

#### Deployment
- Simple hosted deployment or local-first development
- One app service plus one PostgreSQL instance is enough for v1

### v2 Functional Requirements

1. Anonymous submission
   1. The user submits a complaint without creating an account.
   2. The system returns a tracking code.
   3. The system stores only the complaint text and metadata needed for tracking.

2. Admin review
   1. Admins can list complaints, read details, update status, and add notes.
   2. Admins can mark complaints as new, in review, resolved, or rejected.
   3. Admin response drafting can be manual, with AI assistance as an optional helper.

3. Vector support with pgvector
   1. Store complaint embeddings in PostgreSQL using pgvector.
   2. Use similarity search to find related complaints when helpful.
   3. Keep the vector feature simple and optional for the first version.

4. AI fallback behavior
   1. If Gemini fails, the complaint still saves.
   2. If embedding generation fails, the complaint remains usable without vector search.
   3. AI output should never block manual admin handling.

### Data Model

Keep the schema small:
- Complaint
- ComplaintEmbedding
- AdminNote
- AdminUser

Suggested fields:
- Complaint: id, trackingCode, content, status, createdAt, updatedAt
- ComplaintEmbedding: id, complaintId, embeddingVector, createdAt
- AdminNote: id, complaintId, note, createdAt
- AdminUser: id, username, passwordHash, role

### Implementation Phases

#### Phase 1
- Build the React submission form
- Build the Spring Boot REST API
- Store complaints in PostgreSQL
- Generate and return a tracking code
- Add the minimal admin login and review screen

#### Phase 2
- Add Gemini-based complaint classification or summarization
- Add pgvector embeddings for complaint similarity
- Add basic admin notes and status updates

#### Phase 3
- Improve UI polish
- Add simple search or similarity helpers for admins
- Add retention cleanup if needed

### Open Questions

1. Should the admin interface be protected by a single login or kept local-only?
2. Should complaint retention be indefinite or time-limited?
3. Should embeddings be generated for every complaint or only when AI succeeds?
4. Should React stay JavaScript-only, or should the project later move to TypeScript?

### Verification

1. The plan stays personal-project sized and avoids enterprise complexity.
2. The stack is consistent: React on the frontend, Spring Boot on the backend, PostgreSQL plus pgvector for storage and similarity search.
3. AI is optional and never a dependency for saving or reviewing complaints.
4. The anonymous workflow does not introduce user accounts or identity recovery.