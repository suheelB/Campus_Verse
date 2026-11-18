# CampusVerse — Pilot Readiness Guide

This guide covers the operational work required to run CampusVerse for a limited
pilot group (one or two colleges, a few hundred accounts).

## 1. Deployment hardening

- Run the stack behind TLS. The application sets HSTS only for secure requests, so
  terminate TLS at a reverse proxy or load balancer and forward
  `X-Forwarded-Proto: https`.
- Do not publish PostgreSQL on a public interface. In `docker-compose.yml` it is
  bound to the host for local development only; remove that mapping in production.
- Run containers as non-root. The backend image now creates and uses an
  unprivileged `campusverse` user.
- Keep the frontend and backend images on the same release. The frontend nginx
  config proxies `/api` to the backend service name, so no browser-visible API
  origin is required.
- Restrict the CORS allow-list to the deployed frontend origin:
  `CORS_ALLOWED_ORIGINS=https://app.example.edu`.
- Set `JWT_EXPIRATION_MS` to a pilot-appropriate lifetime (24 hours by default).
  Shorter lifetimes reduce exposure if a token leaks; logout revocation covers
  explicit sign-outs.

## 2. Secret management

| Secret | Variable | Guidance |
| --- | --- | --- |
| JWT signing key | `JWT_SECRET` | At least 32 random bytes. The backend refuses to start with a shorter value. Rotate by deploying a new value and accepting that existing sessions end. |
| Database password | `POSTGRES_PASSWORD` | Generated per environment, stored in the platform secret store. |
| Database URL / user | `DATABASE_URL`, `POSTGRES_USER` | Injected by the platform, never committed. |
| College administrator provisioning | `scripts/grant-college-admin.mjs` | Run by an operator with database access; never expose as an HTTP endpoint. |

Never commit `.env`. The repository contains `.env.example` with placeholders
only.

## 3. Backup and restore

- Take a daily `pg_dump` of the `campusverse` database and retain at least 14
  daily copies plus one monthly copy.
- Test the restore path before the pilot starts:
  ```bash
  docker compose exec -T postgres pg_dump -U campusverse -Fc campusverse > campusverse.dump
  docker compose exec -T postgres pg_restore -U campusverse -d campusverse_restore --clean --if-exists < campusverse.dump
  ```
  (create `campusverse_restore` first, then point a staging backend at it).
- Back up the database and the JWT secret together; restoring data without the
  matching secret invalidates all outstanding sessions.

## 4. Monitoring and alerting

- Scrape `GET /api/v1/actuator/health` (and `/actuator/health/liveness`,
  `/actuator/health/readiness`) from the platform.
- Alert on:
  - backend health failures,
  - HTTP 5xx rate above 1% over five minutes,
  - `429` spikes (possible credential stuffing or a broken client),
  - log lines containing `Failed to persist audit entry`,
  - `Scheduled task` failures (announcement publishing/expiry, token purge).
- Logs are structured JSON rows in the container runtime. Ship them to the
  platform log store; do not rely on local container logs for retention.

## 5. Incident response

1. **Suspected token compromise**: rotate `JWT_SECRET` and redeploy. All sessions
   end immediately.
2. **Suspected account takeover**: deactivate the account (`users.status`), which
   blocks login and API access, then review `audit_logs` for the actor.
3. **Suspected privilege escalation**: remove the row from
   `platform_role_assignments` or the club role assignment. Authorisation checks
   read the database on every request, so the next call is denied.
4. **Abusive traffic**: lower `AUTH_RATE_LIMIT_MAX_ATTEMPTS` and, for a
   multi-instance deployment, move the limiter to a shared store.
5. Record an incident note with timestamps, affected accounts, and the audit
   query used to scope the impact.

## 6. Data retention

| Data | Suggested retention | Notes |
| --- | --- | --- |
| Audit logs | 12 months | Required for investigations; export before pruning. |
| Revoked tokens | Until the token's original expiry | Purged automatically by the hourly maintenance job. |
| Event registrations and attendance | Duration of the academic year plus one year | Supports co-curricular records; anonymise on request. |
| Notifications | 90 days | Purely operational. |
| Announcement receipts | Duration of the announcement plus one year | Supports acknowledgement evidence. |

Deletion requests should remove or anonymise profile data while retaining audit
entries in a form that no longer identifies the individual where local policy
requires it.

## 7. Pilot verification checklist

- [x] Backend and frontend images rebuild, all containers run, and the containerised site returns `200` (`http://localhost:5173` and its `/api/v1/health` proxy).
- [x] Flyway migrations V1–V7 applied (`flyway_schema_history` shows success).
- [x] `GET /api/v1/health` returns `200`.
- [x] A student can register and a college administrator can view college-scoped audit logs.
- [x] Login and registration rate limits return `429` after the configured budget.
- [x] Logout invalidates the token for subsequent requests.
- [x] Announcement expiry marks past-dated announcements `EXPIRED`.
- [x] A student can complete a profile, request a club, and be approved (covered by the Playwright journey).
- [x] A college administrator can approve events (covered by the Playwright journey).
- [ ] Backups restore into a scratch database.
