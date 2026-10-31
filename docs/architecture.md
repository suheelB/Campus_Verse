# CampusVerse — Architecture Guide

## 1. Architectural Style

CampusVerse is built as a **modular monolith** with explicit module boundaries within a single deployable Spring Boot application. This provides the development speed and operational simplicity of a monolith while maintaining clean boundaries that allow future extraction into microservices if scaling demands it.

## 2. High-Level System Topology

```text
Student / Club Officer / Faculty / College Admin
                         |
                         v
             React + TypeScript Web App (Vite, Tailwind, TanStack Query)
                         |
                  HTTPS / JSON REST
                         |
                         v
              Spring Boot Application (Java)
     +------------------------------------------------+
     | Identity & Access                              |
     | Colleges / Tenant Scope                        |
     | Student Profiles                               |
     | Clubs & Memberships                            |
     | Announcements                                  |
     | Events & Registration                          |
     | Attendance                                     |
     | Notifications                                  |
     | Administration / Audit                         |
     +------------------------------------------------+
           |                 |
           v                 v
      PostgreSQL        Object Storage (Local/S3)
           |
           v
     Backups / Migrations (Flyway)
```

## 3. Modular Monolith Package Structure (Backend)

```text
com.campusverse
├── CampusVerseApplication.java
├── config/
├── shared/
│   ├── api/
│   ├── errors/
│   ├── pagination/
│   ├── time/
│   └── security/
├── identity/
├── colleges/
├── students/
├── clubs/
├── memberships/
├── announcements/
├── events/
├── registrations/
├── attendance/
├── notifications/
├── audit/
└── admin/
```

### Module Guidelines
- Each module encapsulates its own domain model, repositories, services, and controllers.
- Modules communicate through explicit service interfaces.
- No direct database access across module boundaries without a service mediator.
- Tenant scoping (`college_id`) is enforced at the repository and service layer.

## 4. Frontend Architecture

```text
frontend/src/
├── app/
│   ├── router/
│   ├── providers/
│   └── query-client.ts
├── components/
│   ├── ui/
│   ├── layout/
│   ├── feedback/
│   └── data-display/
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── clubs/
│   ├── memberships/
│   ├── announcements/
│   ├── events/
│   ├── notifications/
│   ├── admin/
│   └── profile/
├── hooks/
├── lib/
├── services/
├── types/
├── styles/
└── main.tsx
```

### Frontend Principles
- **Feature-based organization**: Code related to a specific domain (e.g., `clubs`) is grouped together.
- **TanStack Query**: Manages server state, caching, background refetching, and optimistic updates.
- **React Hook Form + Zod**: Robust type-safe form validation.
- **Tailwind CSS + shadcn/ui**: Accessible, consistent component styling.

## 5. Security Architecture

- **Authentication**: JWT-based stateless authentication or secure session cookies.
- **Authorization**: Role-Based Access Control (RBAC) combined with Resource Ownership verification on the backend.
- **Data Isolation**: Multi-tenant isolation enforced via `college_id` foreign keys and query filters.
- **Audit Logging**: Sensitive administrative actions, approvals, and role assignments are immutably logged.

## 6. Data Architecture

- **Database**: PostgreSQL as the single source of truth.
- **Migrations**: Flyway migration scripts stored in `backend/src/main/resources/db/migration/`.
- **IDs**: UUID primary keys for all domain entities.
- **Timestamps**: UTC (`timestamptz`) for all temporal data.
- **Concurrency Control**: Optimistic locking (`@Version`) and database-level unique constraints / transaction isolation for race-condition-sensitive operations (e.g., event registration capacity).