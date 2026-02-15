# EmpclERP Docker Management Script (PowerShell)
# This script provides common Docker operations for the EmpclERP system

param(
    [Parameter(Position=0)]
    [string]$Command = "help"
)

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Function to check if Docker is running
function Test-Docker {
    try {
        docker info | Out-Null
        return $true
    }
    catch {
        Write-Error "Docker is not running. Please start Docker Desktop and try again."
        exit 1
    }
}

# Function to show help
function Show-Help {
    Write-Host "EmpclERP Docker Management Script (PowerShell)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\docker-manage.ps1 [COMMAND]"
    Write-Host ""
    Write-Host "Commands:"
    Write-Host "  start       Start all services"
    Write-Host "  stop        Stop all services"
    Write-Host "  restart     Restart all services"
    Write-Host "  build       Build all images"
    Write-Host "  logs        Show logs for all services"
    Write-Host "  status      Show status of all services"
    Write-Host "  clean       Clean up containers, images, and volumes"
    Write-Host "  db          Access database CLI"
    Write-Host "  migrate     Run Prisma migrations"
    Write-Host "  seed        Seed the database"
    Write-Host "  health      Check health of all services"
    Write-Host "  help        Show this help message"
    Write-Host ""
}

# Function to start services
function Start-Services {
    Write-Status "Starting EmpclERP services..."
    docker-compose up -d
    Write-Success "Services started successfully!"
    Write-Status "Access the application at:"
    Write-Host "  Frontend: http://localhost:9000" -ForegroundColor White
    Write-Host "  Backend:  http://localhost:4000" -ForegroundColor White
    Write-Host "  pgAdmin:  http://localhost:5051" -ForegroundColor White
}

# Function to stop services
function Stop-Services {
    Write-Status "Stopping EmpclERP services..."
    docker-compose down
    Write-Success "Services stopped successfully!"
}

# Function to restart services
function Restart-Services {
    Write-Status "Restarting EmpclERP services..."
    docker-compose restart
    Write-Success "Services restarted successfully!"
}

# Function to build images
function Build-Images {
    Write-Status "Building EmpclERP images..."
    docker-compose build --no-cache
    Write-Success "Images built successfully!"
}

# Function to show logs
function Show-Logs {
    Write-Status "Showing logs for all services..."
    docker-compose logs -f
}

# Function to show status
function Show-Status {
    Write-Status "EmpclERP Services Status:"
    Write-Host ""
    docker-compose ps
    Write-Host ""
    Write-Status "Resource Usage:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
}

# Function to clean up
function Clean-Up {
    Write-Warning "This will remove all containers, images, and volumes. Are you sure? (y/N)"
    $response = Read-Host
    if ($response -match "^[yY]([eE][sS])?$") {
        Write-Status "Cleaning up Docker resources..."
        docker-compose down -v --remove-orphans
        docker system prune -af
        Write-Success "Cleanup completed!"
    }
    else {
        Write-Status "Cleanup cancelled."
    }
}

# Function to access database
function Access-Database {
    Write-Status "Accessing PostgreSQL CLI..."
    docker-compose exec postgres psql -U empcl_user -d empcl_erp_db
}

# Function to run migrations
function Run-Migrations {
    Write-Status "Running Prisma migrations..."
    docker-compose exec backend npx prisma migrate deploy
    Write-Success "Migrations completed!"
}

# Function to seed database
function Seed-Database {
    Write-Status "Seeding database..."
    docker-compose exec backend npx prisma db seed
    Write-Success "Database seeded successfully!"
}

# Function to check health
function Test-Health {
    Write-Status "Checking service health..."
    Write-Host ""
    
    # Check if services are running
    $services = docker-compose ps
    if ($services -match "Up") {
        Write-Success "Services are running"
    }
    else {
        Write-Error "Some services are not running"
        docker-compose ps
        return
    }
    
    # Check health endpoints
    Write-Host ""
    Write-Status "Health Check Results:"
    
    # Frontend health
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:9000/health" -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Success "Frontend: Healthy"
        }
    }
    catch {
        Write-Error "Frontend: Unhealthy"
    }
    
    # Backend health
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:4000/health" -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Success "Backend: Healthy"
        }
    }
    catch {
        Write-Error "Backend: Unhealthy"
    }
    
    # Database health
    try {
        docker-compose exec postgres pg_isready -U empcl_user -d empcl_erp_db | Out-Null
        Write-Success "Database: Healthy"
    }
    catch {
        Write-Error "Database: Unhealthy"
    }
}

# Main script logic
function Main {
    Test-Docker
    
    switch ($Command.ToLower()) {
        "start" {
            Start-Services
        }
        "stop" {
            Stop-Services
        }
        "restart" {
            Restart-Services
        }
        "build" {
            Build-Images
        }
        "logs" {
            Show-Logs
        }
        "status" {
            Show-Status
        }
        "clean" {
            Clean-Up
        }
        "db" {
            Access-Database
        }
        "migrate" {
            Run-Migrations
        }
        "seed" {
            Seed-Database
        }
        "health" {
            Test-Health
        }
        "help" {
            Show-Help
        }
        default {
            Write-Error "Unknown command: $Command"
            Write-Host ""
            Show-Help
            exit 1
        }
    }
}

# Run main function
Main
