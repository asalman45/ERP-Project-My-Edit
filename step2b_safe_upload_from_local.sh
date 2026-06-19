#!/bin/bash
# =============================================================================
# SAFE MIGRATION: Upload code from LOCAL machine (trusted source)
# Run this in Git Bash on your Windows machine
# OLD droplet was compromised — we use LOCAL code, not server code
# NEW Droplet: 168.144.115.122
# =============================================================================

NEW_IP="168.144.115.122"
LOCAL_PROJECT="f:/ERP-Project-My-Edit"

echo "======================================"
echo " SAFE UPLOAD: Local → New Droplet"
echo " Source: $LOCAL_PROJECT  (TRUSTED)"
echo " Target: root@$NEW_IP:/root/empcl-erp/"
echo "======================================"

# Upload backend source code
echo ""
echo "[1/4] Uploading erp-backend..."
rsync -avz --progress \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='dist' \
    --exclude='*.log' \
    "$LOCAL_PROJECT/erp-backend/" \
    root@$NEW_IP:/root/empcl-erp/erp-backend/

# Upload frontend source code
echo ""
echo "[2/4] Uploading erp-frontend..."
rsync -avz --progress \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='dist' \
    --exclude='.next' \
    --exclude='*.log' \
    "$LOCAL_PROJECT/erp-frontend/" \
    root@$NEW_IP:/root/empcl-erp/erp-frontend/

# Upload docker-compose and env files
echo ""
echo "[3/4] Uploading config files..."
scp "$LOCAL_PROJECT/docker-compose.production.yml" root@$NEW_IP:/root/empcl-erp/
scp "$LOCAL_PROJECT/.env.production"               root@$NEW_IP:/root/empcl-erp/

# Upload the database dump (this is just SQL data — safe)
echo ""
echo "[4/4] Uploading database dump..."
# Find the most recent dump in the project folder
LATEST_DUMP=$(ls "$LOCAL_PROJECT"/erp_database_dump_*.sql 2>/dev/null | sort | tail -1)
if [ -n "$LATEST_DUMP" ]; then
    scp "$LATEST_DUMP" root@$NEW_IP:/root/empcl-erp/live_migration.sql
    echo "Uploaded dump: $LATEST_DUMP"
else
    echo "No local dump found — will use the one rsync'd from old server (DB data only)"
fi

echo ""
echo "======================================"
echo " Upload COMPLETE!"
echo " Next: run step3_restore_and_start.sh"
echo "======================================"
