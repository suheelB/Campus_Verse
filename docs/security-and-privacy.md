# CampusVerse — Security and Privacy Policy

## 1. Authentication & Session Management
- Passwords are securely hashed using BCrypt with strength factor 12.
- Stateless JWT bearer tokens expire according to `JWT_EXPIRATION_MS` (24 hours by default). The signing key must be at least 32 bytes; the application refuses to start with a weaker `JWT_SECRET`.
- Every token carries a unique `jti`. `POST /auth/logout` stores that identifier in `revoked_tokens`, and every authenticated request checks it, so a logged-out token is rejected server-side even if the client kept a copy.
- Expired revoked-token rows are purged hourly; the table therefore stays proportional to recent logouts rather than growing forever.
- Failed login attempts are rejected with `401` and a JSON body; authentication errors never include stack traces.

## 2. Authorization & Tenant Scoping
- **Role-Based Access Control (RBAC)**: Platform roles (Student, College Admin, Platform Admin) and club roles (President, Officer, etc.).
- **Resource Ownership**: Users can only modify their own profiles and resources they own.
- **Tenant Isolation**: All queries and resource lookups are strictly scoped by `college_id`. A user from College A cannot access private data from College B.
- Club endpoints scope directory, detail, creator request history, membership lists, and decisions to the authenticated user's college. Foreign-college club details return not found.
- College and platform administrator checks read `platform_role_assignments` server-side; student registration cannot set a privileged role.
- Club officers need an active membership whose server-stored club role includes `MANAGE_MEMBERS` to process applications or assign a role. Applicants cannot approve their own request.
- The creator becomes a club officer only after a college administrator approves the club request. Admin provisioning currently requires a trusted operational process; there is no public role-grant route.
- `CollegeAdminGuard` centralises the college-administrator check for administrative surfaces and re-reads the database on every call, so a stale token cannot preserve privilege that has been revoked in the database.

## 3. Data Protection
- No plaintext passwords, API keys, or secrets stored in code or logs.
- Database connections use TLS in production.
- Inputs are validated using Bean Validation (Jakarta Validation) and DTOs.
- Parameterized queries via JPA/Hibernate prevent SQL injection.
- JSONB columns (`clubs.social_links`, `club_roles.permissions`, `audit_logs.details`) are written through typed Hibernate JSON mappings rather than string casts.

## 4. Audit Logging
- Sensitive actions are written to `audit_logs`: registration, login, logout, club requests/approvals/rejections, membership apply/approve/reject/leave/role assignment, announcement create/publish/expire/acknowledge, event create/update/publish/approve/reject/cancel, and attendance check-in.
- Each entry records the college, the acting user, the action, the entity type and identifier, structured JSON details, the client IP, and a timestamp.
- Audit writes share the action's transaction, so an entry commits together with the action it describes. A failed insert is logged as `Failed to persist audit entry`; inside a transactional service call the transaction then fails, and in non-transactional paths (for example logout) the response still completes.
- `GET /admin/audit-logs` returns the college-scoped trail, supports `action`, `entityType`, and `entityId` filters, and is limited to college or platform administrators. Page size is capped at 100.
- Audit records are append-only through the application: no update or delete endpoints exist. Retention is an operational policy (see `docs/pilot-readiness.md`).

## 5. Abuse Prevention and Transport Hardening
- Login and registration are rate limited per client address and endpoint (default 10 attempts per 60 seconds, configurable with `AUTH_RATE_LIMIT_MAX_ATTEMPTS` and `AUTH_RATE_LIMIT_WINDOW_SECONDS`). Exceeding the budget returns `429` with a `Retry-After` header.
- The limiter is in-memory and therefore per instance. A multi-instance pilot should move the counter to a shared store such as Redis.
- Client identity comes from `X-Forwarded-For` when present, otherwise from the direct peer address. Deploy the API behind a trusted reverse proxy that overwrites this header, and never expose the backend port publicly; otherwise a client could spoof the header to reset its own budget.
- Responses set `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, a restrictive `Permissions-Policy`, and HSTS on HTTPS requests.
- CORS is restricted to the configured origins (`CORS_ALLOWED_ORIGINS`), and only the documented HTTP methods are allowed.
- `401` and `403` responses are JSON and independent of stack traces.

## 6. Privacy
- Minimum necessary data collection.
- Profile visibility settings let students control what others see.
- Data retention policies for event registrations, attendance, and activity records are described in `docs/pilot-readiness.md`.
