# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2026-02-06

### 🚀 Major Features
- **Dynamic Semantic Branding**: Introduced a comprehensive theming engine allowing runtime customization of primary colors, border radii, and UI density without code changes.
- **Centralized API Configuration**: Refactored frontend to use a single `api.ts` source of truth, eliminating scattered hardcoded URLs.
- **Hybrid Configuration Model**: Backend now supports environment variable defaults (`OPENAI_API_BASE`, `DEFAULT_PRIMARY_COLOR`) with database-level overrides.

### 🛠️ Improvements
- **Environment Hardening**: 
  - Externalized critical backend configurations to `os.getenv`.
  - Added `VITE_API_URL` support for flexible frontend deployment.
- **UI/UX Polish**:
  - Integrated branding tokens into all major components (ChatDashboard, Sidebar, Login).
  - Added missing translations for "Node Registry" and connection status indicators.
  - Enhanced generic "Admin" UI components to be theme-aware.

### 🐛 Bug Fixes
- Fixed hardcoded `localhost` references in `server/routers/admin.py` and `server/services/ai_agent.py`.
- Resolved linting warnings in `BrandingContext.tsx` regarding unused variables.
- Fixed inconsistent dark mode rendering in the Sidebar and Chat Window.

### 📦 CI/CD
- Added GitHub Actions workflow (`ci.yml`) for automated Backend (Pytest) and Frontend (Vite Build) verification.
