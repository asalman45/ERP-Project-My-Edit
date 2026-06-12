#!/bin/bash
# =============================================================================
# EMPCL ERP — Local Database Import Script (Bash)
# File: import-db-local.sh (Project Root)
# Usage: ./import-db-local.sh <path_to_sql_dump>
# =============================================================================

set -e

# Load .env.local variables
if [ -f .env.local ]; then
  # Read .env.local while skipping comments and empty lines
  export $(grep -v '^#' .env.local | xargs)
else
  echo "[ERROR] .env.local file not found in root directory!"
  exit 1
fi

DB_USER=${POSTGRES_USER:-empcl_user}
DB_NAME=${POSTGRES_DB:-erp_db}
CONTAINER_NAME="empcl-local-postgres"

DUMP_FILE=$1

if [ -z "$DUMP_FILE" ]; then
  echo "Usage: $0 <path_to_sql_dump>"
  exit 1
fi

if [ ! -f "$DUMP_FILE" ]; then
  echo "[ERROR] Database dump file '$DUMP_FILE' not found!"
  exit 1
fi

echo ">>> Verifying local database container ($CONTAINER_NAME) is running..."
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "[ERROR] Container '$CONTAINER_NAME' is not running!"
  echo "Please start local services first: docker compose -f docker-compose.local.yml --env-file .env.local up -d"
  exit 1
fi

echo ">>> Wiping existing schema in local database ($DB_NAME)..."
docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

echo ">>> Importing database dump from '$DUMP_FILE'..."
docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" < "$DUMP_FILE"

echo ">>> Database imported successfully!"
