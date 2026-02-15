# EmpclERP Docker Setup (Frontend & Backend Only)

This repository contains Docker configurations for the EmpclERP frontend and backend services. **This setup assumes you already have PostgreSQL and pgAdmin running separately.**

## Architecture

The Docker setup includes:
- **Frontend**: React/Vite application served by Nginx
- **Backend**: Node.js/Express API server
- **Database**: Uses your existing PostgreSQL instance
- **Database Admin**: Uses your existing pgAdmin instance

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 4GB RAM available for Docker
- Ports 9000 and 4000 available
- **Existing PostgreSQL running on port 5432**
- **Existing pgAdmin running on port 5050**

## Quick Start

1. **Clone and navigate to the project directory:**
   ```bash
   cd EmpclERP
   ```

2. **Start all services:**
   ```bash
   docker-compose up -d
   ```

3. **Check service status:**
   ```bash
   docker-compose ps
   ```

4. **Access the applications:**
   - Frontend: http://localhost:9000
   - Backend API: http://localhost:4000
   - pgAdmin: http://localhost:5050 (your existing instance)
   - PostgreSQL: localhost:5432 (your existing instance)

## Service Details

### Frontend (React/Vite + Nginx)
- **Container**: `empcl-erp-frontend`
- **Port**: 9000
- **Health Check**: http://localhost:9000/health
- **Features**:
  - Multi-stage build for optimized production image
  - Nginx with gzip compression and security headers
  - Client-side routing support
  - Static asset caching

### Backend (Node.js/Express)
- **Container**: `empcl-erp-backend`
- **Port**: 4000
- **Health Check**: http://localhost:4000/health
- **Features**:
  - Node.js 18 Alpine base image
  - Puppeteer support for PDF generation
  - Prisma ORM integration
  - Non-root user for security
  - Volume mount for uploads

### Database (PostgreSQL)
- **Container**: `empcl-erp-postgres`
- **Port**: 5433
- **Database**: `empcl_erp_db`
- **User**: `empcl_user`
- **Password**: `empcl_pass123`
- **Features**:
  - Persistent data volume
  - Health checks
  - Automatic initialization from backup

### Database Admin (pgAdmin)
- **Container**: `empcl-erp-pgadmin`
- **Port**: 5051
- **Email**: admin@admin.com
- **Password**: admin123

## Environment Variables

### Backend Environment Variables
```bash
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://empcl_user:empcl_pass123@postgres:5432/empcl_erp_db
```

### Database Environment Variables
```bash
POSTGRES_USER=empcl_user
POSTGRES_PASSWORD=empcl_pass123
POSTGRES_DB=empcl_erp_db
```

## Development Commands

### Build and Start Services
```bash
# Build all images
docker-compose build

# Start services in detached mode
docker-compose up -d

# Start with logs
docker-compose up

# Rebuild and start
docker-compose up --build
```

### Service Management
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: This will delete database data)
docker-compose down -v

# Restart specific service
docker-compose restart backend

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Database Operations
```bash
# Access PostgreSQL CLI
docker-compose exec postgres psql -U empcl_user -d empcl_erp_db

# Run Prisma migrations (from backend container)
docker-compose exec backend npx prisma migrate deploy

# Generate Prisma client
docker-compose exec backend npx prisma generate

# Seed database
docker-compose exec backend npx prisma db seed
```

### Debugging
```bash
# Access backend container shell
docker-compose exec backend sh

# Access frontend container shell
docker-compose exec frontend sh

# Check service health
docker-compose ps
```

## Production Deployment

### Security Considerations
1. Change default passwords in production
2. Use environment-specific `.env` files
3. Enable SSL/TLS certificates
4. Configure firewall rules
5. Use Docker secrets for sensitive data

### Scaling
```bash
# Scale backend service
docker-compose up -d --scale backend=3

# Use load balancer (nginx, traefik, etc.)
```

### Monitoring
```bash
# View resource usage
docker stats

# Check container health
docker-compose ps
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 9000, 4000, 5051, 5433 are available
2. **Database connection issues**: Wait for PostgreSQL to be ready before starting backend
3. **Build failures**: Check Dockerfile syntax and dependencies
4. **Permission issues**: Ensure Docker has proper permissions

### Logs and Debugging
```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres

# Follow logs in real-time
docker-compose logs -f backend
```

### Reset Everything
```bash
# Stop and remove all containers, networks, and volumes
docker-compose down -v --remove-orphans

# Remove all images
docker-compose down --rmi all

# Start fresh
docker-compose up --build
```

## File Structure

```
EmpclERP/
├── docker-compose.yml          # Main orchestration file
├── erp-backend/
│   ├── Dockerfile              # Backend container definition
│   └── .dockerignore           # Backend ignore patterns
├── erp-frontend/
│   ├── Dockerfile              # Frontend container definition
│   ├── nginx.conf              # Nginx configuration
│   └── .dockerignore           # Frontend ignore patterns
└── erp_backup.sql              # Database initialization script
```

## Support

For issues related to:
- Docker configuration: Check this README
- Application bugs: Check individual service logs
- Database issues: Use pgAdmin or PostgreSQL CLI
- Performance: Monitor resource usage with `docker stats`
