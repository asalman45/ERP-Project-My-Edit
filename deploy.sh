#!/bin/bash
# ==========================================
# EMPCL ERP - Automatic Deployment Script
# ==========================================

echo "=========================================="
echo "🚀 Starting Deployment for EMPCL ERP..."
echo "=========================================="
echo ""

# 1. Pull the latest code from GitHub
echo "📦 Step 1: Pulling latest code from git..."
git pull origin main
echo ""

# 2. Run Database schema updates automatically
echo "🗄️ Step 2: Applying any pending database schema updates..."
# Note: Using IF NOT EXISTS makes it safe to run multiple times without throwing errors
docker exec -i empcl-erp-postgres psql -U empcl_user -d erp_db -c "
  ALTER TABLE material ADD COLUMN IF NOT EXISTS sub_category VARCHAR(50);
  ALTER TABLE raw_material ADD COLUMN IF NOT EXISTS sub_category VARCHAR(50);
"
echo "Database updates applied."
echo ""

# 3. Build and restart Docker containers
echo "🏗️ Step 3: Rebuilding and restarting Docker containers..."
docker compose -f docker-compose.production.yml up -d --build
echo ""

echo "=========================================="
echo "✅ Deployment completed successfully!"
echo "Your changes are now live."
echo "=========================================="
