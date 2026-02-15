// Verify QA rejection quantity column exists
import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5433,
  user: process.env.DB_USER || 'erp_user',
  password: process.env.DB_PASSWORD || 'erp_pass123',
  database: process.env.DB_NAME || 'erp_db',
});

async function verify() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'qa_rejection' AND column_name = 'quantity'
    `);

    if (result.rows.length > 0) {
      console.log('✅ Quantity column exists:');
      console.log(JSON.stringify(result.rows[0], null, 2));
    } else {
      console.log('❌ Quantity column not found');
    }

    // Check existing records
    const countResult = await pool.query(`
      SELECT COUNT(*) as total, 
             COUNT(quantity) as with_quantity
      FROM qa_rejection
    `);
    console.log('\n📊 QA Rejection Records:');
    console.log(`Total: ${countResult.rows[0].total}`);
    console.log(`With quantity: ${countResult.rows[0].with_quantity}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

verify();

