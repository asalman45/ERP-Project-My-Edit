import db from './utils/db.js';

async function testDB() {
  try {
    const res = await db.query('SELECT NOW()');
    console.log('✅ Database connected!');
    console.log('Server time:', res.rows[0].now);
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
  } finally {
    await db.end();
  }
}

testDB();