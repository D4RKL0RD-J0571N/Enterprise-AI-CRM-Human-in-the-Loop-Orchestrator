[English](QA_MANUAL.md) | [Español](QA_MANUAL.es.md)

# 📋 QA Manual Review Checklist

Before declaring any version "production-stable", use this checklist for human review.

## 👥 Clients & Conversations
- [ ] **Action Hub**: Click the menu, move cursor around. 
  - *Expected*: Menu stays open until an option is clicked or you click outside.
- [ ] **Sidebar Search**: Type a name, wait for results.
  - *Expected*: Zero lag, results filter correctly.

## ⚙️ Admin Settings
- [ ] **SnapshotsTab → Hover**: Move over snapshot rows.
  - *Expected*: Edit/Rename/Delete buttons are visible (40% base, 100% hover), responsive, and cause no layout jumps.
- [ ] **BrandingTab → Precision**: Rapidly switch between primary colors.
  - *Expected*: Smooth transition, no flicker, preview updates in real-time.

## 💻 Dashboard & Layout
- [ ] **Workspace State**: Move windows, refresh page.
  - *Expected*: Layout is restored exactly as before; no desync between browser and server.
- [ ] **Focus Mode**: Toggle between Canvas and Focus.
  - *Expected*: Animation is smooth, content scales appropriately.

## 📁 Exports & Files
- [ ] **PDF Export**: Click "Export" on an order or chat (if available).
  - *Expected*: Real file download starts; no placeholder alerts or broken links.

---
## ⚡ 5-Minute Deployment Sanity Check
Before you hit "Deploy," run this 5-minute manual "Sanity Check":

| Task | Goal |
| :--- | :--- |
| **Visual Check** | Open Branding tab; resize browser to "Mobile" and "Tablet" widths. |
| **Console Check** | Open DevTools; click "View Activity Log." Are there red errors? |
| **Auth Check** | Log out and log back in. (The most common "silent" fail). |
| **Seeding Check** | Run `python server/seed_config.py` and verify sample data in Chat. |

## 🛡️ Senior QA Safety Rules

1. **Master the "Baseline" Update**: If CI fails on a visual diff, verify manually with `npx playwright show-report`. If correct, run `npx playwright test --update-snapshots` and commit the new images.
2. **Guard against "Flaky" Tests**: Never use hardcoded timeouts. Use `locator.waitFor()` or robust state expectations. If a test fails once but passes on retry, fix the race condition immediately.
3. **The "Production Mirror" Check**: Ensure `baseURL` in `playwright.config.ts` matches the target environment (Staging/Prod) before final sign-off.

---
## 🤖 Automated Testing Suite
New Comprehensive Test Suite for Backend & Frontend verification.

### 1. Backend Integration Tests
Run these scripts to verify core API logic, database integrity, and AI pipelines.
```bash
# Verify Auth, Products, Clients, Orders
python test_products.py && python test_clients.py && python test_orders.py

# Verify WhatsApp Webhook & AI Response Loop
python test_chat_flow.py
```

### 2. Frontend E2E Tests (Playwright)
Run the full browser-based verification suite.
```bash
cd client
# Use --workers=1 for SQLite stability on local/CI environments
npx playwright test --grep @stable --workers=1
```

### 3. Database Maintenance (Docker)
If you encounter schema errors, use these scripts inside the container:
```bash
# Reset Admin Password
docker compose exec backend python reset_admin_docker.py

# Check DB Schemas
docker compose exec backend python check_tables.py
docker compose exec backend python check_columns.py
```

---
*Last Updated: 2026-02-06*
