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

# Run with Maven wrapper
./mvnw spring-boot:run

# Or build and run the JAR
./mvnw clean package -DskipTests
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
| `JWT_SECRET` | JWT signing secret | Required (256+ bits) |
| `JWT_EXPIRATION_MS` | Token expiry | `86400000` (24h) |
| `APP_BASE_URL` | Frontend URL | `http://localhost:5173` |

## Database Migrations

Flyway migrations are located in `backend/src/main/resources/db/migration/`. They run automatically on application startup.

To run migrations manually:
```bash
cd backend
./mvnw flyway:migrate
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
│   └── implementation-progress.md
├── docker-compose.yml
├── .env.example
└── README.md
```

## API Endpoints

### Health
- `GET /api/v1/health` - System health check

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Get current user

### Clubs (coming soon)
- `GET /api/v1/clubs` - List clubs
- `POST /api/v1/clubs` - Create club
- `GET /api/v1/clubs/{id}` - Get club details

## Testing

### Backend
```bash
cd backend
./mvnw test
```

### Frontend
```bash
cd frontend
npm run test
```

### E2E (Playwright - coming soon)
```bash
cd frontend
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