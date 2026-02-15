// Script to add quantity field to qa_rejection table
import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'empcl_erp',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

async function runMigration() {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Read migration file
    const migrationSQL = readFileSync(
      join(__dirname, '../migrations/add_qa_rejection_quantity.sql'),
      'utf-8'
    );

    // Run migration
    await client.query(migrationSQL);
    console.log('✅ Migration completed successfully');

    // Verify
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'qa_rejection' AND column_name = 'quantity'
    `);

    if (result.rows.length > 0) {
      console.log('✅ Quantity column exists:', result.rows[0]);
    } else {
      console.log('⚠️  Quantity column not found');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();

