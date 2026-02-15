# ERP System Migration Checklist

## Pre-Migration Checklist

### Current System (Source)
- [ ] Database dumps created successfully
- [ ] All dump files copied to safe location
- [ ] System is running and accessible
- [ ] No critical operations in progress

### Files to Transfer
- [ ] `erp_database_dump_20251027_234527.sql` (Complete SQL dump)
- [ ] `erp_database_dump_20251027_234534.backup` (Custom format dump)
- [ ] `erp_database_schema_only_20251027_234540.sql` (Schema only)
- [ ] `erp_database_data_only_20251027_234545.sql` (Data only)
- [ ] Entire `EmpclERP` project folder

## New System Setup Checklist

### System Requirements
- [ ] **OS**: Windows 10/11, macOS, or Linux
- [ ] **RAM**: 8GB minimum (16GB recommended)
- [ ] **Storage**: 10GB+ free space
- [ ] **Network**: Internet connection for Docker images

### Software Installation
- [ ] **Docker Desktop** installed and running
- [ ] **Git** installed (if using version control)
- [ ] **Code Editor** installed (VS Code, Cursor, etc.)

### Docker Verification
- [ ] Docker Desktop starts successfully
- [ ] Can run `docker --version`
- [ ] Can run `docker ps` without errors

## Migration Process Checklist

### Step 1: File Transfer
- [ ] Project folder copied to new system
- [ ] Database dump files in project root directory
- [ ] All files accessible and readable

### Step 2: Database Setup
- [ ] PostgreSQL container started: `docker-compose -f erp-backend/docker-compose.yml up -d postgres`
- [ ] PostgreSQL container running: `docker ps | grep postgres`
- [ ] Database restored successfully
- [ ] Database verification completed

### Step 3: System Startup
- [ ] All containers started: `docker-compose up -d`
- [ ] Backend accessible: `curl http://localhost:4000/health`
- [ ] Frontend accessible: Browser opens `http://localhost:9000`
- [ ] All services healthy

### Step 4: Testing
- [ ] Database queries work
- [ ] API endpoints respond
- [ ] Frontend loads correctly
- [ ] Login functionality works
- [ ] Key business processes tested

## Post-Migration Checklist

### System Health
- [ ] All containers running: `docker ps`
- [ ] No error logs: `docker logs <container-name>`
- [ ] Database performance acceptable
- [ ] Memory usage within limits

### Backup Setup
- [ ] Regular backup schedule configured
- [ ] Backup location secured
- [ ] Restore process tested

### Documentation
- [ ] Migration notes documented
- [ ] New system configuration recorded
- [ ] Team access configured
- [ ] Monitoring setup completed

## Emergency Rollback Plan

### If Migration Fails
- [ ] Keep original system running until new system verified
- [ ] Document all issues encountered
- [ ] Have rollback procedure ready
- [ ] Test restore process on backup system first

### Rollback Commands
```bash
# Stop new system
docker-compose down

# Start original system (if available)
# Restore from backup if needed
```

## Quick Commands Reference

### Essential Commands
```bash
# Check Docker status
docker ps
docker --version

# Start PostgreSQL only
docker-compose -f erp-backend/docker-compose.yml up -d postgres

# Restore database
docker exec -i erp-postgres psql -U erp_user -d erp_db < erp_database_dump_20251027_234527.sql

# Start full system
docker-compose up -d

# Check logs
docker logs empcl-erp-backend
docker logs empcl-erp-frontend
docker logs erp-postgres

# Test connectivity
curl http://localhost:4000/health
```

### Troubleshooting Commands
```bash
# Restart containers
docker-compose restart

# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Check resource usage
docker stats

# Clean up unused resources
docker system prune
```

---

**Important Notes:**
- Always test the migration process on a non-production system first
- Keep the original system running until the new system is fully verified
- Document any custom configurations or modifications
- Ensure all team members have access to the new system
- Set up monitoring and alerting for the new system
