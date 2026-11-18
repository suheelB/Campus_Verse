# Milestone 7 — Security, Quality, and Pilot Readiness Checklist

Source: `README.md`, `docs/security-and-privacy.md`, and the known limitations recorded in `docs/implementation-progress.md`.

## Security
- [x] Persist an immutable audit trail for sensitive actions (club requests/approvals, membership decisions, role changes, announcements, event lifecycle, check-in, authentication).
- [x] Expose an administrator-only, college-scoped audit log query endpoint (`GET /admin/audit-logs`).
- [x] Revoke JWT access tokens server-side on logout (`revoked_tokens` + `jti` check in the authentication filter).
- [x] Purge expired revoked tokens automatically (hourly maintenance job).
- [x] Add bounded rate limiting for login and registration to slow credential-stuffing attempts (`AuthRateLimitFilter`, `429` + `Retry-After`).
- [x] Set explicit security headers (frame denial, content-type sniffing, referrer policy, permissions policy, HSTS behind HTTPS).
- [x] Keep 401/403 responses JSON and never leak stack traces.
- [x] Ensure privileged roles are only granted by the trusted provisioning script (`scripts/grant-college-admin.mjs`; no public grant route).

## Quality and automation
- [x] Add automated announcement publishing and expiry (`expires_at` → `EXPIRED`) so stale notices stop appearing.
- [x] Add unit tests for audit logging, token revocation, rate limiting, and announcement expiry.
- [x] Keep all existing backend unit tests green (`mvn test`: 36 run, 0 failures, 1 opt-in skip).
- [x] Keep frontend unit tests, TypeScript build, and lint green (14 tests; ESLint 0 errors, 1 advisory warning).
- [x] Add a CI workflow that builds and tests backend and frontend (`.github/workflows/ci.yml`).
- [x] Align the Dockerfile build and runtime with the documented Java 21 stack.
- [x] Update `README.md`, security docs, test plan, and implementation progress with verified results.

## Pilot readiness
- [x] Document deployment hardening, secret management, backup/restore, monitoring, and incident response (`docs/pilot-readiness.md`).
- [x] Document data retention guidance for attendance and audit records.
- [x] Verify health endpoint, migrations, and hardening probes after the Milestone 7 build (Flyway V1–V7 applied, health `200`, headers, rate limit, logout revocation, audit scoping, announcement expiry).
- [x] Run the complete MVP journey end to end against the hardened build (Playwright).
