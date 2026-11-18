# CampusVerse

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

Campus Community Operating System for Colleges

## Overview

CampusVerse is a campus community platform that helps students discover clubs, join activities, organize events, collaborate across clubs, find volunteer opportunities, and build a verified record of extracurricular contributions.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, React Hook Form, Zod
- **Backend**: Java 21, Spring Boot 3.3, Spring Security, Spring Data JPA, Flyway
- **Database**: PostgreSQL 16
- **Infrastructure**: Docker, Docker Compose
- **CI/CD**: GitHub Actions

## Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local frontend development)
- Java 21 (for local backend development)
- Maven 3.9+ (or use the included wrapper)

## Quick Start (Docker)

```bash
# Clone the repository
git clone <repository-url>
cd campusverse

# Copy environment template
cp .env.example .env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8080/api/v1
- Health Check: http://localhost:8080/api/v1/health

## Local Development

### Backend

```bash
cd backend

# Copy environment template
cp ../.env.example .env

# Run with Maven
mvn spring-boot:run

# Or build and run the JAR
mvn clean package -DskipTests
java -jar target/campusverse-backend-0.0.1-SNAPSHOT.jar
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_DB` | Database name | `campusverse` |
| `POSTGRES_USER` | Database user | `campusverse` |
| `POSTGRES_PASSWORD` | Database password | Required |
| `DATABASE_URL` | JDBC URL | `jdbc:postgresql://localhost:5432/campusverse` |
| `SERVER_PORT` | Backend port | `8080` |
| `CORS_ALLOWED_ORIGINS` | CORS origins | `http://localhost:5173` |
| `JWT_SECRET` | JWT signing secret (32+ bytes) | Required (256+ bits) |
| `JWT_EXPIRATION_MS` | Token expiry | `86400000` (24h) |
| `AUTH_RATE_LIMIT_MAX_ATTEMPTS` | Login/registration attempts per window | `10` |
| `AUTH_RATE_LIMIT_WINDOW_SECONDS` | Rate-limit window | `60` |
| `MAINTENANCE_ANNOUNCEMENT_INTERVAL_MS` | Scheduled/expired announcement sweep interval | `60000` |
| `MAINTENANCE_TOKEN_PURGE_INTERVAL_MS` | Revoked-token purge interval | `3600000` |
| `APP_BASE_URL` | Frontend URL | `http://localhost:5173` |

## Database Migrations

Flyway migrations are located in `backend/src/main/resources/db/migration/`. They run automatically on application startup.

To run migrations manually:
```bash
cd backend
mvn flyway:migrate
```

## Project Structure

```
campusverse/
├── backend/                 # Spring Boot application
│   ├── src/main/java/com/campusverse/
│   │   ├── config/          # Configuration classes
│   │   ├── shared/          # Shared utilities (errors, API, security)
│   │   ├── identity/        # Authentication & users
│   │   ├── colleges/        # College/workspace management
│   │   ├── students/        # Student profiles
│   │   ├── clubs/           # Club management
│   │   ├── memberships/     # Club memberships
│   │   ├── announcements/   # Announcements
│   │   ├── events/          # Events
│   │   ├── registrations/   # Event registrations
│   │   ├── attendance/      # Attendance tracking
│   │   ├── notifications/   # Notifications
│   │   ├── audit/           # Audit logging
│   │   └── admin/           # Admin features
│   └── src/main/resources/
│       ├── application.yml
│       └── db/migration/    # Flyway SQL migrations
├── frontend/                # React application
│   ├── src/
│   │   ├── app/             # App providers, router
│   │   ├── components/      # Shared components
│   │   ├── features/        # Feature-based modules
│   │   ├── hooks/           # Custom hooks
│   │   ├── lib/             # Utility functions
│   │   ├── services/        # API clients
│   │   ├── types/           # TypeScript types
│   │   └── styles/          # Global styles
├── infrastructure/          # Docker, deployment configs
├── docs/                    # Documentation
│   ├── product-requirements.md
│   ├── architecture.md
│   ├── database-design.md
│   ├── security-and-privacy.md
│   ├── api-contracts.md
│   ├── test-plan.md
│   ├── pilot-readiness.md
│   └── implementation-progress.md
├── docker-compose.yml
├── .env.example
└── README.md
```

## API endpoints
- `GET /api/v1/health` - Backend/database health check.
- `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me` - Authentication and current-user endpoints.

## Clubs
- `GET /api/v1/clubs` - Search and browse clubs in the signed-in user's college (supports `search`, `category`, `page`, and `size`).
- `GET /api/v1/clubs/categories` - List club categories.
- `GET /api/v1/clubs/{clubId}` - Get same-college club details.
- `POST /api/v1/clubs` - Submit a new club request for administrator approval.
- `GET /api/v1/clubs/mine` - See your submitted club requests.
- `GET /api/v1/clubs/requests` - College administrator approval queue.
- `POST /api/v1/clubs/{clubId}/approve` - Approve a pending club request.
- `POST /api/v1/clubs/{clubId}/reject` - Reject a pending club request.

## Memberships
- `POST /api/v1/memberships/clubs/{clubId}` - Apply/reapply to join an active club.
- `GET /api/v1/memberships/me` - List your memberships and application statuses.
- `DELETE /api/v1/memberships/clubs/{clubId}` - Leave a club.
- `GET /api/v1/clubs/{clubId}/membership-requests` - Officer/admin review queue.
- `POST /api/v1/memberships/{membershipId}/approve` - Approve a membership application.
- `POST /api/v1/memberships/{membershipId}/reject` - Reject a membership application.
- `GET /api/v1/clubs/{clubId}/members` - List club members (authorized officers/admins).
- `GET /api/v1/clubs/{clubId}/roles` - List club roles (authorized officers/admins).
- `PUT /api/v1/memberships/{membershipId}/role` - Assign a role in that club (authorized officers/admins).

All endpoints except health and authentication require a bearer token. See `docs/api-contracts.md` for access rules.

## Announcements, events, attendance, and notifications
- `/api/v1/announcements`, `/api/v1/events`, `/api/v1/notifications` - Feed, lifecycle, registration, waitlist, check-in, turnout reporting, and in-app notifications.
- `/api/v1/admin/audit-logs` - College-scoped audit trail for college/platform administrators (supports `action`, `entityType`, and `entityId` filters).
- `POST /api/v1/auth/logout` revokes the presented token server-side.

## Security
- JWT logout revocation, audit logging, auth rate limiting, and security headers are documented in `docs/security-and-privacy.md`.
- Operational hardening, secrets, backups, monitoring, incident response, and data retention are documented in `docs/pilot-readiness.md`.



## Testing

### Backend
```bash
cd backend
mvn test
```

The event-capacity concurrency test uses a disposable database and is opt-in:
```bash
docker compose exec postgres createdb -U campusverse campusverse_it
mvn -Dtest=EventRegistrationConcurrencyTest -Dcampusverse.it.enabled=true test
```

### Frontend
```bash
cd frontend
npm run lint
npm run test
npm run build
```

### E2E (Playwright)
The end-to-end suite needs the Docker backend, PostgreSQL, and a Vite dev server
on port 5174:
```bash
cd frontend
npm run dev -- --port 5174
npm run test:e2e
```

## Development Guidelines

1. **Security**: Never commit secrets. Use environment variables.
2. **Database**: All schema changes via Flyway migrations.
3. **API**: Use DTOs, not entities. Validate all inputs.
4. **Frontend**: Feature-based structure. Use TanStack Query for server state.
5. **Testing**: Write tests for business logic and critical paths.

## License

Apache License 2.0 - see [LICENSE](LICENSE) file for details.