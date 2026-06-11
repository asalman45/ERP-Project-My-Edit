#!/bin/bash
# ============================================================
# ERP Database Migration Script
# Run on server: bash scripts/migrate-production.sh
# ============================================================

set -e  # Exit on any error

echo ""
echo "======================================"
echo "  ERP Production Migration Script"
echo "======================================"
echo ""

# ── Step 1: Add CNIC column to customer table ──────────────
echo "► Adding CNIC column to customer table..."

docker exec empcl-erp-backend node --input-type=module -e "
import pg from 'pg';
const p = new pg.Pool({ connectionString: process.env.DATABASE_URL });
try {
  await p.query('ALTER TABLE customer ADD COLUMN IF NOT EXISTS cnic VARCHAR(255)');
  console.log('  ✅ CNIC column ready.');
} catch(e) {
  console.log('  ⚠️  CNIC column error:', e.message);
}
await p.end();
"

echo ""

# ── Step 2: Verify the column was added ────────────────────
echo "► Verifying schema..."

docker exec empcl-erp-backend node --input-type=module -e "
import pg from 'pg';
const p = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const r = await p.query(\`
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_name = 'customer'
  AND column_name = 'cnic'
\`);
if (r.rows.length > 0) {
  console.log('  ✅ Verified: cnic column exists in customer table.');
} else {
  console.log('  ❌ cnic column NOT found. Check for errors above.');
}
await p.end();
"

echo ""
echo "======================================"
echo "  Migration Complete!"
echo "======================================"
echo ""
