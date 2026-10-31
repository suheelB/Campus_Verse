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

### Clubs
- `GET /api/v1/clubs` — List/search clubs (with category, search, pagination).
- `POST /api/v1/clubs` — Propose a new club.
- `GET /api/v1/clubs/{clubId}` — Get club details.
- `PATCH /api/v1/clubs/{clubId}` — Update club details.
- `POST /api/v1/clubs/{clubId}/submit-for-approval` — Submit club for admin review.
- `POST /api/v1/clubs/{clubId}/approve` — Approve club (Admin).
- `POST /api/v1/clubs/{clubId}/reject` — Reject club (Admin).

### Memberships
- `POST /api/v1/clubs/{clubId}/membership-applications` — Apply to join club.
- `GET /api/v1/clubs/{clubId}/membership-applications` — List applications (Officer).
- `POST /api/v1/clubs/{clubId}/membership-applications/{applicationId}/approve` — Approve application.
- `POST /api/v1/clubs/{clubId}/membership-applications/{applicationId}/reject` — Reject application.
- `POST /api/v1/clubs/{clubId}/leave` — Leave club.
- `GET /api/v1/clubs/{clubId}/members` — List active club members.

### Announcements
- `GET /api/v1/announcements` — List visible announcements.
- `POST /api/v1/clubs/{clubId}/announcements` — Create announcement.
- `POST /api/v1/announcements/{announcementId}/publish` — Publish announcement.
- `POST /api/v1/announcements/{announcementId}/acknowledge` — Acknowledge announcement.

### Events & Attendance
- `GET /api/v1/events` — List published events.
- `POST /api/v1/clubs/{clubId}/events` — Create event.
- `GET /api/v1/events/{eventId}` — Event details.
- `POST /api/v1/events/{eventId}/registrations` — Register for event.
- `DELETE /api/v1/events/{eventId}/registrations/me` — Cancel registration.
- `POST /api/v1/events/{eventId}/check-in` — Check in attendee (Organizer).
- `GET /api/v1/events/{eventId}/attendance` — View attendance records.

### Notifications
- `GET /api/v1/notifications` — List user notifications.
- `POST /api/v1/notifications/{notificationId}/read` — Mark notification read.

### Admin
- `GET /api/v1/admin/dashboard` — Admin overview.
- `GET /api/v1/admin/audit-logs` — View audit logs.
