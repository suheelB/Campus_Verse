# CampusVerse — API Contracts

## Base Path
`/api/v1`

## Response Format
Standard JSON responses. Errors follow RFC 9457 Problem Details or consistent JSON error format:
```json
{
  "timestamp": "2026-10-31T12:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/v1/clubs"
}
```

## Endpoints Summary

### Health & Status
- `GET /api/v1/health` — Returns system status, database connection status, and version.

### Authentication
- `POST /api/v1/auth/register` — Register a new student/user.
- `POST /api/v1/auth/login` — Authenticate and obtain session/token.
- `POST /api/v1/auth/logout` — Terminate session.
- `GET /api/v1/auth/me` — Get current authenticated user profile.

### Clubs and memberships — implemented routes
- `GET /api/v1/clubs` — College-scoped active-club directory; accepts `search`, `category`, `page`, and `size` (maximum 50).
- `GET /api/v1/clubs/categories` — Available categories.
- `GET /api/v1/clubs/{clubId}` — Same-college club detail.
- `POST /api/v1/clubs` — Submit a club request; creates `PENDING_APPROVAL`.
- `GET /api/v1/clubs/mine` — Current user's submitted club requests and decisions.
- `GET /api/v1/clubs/requests` — Pending college approvals (college administrator only).
- `POST /api/v1/clubs/{clubId}/approve` and `POST /api/v1/clubs/{clubId}/reject` — Decide a pending request (college administrator only); rejection accepts `{ "reason": "..." }`.
- `GET /api/v1/clubs/{clubId}/members?status=ACTIVE` — Club members (authorized club officer or college administrator).
- `GET /api/v1/clubs/{clubId}/membership-requests` — Pending membership applications (authorized officer/admin).
- `GET /api/v1/clubs/{clubId}/roles` — Club roles (authorized officer/admin).
- `POST /api/v1/memberships/clubs/{clubId}` — Apply or reapply to join.
- `DELETE /api/v1/memberships/clubs/{clubId}` — Leave current membership.
- `GET /api/v1/memberships/me` — Current user's memberships and application statuses.
- `POST /api/v1/memberships/{membershipId}/approve` and `/reject` — Decide an application (authorized officer/admin; self-approval is denied).
- `PUT /api/v1/memberships/{membershipId}/role` — Assign an existing role from the same club (authorized officer/admin); body `{ "roleId": "..." }`.

Club and membership endpoints require authentication. Club and membership lookups are scoped to the signed-in user's college. New club requests are hidden from the directory until approved.

### Future endpoints — not implemented
- Announcement, event, attendance, notification, and admin dashboard routes listed below are planned contracts, not available APIs.

