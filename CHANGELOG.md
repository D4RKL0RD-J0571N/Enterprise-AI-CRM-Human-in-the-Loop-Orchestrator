# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-01-17

### Added
- **Conversation Management**:
  - Right-click Context Menus for Sidebar (Pin, Archive) and Messages (Copy, Delete, Edit).
  - Backend API endpoints for Pin/Unpin and Archive/Unarchive.
  - Database schema migration (v3) adding `is_archived` and `is_pinned` columns.
- **AI Metadata & HITL**:
  - Frontend display for AI Intent, Confidence Score, and Reasoning.
  - "AI is thinking..." visual indicator during generation.
  - Backend logic to analyze and store metadata for every AI response.
- **UI Improvements**:
  - Optimistic UI updates for instant "Approve/Reject" feedback.
  - Trash icon on hover for message deletion.
  - Timestamp formatting and sender differentiation.
  - Fully functional Dark/Light mode toggle.

### Changed
- Refactored `ChatDashboard.tsx` to include `InfoPanel` and `Sidebar` components.
- Updated database schema (v2) to include `confidence` and `metadata_json` in messages.
- Moved `Sidebar` logic to its own component with auto-refresh polling.

### Fixed
- Fixed bug where new messages were overwriting old ones due to missing ID broadcast.
- Fixed stale state issues where "Approve" button wouldn't update UI until refresh.
- Resolved TypeScript errors and syntax issues in Sidebar and Dashboard components.
