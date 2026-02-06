# 📝 Project Roadmap & TODO

## 🛡️ Phase 1: Security & Compliance (Immediate)
- [x] **Restrict CORS Policy**: Narrow `allow_origins` to production domains.
- [x] **API Key Encryption**: Implement Fernet encryption for DB-stored secrets.
- [x] **Zero-Echo Validation**: Unit tests for neutral response sanitization.

## 🏗️ Phase 2: Resilience & Reliability (High Priority)
- [x] **WebSocket Heartbeats**: Implement PING/PONG for zombie connection detection.
- [x] **Structured JSON Logging**: Transition to GELF/JSON logs for easier ingestion.
- [x] **Stale Message Cleanup**: Background task to drop expired pending messages.

## ⚡ Phase 3: Performance & Modernization (Medium Priority)
- [x] **Async Refactor**: Convert remaining sync DB calls in routers (Admin, WhatsApp, Conversations).
- [x] **Pydantic v2 Upgrade**: Migrate all schemas for 10x speed boost and modern syntax.
- [x] **Distributed Task Queue**: Move background tasks to Celery/Redis (Boilerplate implemented).

## 🧪 Phase 4: Quality Assurance (Technical Debt)
- [x] **HITL Integration Tests**: End-to-end simulation of the approval pipeline (Verified via `test_hitl_pipeline.py`).
- [x] **Mock LLM Service**: Local simulator for deterministic testing (Internal mocking implemented).
- [x] **Telemetry & Metrics**: Finalize Prometheus metrics for monitoring (Instrumented).

## 🚀 Phase 5: Enterprise Scaling (Long Term)
- [x] **PostgreSQL Migration**: Prepared database.py and migration foundation.
- [x] **Multi-Tenant Database Isolation**: Added tenant_id schema across all tables (Migration v15).
- [ ] **OpenTelemetry Tracing**: Add full request-path instrumentation.

---

## 🎯 Original Phase 5: Features (In Progress)
- [x] **1. Configuration Snapshots (The "Safety Net")**
- [x] **2. Intent Analytics Dashboard**
- [x] **3. Advanced HITL Workflow** (In-chat editor with suggested replies)
- [x] **4. Automated Knowledge Ingestion** (CSV/JSON upload)
- [x] **5. Multi-Model Support**

---

## ✅ Completed Tasks
- [x] Refactor AI Agent Config (Dynamic Identity, Grounding, Intent Mapping)
- [x] Full Internationalization (en/es synchronized)
- [x] Administrative Dashboard for Knowledge Base (CRUD)
- [x] Local LLM Integration via LM Studio
- [x] Real-time HITL Dashboard with WebSockets
