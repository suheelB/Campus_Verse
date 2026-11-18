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
- `POST /api/v1/auth/logout` — Revoke the presented bearer token server-side (`revoked_tokens`) and end the session.
- `GET /api/v1/auth/me` — Get current authenticated user profile.

Login and registration are rate limited per client address and endpoint; exceeding the budget returns `429` with a `Retry-After` header.

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

### Announcements and notifications — implemented routes
- `GET /api/v1/announcements/feed` — Paginated announcement feed visible to the signed-in user (college-wide notices, joined club member notices, and officer notices); accepts `page` and `size`.
- `GET /api/v1/announcements/{id}` — Announcement detail (scoped to eligible audience; automatically marks as read).
- `POST /api/v1/announcements` — Create announcement (club officer for club notices, college administrator for college-wide notices).
- `PUT /api/v1/announcements/{id}` — Update announcement (author, club officer, or administrator).
- `POST /api/v1/announcements/{id}/acknowledge` — Acknowledge reading an announcement that requires acknowledgement.
- `POST /api/v1/announcements/{id}/read` — Explicitly record read receipt.
- `GET /api/v1/announcements/club/{clubId}` — Announcement history for a club (authorized club officer or administrator).
- `GET /api/v1/announcements/mine` — Announcements authored by current user.
- `GET /api/v1/notifications` — Current user's in-app notification list.
- `GET /api/v1/notifications/unread-count` — Count of unread notifications for navbar indicator.
- `PUT /api/v1/notifications/{id}/read` — Mark notification as read.
- `PUT /api/v1/notifications/read-all` — Mark all notifications as read.

### Events, registration, and attendance — implemented routes
- `GET /api/v1/events` — Paginated list of events scoped to the signed-in user's college; supports `search`, `clubId`, `status`, and `upcoming` (boolean) filters.
- `GET /api/v1/events/{id}` — Event details including user-specific registration status and live capacity count.
- `POST /api/v1/events` — Create event proposal or published event (club officer with `MANAGE_EVENTS`/`MANAGE_MEMBERS` or college administrator).
- `PUT /api/v1/events/{id}` — Update event details (club officer or college administrator).
- `POST /api/v1/events/{id}/publish` — Publish event for student discovery.
- `POST /api/v1/events/{id}/cancel` — Cancel event and broadcast cancellation notification to all registered attendees.
- `POST /api/v1/events/{id}/approve` — College admin approves event proposal (`PENDING_APPROVAL` -> `PUBLISHED`).
- `POST /api/v1/events/{id}/reject` — College admin rejects event proposal with optional reason.
- `POST /api/v1/events/{id}/register` — Student registers for event. Enforces deadline and capacity; automatically places student on waitlist if event capacity is reached.
- `DELETE /api/v1/events/{id}/register` — Student cancels registration. Safely and atomically promotes the next waitlisted student to `REGISTERED` and dispatches notification.
- `GET /api/v1/events/registrations/me` — Current student's event registrations and waitlist statuses.
- `GET /api/v1/events/{id}/registrations` — Private roster of registered and waitlisted students (authorized club officer or college admin).
- `POST /api/v1/events/{id}/check-in` — Organizer checks in attendee by user ID or email (idempotent, records timestamp, officer ID, and method; marks registration as `ATTENDED`).
- `GET /api/v1/events/{id}/attendance` — Event check-in attendance list (authorized club officer or college admin).
- `GET /api/v1/events/{id}/attendance/report` — Turnout and attendance rate report (capacity, total registered, waitlisted, attended, and percentage).

### Administrators — implemented routes
- `GET /api/v1/admin/audit-logs` — College-scoped audit trail for college and platform administrators. Accepts `action`, `entityType`, `entityId`, `page`, and `size`; the response page size is capped at 100. Non-administrators receive `403`, and entries are always scoped to the caller's college.

## Audit events
The API records audit entries for `AUTH_REGISTER`, `AUTH_LOGIN`, `AUTH_LOGOUT`, `CLUB_REQUEST`, `CLUB_APPROVE`, `CLUB_REJECT`, `MEMBERSHIP_APPLY`, `MEMBERSHIP_APPROVE`, `MEMBERSHIP_REJECT`, `MEMBERSHIP_LEAVE`, `MEMBERSHIP_ROLE_ASSIGN`, `ANNOUNCEMENT_CREATE`, `ANNOUNCEMENT_PUBLISH`, `ANNOUNCEMENT_EXPIRE`, `ANNOUNCEMENT_ACKNOWLEDGE`, `EVENT_CREATE`, `EVENT_UPDATE`, `EVENT_PUBLISH`, `EVENT_APPROVE`, `EVENT_REJECT`, `EVENT_CANCEL`, and `EVENT_CHECK_IN`.

