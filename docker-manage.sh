#!/bin/bash

# EmpclERP Docker Management Script
# This script provides common Docker operations for the EmpclERP system

set -e

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

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to show help
show_help() {
    echo "EmpclERP Docker Management Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start       Start all services"
    echo "  stop        Stop all services"
    echo "  restart     Restart all services"
    echo "  build       Build all images"
    echo "  logs        Show logs for all services"
    echo "  status      Show status of all services"
    echo "  clean       Clean up containers, images, and volumes"
    echo "  db          Access database CLI"
    echo "  migrate     Run Prisma migrations"
    echo "  seed        Seed the database"
    echo "  health      Check health of all services"
    echo "  help        Show this help message"
    echo ""
}

# Function to start services
start_services() {
    print_status "Starting EmpclERP services..."
    docker-compose up -d
    print_success "Services started successfully!"
    print_status "Access the application at:"
    echo "  Frontend: http://localhost:9000"
    echo "  Backend:  http://localhost:4000"
    echo "  pgAdmin:  http://localhost:5051"
}

# Function to stop services
stop_services() {
    print_status "Stopping EmpclERP services..."
    docker-compose down
    print_success "Services stopped successfully!"
}

# Function to restart services
restart_services() {
    print_status "Restarting EmpclERP services..."
    docker-compose restart
    print_success "Services restarted successfully!"
}

# Function to build images
build_images() {
    print_status "Building EmpclERP images..."
    docker-compose build --no-cache
    print_success "Images built successfully!"
}

# Function to show logs
show_logs() {
    print_status "Showing logs for all services..."
    docker-compose logs -f
}

# Function to show status
show_status() {
    print_status "EmpclERP Services Status:"
    echo ""
    docker-compose ps
    echo ""
    print_status "Resource Usage:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
}

# Function to clean up
clean_up() {
    print_warning "This will remove all containers, images, and volumes. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_status "Cleaning up Docker resources..."
        docker-compose down -v --remove-orphans
        docker system prune -af
        print_success "Cleanup completed!"
    else
        print_status "Cleanup cancelled."
    fi
}

# Function to access database
access_database() {
    print_status "Accessing PostgreSQL CLI..."
    docker-compose exec postgres psql -U empcl_user -d empcl_erp_db
}

# Function to run migrations
run_migrations() {
    print_status "Running Prisma migrations..."
    docker-compose exec backend npx prisma migrate deploy
    print_success "Migrations completed!"
}

# Function to seed database
seed_database() {
    print_status "Seeding database..."
    docker-compose exec backend npx prisma db seed
    print_success "Database seeded successfully!"
}

# Function to check health
check_health() {
    print_status "Checking service health..."
    echo ""
    
    # Check if services are running
    if docker-compose ps | grep -q "Up"; then
        print_success "Services are running"
    else
        print_error "Some services are not running"
        docker-compose ps
        return 1
    fi
    
    # Check health endpoints
    echo ""
    print_status "Health Check Results:"
    
    # Frontend health
    if curl -s http://localhost:9000/health > /dev/null 2>&1; then
        print_success "Frontend: Healthy"
    else
        print_error "Frontend: Unhealthy"
    fi
    
    # Backend health
    if curl -s http://localhost:4000/health > /dev/null 2>&1; then
        print_success "Backend: Healthy"
    else
        print_error "Backend: Unhealthy"
    fi
    
    # Database health
    if docker-compose exec postgres pg_isready -U empcl_user -d empcl_erp_db > /dev/null 2>&1; then
        print_success "Database: Healthy"
    else
        print_error "Database: Unhealthy"
    fi
}

# Main script logic
main() {
    check_docker
    
    case "${1:-help}" in
        start)
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        build)
            build_images
            ;;
        logs)
            show_logs
            ;;
        status)
            show_status
            ;;
        clean)
            clean_up
            ;;
        db)
            access_database
            ;;
        migrate)
            run_migrations
            ;;
        seed)
            seed_database
            ;;
        health)
            check_health
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
