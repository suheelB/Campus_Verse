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
4. **Club tenant isolation**: A user cannot read clubs from another college, request membership outside their college, or manage a different college's club.
5. **Club request workflow**: Student request persists as pending, stays out of directory, then only an authorized same-college administrator can approve/reject it.
6. **Membership workflow**: Student application persists; duplicate pending/active applications conflict; officer/admin decisions persist; self-approval and unauthorized role assignment are denied.
7. **Membership lifecycle**: Member can leave; rejected or left user can reapply while uniqueness is retained.
8. **Events and attendance** (future milestone): registration, capacity, check-in and report scenarios after implementation.

