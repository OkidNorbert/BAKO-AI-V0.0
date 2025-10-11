#!/bin/bash

# Basketball Performance Analysis System - Automated Setup Script
# This script automates the setup process for the Basketball Performance Analysis System

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if Docker is running
check_docker_running() {
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to install Docker on Ubuntu/Debian
install_docker_ubuntu() {
    print_status "Installing Docker on Ubuntu/Debian..."
    
    # Update package index
    sudo apt-get update
    
    # Install required packages
    sudo apt-get install -y \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # Add Docker's official GPG key
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    
    # Set up the repository
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
        $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Update package index again
    sudo apt-get update
    
    # Install Docker Engine
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Start and enable Docker
    sudo systemctl start docker
    sudo systemctl enable docker
    
    # Add user to docker group
    sudo usermod -aG docker $USER
    
    print_success "Docker installed successfully!"
    print_warning "Please log out and log back in for Docker group changes to take effect."
}

# Function to install Docker on Kali Linux
install_docker_kali() {
    print_status "Installing Docker on Kali Linux..."
    
    # Update package index
    sudo apt-get update
    
    # Install Docker
    sudo apt-get install -y docker.io docker-compose
    
    # Start and enable Docker
    sudo systemctl start docker
    sudo systemctl enable docker
    
    # Add user to docker group
    sudo usermod -aG docker $USER
    
    print_success "Docker installed successfully!"
    print_warning "Please log out and log back in for Docker group changes to take effect."
}

# Function to detect OS and install Docker
install_docker() {
    if command_exists docker; then
        print_success "Docker is already installed!"
        return
    fi
    
    print_status "Docker not found. Installing Docker..."
    
    # Detect OS
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        case $ID in
            ubuntu|debian)
                install_docker_ubuntu
                ;;
            kali)
                install_docker_kali
                ;;
            *)
                print_error "Unsupported operating system: $ID"
                print_status "Please install Docker manually and run this script again."
                exit 1
                ;;
        esac
    else
        print_error "Cannot detect operating system."
        print_status "Please install Docker manually and run this script again."
        exit 1
    fi
}

# Function to create .env file if it doesn't exist
create_env_file() {
    if [[ ! -f .env ]]; then
        print_status "Creating .env file..."
        cat > .env << EOF
# Database Configuration
POSTGRES_DB=basketball_performance
POSTGRES_USER=basketball_user
POSTGRES_PASSWORD=basketball_password
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379

# MinIO Configuration
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123
MINIO_HOST=minio
MINIO_PORT=9000

# Backend Configuration
BACKEND_HOST=backend
BACKEND_PORT=8000
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AI Service Configuration
AI_SERVICE_HOST=ai-service
AI_SERVICE_PORT=8001

# Frontend Configuration
FRONTEND_HOST=frontend
FRONTEND_PORT=3000

# Production Configuration
ENVIRONMENT=production
DEBUG=false
EOF
        print_success ".env file created!"
    else
        print_status ".env file already exists, skipping creation."
    fi
}

# Function to start services
start_services() {
    print_status "Starting Basketball Performance Analysis System..."
    
    # Check if Docker is running
    check_docker_running
    
    # Stop any existing services to avoid port conflicts
    print_status "Stopping any existing services..."
    sudo docker-compose -f infra/docker-compose.yml down 2>/dev/null || true
    sudo docker-compose -f infra/docker-compose.prod.yml down 2>/dev/null || true
    
    # Start production services (recommended)
    print_status "Starting production services..."
    sudo docker-compose --env-file .env -f infra/docker-compose.prod.yml up --build -d
    
    # Wait for services to start
    print_status "Waiting for services to start..."
    sleep 30
    
    # Check service status
    print_status "Checking service status..."
    sudo docker-compose -f infra/docker-compose.prod.yml ps
    
    print_success "Services started successfully!"
}

# Function to display access information
show_access_info() {
    echo ""
    print_success "🎉 Basketball Performance Analysis System is now running!"
    echo ""
    echo -e "${GREEN}Access URLs:${NC}"
    echo "  🌐 Frontend:        http://localhost:3000"
    echo "  🔧 Backend API:     http://localhost:8000"
    echo "  🤖 AI Service:      http://localhost:8001"
    echo "  📦 MinIO Console:   http://localhost:9001"
    echo "  📊 Grafana:         http://localhost:3001"
    echo "  📈 Prometheus:      http://localhost:9090"
    echo ""
    echo -e "${GREEN}Default Credentials:${NC}"
    echo "  MinIO Console:"
    echo "    Username: minioadmin"
    echo "    Password: minioadmin123"
    echo ""
    echo -e "${GREEN}Useful Commands:${NC}"
    echo "  View logs:          sudo docker-compose -f infra/docker-compose.prod.yml logs [service]"
    echo "  Stop services:      sudo docker-compose -f infra/docker-compose.prod.yml down"
    echo "  Restart services:   sudo docker-compose -f infra/docker-compose.prod.yml restart"
    echo "  Check status:       sudo docker-compose -f infra/docker-compose.prod.yml ps"
    echo ""
}

# Function to run health checks
run_health_checks() {
    print_status "Running health checks..."
    
    # Check if services are responding
    local services=("http://localhost:8000/health" "http://localhost:3000" "http://localhost:8001/health")
    local service_names=("Backend" "Frontend" "AI Service")
    
    for i in "${!services[@]}"; do
        if curl -s -f "${services[$i]}" >/dev/null 2>&1; then
            print_success "${service_names[$i]} is healthy"
        else
            print_warning "${service_names[$i]} is not responding (this might be normal during startup)"
        fi
    done
}

# Main setup function
main() {
    echo -e "${BLUE}"
    echo "🏀 Basketball Performance Analysis System - Automated Setup"
    echo "=========================================================="
    echo -e "${NC}"
    
    # Check if we're in the right directory
    if [[ ! -f "infra/docker-compose.yml" ]]; then
        print_error "Please run this script from the project root directory."
        exit 1
    fi
    
    # Install Docker if needed
    install_docker
    
    # Create .env file if needed
    create_env_file
    
    # Start services
    start_services
    
    # Run health checks
    run_health_checks
    
    # Show access information
    show_access_info
    
    print_success "Setup completed successfully! 🎉"
}

# Run main function
main "$@"
