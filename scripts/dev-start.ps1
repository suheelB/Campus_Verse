#!/usr/bin/env pwsh
# CampusVerse Development Startup Script (Windows PowerShell)

param(
    [switch]$NoBuild
)

Write-Host "🚀 Starting CampusVerse Development Environment" -ForegroundColor Green

# Check for Docker
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker is not installed. Please install Docker first." -ForegroundColor Red
    exit 1
}

if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker Compose is not installed. Please install Docker Compose first." -ForegroundColor Red
    exit 1
}

# Check for .env file
if (-not (Test-Path ".env")) {
    Write-Host "📝 Creating .env from .env.example" -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "⚠️  Please edit .env with your configuration before continuing" -ForegroundColor Yellow
    Write-Host "   Especially: POSTGRES_PASSWORD, JWT_SECRET" -ForegroundColor Yellow
    Read-Host "Press Enter to continue after editing .env, or Ctrl+C to exit..."
}

# Load environment variables
if (Test-Path ".env") {
    $envContent = Get-Content .env -Raw
    foreach ($line in $envContent -split "`n") {
        $line = $line.Trim()
        if ($line -and -not $line.StartsWith("#")) {
            $parts = $line -split "=", 2
            if ($parts.Count -eq 2) {
                $env:$parts[0] = $parts[1]
            }
        }
    }
}

# Start PostgreSQL first
Write-Host "🐘 Starting PostgreSQL..." -ForegroundColor Cyan
docker-compose up -d postgres

# Wait for PostgreSQL to be healthy
Write-Host "⏳ Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
$postgresReady = $false
for ($i = 0; $i -lt 30; $i++) {
    try {
        $result = docker-compose exec -T postgres pg_isready -U $env:POSTGRES_USER -d $env:POSTGRES_DB
        if ($result -like "*accepting connections*") {
            $postgresReady = $true
            break
        }
    } catch { }
    Start-Sleep -Seconds 2
}

if (-not $postgresReady) {
    Write-Host "❌ PostgreSQL failed to start within timeout" -ForegroundColor Red
    exit 1
}
Write-Host "✅ PostgreSQL is ready" -ForegroundColor Green

# Start backend
Write-Host "🔧 Starting Backend..." -ForegroundColor Cyan
docker-compose up -d backend

# Wait for backend health
Write-Host "⏳ Waiting for Backend to be ready..." -ForegroundColor Yellow
$backendReady = $false
for ($i = 0; $i -lt 30; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080/api/v1/health/liveness" -Method Get -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $backendReady = $true
            break
        }
    } catch { }
    Start-Sleep -Seconds 2
}

if (-not $backendReady) {
    Write-Host "❌ Backend failed to start within timeout" -ForegroundColor Red
    docker-compose logs backend
    exit 1
}
Write-Host "✅ Backend is ready" -ForegroundColor Green

# Start frontend
Write-Host "🎨 Starting Frontend..." -ForegroundColor Cyan
docker-compose up -d frontend

Write-Host ""
Write-Host "✅ CampusVerse is running!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "🔧 Backend API: http://localhost:8080/api/v1" -ForegroundColor Cyan
Write-Host "💚 Health Check: http://localhost:8080/api/v1/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "To view logs: docker-compose logs -f" -ForegroundColor Gray
Write-Host "To stop: docker-compose down" -ForegroundColor Gray