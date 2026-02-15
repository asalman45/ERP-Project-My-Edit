# ERP System Migration Guide

This guide will help you migrate your ERP system to a new machine using the database dumps we created.

## Prerequisites

### System Requirements
- **Operating System**: Windows 10/11, macOS, or Linux
- **RAM**: Minimum 8GB (16GB recommended)
- **Storage**: At least 10GB free space
- **Docker Desktop**: Latest version installed
- **Git**: For cloning the repository

### Required Software
1. **Docker Desktop** - Download from [docker.com](https://www.docker.com/products/docker-desktop/)
2. **Git** - Download from [git-scm.com](https://git-scm.com/)
3. **Code Editor** (optional) - VS Code, Cursor, etc.

## Step 1: Install Docker Desktop

### Windows
1. Download Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop/)
2. Run the installer as Administrator
3. Restart your computer when prompted
4. Start Docker Desktop and wait for it to fully start

### macOS
1. Download Docker Desktop for Mac
2. Drag Docker to Applications folder
3. Launch Docker Desktop
4. Complete the setup wizard

### Linux
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

## Step 2: Transfer Files

### Option A: Using Git (Recommended)
```bash
# Clone the repository
git clone <your-repository-url>
cd EmpclERP

# Copy the database dump files to the project root
# You'll need to transfer these files from your current system:
# - erp_database_dump_20251027_234527.sql
# - erp_database_dump_20251027_234534.backup
# - erp_database_schema_only_20251027_234540.sql
# - erp_database_data_only_20251027_234545.sql
```

### Option B: Manual Transfer
1. Copy the entire `EmpclERP` folder to the new system
2. Ensure all database dump files are in the root directory

## Step 3: Database Setup

### Start PostgreSQL Container
```bash
# Navigate to the project directory
cd EmpclERP

# Start only the PostgreSQL container first
docker-compose -f erp-backend/docker-compose.yml up -d postgres

# Wait for PostgreSQL to be ready (about 30 seconds)
docker logs erp-postgres
```

### Restore Database
```bash
# Option 1: Using the complete SQL dump (Recommended)
docker exec -i erp-postgres psql -U erp_user -d erp_db < erp_database_dump_20251027_234527.sql

# Option 2: Using custom format dump (Faster)
docker exec -i erp-postgres pg_restore -U erp_user -d erp_db < erp_database_dump_20251027_234534.backup

# Option 3: Schema + Data separately
# First restore schema
docker exec -i erp-postgres psql -U erp_user -d erp_db < erp_database_schema_only_20251027_234540.sql
# Then restore data
docker exec -i erp-postgres psql -U erp_user -d erp_db < erp_database_data_only_20251027_234545.sql
```

### Verify Database Restore
```bash
# Check if tables exist
docker exec erp-postgres psql -U erp_user -d erp_db -c "\dt"

# Check record counts
docker exec erp-postgres psql -U erp_user -d erp_db -c "SELECT COUNT(*) FROM work_order;"
docker exec erp-postgres psql -U erp_user -d erp_db -c "SELECT COUNT(*) FROM sales_order;"
```

## Step 4: Start the Complete System

### Start All Services
```bash
# Start the complete ERP system
docker-compose up -d

# Check all containers are running
docker ps
```

### Verify Services
```bash
# Check backend health
curl http://localhost:4000/health

# Check frontend
# Open browser and go to http://localhost
```

## Step 5: Configuration Updates

### Update Environment Variables (if needed)
```bash
# Check current configuration
docker exec empcl-erp-backend env | grep DATABASE
```

### Update Docker Compose (if needed)
If you need to change ports or other settings, edit:
- `docker-compose.yml` (main configuration)
- `erp-backend/docker-compose.yml` (database configuration)

## Step 6: Testing

### Test Database Connection
```bash
# Test database connection
docker exec erp-postgres psql -U erp_user -d erp_db -c "SELECT version();"
```

### Test API Endpoints
```bash
# Test backend API
curl http://localhost:4000/api/health
curl http://localhost:4000/api/products
```

### Test Frontend
1. Open browser
2. Navigate to `http://localhost:9000`
3. Test login and key functionalities

## Troubleshooting

### Common Issues

#### 1. Docker Desktop Not Starting
- **Windows**: Run as Administrator, check Hyper-V is enabled
- **macOS**: Check System Preferences > Security & Privacy
- **Linux**: Ensure Docker service is running

#### 2. Database Connection Issues
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check PostgreSQL logs
docker logs erp-postgres

# Restart PostgreSQL
docker restart erp-postgres
```

#### 3. Port Conflicts
If ports 9000, 4000, or 5432 are in use:
```bash
# Check what's using the ports
netstat -tulpn | grep :80
netstat -tulpn | grep :4000
netstat -tulpn | grep :5432

# Stop conflicting services or change ports in docker-compose.yml
```

#### 4. Database Restore Fails
```bash
# Check database exists
docker exec erp-postgres psql -U erp_user -l

# Drop and recreate database if needed
docker exec erp-postgres psql -U erp_user -c "DROP DATABASE IF EXISTS erp_db;"
docker exec erp-postgres psql -U erp_user -c "CREATE DATABASE erp_db;"
```

### Performance Optimization

#### 1. Increase Docker Resources
- Open Docker Desktop Settings
- Go to Resources
- Increase Memory to 8GB+ and CPUs to 4+

#### 2. Database Optimization
```bash
# Connect to database and run optimization
docker exec erp-postgres psql -U erp_user -d erp_db -c "VACUUM ANALYZE;"
```

## Maintenance

### Regular Backups
```bash
# Create new backup
docker exec erp-postgres pg_dump -U erp_user -d erp_db --clean --create > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Updates
```bash
# Pull latest changes
git pull origin main

# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Monitoring
```bash
# Check container status
docker ps

# Check logs
docker logs empcl-erp-backend
docker logs empcl-erp-frontend
docker logs erp-postgres
```

## Support

If you encounter issues:
1. Check Docker Desktop is running
2. Verify all containers are up: `docker ps`
3. Check logs: `docker logs <container-name>`
4. Ensure database dump files are in the correct location
5. Verify network connectivity between containers

## Quick Start Commands

```bash
# Complete setup in one go
cd EmpclERP
docker-compose -f erp-backend/docker-compose.yml up -d postgres
sleep 30
docker exec -i erp-postgres psql -U erp_user -d erp_db < erp_database_dump_20251027_234527.sql
docker-compose up -d
```

---

**Note**: Replace the dump file names with the actual files you have from your current system.
