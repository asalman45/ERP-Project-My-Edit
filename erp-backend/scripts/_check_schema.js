import db from '../src/utils/db.js';
const r = await db.query(`SELECT pg_type.typname, enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname ILIKE '%txn%' OR pg_type.typname ILIKE '%inventory%' ORDER BY pg_type.typname, enumsortorder`);
r.rows.forEach(x => console.log(`${x.typname}: ${x.enumlabel}`));
await db.end?.();
