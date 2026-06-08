import db from '../src/utils/db.js';

async function migrate() {
  console.log('Starting product_model migration...');
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    // 1. Create junction table
    console.log('Creating product_model table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_model (
        product_model_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        product_id TEXT NOT NULL REFERENCES product(product_id) ON DELETE CASCADE,
        model_id TEXT NOT NULL REFERENCES model(model_id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (product_id, model_id)
      )
    `);

    // 2. Migrate existing data from product.model_id
    console.log('Migrating existing model associations...');
    const result = await client.query(`
      INSERT INTO product_model (product_id, model_id)
      SELECT product_id, model_id 
      FROM product
      WHERE model_id IS NOT NULL
      ON CONFLICT (product_id, model_id) DO NOTHING
    `);
    
    console.log(`Migrated ${result.rowCount} product-model associations.`);

    // 3. Optional: we will leave the model_id in the product table as-is for backward compatibility
    // if any external queries depend on it.

    await client.query('COMMIT');
    console.log('Migration completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

migrate();
