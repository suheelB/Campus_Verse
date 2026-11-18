# Milestone 6 — Complete MVP Integration Checklist

Source of truth: root `README.md` and `docs/api-contracts.md`.

## Integration blockers identified during audit

- [ ] Event capacity is checked with a read-then-write count and is unsafe under concurrent registration.
- [ ] Event detail returns unpublished proposals to any same-college authenticated user by id.
- [ ] Attended registrations are not counted as occupied seats, so capacity, detail counts, and turnout report are wrong after check-in.
- [ ] A student sees a registration button after already being checked in.
- [ ] Event approval queue depends on the club approval query succeeding and has no rejection action.
- [ ] College-wide announcements are not dispatched as notifications.
- [ ] A club announcement can be targeted at `ALL_COLLEGE`, which silently limits delivery to the club.
- [ ] Cached user data in the browser does not refresh privileged role changes after login.
- [ ] Unauthenticated `/auth/me` returns 400 rather than 401; security entry point is missing.
- [ ] There is no documented trusted provisioning path for a college administrator.
- [ ] No Playwright end-to-end suite exists for the required MVP journey.

## Required end-to-end journey

- [ ] Student registers through the UI.
- [ ] Student completes profile fields and visibility.
- [ ] Student discovers an approved club.
- [ ] Student applies to join.
- [ ] Authorized officer approves membership.
- [ ] Student sees active membership.
- [ ] Officer publishes club announcement requiring acknowledgement.
- [ ] Student sees announcement and acknowledges it.
- [ ] Officer submits event proposal.
- [ ] College administrator approves event.
- [ ] Student registers for the published event.
- [ ] Organizer checks in the student.
- [ ] Organizer views a correct attendance report.
- [ ] Database rows are verified for club, membership, announcement receipt, event registration, and attendance.
- [ ] Permission boundaries are verified: student cannot approve membership, create announcements, approve events, or read private rosters.

## Verification commands

- [ ] `mvn test` (unit + Testcontainers integration)
- [ ] `npm test`
- [ ] `npm run build`
- [ ] `npm run test:e2e`
- [ ] Fresh-database Flyway migration check
- [ ] Health endpoint and frontend-to-backend request
