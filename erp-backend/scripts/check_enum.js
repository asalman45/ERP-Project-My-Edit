
import db from '../src/utils/db.js';

async function check() {
  try {
    const res = await db.query(`SELECT enumlabel FROM pg_enum WHERE enumtypid = '"TxnType"'::regtype;`);
    console.log("TxnType values:", res.rows.map(r => r.enumlabel));
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

check();
