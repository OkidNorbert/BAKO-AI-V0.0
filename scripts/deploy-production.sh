#!/bin/bash

# Basketball Performance System - Production Deployment Script
set -e

echo "🏀 Basketball Performance System - Production Deployment"
echo "========================================================"

# Configuration
NAMESPACE="basketball-performance"
REGISTRY="ghcr.io/your-org/basketball-performance"
VERSION=${1:-latest}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed"
        exit 1
    fi
    
    # Check if helm is installed
    if ! command -v helm &> /dev/null; then
        log_warn "helm is not installed (optional)"
    fi
    
    # Check kubectl connection
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    log_info "Prerequisites check passed"
}

# Create namespace
create_namespace() {
    log_info "Creating namespace: $NAMESPACE"
    kubectl apply -f k8s/namespace.yaml
}

# Deploy secrets
deploy_secrets() {
    log_info "Deploying secrets..."
    
    # Check if secrets exist
    if kubectl get secret basketball-secrets -n $NAMESPACE &> /dev/null; then
        log_warn "Secrets already exist, skipping..."
        return
    fi
    
    # Create secrets (you should replace these with actual values)
    kubectl create secret generic basketball-secrets \
        --from-literal=database-url="postgresql://user:password@postgres:5432/basketball" \
        --from-literal=redis-url="redis://redis:6379/0" \
        --from-literal=jwt-secret="your-jwt-secret-key" \
        --from-literal=minio-access-key="minioadmin" \
        --from-literal=minio-secret-key="minioadmin" \
        -n $NAMESPACE
    
    log_info "Secrets created"
}

# Deploy database
deploy_database() {
    log_info "Deploying database..."
    
    # Deploy PostgreSQL
    kubectl apply -f k8s/postgres-deployment.yaml
    
    # Wait for database to be ready
    log_info "Waiting for database to be ready..."
    kubectl wait --for=condition=ready pod -l app=postgres -n $NAMESPACE --timeout=300s
    
    log_info "Database deployed successfully"
}

# Deploy Redis
deploy_redis() {
    log_info "Deploying Redis..."
    
    kubectl apply -f k8s/redis-deployment.yaml
    
    # Wait for Redis to be ready
    log_info "Waiting for Redis to be ready..."
    kubectl wait --for=condition=ready pod -l app=redis -n $NAMESPACE --timeout=300s
    
    log_info "Redis deployed successfully"
}

# Deploy AI Service
deploy_ai_service() {
    log_info "Deploying AI Service..."
    
    # Update image version in deployment
    sed -i "s|image: .*|image: $REGISTRY/ai-service:$VERSION|g" k8s/ai-service-deployment.yaml
    
    kubectl apply -f k8s/ai-service-deployment.yaml
    
    # Wait for AI service to be ready
    log_info "Waiting for AI Service to be ready..."
    kubectl wait --for=condition=ready pod -l app=basketball-ai-service -n $NAMESPACE --timeout=600s
    
    log_info "AI Service deployed successfully"
}

# Deploy Backend
deploy_backend() {
    log_info "Deploying Backend..."
    
    # Update image version in deployment
    sed -i "s|image: .*|image: $REGISTRY/backend:$VERSION|g" k8s/backend-deployment.yaml
    
    kubectl apply -f k8s/backend-deployment.yaml
    
    # Wait for backend to be ready
    log_info "Waiting for Backend to be ready..."
    kubectl wait --for=condition=ready pod -l app=basketball-backend -n $NAMESPACE --timeout=300s
    
    log_info "Backend deployed successfully"
}

# Deploy Frontend
deploy_frontend() {
    log_info "Deploying Frontend..."
    
    # Update image version in deployment
    sed -i "s|image: .*|image: $REGISTRY/frontend:$VERSION|g" k8s/frontend-deployment.yaml
    
    kubectl apply -f k8s/frontend-deployment.yaml
    
    # Wait for frontend to be ready
    log_info "Waiting for Frontend to be ready..."
    kubectl wait --for=condition=ready pod -l app=basketball-frontend -n $NAMESPACE --timeout=300s
    
    log_info "Frontend deployed successfully"
}

# Deploy Monitoring
deploy_monitoring() {
    log_info "Deploying Monitoring..."
    
    # Deploy Prometheus
    kubectl apply -f k8s/prometheus-deployment.yaml
    
    # Deploy Grafana
    kubectl apply -f k8s/grafana-deployment.yaml
    
    log_info "Monitoring deployed successfully"
}

# Deploy Ingress
deploy_ingress() {
    log_info "Deploying Ingress..."
    
    kubectl apply -f k8s/ingress.yaml
    
    log_info "Ingress deployed successfully"
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    
    # Get backend pod name
    BACKEND_POD=$(kubectl get pods -l app=basketball-backend -n $NAMESPACE -o jsonpath='{.items[0].metadata.name}')
    
    # Run migrations
    kubectl exec $BACKEND_POD -n $NAMESPACE -- alembic upgrade head
    
    log_info "Database migrations completed"
}

# Health check
health_check() {
    log_info "Performing health checks..."
    
    # Check backend health
    BACKEND_SERVICE=$(kubectl get service basketball-backend -n $NAMESPACE -o jsonpath='{.spec.clusterIP}')
    if curl -f http://$BACKEND_SERVICE:8000/health &> /dev/null; then
        log_info "✅ Backend health check passed"
    else
        log_error "❌ Backend health check failed"
        exit 1
    fi
    
    # Check AI service health
    AI_SERVICE=$(kubectl get service basketball-ai-service -n $NAMESPACE -o jsonpath='{.spec.clusterIP}')
    if curl -f http://$AI_SERVICE:8001/health &> /dev/null; then
        log_info "✅ AI Service health check passed"
    else
        log_error "❌ AI Service health check failed"
        exit 1
    fi
    
    log_info "All health checks passed"
}

# Main deployment function
main() {
    log_info "Starting production deployment..."
    log_info "Version: $VERSION"
    log_info "Namespace: $NAMESPACE"
    
    check_prerequisites
    create_namespace
    deploy_secrets
    deploy_database
    deploy_redis
    deploy_ai_service
    deploy_backend
    deploy_frontend
    deploy_monitoring
    deploy_ingress
    run_migrations
    health_check
    
    log_info "🎉 Production deployment completed successfully!"
    log_info "Access the application at: https://basketball-performance.your-domain.com"
}

# Run main function
main "$@"
