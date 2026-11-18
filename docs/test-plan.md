# CampusVerse — Test Plan

## 1. Testing Strategy

CampusVerse uses complementary layers:

- **Backend unit tests**: JUnit 5 and Mockito cover service rules, permission checks, lifecycle transitions, and college isolation. Run with `mvn test`.
- **Backend database integration tests**: A Spring Boot test executes real SQL against PostgreSQL, including a concurrency test for event capacity. Testcontainers cannot attach to the Docker 29 Desktop socket in this environment, so the database test is opt-in and uses a disposable database:
  ```bash
  docker compose exec postgres createdb -U campusverse campusverse_it
  cd backend
  mvn -Dtest=EventRegistrationConcurrencyTest -Dcampusverse.it.enabled=true test
  ```
  Override `CAMPUSVERSE_IT_DB_URL`, `CAMPUSVERSE_IT_DB_USER`, and `CAMPUSVERSE_IT_DB_PASSWORD` to point at another disposable database.
- **Security and permission tests**: Service tests and the end-to-end suite verify 401/403 responses, self-approval prevention, private roster protection, and cross-college isolation.
- **Frontend unit tests**: Vitest covers API clients and request contracts. Run with `npm test` from `frontend/`.
- **End-to-end tests**: Playwright drives the real React app, Spring Boot API, and PostgreSQL. The suite has no mocked HTTP and verifies persisted database rows. Run with:
  ```bash
  cd frontend
  npx playwright install chromium
  npm run test:e2e
  ```
  Playwright starts Vite on port `5174` (proxying `/api` to `localhost:8080`) unless `E2E_BASE_URL` or `E2E_NO_WEBSERVER` is set. The suite requires the Docker Compose PostgreSQL and backend to be running. It provisions a college administrator through `scripts/grant-college-admin.mjs`, which is the trusted operational path; there is no public role-grant API.
- **Migration verification**: Flyway runs on application startup with `ddl-auto: validate`. A clean database check confirms all migrations apply from scratch.

## 2. Critical Test Scenarios (MVP Acceptance)

1. **Health check**: `GET /api/v1/health` returns `UP` with `database: CONNECTED`.
2. **Authentication**: Registration and login succeed; invalid credentials return 401; unauthenticated protected endpoints return 401; duplicate email registration returns 409.
3. **Tenant isolation**: A user from College A cannot read or modify College B data; cross-college club detail and applications return 404.
4. **Club request workflow**: A student request stays private to college administrators, then approval makes it discoverable and grants the requester an officer membership.
5. **Membership workflow**: Applications persist, duplicate pending/active applications conflict, officer decisions persist, and self-approval or unauthorized role assignment is denied.
6. **Announcements and receipts**: Officer announcements reach active members, acknowledgement requires a matching receipt row, and non-officers cannot publish.
7. **Events and capacity**: Officers submit proposals; only college administrators approve them; unpublished proposals are invisible to students; concurrent registrations cannot exceed capacity; cancellation promotes the waitlist.
8. **Attendance**: Organizers check students in exactly once, attendance reports count `REGISTERED + ATTENDED` registrations, and private rosters are limited to organizers and administrators.
9. **Full MVP journey (Playwright)**: Register → profile → discover club → apply → officer approves → announcement + acknowledgement → event proposal → administrator approval → student registration → check-in → attendance report, with direct PostgreSQL assertions for every persisted state and negative permission checks.

## 3. Milestone 7 Security and Maintenance Checks

### Automated
- `AuditServiceTest`: entries capture college/actor/action/entity/details, unscoped writes are skipped, and a persistence failure does not break the caller.
- `TokenRevocationServiceTest`: revocation stores `jti` and expiry, expired tokens are not stored, missing `jti` is skipped, and lookup consults the store.
- `AuthRateLimiterTest`: attempts up to the budget are allowed, keys are independent, the budget resets after the window, and the filter returns `429` with `Retry-After` and a JSON body.
- `AnnouncementMaintenanceTest`: due scheduled announcements publish and past-dated announcements become `EXPIRED`, both audited.
- Existing service tests continue to cover college isolation, self-approval, and permission checks with the new `AuditService` dependency.

### Runtime probes
All six were executed against the Milestone 7 build on 2026-11-18 and passed:

1. Login and registration return `429` after the configured budget. Observed: ten `401` invalid-credential responses, then `429` with `Retry-After: 59` and a JSON body.
2. A token used after `POST /auth/logout` returns `401`. Observed: `/auth/me` returned `200` before logout, logout `200`, then `401`, with one `revoked_tokens` row.
3. `GET /admin/audit-logs` returns `403` for a student and only same-college entries for an administrator. Observed: student `403`; the administrator saw exactly the five `demo-college` entries while a `state-university` entry was excluded.
4. `GET /admin/audit-logs` rejects `size` above 100 by capping the response page size. Observed: `size=500` returned `size: 100`.
5. Response headers include `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, and `Permissions-Policy`. Observed on `/health`; HSTS is emitted only over HTTPS by design.
6. Setting `expires_at` in the past on a published announcement transitions it to `EXPIRED` after the maintenance interval. Observed: `PUBLISHED` → `EXPIRED` with an `ANNOUNCEMENT_EXPIRE` audit row.

