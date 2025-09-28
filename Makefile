# Basketball Performance System - Development Commands

.PHONY: help up down restart logs test test-backend test-ai-service test-frontend test-coverage clean build dev-backend dev-ai-service dev-frontend

# Default target
help:
	@echo "Basketball Performance System - Development Commands"
	@echo ""
	@echo "Available commands:"
	@echo "  up              Start all services with Docker Compose"
	@echo "  down            Stop all services"
	@echo "  restart         Restart all services"
	@echo "  logs            View logs from all services"
	@echo "  test            Run all tests"
	@echo "  test-backend    Run backend tests only"
	@echo "  test-ai-service Run AI service tests only"
	@echo "  test-frontend   Run frontend tests only"
	@echo "  test-coverage   Run tests with coverage report"
	@echo "  clean           Clean up containers and volumes"
	@echo "  build           Build all Docker images"
	@echo "  dev-backend     Start backend in development mode"
	@echo "  dev-ai-service  Start AI service in development mode"
	@echo "  dev-frontend    Start frontend in development mode"

# Docker Compose commands
up:
	@echo "Starting Basketball Performance System..."
	docker-compose -f infra/docker-compose.yml up -d
	@echo "Services started! Access:"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend:  http://localhost:8000"
	@echo "  AI Service: http://localhost:8001"
	@echo "  MinIO:    http://localhost:9001"

down:
	@echo "Stopping all services..."
	docker-compose -f infra/docker-compose.yml down

restart:
	@echo "Restarting all services..."
	docker-compose -f infra/docker-compose.yml restart

logs:
	docker-compose -f infra/docker-compose.yml logs -f

# Testing commands
test:
	@echo "Running all tests..."
	docker-compose -f infra/docker-compose.yml exec backend pytest
	docker-compose -f infra/docker-compose.yml exec ai-service pytest
	docker-compose -f infra/docker-compose.yml exec frontend npm test

test-backend:
	@echo "Running backend tests..."
	docker-compose -f infra/docker-compose.yml exec backend pytest

test-ai-service:
	@echo "Running AI service tests..."
	docker-compose -f infra/docker-compose.yml exec ai-service pytest

test-frontend:
	@echo "Running frontend tests..."
	docker-compose -f infra/docker-compose.yml exec frontend npm test

test-coverage:
	@echo "Running tests with coverage..."
	docker-compose -f infra/docker-compose.yml exec backend pytest --cov=app
	docker-compose -f infra/docker-compose.yml exec ai-service pytest --cov=service
	docker-compose -f infra/docker-compose.yml exec frontend npm run test:coverage

# Development commands
dev-backend:
	@echo "Starting backend in development mode..."
	cd backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-ai-service:
	@echo "Starting AI service in development mode..."
	cd ai_service && python -m uvicorn service.main:app --reload --host 0.0.0.0 --port 8001

dev-frontend:
	@echo "Starting frontend in development mode..."
	cd frontend && npm run dev

# Build and clean commands
build:
	@echo "Building all Docker images..."
	docker-compose -f infra/docker-compose.yml build

clean:
	@echo "Cleaning up containers and volumes..."
	docker-compose -f infra/docker-compose.yml down -v --remove-orphans
	docker system prune -f

# Database commands
db-init:
	@echo "Initializing database..."
	docker-compose -f infra/docker-compose.yml exec backend python scripts/init_db.py

db-migrate:
	@echo "Running database migrations..."
	docker-compose -f infra/docker-compose.yml exec backend alembic upgrade head

db-reset:
	@echo "Resetting database..."
	docker-compose -f infra/docker-compose.yml exec backend alembic downgrade base
	docker-compose -f infra/docker-compose.yml exec backend alembic upgrade head

# Health checks
health:
	@echo "Checking service health..."
	@curl -f http://localhost:8000/health || echo "Backend: ❌"
	@curl -f http://localhost:8001/health || echo "AI Service: ❌"
	@curl -f http://localhost:3000 || echo "Frontend: ❌"
