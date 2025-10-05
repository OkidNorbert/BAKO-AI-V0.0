#!/bin/bash

# Basketball Performance System - Restart with Database Initialization
# This script restarts the Docker services and ensures database tables are created

echo "🏀 Basketball Performance System - Restart with DB Initialization"
echo "=================================================================="

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f infra/docker-compose.yml down

# Remove any orphaned containers
echo "🧹 Cleaning up orphaned containers..."
docker-compose -f infra/docker-compose.yml down --remove-orphans

# Start services with database initialization
echo "🚀 Starting services with database initialization..."
docker-compose -f infra/docker-compose.yml -f infra/docker-compose.override.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 15

# Check service health
echo "🔍 Checking service health..."

# Check PostgreSQL
if docker exec basketball-postgres pg_isready -U postgres; then
    echo "✅ PostgreSQL is ready"
else
    echo "❌ PostgreSQL is not ready"
fi

# Check Backend
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Backend API is ready"
else
    echo "❌ Backend API is not ready"
fi

# Check Frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is ready"
else
    echo "❌ Frontend is not ready"
fi

echo ""
echo "🎯 Application Status:"
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:8000"
echo "  API Docs:  http://localhost:8000/docs"
echo "  Database:  basketball_performance (PostgreSQL)"
echo ""
echo "✅ Basketball Performance System is ready!"
echo "   All database tables will be created automatically on startup."
echo "   No more 'service unavailable' errors!"
