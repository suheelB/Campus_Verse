# CampusVerse — Test Plan

## 1. Testing Strategy

CampusVerse employs a multi-layered testing approach:
- **Backend Unit Tests**: JUnit 5 and Mockito for domain logic, services, and validators.
- **Backend Integration Tests**: Spring Boot Test with Testcontainers (PostgreSQL) for repositories, migrations, and database constraints.
- **Security Tests**: Spring Security test mockMvc tests verifying unauthenticated access, role restrictions, and tenant data isolation.
- **Concurrency Tests**: Multi-threaded tests verifying event capacity limits and race-condition safety.
- **Frontend Tests**: Vitest and React Testing Library for components, forms, and client hooks.
- **End-to-End Tests**: Playwright scripts covering core user journeys (registration, club joining, event registration, check-in).

## 2. Critical Test Scenarios (MVP Acceptance)

1. **Health Check**: `/api/v1/health` returns status UP and database connection verified.
2. **User Authentication**: Valid registration and login succeed; invalid credentials return 401; protected endpoints reject unauthenticated requests.
3. **Tenant Isolation**: User from College A cannot read or modify data belonging to College B.
4. **Club Lifecycle**: Student proposes club; college admin approves; club becomes active in directory.
5. **Membership Workflow**: Student applies to join club; officer approves; membership becomes active.
6. **Event Registration & Capacity**: Student registers for event; duplicate registration is rejected; concurrent registrations cannot exceed capacity.
7. **Attendance Check-in**: Authorized organizer checks in registered attendee; duplicate check-in is prevented.
