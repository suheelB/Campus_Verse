# CampusVerse — Implementation Progress

## Milestone 0 — Requirements and architecture
**Status:** Existing documentation set present; not re-audited for implementation completeness in this milestone.

## Milestone 1 — Runnable foundation
**Status:** Baseline projects and Compose configuration exist. Frontend production build is verified. Backend Docker build is being re-run after Milestone 3 changes. PostgreSQL startup/migration verification is pending.

## Milestone 2 — Authentication and profiles
**Status:** Authentication, JWT, student profile, and college association code exists. This milestone has not been re-tested end to end during the Milestone 3 work. Local accounts use BCrypt and a signed bearer token; logout originally removed the token client-side only and now revokes it server-side (Milestone 7).

## Milestone 3 — Clubs and memberships
**Status:** Completed and verified.

### Implemented in this work
- Added Flyway V4 migration with club creator foreign key and indexes.
- Added college-scoped club directory API with search, category filter, pagination (maximum 50/page), detail, and category list.
- Added student club requests, creator request history, and college administrator review endpoints.
- Added persisted membership applications, reapplication after rejection/leave, leaving, student membership list, officer request queue, active member list, and club-role assignment.
- Added backend checks for active account, college scope, college-admin role assignments, club officer permission, self-approval prohibition, and duplicate membership uniqueness.
- Added directory, club detail/join, my-clubs/dashboard, and club management UI with loading, empty, error, and action feedback states.
- Added and verified unit tests in `ClubServiceTest` covering college isolation, duplicate application prevention, self-approval prevention, unauthorized role assignment restriction, and member leave lifecycle.
- Added and verified frontend unit tests in `clubsApi.test.ts` covering directory queries, application submission, approval/rejection decisions, and leaving a club.

### Verification
- `npm --prefix frontend run build`: passed cleanly (`tsc -b && vite build`).
- `npm --prefix frontend test`: 4/4 unit tests passed with Vitest.
- `mvn test`: 5/5 unit tests passed in `ClubServiceTest`.
- PostgreSQL/Flyway runtime migration: verified V1-V4 tables and constraints active in PostgreSQL.
- Docker containers: `campusverse-backend`, `campusverse-frontend`, and `campusverse-postgres` verified operational.

### Known limitations and remaining work
- College administrators must be provisioned through a trusted administrative process into `platform_role_assignments`; public registration cannot grant privileged roles.
- Membership capacity limits are not currently enforced, and club privacy modes beyond public clubs are not surfaced in this MVP UI.
- Sensitive club and membership decisions are permission-checked and persisted, but audit logging table is scheduled for Milestone 7.

## Milestone 4 — Announcements and notifications
**Status:** Completed and verified.

### Implemented in this work
- Added Flyway V5 migration (`V5__announcements_notifications.sql`) defining `announcements`, `announcement_receipts`, and `notifications` tables with foreign keys and deduplication indexes.
- Added Announcement domain model supporting priorities (`NORMAL`, `IMPORTANT`, `URGENT`), target audiences (`ALL_COLLEGE`, `CLUB_MEMBERS`, `CLUB_OFFICERS`), statuses (`DRAFT`, `SCHEDULED`, `PUBLISHED`, `EXPIRED`, `ARCHIVED`), and acknowledgement requirements.
- Implemented announcement publication and scheduling with permission boundary checks: club announcements require club officer permission (`MANAGE_MEMBERS`), while college-wide announcements require college administrator privileges.
- Implemented audience-restricted announcement feed and view endpoints enforcing college isolation and club membership checks.
- Implemented read receipts (`read_at`) and member acknowledgement tracking (`acknowledged_at`) with aggregate view/acknowledgement counts for authors and officers.
- Implemented notification dispatch engine triggering in-app notifications to targeted club members with deduplication keys to prevent duplicate alerts.
- Implemented user notifications API: list with pagination, unread badge counter (`GET /notifications/unread-count`), individual mark-as-read, and bulk `markAllAsRead`.
- Built frontend announcements experience (`AnnouncementsPage.tsx`) with priority filter chips, pending acknowledgement filter, compose modal, and inline acknowledgement action.
- Built frontend notifications inbox (`NotificationsPage.tsx`) with unread status indicators and mark-all-read capability.
- Added live unread notification badge and navigation link to application header (`Header.tsx`).
- Surfaced priority announcements and pending acknowledgement actions directly on student dashboard (`DashboardPage.tsx`).
- Added and verified unit tests in `AnnouncementServiceTest` covering officer authorization, audience restrictions, college-wide admin requirement, and member acknowledgement workflow.
- Added and verified frontend tests in `announcementsApi.test.ts` covering feed fetching, creation, acknowledgement, and notification read flows.

### Verification
- `npm --prefix frontend test`: 9/9 unit tests passed with Vitest.
- `npm --prefix frontend run build`: passed cleanly (`tsc -b && vite build`).
- `mvn test`: 9/9 unit tests passed (5 in `ClubServiceTest`, 4 in `AnnouncementServiceTest`).
- Database migration V5 applied to PostgreSQL with all tables and indexes.

### Known limitations and remaining work
- Expired announcement background sweeper can be enhanced with scheduled cron in Milestone 7; query-level expiration filtering is active.
- Email/SMS notification channels are deferred to post-MVP; in-app notification engine is active.

## Milestone 5 — Events and attendance
**Status:** Complete.

### Implemented capabilities
- Database migration `V6__events_attendance.sql` defining `events`, `event_registrations`, and `event_attendance` with status constraints and performance indexes.
- Complete backend event lifecycle:
  - Event proposal creation, updates, publish, admin approval, rejection, and cancellation.
  - College-scoped event discovery with upcoming/past filtering and text search.
  - Deadlines and capacity enforcement with automated waitlist queueing when full.
  - Safe, atomic waitlist promotion on registration cancellation with instant user notification.
  - Organizer check-in desk (by user ID or email lookup) with idempotent attendance tracking and `ATTENDED` registration status updates.
  - Turnout report endpoint calculating capacity, registered count, waitlisted count, attended count, and attendance turnout percentage.
- Frontend event system:
  - `EventsPage.tsx` with search, club filtering, upcoming/past toggle, registration indicators, and Host Event modal for authorized officers.
  - `EventDetailPage.tsx` with full details, capacity meter, self-serve register/cancel actions, and organizer control center.
  - `EventCheckInModal.tsx` for real-time attendee roster search, 1-click check-in, and manual email check-in.
  - Top navigation bar and student dashboard integration with event quick links.
- Verified test suites:
  - Backend `EventServiceTest.java`: 8/8 tests passing (17/17 total backend tests passing).
  - Frontend `eventsApi.test.ts`: 5/5 tests passing (14/14 total frontend tests passing).
  - TypeScript compilation and Vite production build verified cleanly.

## Milestone 6 — Complete MVP integration
**Status:** Completed and verified.

### Implemented in this work
- Fixed club creation returning `500`: `clubs.social_links` and `club_roles.permissions` are PostgreSQL `jsonb`, now mapped with `@JdbcTypeCode(SqlTypes.JSON)` in `Club` and `ClubRole`.
- Fixed `scripts/grant-college-admin.mjs` to pass SQL to `psql` over stdin (variables do not interpolate with `-c`) and added a college-administrator provisioning path.
- Added the development origin `http://localhost:5174` to CORS and documented the split between the Docker build (`5173`) and the Vite dev server (`5174`).
- Verified the admin path end to end: a student requests a club (`201`), an administrator approves it (`200`), and the creator receives an active "Club officer" membership with `MANAGE_MEMBERS`.
- Rebuilt the Docker frontend so the administrator approval queue and management screens are present in the production build.
- Added a Playwright MVP journey covering registration, profile completion, club request/approval, membership approval, announcements, event proposal/approval, registration, check-in, turnout reporting, and cross-college isolation checks.

### Verification
- `POST /api/v1/clubs` → `201`; `POST /api/v1/clubs/{id}/approve` → `200`.
- PostgreSQL membership state after approval: `ACTIVE|ACTIVE|Club officer|["MANAGE_MEMBERS"]`.
- Frontend `200` on `http://localhost:5173` and the `/api` proxy.
- Full end-to-end run recorded under Milestone 7.

## Milestone 7 — Security, quality, and pilot readiness
**Status:** Completed and verified.

### Security
- Added migration `V7__audit_and_token_revocation.sql` with `audit_logs` and `revoked_tokens` plus college/actor/entity/action indexes.
- Added the `com.campusverse.audit` package: `AuditLog`, repository, `AuditService`, and the administrator-only, college-scoped `GET /admin/audit-logs` endpoint (filter by `action`, `entityType`, `entityId`; page size capped at 100).
- Instrumented sensitive flows with audit writes: registration, login, logout, club request/approve/reject, membership apply/approve/reject/leave/role assignment, announcement create/publish/expire/acknowledge, event create/update/publish/approve/reject/cancel, and attendance check-in.
- Added `CollegeAdminGuard`, which re-reads `platform_role_assignments` on every call so a stale token cannot preserve removed privilege.
- JWT access tokens now carry a `jti`. `POST /auth/logout` records the `jti` in `revoked_tokens`, and `JwtAuthenticationFilter` rejects revoked tokens on every request. Expired rows are purged hourly.
- `JwtTokenProvider` refuses to start when `JWT_SECRET` is shorter than 32 bytes.
- Added `AuthRateLimiter` + `AuthRateLimitFilter`: login and registration are limited per client address and endpoint (default 10 attempts per 60 seconds) and return `429` with `Retry-After`.
- Added security headers in `SecurityConfig`: frame denial, `nosniff`, `Referrer-Policy: no-referrer`, a restrictive `Permissions-Policy`, and HSTS on HTTPS requests.

### Quality and automation
- Added `@EnableScheduling` and `MaintenanceJobs`: scheduled announcements are published when due, expired announcements become `EXPIRED`, and revoked tokens are purged.
- Added unit tests: `AuditServiceTest`, `TokenRevocationServiceTest`, `AuthRateLimiterTest` (including the filter's `429` response), and `AnnouncementMaintenanceTest`.
- Added a flat ESLint 9 configuration (`frontend/eslint.config.js`) with `typescript-eslint`, `react-hooks`, and `react-refresh`; replaced `any` in mutation handlers with `apiErrorMessage(error: unknown, fallback)`.
- Added `.github/workflows/ci.yml`: backend `mvn -B verify` on Java 21, frontend lint/test/build on Node 20, and Docker image builds.
- Updated the backend Dockerfile to Java 21 and switched the runtime to an unprivileged user.

### Verification
- `mvn test`: 36 tests run, 0 failures, 0 errors, 1 skipped (opt-in concurrency test); `BUILD SUCCESS`.
- `npm run test`: 14/14 tests passed (3 files).
- `npm run lint`: 0 errors, 1 warning (`react-refresh` fast-refresh advisory in `AuthContext.tsx`).
- `npm run build`: `tsc -b && vite build` passed.
- Flyway V1–V7 applied to PostgreSQL; `GET /api/v1/health` returned `200`.
- Runtime probes on 2026-11-18: security headers present; ten invalid logins followed by `429` with `Retry-After: 59`; a token returned `401` after logout with a `revoked_tokens` row; a student received `403` from `/admin/audit-logs` while a college administrator saw only that college's entries and `size=500` was capped to `100`; a past-dated published announcement became `EXPIRED` with an `ANNOUNCEMENT_EXPIRE` audit row.
- After rebuilding the backend image, `GET /api/v1/health` returned `200` and the same header/rate-limit/logout probes passed against the container.
- Playwright MVP journey passed against the hardened backend (1/1, 31.4s): registration, profile, club request and approval, membership approval, announcement acknowledgement, event proposal and approval, registration, check-in, turnout report, and cross-college isolation checks.

### Documentation
- Added `docs/pilot-readiness.md` (deployment hardening, secrets, backup/restore, monitoring, incident response, retention).
- Rewrote `docs/security-and-privacy.md` for the implemented controls.
- Updated `README.md` (Java 21 Docker runtime, rate-limit and maintenance variables, endpoint list, testing commands).
- Updated `docs/test-plan.md` and `docs/milestone-7-checklist.md`.

### Known limitations
- The auth rate limiter is in-memory and per instance; a multi-instance pilot should move counters to Redis.
- Audit writes share the action's transaction so the trail and the action stay consistent. Failed inserts are logged as `Failed to persist audit entry`; in transactional service paths the action then fails, while non-transactional paths such as logout still return normally.
- The Testcontainers concurrency test cannot attach to the local Docker 29 socket; it remains opt-in against a disposable database.

