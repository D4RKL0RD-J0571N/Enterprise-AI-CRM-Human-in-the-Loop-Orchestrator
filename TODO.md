# 📝 Project Roadmap & TODO

## 🎯 Phase 5: Production Readiness & Advanced Governance

- [x] **1. Configuration Snapshots (The "Safety Net")**
    - Implement versioning for AI configurations.
    - Add "Rollback" functionality in the Admin UI.
    - Automatically snapshot on every "Save".
- [x] **2. Intent Analytics Dashboard**
    - Track intent frequency over time.
    - Visualize top customer inquiries in the Admin panel.
- [ ] **3. Advanced Human-in-the-loop (HITL) Workflow**
    - In-chat prompt editor for AI suggestions.
    - Batch approval/rejection mode.
- [ ] **4. Automated Knowledge Ingestion**
    - Support for CSV/JSON file uploads for the Knowledge Base.
    - Bulk import/export of grounding data.
- [ ] **5. Multi-Model Support (The "Switcher")**
    - Dropdown to select different LLM backends (OpenAI, Anthropic, Local).
    - Per-tenant model preference storage.

---

## ✅ Completed Tasks
- [x] Refactor AI Agent Config (Dynamic Identity, Grounding, Intent Mapping)
- [x] Full Internationalization (en/es synchronized)
- [x] Administrative Dashboard for Knowledge Base (CRUD)
- [x] Local LLM Integration via LM Studio
- [x] Real-time HITL Dashboard with WebSockets
