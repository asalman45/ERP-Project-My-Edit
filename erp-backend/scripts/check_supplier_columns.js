import db from '../src/utils/db.js';

async function check() {
  try {
    const res = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'supplier'
    `);
    console.log("COLUMNS IN supplier TABLE:");
    res.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type}`);
    });
  } catch (err) {
    console.error("Error querying schema:", err);
  } finally {
    await db.end();
  }
}

check();
