# Enterprise AI CRM: Human-in-the-Loop Orchestrator

A production-grade AI orchestration system integrating Local LLMs with WhatsApp for compliant, observable, and human-supervised customer communication.  
This project implements deterministic safety guardrails, dynamic intent mapping, and a real-time Human-in-the-Loop (HITL) approval workflow.

---

## 🧠 Overview

The Enterprise AI CRM Orchestrator combines **LLM automation**, **safety enforcement**, and **human review** into a single event-driven architecture.  
It is designed for B2B environments where customer interactions must comply with strict operational and content policies.

**Core Objectives:**
- Maintain *full control and auditability* over every AI output.
- Enforce deterministic **Guardrail logic** distinguishing *security violations* from *business out-of-scope* topics.
- Provide real-time HITL oversight for pending AI-generated responses.
- Surface rich observability data (latency, confidence, violation counts, and token metrics).

---

## ⚙️ System Architecture

**Backend Stack:** FastAPI · SQLAlchemy · WebSockets · LM Studio / OpenAI-compatible API  
**Frontend Stack:** React · TypeScript · Vite · TailwindCSS v4  
**Core Subsystems:**
1. **Guardrail Engine (Security Sentinel)**  
   - Pre-scans all inbound messages for restricted domains (political, legal, medical).  
   - Applies deterministic classification: `security_violation`, `out_of_scope`, `in_scope`.  
   - Provides Zero-Echo enforcement and cold neutral responses for flagged content.

2. **Intent Orchestrator**  
   - Dynamically constructs LLM context using UI-configured `intent_rules` and `forbidden_topics`.  
   - Generates runtime classification prompts for LLMs.  
   - Supports multi-tenant identity configuration and tone/language customization.

3. **AI Engine**  
   - Routes inference requests to a local or remote LLM endpoint.  
   - Applies post-inference auditing for confidence scores, latency metrics, and token usage.  
   - Enforces confidence-based auto-response vs manual-review thresholds.

4. **HITL Review Pipeline (WebSocket)**  
   - Maintains real-time queue for pending AI responses.  
   - Supports `Approve`, `Edit`, and `Reject` actions.  
   - Uses idempotent event tokens and backpressure-safe broadcasting.

5. **Observability & Audit**  
   - Persists every event into `SecurityAudit` (classification, latency_ms, tokens_used, triggered_keywords).  
   - Exposes `/metrics` endpoint for Prometheus scrapers.  
   - Provides latency histograms and blocked-event counters.

---

## 🔁 Concurrency Model (WebSockets)

The system uses a non-blocking, event-driven concurrency model.

**Core characteristics:**
- Each connected operator (HITL reviewer) subscribes to a WebSocket channel.  
- Incoming LLM suggestions are pushed as pending events with idempotency keys.  
- Operators perform `approve`, `edit`, or `reject` actions — each action acknowledged server-side.  
- A concurrency-safe broadcast manager ensures:
  - **No message duplication:** via UUID-based event tokens.
  - **Backpressure management:** slow clients receive bounded queues; stale sockets are dropped.  
  - **Optimistic UI synchronization:** client state updated before confirmation, then reconciled after acknowledgment.

**Flow Summary:**
1. Client submits a WhatsApp message → FastAPI receives event.  
2. Guardrail Engine classifies and pre-screens message.  
3. AI Orchestrator generates contextual system prompt → queries local LLM.  
4. Response logged with latency, confidence, and classification.  
5. If confidence < threshold → queued in HITL for manual approval via WebSocket.  
6. Approved/rejected messages persist audit events and update message state.

---

## 📊 AI Observability

The CRM Orchestrator treats observability as a **first-class subsystem**.

**Logged Metrics per Interaction:**
| Metric | Description |
|--------|--------------|
| `latency_ms` | End-to-end LLM response latency |
| `tokens_used` | Total tokens used in inference |
| `confidence_score` | Self-assessed LLM confidence (0–100) |
| `classification` | Security vs business boundary |
| `triggered_keywords` | Matched guardrail triggers |
| `audit_status` | Passed, Blocked, or Latency_Violation |

**Exported Prometheus Metrics:**
- `ai_requests_total{status}`  
- `security_violations_total{type}`  
- `auto_approved_total`  
- `manual_reviews_total`  
- `average_latency_ms`  
- `confidence_histogram_bucket`  

**Audit Schema (SQLAlchemy):**
```python
class SecurityAudit(Base):
    client_id: str
    input_message: str
    output_message: str
    intent: str
    classification: str
    confidence: int
    latency_ms: int
    tokens_used: int
    status: str
    reasoning: str
    triggered_keywords: str
```

---

## 🚀 Getting Started

### Backend Setup
```bash
cd server
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

### Frontend Setup
```bash
cd client
npm install
npm run dev
```

### Local LLM Setup
1. Open LM Studio
2. Load a model (e.g., Mistral-7B or Llama-3)
3. Start local API server on port 1234

### 🧪 Testing and Validation
- Run tests: `pytest -v`
- Static checks: `ruff check .` `mypy server/` `black --check .`

### 📈 Observability & Metrics
The system exposes Prometheus-compatible metrics at `/metrics`.

**Key Metrics:**
- `ai_requests_total`: Total AI generation requests.
- `security_violations_total`: Blocked triggers (Political, Medical, etc).
- `request_latency_ms`: Histogram of response times.

**Access:**
```bash
curl http://localhost:8000/metrics
```

### ⚙️ Configuration & Secrets
API Keys and sensitive configuration are now managed via the Database/Admin API, not `env` variables.
- navigate to `http://localhost:5173/admin` (Frontend) to configure logic.
- Keys are migrated from `.env` on first run via `migrate_secrets.py`.

---

## 🧩 **ARCHITECTURE.md — Data Flow and System Design**
See [ARCHITECTURE.md](./ARCHITECTURE.md) for sequence diagrams and detailed data flow analysis.

---

## 🧰 License
MIT License
