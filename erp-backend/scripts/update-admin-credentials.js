// ============================================================
// One-time migration: Update admin credentials
// Run once with:  node scripts/update-admin-credentials.js
// ============================================================
import bcrypt from 'bcryptjs';
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const NEW_USERNAME = 'Administrator@2026';
const NEW_PASSWORD = 'SalmanERP@2026@';
const NEW_NAME     = 'Administrator';
const NEW_ROLE     = 'Admin';

// Old usernames to be completely removed
const OLD_USERNAMES = ['admin', 'Admin', 'administrator'];

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Remove all old admin-style accounts
    const deleteResult = await client.query(
      `DELETE FROM app_user WHERE username = ANY($1) RETURNING username`,
      [OLD_USERNAMES]
    );
    if (deleteResult.rows.length > 0) {
      console.log(`✅ Removed old users: ${deleteResult.rows.map(r => r.username).join(', ')}`);
    } else {
      console.log('ℹ️  No old admin users found to remove.');
    }

    // 2. Hash the new strong password
    const passwordHash = await bcrypt.hash(NEW_PASSWORD, 12);

    // 3. Insert the new Administrator@2026 account (or update if already exists)
    const upsertResult = await client.query(
      `INSERT INTO app_user (user_id, username, password_hash, name, role, is_active, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, true, NOW())
       ON CONFLICT (username) DO UPDATE
         SET password_hash = EXCLUDED.password_hash,
             name          = EXCLUDED.name,
             role          = EXCLUDED.role,
             is_active     = true,
             updated_at    = NOW()
       RETURNING username, name, role`,
      [NEW_USERNAME, passwordHash, NEW_NAME, NEW_ROLE]
    );

    const u = upsertResult.rows[0];
    console.log(`✅ Admin account ready:`);
    console.log(`   Username : ${u.username}`);
    console.log(`   Name     : ${u.name}`);
    console.log(`   Role     : ${u.role}`);
    console.log(`   Password : ${NEW_PASSWORD}  ← keep this safe!`);

    await client.query('COMMIT');
    console.log('\n✅ Migration complete. You can now log in with the new credentials.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
