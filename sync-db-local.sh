#!/bin/bash
# =============================================================================
# EMPCL ERP — Local Database Sync Script (Bash)
# File: sync-db-local.sh (Project Root)
# Usage: ./sync-db-local.sh
# =============================================================================

set -e

SERVER_IP="143.110.183.65"
SERVER_PATH="/root/empcl-erp/erp_prod_db.sql"
LOCAL_FILE="erp_prod_db.sql"

echo ">>> Connecting to server ($SERVER_IP) to generate a fresh database dump..."
ssh root@$SERVER_IP "docker exec empcl-erp-postgres pg_dump -U empcl_user erp_db > $SERVER_PATH"

echo ">>> Downloading database dump to local machine..."
scp root@$SERVER_IP:$SERVER_PATH ./$LOCAL_FILE

echo ">>> Importing database dump into local PostgreSQL..."
if [ -f "import-db-local.sh" ]; then
  chmod +x import-db-local.sh
  ./import-db-local.sh ./$LOCAL_FILE
else
  echo "[ERROR] import-db-local.sh script not found!"
  exit 1
fi
