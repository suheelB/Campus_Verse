#!/bin/bash
# CampusVerse Development Startup Script (Linux/macOS)

set -e

echo "🚀 Starting CampusVerse Development Environment"

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check for .env file
if [ ! -f .env ]; then
    echo "📝 Creating .env from .env.example"
    cp .env.example .env
    echo "⚠️  Please edit .env with your configuration before continuing"
    echo "   Especially: POSTGRES_PASSWORD, JWT_SECRET"
    read -p "Press Enter to continue after editing .env, or Ctrl+C to exit..."
fi

# Start PostgreSQL first
echo "🐘 Starting PostgreSQL..."
docker-compose up -d postgres

# Wait for PostgreSQL to be healthy
echo "⏳ Waiting for PostgreSQL to be ready..."
until docker-compose exec -T postgres pg_isready -U "${POSTGRES_USER:-campusverse}" -d "${POSTGRES_DB:-campusverse}" > /dev/null 2>&1; do
    sleep 2
done
echo "✅ PostgreSQL is ready"

# Start backend
echo "🔧 Starting Backend..."
docker-compose up -d backend

# Wait for backend health
echo "⏳ Waiting for Backend to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:8080/api/v1/health/liveness > /dev/null 2>&1; then
        echo "✅ Backend is ready"
        break
    fi
    sleep 2
done

# Start frontend
echo "🎨 Starting Frontend..."
docker-compose up -d frontend

echo ""
echo "✅ CampusVerse is running!"
echo ""
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend API: http://localhost:8080/api/v1"
echo "💚 Health Check: http://localhost:8080/api/v1/health"
echo ""
echo "To view logs: docker-compose logs -f"
echo "To stop: docker-compose down"